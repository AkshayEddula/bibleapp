import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  Medal,
  MedalIcon,
  Star,
  Trophy,
  Zap
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  ZoomIn
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import CelebrationModal from "../../components/CelebrationModal";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { images } from "../../utils";

const { width, height } = Dimensions.get("window");

// Details Modal Component
const DetailsModal = ({ visible, item, onClose, type }) => {
  if (!item) return null;

  const isQuest = type === "quest";
  const isLocked = type === "badge" && !item.is_earned;

  // Badge Specific Styles
  const BadgeHeader = () => (
    <ImageBackground
      source={images.J1}
      style={{ width: "100%", height: 200, alignItems: "center", justifyContent: "center" }}
      imageStyle={{ opacity: 0.8 }}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.6)"]}
        style={{ position: 'absolute', inset: 0 }}
      />
      <View className="w-24 h-24 rounded-full items-center justify-center bg-white/20 backdrop-blur-md border-2 border-white/50 shadow-lg">
        {item.icon_url ? (
          <Text className="text-[40px]">{item.icon_url}</Text>
        ) : (
          <Medal size={48} color="#FFD700" />
        )}
      </View>
      <View className="absolute bottom-4 bg-black/40 px-3 py-1 rounded-full border border-white/20">
        <Text className="text-white font-lexend-bold text-[12px] tracking-wider uppercase">
          {item.xp_reward} XP Badge
        </Text>
      </View>
    </ImageBackground>
  );

  const QuestHeader = () => (
    <LinearGradient
      colors={["#E0E7FF", "#C7D2FE"]}
      style={{ padding: 32, alignItems: "center", justifyContent: "center" }}
    >
      <View className="w-20 h-20 rounded-full items-center justify-center bg-white/50">
        <Trophy size={40} color="#4F46E5" />
      </View>
    </LinearGradient>
  );

  const LockedHeader = () => (
    <View className="bg-gray-100 p-8 items-center justify-center h-[180px]">
      <View className="w-20 h-20 rounded-full items-center justify-center bg-gray-200">
        <Lock size={32} color="#9CA3AF" />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView
        intensity={10}
        tint="dark"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
        />
        <Pressable style={{ position: 'absolute', inset: 0 }} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.duration(300)}
          className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          {isQuest ? <QuestHeader /> : (isLocked ? <LockedHeader /> : <BadgeHeader />)}

          {/* Content */}
          <View className="p-6">
            <Text className="text-[24px] font-lexend-bold text-gray-900 text-center mb-2">
              {item.title || item.name}
            </Text>

            <Text className="text-[15px] font-lexend text-gray-600 text-center mb-6 leading-[22px]">
              {item.description}
            </Text>

            {/* Stats/Progress */}
            <View className="bg-stone-50 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[13px] font-lexend-medium text-gray-500">Requirement</Text>
                <Text className="text-[13px] font-lexend-semibold text-gray-800">
                  {item.requirement_count || item.requirement_value} {item.requirement_type?.replace('_', ' ')}
                </Text>
              </View>

              {isQuest && (
                <View className="mt-2">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-[12px] font-lexend-medium text-gray-500">Progress</Text>
                    <Text className="text-[12px] font-lexend-semibold text-indigo-600">
                      {Math.floor((item.progress / item.requirement_count) * 100)}%
                    </Text>
                  </View>
                  <View className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min((item.progress / item.requirement_count) * 100, 100)}%` }}
                    />
                  </View>
                </View>
              )}

              {!isQuest && !isLocked && (
                <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-stone-200">
                  <Text className="text-[12px] font-lexend-medium text-gray-500">Earned On</Text>
                  <Text className="text-[12px] font-lexend-semibold text-indigo-600">
                    {new Date(item.earned_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={onClose}
              className="bg-gray-900 w-full py-4 rounded-[20px] active:scale-95"
            >
              <Text className="text-white text-center font-lexend-semibold text-[16px]">
                Close
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};



export default function StatsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [celebrationQueue, setCelebrationQueue] = useState([]);
  const [currentCelebration, setCurrentCelebration] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // For DetailsModal
  const shownCelebrationsRef = useRef(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeQuests, setActiveQuests] = useState([]);
  const [allBadges, setAllBadges] = useState([]); // Store all badges with earned status
  const [selectedTab, setSelectedTab] = useState("overview"); // overview, quests, badges

  // Handle initial auth loading state
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Auth finished but no user. Stopping loading.");
      setLoading(false);
    }
  }, [authLoading, user]);

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("StatsScreen focused. User:", user?.id, "AuthLoading:", authLoading);
      if (user?.id) {
        fetchAllData();
      }
    }, [user?.id])
  );

  const fetchAllData = async () => {
    console.log("fetchAllData started");
    try {
      const [userStats, questsData, badgesData] = await Promise.all([
        fetchUserStats(),
        fetchQuests(),
        fetchBadges(),
      ]);
      console.log("fetchAllData promises resolved");

      // Check for new achievements (completed within last 5 minutes)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

      console.log("Checking for celebrations...");
      console.log("Current Time:", now.toISOString());
      console.log("Threshold:", fiveMinutesAgo.toISOString());

      const newCelebrations = [];

      // Check Quests
      questsData.forEach((q) => {
        if (q.is_completed && q.completed_at) {
          const completedAt = new Date(q.completed_at);
          console.log(`Quest ${q.title} completed at:`, completedAt.toISOString());

          if (
            completedAt > fiveMinutesAgo &&
            !shownCelebrationsRef.current.has(`quest-${q.id}`)
          ) {
            console.log("Queueing celebration for quest:", q.title);
            newCelebrations.push({ type: "quest", item: q });
            shownCelebrationsRef.current.add(`quest-${q.id}`);
          }
        }
      });

      // Check Badges
      badgesData.forEach((b) => {
        if (b.is_earned && b.earned_at) {
          const earnedAt = new Date(b.earned_at);
          console.log(`Badge ${b.name} earned at:`, earnedAt.toISOString());

          if (
            earnedAt > fiveMinutesAgo &&
            !shownCelebrationsRef.current.has(`badge-${b.id}`)
          ) {
            console.log("Queueing celebration for badge:", b.name);
            newCelebrations.push({ type: "badge", item: b });
            shownCelebrationsRef.current.add(`badge-${b.id}`);
          }
        }
      });

      if (newCelebrations.length > 0) {
        setCelebrationQueue((prev) => [...prev, ...newCelebrations]);
      }
      if (!userStats) {
        // Only show alert if critical user stats failed
        Alert.alert("Connection Issue", "Could not load your profile stats. Please pull to refresh.");
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Something went wrong while loading your data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const fetchUserStats = async () => {
    const { data, error } = await supabase
      .from("gamification_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching stats:", error);
      return null;
    }

    setStats(data);
    return data;
  };

  const fetchQuests = async () => {
    try {
      console.log("Fetching quests for user:", user.id);

      const { data, error } = await supabase.rpc('get_user_quests', {
        p_user_id: user.id
      });

      if (error) {
        console.error("Error fetching quests:", error.message, error.details);
        setActiveQuests([]); // Set empty array on error
        return [];
      }

      console.log("Quests fetched successfully:", data?.length || 0);

      if (!data || data.length === 0) {
        setActiveQuests([]);
        return [];
      }

      // Deduplicate
      const uniqueQuests = Object.values(
        data.reduce((acc, curr) => {
          if (!acc[curr.id]) acc[curr.id] = curr;
          return acc;
        }, {})
      );

      setActiveQuests(uniqueQuests);
      return uniqueQuests;
    } catch (err) {
      console.error("Caught error in fetchQuests:", err.message, err.stack);
      setActiveQuests([]); // Prevent undefined state
      return [];
    }
  };

  const fetchBadges = async () => {
    // 1. Fetch all badge definitions
    const { data: badgesData, error: badgesError } = await supabase
      .from("badges")
      .select("*")
      .order("xp_reward", { ascending: true });

    if (badgesError) {
      console.error("Error fetching badges:", badgesError);
      return [];
    }

    // 2. Fetch user's earned badges
    const { data: userBadgesData, error: userBadgesError } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id);

    if (userBadgesError) {
      console.error("Error fetching user badges:", userBadgesError);
      return [];
    }

    // 3. Merge to create a list of all badges with "earned" status
    const mergedBadges = badgesData.map(badge => {
      const earnedBadge = userBadgesData?.find(ub => ub.badge_id === badge.id);
      return {
        ...badge,
        is_earned: !!earnedBadge,
        earned_at: earnedBadge?.earned_at
      };
    });

    setAllBadges(mergedBadges);
    return mergedBadges;
  };

  const calculateLevelProgress = () => {
    if (!stats) return { percentage: 0, current: 0, next: 150 };

    const currentLevel = stats.current_level;

    // Formula: XP required = level^2 * 150
    const nextLevelThreshold = Math.pow(currentLevel + 1, 2) * 150;
    const currentLevelThreshold = Math.pow(currentLevel, 2) * 150;

    const totalRange = nextLevelThreshold - currentLevelThreshold;
    const progressInLevel = stats.total_xp - currentLevelThreshold;

    let percentage = (progressInLevel / totalRange) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    return {
      percentage,
      current: stats.total_xp,
      next: nextLevelThreshold
    };
  };

  // Handle Celebration Queue
  useEffect(() => {
    if (!currentCelebration && celebrationQueue.length > 0) {
      // Batch all pending celebrations
      setCurrentCelebration(celebrationQueue);
      setCelebrationQueue([]);
    }
  }, [currentCelebration, celebrationQueue]);

  const closeCelebration = () => {
    setCurrentCelebration(null);
  };

  const openDetails = (item, type) => {
    setSelectedItem({ item, type });
  };

  const closeDetails = () => {
    setSelectedItem(null);
  };

  if (loading && !stats) {
    return (
      <LinearGradient
        colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F9C846" />
          <Text className="text-gray-700 mt-4 font-lexend-light">
            Loading your stats...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const levelProgress = calculateLevelProgress();
  const dailyQuests = activeQuests.filter(q => q.quest_type === 'daily');
  const weeklyQuests = activeQuests.filter(q => q.quest_type === 'weekly');
  const earnedBadges = allBadges.filter(b => b.is_earned);
  const lockedBadges = allBadges.filter(b => !b.is_earned);

  return (
    <LinearGradient
      colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header with Character */}
        <View className="px-6 pt-2 pb-6 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[28px] font-lexend-semibold text-gray-800">
              Your Journey
            </Text>
            <Text className="text-[15px] font-lexend-light text-gray-600 mt-1">
              Keep growing in faith every day!
            </Text>

            {/* Speech Bubble */}
            <View className="mt-4 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-stone-200/60 shadow-sm">
              <Text className="text-[13px] font-lexend text-gray-700">
                "You're doing great! Keep up the streak! 🔥"
              </Text>
            </View>
          </View>

          {/* Character Image */}
          <View className="relative">
            <View className="absolute inset-0 bg-yellow-200/30 blur-xl rounded-full" />
            <Image
              source={images.Char}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Tab Selector */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-white rounded-full p-1.5 border border-stone-200">
            {["overview", "quests", "badges"].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab)}
                className="flex-1"
              >
                <LinearGradient
                  colors={
                    selectedTab === tab
                      ? ["#FEE8A0", "#F9C846"]
                      : ["transparent", "transparent"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 8,
                    borderRadius: 100,
                    alignItems: "center",
                  }}
                >
                  <Text
                    className={`font-lexend-medium text-[14px] capitalize ${selectedTab === tab ? "text-amber-900" : "text-gray-600"
                      }`}
                  >
                    {tab}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F9C846" />
          }
        >
          {/* OVERVIEW TAB */}
          {selectedTab === "overview" && stats && (
            <View className="px-6">
              {/* Level Card */}
              <View
                className="bg-white rounded-[28px] p-6 mb-5 border border-stone-200/40"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-[15px] font-lexend-light text-gray-600">
                      Current Level
                    </Text>
                    <Text className="text-[36px] font-lexend-bold text-gray-800 leading-tight">
                      {stats.current_level}
                    </Text>
                  </View>
                  <LinearGradient
                    colors={["#8B5CF6", "#6366F1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 100,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trophy size={32} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                </View>

                {/* Progress Bar */}
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[13px] font-lexend-medium text-gray-700">
                      Progress to Level {stats.current_level + 1}
                    </Text>
                    <Text className="text-[13px] font-lexend-semibold text-indigo-600">
                      {Math.floor(levelProgress.percentage)}%
                    </Text>
                  </View>
                  <View className="h-3 bg-stone-100 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={["#8B5CF6", "#6366F1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: `${levelProgress.percentage}%`,
                        height: "100%",
                        borderRadius: 100,
                      }}
                    />
                  </View>
                  <Text className="text-[12px] font-lexend-light text-gray-500 mt-1.5">
                    {levelProgress.current.toLocaleString()} /{" "}
                    {levelProgress.next.toLocaleString()} XP
                  </Text>
                </View>
              </View>

              {/* Streak Card */}
              <View
                className="bg-white rounded-[28px] p-6 mb-5 border border-stone-200/40"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Flame size={20} color="#F97316" strokeWidth={2} />
                      <Text className="text-[16px] font-lexend-semibold text-gray-800">
                        Daily Streak
                      </Text>
                    </View>
                    <Text className="text-[32px] font-lexend-bold text-orange-600 leading-tight">
                      {stats.current_streak}{" "}
                      <Text className="text-[18px] font-lexend-medium text-gray-600">
                        days
                      </Text>
                    </Text>
                    <Text className="text-[13px] font-lexend-light text-gray-500 mt-1">
                      Best: {stats.longest_streak} days 🏆
                    </Text>
                  </View>
                  <LinearGradient
                    colors={["#FED7AA", "#FDBA74"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 100,
                    }}
                  >
                    <Text className="text-[28px]">🔥</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Today's Focus (Daily Quests Preview) */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-3 px-1">
                  <Text className="text-[16px] font-lexend-semibold text-gray-800">
                    Today's Focus
                  </Text>
                  <Pressable onPress={() => setSelectedTab('quests')}>
                    <Text className="text-[13px] font-lexend-medium text-indigo-600">
                      View All
                    </Text>
                  </Pressable>
                </View>
                {dailyQuests.length > 0 ? (
                  dailyQuests.slice(0, 2).map(quest => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      compact
                      onPress={() => openDetails(quest, 'quest')}
                    />
                  ))
                ) : (
                  <Text className="text-gray-500 font-lexend-light italic px-1">
                    No daily quests available.
                  </Text>
                )}
              </View>

              {/* Stats Grid */}
              <View className="mb-5">
                <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                  Lifetime Stats
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {/* Total Points */}
                  <View
                    className="bg-white rounded-2xl p-4 border border-stone-200/40"
                    style={{
                      width: (width - 60) / 2,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <Zap size={18} color="#F59E0B" strokeWidth={2} />
                      <Text className="text-[13px] font-lexend-medium text-gray-600">
                        Total Points
                      </Text>
                    </View>
                    <Text className="text-[24px] font-lexend-bold text-gray-800">
                      {stats.total_points.toLocaleString()}
                    </Text>
                  </View>

                  {/* Total XP */}
                  <View
                    className="bg-white rounded-2xl p-4 border border-stone-200/40"
                    style={{
                      width: (width - 60) / 2,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <Star size={18} color="#8B5CF6" strokeWidth={2} />
                      <Text className="text-[13px] font-lexend-medium text-gray-600">
                        Total XP
                      </Text>
                    </View>
                    <Text className="text-[24px] font-lexend-bold text-gray-800">
                      {stats.total_xp.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* QUESTS TAB */}
          {selectedTab === "quests" && (
            <View className="px-6">
              {activeQuests.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-6xl mb-4">🎯</Text>
                  <Text className="text-[18px] font-lexend-semibold text-gray-800">
                    No Active Quests
                  </Text>
                  <Text className="text-[14px] font-lexend-light text-gray-600 mt-2 text-center px-8">
                    Check back later for new daily and weekly quests!
                  </Text>
                </View>
              ) : (
                <>
                  {/* Daily Quests */}
                  {dailyQuests.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                        Daily Quests
                      </Text>
                      {dailyQuests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          onPress={() => openDetails(quest, 'quest')}
                        />
                      ))}
                    </View>
                  )}

                  {/* Weekly Quests */}
                  {weeklyQuests.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                        Weekly Quests
                      </Text>
                      {weeklyQuests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          onPress={() => openDetails(quest, 'quest')}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* BADGES TAB */}
          {selectedTab === "badges" && (
            <View className="px-6">
              {/* Earned Badges */}
              <View className="mb-6">
                <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                  Earned Badges ({earnedBadges.length})
                </Text>
                {earnedBadges.length === 0 ? (
                  <Text className="text-gray-500 font-lexend-light italic px-1 mb-4">
                    No badges earned yet. Keep reading!
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-3">
                    {earnedBadges.map((badge) => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        earnedAt={badge.earned_at}
                        isLocked={false}
                        onPress={() => openDetails(badge, 'badge')}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Locked Badges */}
              <View className="mb-6">
                <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                  Available Badges
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {lockedBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isLocked={true}
                      onPress={() => openDetails(badge, 'badge')}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      {/* Celebration Modal */}
      <CelebrationModal
        visible={!!currentCelebration}
        items={currentCelebration || []}
        onClose={closeCelebration}
      />

      {/* Details Modal */}
      <DetailsModal
        visible={!!selectedItem}
        item={selectedItem?.item}
        type={selectedItem?.type}
        onClose={closeDetails}
      />
    </LinearGradient>
  );
}

// Quest Card Component
function QuestCard({ quest, compact = false, onPress }) {
  const progress = (quest.progress / quest.requirement_count) * 100 || 0;
  const isComplete = quest.is_completed || progress >= 100;

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white rounded-[24px] p-5 mb-3 border border-stone-200/60 active:scale-[0.98] transition-transform ${compact ? 'py-4' : ''}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-1">
            {quest.title}
          </Text>
          {!compact && (
            <Text className="text-[13px] font-lexend-light text-gray-600 leading-[18px]">
              {quest.description}
            </Text>
          )}
        </View>

        {/* Type Badge - Only show if not compact or if we want to distinguish */}
        {!compact && (
          <View className={`px-2.5 py-1 rounded-full ${quest.quest_type === 'daily' ? 'bg-blue-100' : 'bg-purple-100'}`}>
            <Text className={`text-[10px] font-lexend-semibold capitalize ${quest.quest_type === 'daily' ? 'text-blue-700' : 'text-purple-700'}`}>
              {quest.quest_type}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[12px] font-lexend-medium text-gray-700">
            {quest.progress} / {quest.requirement_count}
          </Text>
          <Text className="text-[12px] font-lexend-semibold text-indigo-600">
            {Math.floor(progress)}%
          </Text>
        </View>
        <View className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <LinearGradient
            colors={
              isComplete ? ["#10B981", "#34D399"] : ["#8B5CF6", "#6366F1"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              borderRadius: 100,
            }}
          />
        </View>
      </View>

      {/* Rewards */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Zap size={16} color="#F59E0B" strokeWidth={2} />
          <Text className="text-[13px] font-lexend-semibold text-gray-700">
            +{quest.xp_reward} XP
          </Text>
        </View>

        {isComplete ? (
          <View className="flex-row items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} />
            <Text className="text-[11px] font-lexend-semibold text-green-700">
              Complete
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-full">
            <Clock size={14} color="#F59E0B" strokeWidth={2} />
            <Text className="text-[11px] font-lexend-semibold text-amber-700">
              In Progress
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// Badge Card Component
function BadgeCard({ badge, earnedAt, isLocked = false, onPress }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLocked) {
    return (
      <Pressable
        onPress={onPress}
        className="bg-white rounded-[24px] p-4 border border-stone-200/60 active:scale-[0.98] transition-transform"
        style={{
          width: (width - 60) / 2,
        }}
      >
        <View className="items-center mb-4 opacity-50">
          <View className="w-[72px] h-[72px] rounded-full items-center justify-center bg-gray-100 mb-2">
            {badge.icon_url ? (
              <Text className="text-[32px] opacity-40">{badge.icon_url}</Text>
            ) : (
              <Lock size={28} color="#9CA3AF" />
            )}
          </View>
        </View>
        <Text className="text-[15px] font-lexend-semibold text-center mb-1 leading-tight text-gray-400">
          {badge.name}
        </Text>
        <View className="rounded-full py-1.5 px-2 bg-stone-100 mt-2">
          <Text className="text-[10px] font-lexend-medium text-center text-gray-400">
            Reward: {badge.xp_reward} XP
          </Text>
        </View>
      </Pressable>
    );
  }

  // Earned Badge Design
  return (
    <Pressable
      onPress={onPress}
      className="rounded-[24px] overflow-hidden active:scale-[0.98] transition-transform"
      style={{
        width: (width - 60) / 2,
        height: 180,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
      }}
    >
      <ImageBackground
        source={images.J1}
        style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'space-between' }}
        imageStyle={{ borderRadius: 24 }}
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
          style={{ position: 'absolute', inset: 0, borderRadius: 24 }}
        />

        {/* Icon */}
        <View className="w-16 h-16 rounded-full items-center justify-center bg-white/20 backdrop-blur-sm border border-white/40 mt-2">
          {badge.icon_url ? (
            <Text className="text-[32px]">{badge.icon_url}</Text>
          ) : (
            <MedalIcon size={32} color="#FFD700" />
          )}
        </View>

        {/* Info */}
        <View className="w-full items-center">
          <Text className="text-[16px] font-lexend-bold text-white text-center leading-tight mb-1 shadow-sm">
            {badge.name}
          </Text>
          <View className="bg-white/20 px-2 py-1 rounded-full border border-white/10">
            <Text className="text-[10px] font-lexend-medium text-white/90">
              {formatDate(earnedAt)}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}