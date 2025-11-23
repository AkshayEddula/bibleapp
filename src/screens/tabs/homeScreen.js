// HomeScreen.js - Updated with Stories Header
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Calendar, Flame } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CelebrationModal from "../../components/CelebrationModal";
import PrayerWallScreen from "../../components/PrayerCard";
import { StoryCircle } from "../../components/StoriesCard";
import StreakModal from "../../components/StreakModal";
import TestimoniesScreen from "../../components/TestimonalCard";
import { VerseCard } from "../../components/VerseCard";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

const storyTags = [
  {
    id: 1,
    tag: "Faith",
    color: ["#FEE8A0", "#F9C846"],
    icon: "✨",
    hasNew: true,
  },
  {
    id: 2,
    tag: "Wisdom",
    color: ["#E0C3FC", "#8EC5FC"],
    icon: "📖",
    hasNew: true,
  },
  {
    id: 3,
    tag: "Hope",
    color: ["#FFE5B4", "#FFB347"],
    icon: "🌤️",
    hasNew: false,
  },
  {
    id: 4,
    tag: "Love",
    color: ["#FFD6E8", "#FF9ECD"],
    icon: "💛",
    hasNew: true,
  },
  {
    id: 5,
    tag: "Peace",
    color: ["#C1E1C1", "#A8E6CF"],
    icon: "🕊️",
    hasNew: false,
  },
  {
    id: 6,
    tag: "Grace",
    color: ["#F6D5F7", "#E5B3E6"],
    icon: "🙏",
    hasNew: true,
  },

];

// Achievement Toast Component - REMOVED

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isUserLoggedIn, user, logout, isLogoutLoading } = useAuth();
  const [verses, setVerses] = useState([]);
  const [likedVerses, setLikedVerses] = useState(new Set());
  const [savedVerses, setSavedVerses] = useState(new Set());
  const [verseCounts, setVerseCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("foryou"); // 'foryou' | 'verses'

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // Notification State
  const [notification, setNotification] = useState(null);
  const notifiedIdsRef = useRef(new Set());

  // Streak Modal State
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [streakData, setStreakData] = useState({
    current: 0,
    history: [],
    quests: []
  });

  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (!isUserLoggedIn) return;
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    initializeData();

    // Start polling for achievements
    const interval = setInterval(checkAchievements, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [isUserLoggedIn]);

  const checkAchievements = async () => {
    if (!user) return;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000); // Check last minute

    // Check Quests
    const { data: quests } = await supabase
      .from("user_quests")
      .select("*, quests(*)")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .gt("completed_at", oneMinuteAgo.toISOString());

    if (quests && quests.length > 0) {
      const latest = quests[0];
      if (!notifiedIdsRef.current.has(`quest-${latest.id}`)) {
        setNotification({ type: 'quest', item: { ...latest.quests, ...latest } });
        notifiedIdsRef.current.add(`quest-${latest.id}`);
        return; // Show one at a time
      }
    }

    // Check Badges
    const { data: badges } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id)
      .gt("earned_at", oneMinuteAgo.toISOString());

    if (badges && badges.length > 0) {
      const latest = badges[0];
      if (!notifiedIdsRef.current.has(`badge-${latest.id}`)) {
        setNotification({ type: 'badge', item: { ...latest.badges, ...latest } });
        notifiedIdsRef.current.add(`badge-${latest.id}`);
      }
    }
  };

  const handleNotificationPress = () => {
    setNotification(null);
    navigation.navigate('Stats'); // Navigate to Stats tab
  };

  const fetchVerses = async (pageNumber) => {
    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("bible_verses")
        .select("*")
        .range(from, to)
        .order('created_at', { ascending: false }); // Ensure consistent order

      if (error) throw error;

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (pageNumber === 0) {
        setVerses(data);
      } else {
        setVerses(prev => [...prev, ...data]);
      }

      return data;
    } catch (err) {
      console.error("Error fetching verses:", err);
      setError(err.message);
      return [];
    }
  };

  const initializeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch initial verses
      const initialVerses = await fetchVerses(0);

      const [likesResult, savesResult, countsResult, viewsResult] =
        await Promise.all([
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "like"),
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "save"),
          supabase.from("verse_interaction_counts").select("*"),
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "view"),
        ]);

      if (likesResult.data) {
        setLikedVerses(new Set(likesResult.data.map((item) => item.verse_id)));
      }

      if (savesResult.data) {
        setSavedVerses(new Set(savesResult.data.map((item) => item.verse_id)));
      }

      if (viewsResult.data) {
        setViewedVerses(new Set(viewsResult.data.map((item) => item.verse_id)));
      }

      if (countsResult.data) {
        const countsMap = {};
        countsResult.data.forEach((count) => {
          countsMap[count.verse_id] = count;
        });
        setVerseCounts(countsMap);
      }

      // Fetch Streak Data
      await fetchStreakData();

    } catch (err) {
      setError(err.message);
      console.error("Error initializing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreVerses = async () => {
    if (!hasMore || loading) return;
    // Only load more if we are in 'verses' tab, or if we want to support infinite scroll in 'foryou' too (but foryou is capped at 5 currently)
    if (activeTab === 'verses') {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchVerses(nextPage);
    }
  };

  const fetchStreakData = async () => {
    try {
      // 1. Get Current Streak & Last Active Date
      const { data: stats } = await supabase
        .from("gamification_profiles")
        .select("current_streak, last_active_date")
        .eq("user_id", user.id)
        .single();

      // 2. Get Weekly History (Last 7 days)
      const today = new Date();
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
      }

      // Fetch daily stats for these days
      const { data: dailyStats } = await supabase
        .from("daily_user_stats")
        .select("date")
        .eq("user_id", user.id)
        .in("date", last7Days);

      const activeDates = new Set(dailyStats?.map(ds => ds.date) || []);

      const history = last7Days.map(dateStr => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...

        // Check if this date is "active"
        // 1. From daily_user_stats (history)
        // 2. OR if it's today and last_active_date is today (real-time)
        let isActive = activeDates.has(dateStr);

        if (dateStr === today.toISOString().split('T')[0] && stats?.last_active_date === dateStr) {
          isActive = true;
        }

        return {
          day: dayName,
          active: isActive,
          isToday: dateStr === today.toISOString().split('T')[0]
        };
      });

      // 3. Get Active Streak Quests (from metadata)
      const { data: allStreakQuests } = await supabase
        .from("quests")
        .select("*")
        .ilike("requirement_type", "%streak%")
        .eq("is_active", true);

      // 4. Get User Progress for these quests (to check completion)
      const { data: userQuestProgress } = await supabase
        .from("user_quests")
        .select("quest_id, is_completed")
        .eq("user_id", user.id)
        .in("quest_id", allStreakQuests?.map(q => q.id) || []);

      const completedQuestIds = new Set(
        userQuestProgress?.filter(uq => uq.is_completed).map(uq => uq.quest_id)
      );

      const formattedQuests = allStreakQuests?.map(q => {
        const isCompleted = completedQuestIds.has(q.id);
        // If not completed, show current streak as progress
        // If completed, it's done.
        return {
          title: q.title,
          reward: q.xp_reward,
          completed: isCompleted,
          progress: isCompleted ? q.requirement_count : (stats?.current_streak || 0),
          total: q.requirement_count
        };
      }) || [];

      // Sort: Incomplete first
      formattedQuests.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

      setStreakData({
        current: stats?.current_streak || 0,
        history,
        quests: formattedQuests
      });

    } catch (error) {
      console.error("Error fetching streak data:", error);
    }
  };

  const toggleInteraction = async (verseId, type, currentState, setState) => {
    const isCurrentlyActive = currentState.has(verseId);

    // Optimistic update
    const newState = new Set(currentState);
    if (isCurrentlyActive) {
      newState.delete(verseId);
    } else {
      newState.add(verseId);
    }
    setState(newState);

    // Update count optimistically
    const countKey = `${type}_count`;
    setVerseCounts((prev) => ({
      ...prev,
      [verseId]: {
        ...prev[verseId],
        [countKey]:
          (prev[verseId]?.[countKey] || 0) + (isCurrentlyActive ? -1 : 1),
      },
    }));

    try {
      if (isCurrentlyActive) {
        const { error } = await supabase
          .from("verse_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("verse_id", verseId)
          .eq("interaction_type", type);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("verse_interactions").insert({
          user_id: user.id,
          verse_id: verseId,
          interaction_type: type,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error toggling ${type}:`, error);

      // Revert optimistic update
      setState(currentState);
      setVerseCounts((prev) => ({
        ...prev,
        [verseId]: {
          ...prev[verseId],
          [countKey]:
            (prev[verseId]?.[countKey] || 0) + (isCurrentlyActive ? 1 : -1),
        },
      }));

      setError(`Failed to update ${type}. Please try again.`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const toggleLike = (verseId) => {
    toggleInteraction(verseId, "like", likedVerses, setLikedVerses);
  };

  const toggleSave = (verseId) => {
    toggleInteraction(verseId, "save", savedVerses, setSavedVerses);
  };

  const handleShare = async (verseId) => {
    // Shares are not toggled, they are just recorded
    // Optimistic update for count
    setVerseCounts((prev) => ({
      ...prev,
      [verseId]: {
        ...prev[verseId],
        share_count: (prev[verseId]?.share_count || 0) + 1,
      },
    }));

    try {
      const { error } = await supabase.from("verse_interactions").insert({
        user_id: user.id,
        verse_id: verseId,
        interaction_type: "share",
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error recording share:", error);
      // Revert count on error
      setVerseCounts((prev) => ({
        ...prev,
        [verseId]: {
          ...prev[verseId],
          share_count: (prev[verseId]?.share_count || 0) - 1,
        },
      }));
    }
  };

  const getVerseCount = (verseId) => {
    return (
      verseCounts[verseId] || {
        like_count: 0,
        comment_count: 0,
        save_count: 0,
        share_count: 0,
        view_count: 0,
      }
    );
  };

  const handleStoryPress = (tag) => {
    console.log(`Pressed ${tag} story`);
    // Navigate to story viewer or filter verses by tag
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[24px] font-lexend-medium text-gray-800">
            lumiverse
          </Text>
          <View className="flex-row items-center gap-5">
            <Pressable className="active:opacity-60">
              <Calendar size={24} color="#1f2937" strokeWidth={2} />
            </Pressable>
            <Pressable
              className="active:opacity-60 w-10 h-10 items-center justify-center"
              onPress={() => {
                fetchStreakData(); // Refresh data before showing
                setStreakModalVisible(true);
              }}
            >
              <Flame size={24} color={streakData.current > 0 ? "#EA580C" : "#1f2937"} fill={streakData.current > 0 ? "#EA580C" : "none"} strokeWidth={2} />
            </Pressable>
            <Pressable className="active:opacity-60 relative">
              <Bell size={24} color="#1f2937" strokeWidth={2} />
              <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Stories Section */}
      <View className="mb-5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: 8,
          }}
        >
          {storyTags.map((story) => (
            <StoryCircle
              key={story.id}
              tag={story.tag}
              color={story.color}
              icon={story.icon}
              hasNew={story.hasNew}
              onPress={() => handleStoryPress(story.tag)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Tab Selector */}
      <View className="flex-row px-6 mb-4 gap-6 border-b border-gray-100 pb-2">
        <Pressable
          onPress={() => setActiveTab("foryou")}
          className="items-center"
        >
          <Text className={`text-[16px] font-lexend-semibold ${activeTab === "foryou" ? "text-gray-900" : "text-gray-400"}`}>
            For You
          </Text>
          {activeTab === "foryou" && (
            <View className="h-1 w-full bg-yellow-400 rounded-full mt-1" />
          )}
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("verses")}
          className="items-center"
        >
          <Text className={`text-[16px] font-lexend-semibold ${activeTab === "verses" ? "text-gray-900" : "text-gray-400"}`}>
            Verses
          </Text>
          {activeTab === "verses" && (
            <View className="h-1 w-full bg-yellow-400 rounded-full mt-1" />
          )}
        </Pressable>
      </View>



      {/* Loading/Error States */}
      {loading && page === 0 && (
        <View className="items-center py-4">
          <ActivityIndicator color="#F9C846" />
          <Text className="text-gray-700 mt-2 font-lexend-light">
            Loading verses...
          </Text>
        </View>
      )}

      {error && (
        <View className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-200 mx-5">
          <Text className="text-red-600 text-center font-lexend-light">
            {error}
          </Text>
        </View>
      )}

      {!loading && verses.length === 0 && !error && (
        <View className="py-4">
          <Text className="text-gray-700 text-center font-lexend-light">
            No verses found.
          </Text>
        </View>
      )}
    </>
  );

  const renderFooter = () => {
    if (activeTab === 'foryou') {
      return (
        <View className="px-5 pb-20">
          <PrayerWallScreen />
          <TestimoniesScreen />
          <TouchableOpacity onPress={() => logout()}>
            <Text className="text-center text-gray-400 py-4">Logout</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Verses Tab Footer
      return (
        <View className="py-4 pb-20">
          {hasMore && verses.length > 0 && (
            <ActivityIndicator color="#F9C846" />
          )}
        </View>
      );
    }
  };

  // Track viewed verses locally to prevent duplicate views in one session
  const [viewedVerses, setViewedVerses] = useState(new Set());

  const handleView = async (verseId) => {
    if (viewedVerses.has(verseId)) return;

    // Add to local set immediately
    setViewedVerses(prev => new Set(prev).add(verseId));

    // Optimistic count update
    setVerseCounts((prev) => ({
      ...prev,
      [verseId]: {
        ...prev[verseId],
        view_count: (prev[verseId]?.view_count || 0) + 1,
      },
    }));

    try {
      // Check if already viewed in DB (optional, but good for data integrity if session resets)
      // For now, we'll rely on the insert failing or just inserting. 
      // Ideally, we should have a unique constraint on (user_id, verse_id, interaction_type) for views too, 
      // or just insert and let the backend handle it.
      // Given the user request "registerd once only per verse per user", 
      // we should try to select first or rely on a unique index.
      // Assuming we just want to record it if not present:

      const { error } = await supabase.from("verse_interactions").insert({
        user_id: user.id,
        verse_id: verseId,
        interaction_type: "view",
      });

      if (error) {
        // If error is duplicate key (code 23505), it's fine, we just ignore it.
        if (error.code !== '23505') {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error recording view:", error);
      // We don't revert the optimistic update for views usually, as it's less critical than likes
    }
  };

  const renderItem = ({ item }) => {
    const counts = getVerseCount(item.id);
    return (
      <View className="px-5 mb-6">
        <VerseCard
          key={`${item.id}-${counts.view_count}`} // Force re-render when view count changes
          verse={item}
          isLiked={likedVerses.has(item.id)}
          isSaved={savedVerses.has(item.id)}
          counts={counts}
          onToggleLike={toggleLike}
          onToggleSave={toggleSave}
          onShare={handleShare}
          onView={() => handleView(item.id)}
          headerText={activeTab === 'foryou' ? "Verse of the Day" : "Daily Verse"}
        />
      </View>
    );
  };

  // Filter data based on tab
  const listData = activeTab === 'foryou' ? verses.slice(0, 1) : verses;

  return (
    <LinearGradient
      colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          extraData={verseCounts} // Force re-render when counts change
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreVerses}
          onEndReachedThreshold={0.5}
        />

        {/* Celebration Modal */}
        <CelebrationModal
          visible={!!notification}
          item={notification?.item}
          type={notification?.type}
          onClose={handleNotificationPress}
        />

        {/* Streak Modal */}
        <StreakModal
          visible={streakModalVisible}
          onClose={() => setStreakModalVisible(false)}
          streak={streakData.current}
          history={streakData.history}
          quests={streakData.quests}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

