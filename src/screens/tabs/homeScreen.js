// HomeScreen.js - Updated with Stories Header
import { ChampionIcon, Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import CelebrationModal from "../../components/CelebrationModal";
import DailyQuestsPreview from "../../components/DailyQuestsPreview";
import HomePagePrayerPreview from "../../components/HomePagePrayerPreview";
import HomePageTestimonialPreview from "../../components/HomePageTestimonialPreview";
import { StoryCircle } from "../../components/StoriesCard";
import StoryViewerModal from "../../components/StoryViewerModal";
import StreakModal from "../../components/StreakModal";
import { VerseCard } from "../../components/VerseCard";
import VerseReelsPreview from "../../components/VerseReelsPreview";
import XPModal from "../../components/XPModal";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

// Emoji pool for random assignment to tags
const EMOJI_POOL = [
  "💪", "✨", "💛", "🎯", "🎓", "🙏", "❤️", "🌟", "🕊️", "💚",
  "🔥", "🌈", "⭐", "💫", "🌺", "🦋", "🌸", "🎨", "🎭", "🎪"
];

// Function to generate random gradient colors
const generateRandomGradient = () => {
  const gradients = [
    ["#FF9A9E", "#FECFEF"],
    ["#FEE8A0", "#F9C846"],
    ["#FFD6E8", "#FF9ECD"],
    ["#C1E1C1", "#A8E6CF"],
    ["#A8EDEA", "#FED6E3"],
    ["#FFE6FA", "#C3CDE6"],
    ["#FBC2EB", "#A6C1EE"],
    ["#FFDEE9", "#B5FFFC"],
    ["#D4FC79", "#96E6A1"],
    ["#FAD0C4", "#FFD1FF"],
    ["#FEC163", "#DE4313"],
    ["#92FFC0", "#002661"],
    ["#EBBBA7", "#CFC7F8"],
    ["#FFF1EB", "#ACE0F9"],
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

// Function to get random emoji
const getRandomEmoji = () => {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
};

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
  const [activeFilter, setActiveFilter] = useState("All");
  const [storyTags, setStoryTags] = useState([]); // Verse tags from backend
  const [loadingStoryTags, setLoadingStoryTags] = useState(true); // Loading state for tags

  const FILTERS = [
    "All",
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
  ];

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

  // XP Modal State
  const [xpModalVisible, setXpModalVisible] = useState(false);
  const [userStats, setUserStats] = useState(null);

  // Story Viewer State
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyVerses, setStoryVerses] = useState([]);
  const [selectedStoryTag, setSelectedStoryTag] = useState(null);
  const [loadingStoryTag, setLoadingStoryTag] = useState(null);

  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    // Initial Data Fetch
    if (!fetchedOnce.current) {
      fetchedOnce.current = true;
      initializeData();
    }

    // Start polling for achievements
    const interval = setInterval(checkAchievements, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [isUserLoggedIn]);

  // Track if verses have been loaded for the verses tab
  const [versesTabLoaded, setVersesTabLoaded] = useState(false);

  // Effect to fetch verses when filter changes (only if verses tab is already loaded)
  useEffect(() => {
    if (fetchedOnce.current && versesTabLoaded && activeTab === 'verses') {
      setPage(0);
      setHasMore(true);
      fetchVerses(0, activeFilter);
    }
  }, [activeFilter]);

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

  const fetchVerses = async (pageNumber = 0, filter = "All") => {
    try {
      if (pageNumber === 0) setLoading(true);

      let query = supabase
        .from("bible_verses")
        .select("*")
        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

      // Apply Filters
      if (filter !== "All") {
        query = query.eq("book", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (pageNumber === 0) {
        setVerses(data);
      } else {
        setVerses((prev) => [...prev, ...data]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching verses:", err);
      Alert.alert("Connection Issue", "Could not load verses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVerseTags = async () => {
    try {
      setLoadingStoryTags(true);
      const { data, error } = await supabase
        .from("verse_tags")
        .select("id, name")
        .limit(20); // Fetch up to 20 tags

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform tags with random emojis and colors
        const transformedTags = data.map((tag) => ({
          id: tag.id,
          tag: tag.name,
          color: generateRandomGradient(),
          icon: getRandomEmoji(),
          hasNew: true,
        }));
        setStoryTags(transformedTags);
      }
    } catch (err) {
      console.error("Error fetching verse tags:", err);
      // Silent fail - tags are optional UI enhancement
    } finally {
      setLoadingStoryTags(false);
    }
  };

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch random "For You" verse
      const { count } = await supabase
        .from("bible_verses")
        .select("*", { count: "exact", head: true });

      const randomOffset = Math.floor(Math.random() * (count || 1));

      const { data: forYouVerse, error: forYouError } = await supabase
        .from("bible_verses")
        .select("*")
        .range(randomOffset, randomOffset)
        .limit(1);

      if (forYouError) throw forYouError;
      if (forYouVerse) {
        setVerses(forYouVerse);
      }

      const [likesResult, savesResult, countsResult] =
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
        ]);

      if (likesResult.data) {
        setLikedVerses(new Set(likesResult.data.map((item) => item.verse_id)));
      }

      if (savesResult.data) {
        setSavedVerses(new Set(savesResult.data.map((item) => item.verse_id)));
      }

      // We do NOT fetch past views anymore. 
      // This allows recording a new view each time the user opens the app (new session).

      if (countsResult.data) {
        const countsMap = {};
        countsResult.data.forEach((count) => {
          countsMap[count.verse_id] = count;
        });
        setVerseCounts(countsMap);
      }

      // Fetch Streak Data
      await fetchStreakData();

      // Fetch Verse Tags
      await fetchVerseTags();

    } catch (err) {
      setError(err.message);
      console.error("Error initializing data:", err);
      Alert.alert("Error", "Could not load your feed.");
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
      await fetchVerses(nextPage, activeFilter);
    }
  };

  const fetchStreakData = async () => {
    try {
      // 1. Get Current Streak & Last Active Date
      const { data: stats } = await supabase
        .from("gamification_profiles")
        .select("current_streak, last_active_date, current_level, total_xp")
        .eq("user_id", user.id)
        .single();

      if (stats) {
        setUserStats(stats);
      }

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
      // Silent fail for streak data is okay, but maybe log it
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
      Alert.alert("Error", `Could not ${type} verse.`);
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
      Alert.alert("Error", "Could not share verse.");
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

  const handleStoryPress = async (tag) => {
    console.log(`Pressed ${tag} story`);
    setSelectedStoryTag(tag);
    setLoadingStoryTag(tag);

    try {
      // 1. Get Tag ID
      const { data: tagData, error: tagError } = await supabase
        .from('verse_tags')
        .select('id')
        .ilike('name', tag)
        .single();

      if (tagError || !tagData) {
        console.log('Tag not found:', tag);
        setLoadingStoryTag(null);
        return;
      }

      // 2. Get Verse IDs from Map
      const { data: mapData, error: mapError } = await supabase
        .from('bible_verse_tag_map')
        .select('verse_id')
        .eq('tag_id', tagData.id)
        .limit(10);

      if (mapError || !mapData || mapData.length === 0) {
        console.log('No verses found for tag:', tag);
        setLoadingStoryTag(null);
        return;
      }

      // Shuffle array to get random 3 from the 10
      const shuffled = mapData.sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, 3).map(m => m.verse_id);

      // 3. Fetch Verses
      const { data, error } = await supabase
        .from("bible_verses")
        .select("*")
        .in('id', selectedIds);

      if (error) throw error;

      // Add the tag to the verses for display
      const stories = data.map(v => ({
        ...v,
        tag: tag
      }));

      setStoryVerses(stories);
      setStoryViewerVisible(true);
    } catch (err) {
      console.error("Error fetching story verses:", err);
      Alert.alert("Error", "Could not load story.");
    } finally {
      setLoadingStoryTag(null);
    }
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[24px] font-lexend-medium text-gray-800">
            lumiverse
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              className="active:opacity-60 flex-row items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100/50 shadow-sm"
              onPress={() => {
                fetchStreakData();
                setXpModalVisible(true);
              }}
            >
              <HugeiconsIcon icon={ChampionIcon} size={18} pointerEvents="none" color="#4F46E5" strokeWidth={1.5} />
              <Text className="text-indigo-700 font-lexend-bold text-xs">
                Lvl {userStats?.current_level || 1}
              </Text>
            </Pressable>

            <Pressable
              className="active:opacity-60 flex-row items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100/50 shadow-sm"
              onPress={() => {
                fetchStreakData(); // Refresh data before showing
                setStreakModalVisible(true);
              }}
            >
              <HugeiconsIcon icon={Fire02Icon} size={18} pointerEvents="none" color="#EA580C" fill="#EA580C" strokeWidth={1.5} />
              <Text className="text-orange-700 font-lexend-bold text-xs">
                {streakData.current}
              </Text>
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
          {loadingStoryTags ? (
            // Skeleton loaders while tags are loading
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="items-center mr-4">
                  <View
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      backgroundColor: '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View className="w-full h-full rounded-full items-center justify-center">
                      <ActivityIndicator color="#9CA3AF" size="small" />
                    </View>
                  </View>
                  <View className="mt-2 w-12 h-3 bg-gray-200 rounded" />
                </View>
              ))}
            </>
          ) : (
            // Actual story tags
            storyTags.map((story) => (
              <StoryCircle
                key={story.id}
                tag={story.tag}
                color={story.color}
                icon={story.icon}
                hasNew={story.hasNew}
                isLoading={loadingStoryTag === story.tag}
                onPress={() => handleStoryPress(story.tag)}
              />
            ))
          )}
        </ScrollView>
      </View>



      {/* <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
        <Text>Upgrade to Premium</Text>
      </TouchableOpacity> */}

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
          onPress={() => {
            setActiveTab("verses");
            // Lazy load verses when tab is clicked for the first time
            if (!versesTabLoaded) {
              setVersesTabLoaded(true);
              setPage(0);
              setHasMore(true);
              fetchVerses(0, activeFilter);
            }
          }}
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

      {/* Filters (Only for Verses Tab) */}
      {activeTab === "verses" && (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingVertical: 4 }}
          >
            {FILTERS.map((filter) => (
              <Pressable
                key={filter}
                onPress={() => {
                  if (activeFilter !== filter) {
                    setActiveFilter(filter);
                    setPage(0); // Reset page to trigger new fetch
                    setVerses([]); // Clear current list
                    setHasMore(true);
                  }
                }}
                className={`px-4 py-2 rounded-full border ${activeFilter === filter
                  ? "bg-gray-900 border-gray-900 shadow-sm"
                  : "bg-white border-gray-200/60 shadow-sm"
                  }`}
              >
                <Text
                  className={`font-lexend-medium text-sm ${activeFilter === filter ? "text-white" : "text-gray-600"
                    }`}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}



      {/* Loading/Error States */}
      {loading && verses.length === 0 && (
        <View className="items-center py-4">
          <ActivityIndicator color="#F9C846" />
          <Text className="text-gray-700 mt-2 font-lexend-light">
            Loading verses...
          </Text>
        </View>
      )}

      {error && (
        <View className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-100 mx-5 shadow-sm">
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

  const renderFooter = useMemo(() => {
    return (
      <>
        {/* For You Tab Footer - Always mounted but conditionally visible */}
        <View className="pt-6 pb-4" style={{ display: activeTab === 'foryou' ? 'flex' : 'none' }}>
          {/* Verse Reels Section */}
          <VerseReelsPreview
            navigation={navigation}
            likedVerses={likedVerses}
            savedVerses={savedVerses}
            onInteraction={(verseId, type) => {
              if (type === 'like') toggleLike(verseId);
              else if (type === 'save') toggleSave(verseId);
              else if (type === 'share') handleShare(verseId);
            }}
            onViewVerse={handleView}
          />

          {/* Daily Quests Section */}
          <DailyQuestsPreview />

          {/* Prayer and Testimonial Sections */}
          <View className="px-5">
            <HomePagePrayerPreview navigation={navigation} />
            <HomePageTestimonialPreview navigation={navigation} />
          </View>
        </View>

        {/* Verses Tab Footer */}
        {activeTab === 'verses' && (
          <View className="py-4 pb-20">
            {hasMore && verses.length > 0 && (
              <ActivityIndicator color="#F9C846" />
            )}
          </View>
        )}
      </>
    );
  }, [activeTab, hasMore, verses.length, navigation, likedVerses, savedVerses]);

  // Track viewed verses locally to prevent duplicate views in one session
  const [viewedVerses, setViewedVerses] = useState(new Set());

  const handleView = async (verseId) => {
    // Validation
    if (!verseId || !user?.id) return;

    // Session-based de-duplication:
    // If we've already recorded a view for this verse IN THIS SESSION, don't do it again.
    if (viewedVerses.has(verseId)) return;

    // Add to local set immediately to prevent duplicate calls while scrolling
    setViewedVerses(prev => new Set(prev).add(verseId));

    // Optimistic count update REMOVED to prevent "jumping" UI.
    // We now wait for server confirmation before updating the count.

    const recordView = async (retryCount = 0) => {
      try {
        const { error } = await supabase.from("verse_interactions").insert({
          user_id: user.id,
          verse_id: verseId,
          interaction_type: "view",
        });

        if (!error) {
          // Success! Update the UI count now.
          setVerseCounts((prev) => ({
            ...prev,
            [verseId]: {
              ...prev[verseId],
              view_count: (prev[verseId]?.view_count || 0) + 1,
            },
          }));
        } else {
          // Handle errors
          if (error.code !== '23505') {
            console.warn(`Supabase view recording error (Attempt ${retryCount + 1}):`, error.message);
            // Retry on network errors or 5xx server errors
            if (retryCount < 3 && (error.message?.includes('Network') || error.status >= 500)) {
              setTimeout(() => recordView(retryCount + 1), 1000 * (retryCount + 1));
            }
          }
        }
      } catch (error) {
        // Silent fail for views as requested by user ("no error what so ever")
        // Only log if it's NOT a network error and NOT a duplicate error
        if (!error.message?.includes('Network') && error.code !== '23505') {
          console.warn(`View recording exception (Attempt ${retryCount + 1}):`, error);
        }

        // Retry silently on network exceptions
        if (retryCount < 3 && error.message?.includes('Network')) {
          setTimeout(() => recordView(retryCount + 1), 1000 * (retryCount + 1));
        }
      }
    };

    recordView();
  };

  const renderItem = ({ item }) => {
    const counts = getVerseCount(item.id);
    const marginClass = activeTab === 'foryou' ? 'px-5 mb-0' : 'px-5 mb-6';
    return (
      <View className={marginClass}>
        <VerseCard
          key={item.id}
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
      style={{
        flex: 1,
        paddingTop: Constants.statusBarHeight
      }}
    >
      <View className="flex-1" >
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

        <XPModal
          visible={xpModalVisible}
          onClose={() => setXpModalVisible(false)}
          stats={userStats}
        />

        {/* Story Viewer Modal */}
        <StoryViewerModal
          visible={storyViewerVisible}
          onClose={() => setStoryViewerVisible(false)}
          stories={storyVerses}
        />
      </View>
    </LinearGradient>
  );
}

