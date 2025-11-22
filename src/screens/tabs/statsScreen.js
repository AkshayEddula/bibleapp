import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  Medal,
  Star,
  Trophy,
  Zap
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { images } from "../../utils";

const { width } = Dimensions.get("window");

export default function StatsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeQuests, setActiveQuests] = useState([]);
  const [allBadges, setAllBadges] = useState([]); // Store all badges with earned status
  const [selectedTab, setSelectedTab] = useState("overview"); // overview, quests, badges

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchAllData();
      }
    }, [user?.id])
  );

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchUserStats(),
        fetchQuests(),
        fetchBadges(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
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
      return;
    }

    setStats(data);
  };

  const fetchQuests = async () => {
    const { data: questsData, error: questsError } = await supabase
      .from("quests")
      .select("*")
      .eq("is_active", true);

    if (questsError) {
      console.error("Error fetching quests:", questsError);
      return;
    }

    const { data: userQuestsData, error: userQuestsError } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", user.id);

    if (userQuestsError) {
      console.error("Error fetching user quests:", userQuestsError);
      return;
    }

    // Merge data
    const mergedQuests = questsData.map(quest => {
      const userQuest = userQuestsData?.find(uq => uq.quest_id === quest.id);
      return {
        ...quest,
        progress: userQuest?.progress_count || 0,
        is_completed: userQuest?.is_completed || false,
        user_quest_id: userQuest?.id
      };
    });

    setActiveQuests(mergedQuests);
  };

  const fetchBadges = async () => {
    // 1. Fetch all badge definitions
    const { data: badgesData, error: badgesError } = await supabase
      .from("badges")
      .select("*")
      .order("xp_reward", { ascending: true });

    if (badgesError) {
      console.error("Error fetching badges:", badgesError);
      return;
    }

    // 2. Fetch user's earned badges
    const { data: userBadgesData, error: userBadgesError } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id);

    if (userBadgesError) {
      console.error("Error fetching user badges:", userBadgesError);
      return;
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
      <SafeAreaView className="flex-1">
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
                    <QuestCard key={quest.id} quest={quest} compact />
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
                        <QuestCard key={quest.id} quest={quest} />
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
                        <QuestCard key={quest.id} quest={quest} />
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
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Quest Card Component
function QuestCard({ quest, compact = false }) {
  const progress = (quest.progress / quest.requirement_count) * 100 || 0;
  const isComplete = quest.is_completed || progress >= 100;

  return (
    <View
      className={`bg-white rounded-[24px] p-5 mb-3 border border-stone-200/40 ${compact ? 'py-4' : ''}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
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
    </View>
  );
}

// Badge Card Component
function BadgeCard({ badge, earnedAt, isLocked = false }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Infer rarity/color based on XP reward or category
  const getBadgeColor = () => {
    if (isLocked) return ["#E5E7EB", "#D1D5DB"]; // Gray for locked
    if (badge.xp_reward >= 100) return ["#FBBF24", "#F59E0B"]; // Legendary/Gold
    if (badge.xp_reward >= 50) return ["#C084FC", "#A855F7"]; // Epic/Purple
    if (badge.xp_reward >= 20) return ["#93C5FD", "#60A5FA"]; // Rare/Blue
    return ["#D1D5DB", "#9CA3AF"]; // Common/Gray
  };

  return (
    <View
      className={`bg-white rounded-[20px] p-4 border ${isLocked ? 'border-stone-100 opacity-70' : 'border-stone-200/40'}`}
      style={{
        width: (width - 60) / 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Badge Icon with Gradient Background */}
      <View className="items-center mb-3">
        <LinearGradient
          colors={getBadgeColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 100,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          {isLocked ? (
            <Lock size={24} color="#9CA3AF" />
          ) : badge.icon_url ? (
            <Text className="text-[32px]">{badge.icon_url}</Text>
          ) : (
            <Medal size={32} color="#fff" />
          )}
        </LinearGradient>
      </View>

      {/* Badge Info */}
      <Text className={`text-[14px] font-lexend-semibold text-center mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
        {badge.name}
      </Text>
      <Text className="text-[11px] font-lexend-light text-gray-500 text-center leading-[15px] mb-2" numberOfLines={2}>
        {badge.description}
      </Text>

      {/* Earned Date or Requirement */}
      <View className={`rounded-full py-1.5 px-2 ${isLocked ? 'bg-stone-100' : 'bg-stone-50'}`}>
        <Text className={`text-[10px] font-lexend-medium text-center ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
          {isLocked ? `Reward: ${badge.xp_reward} XP` : `Earned ${formatDate(earnedAt)}`}
        </Text>
      </View>
    </View>
  );
}