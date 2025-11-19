import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Flame,
  Target,
  Star,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
} from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

export default function StatsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dailyActivity, setDailyActivity] = useState(null);
  const [activeQuests, setActiveQuests] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [selectedTab, setSelectedTab] = useState("overview"); // overview, quests, badges

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchDailyActivity(),
        fetchActiveQuests(),
        fetchUserBadges(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    const { data, error } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching stats:", error);
      return;
    }

    setStats(data);
  };

  const fetchDailyActivity = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("daily_activity")
      .select("*")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching daily activity:", error);
      return;
    }

    setDailyActivity(data || null);
  };

  const fetchActiveQuests = async () => {
    const { data, error } = await supabase
      .from("user_quests")
      .select(
        `
        *,
        quest_templates (
          quest_name,
          quest_description,
          requirement_type,
          difficulty
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("quest_type", { ascending: true });

    if (error) {
      console.error("Error fetching quests:", error);
      return;
    }

    setActiveQuests(data || []);
  };

  const fetchUserBadges = async () => {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        *,
        badge_definitions (
          badge_name,
          badge_description,
          badge_icon,
          category,
          rarity
        )
      `,
      )
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching badges:", error);
      return;
    }

    setUserBadges(data || []);
  };

  const calculateLevelProgress = () => {
    if (!stats) return 0;
    const progress =
      ((stats.total_xp % stats.xp_for_next_level) / stats.xp_for_next_level) *
      100;
    return Math.min(progress, 100);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return ["#A7F3D0", "#6EE7B7"];
      case "medium":
        return ["#FDE68A", "#FCD34D"];
      case "hard":
        return ["#FCA5A5", "#F87171"];
      default:
        return ["#E5E7EB", "#D1D5DB"];
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return ["#D1D5DB", "#9CA3AF"];
      case "rare":
        return ["#93C5FD", "#60A5FA"];
      case "epic":
        return ["#C084FC", "#A855F7"];
      case "legendary":
        return ["#FBBF24", "#F59E0B"];
      default:
        return ["#E5E7EB", "#D1D5DB"];
    }
  };

  if (loading) {
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

  if (!stats) {
    return (
      <LinearGradient
        colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-lexend-semibold text-gray-800 mb-2">
            No stats available
          </Text>
          <Text className="text-gray-600 font-lexend-light text-center">
            Start reading verses to see your progress!
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Text className="text-[28px] font-lexend-semibold text-gray-800">
            Your Journey
          </Text>
          <Text className="text-[15px] font-lexend-light text-gray-600 mt-1">
            Keep growing in faith every day
          </Text>
        </View>

        {/* Tab Selector */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-white rounded-full p-1.5 border border-stone-200">
            <Pressable
              onPress={() => setSelectedTab("overview")}
              className={`flex-1 py-2.5 rounded-full ${selectedTab === "overview" ? "" : ""}`}
            >
              <LinearGradient
                colors={
                  selectedTab === "overview"
                    ? ["#FEE8A0", "#F9C846"]
                    : ["transparent", "transparent"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  alignItems: "center",
                }}
              >
                <Text
                  className={`font-lexend-medium text-[14px] ${selectedTab === "overview" ? "text-amber-900" : "text-gray-600"}`}
                >
                  Overview
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setSelectedTab("quests")}
              className="flex-1 py-2.5 rounded-full"
            >
              <LinearGradient
                colors={
                  selectedTab === "quests"
                    ? ["#FEE8A0", "#F9C846"]
                    : ["transparent", "transparent"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  alignItems: "center",
                }}
              >
                <Text
                  className={`font-lexend-medium text-[14px] ${selectedTab === "quests" ? "text-amber-900" : "text-gray-600"}`}
                >
                  Quests
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setSelectedTab("badges")}
              className="flex-1 py-2.5 rounded-full"
            >
              <LinearGradient
                colors={
                  selectedTab === "badges"
                    ? ["#FEE8A0", "#F9C846"]
                    : ["transparent", "transparent"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  alignItems: "center",
                }}
              >
                <Text
                  className={`font-lexend-medium text-[14px] ${selectedTab === "badges" ? "text-amber-900" : "text-gray-600"}`}
                >
                  Badges
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* OVERVIEW TAB */}
          {selectedTab === "overview" && (
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
                      {Math.floor(calculateLevelProgress())}%
                    </Text>
                  </View>
                  <View className="h-3 bg-stone-100 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={["#8B5CF6", "#6366F1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: `${calculateLevelProgress()}%`,
                        height: "100%",
                        borderRadius: 100,
                      }}
                    />
                  </View>
                  <Text className="text-[12px] font-lexend-light text-gray-500 mt-1.5">
                    {stats.total_xp.toLocaleString()} /{" "}
                    {stats.xp_for_next_level.toLocaleString()} XP
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

              {/* Daily Progress Card */}
              {dailyActivity && (
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
                  <View className="flex-row items-center gap-2 mb-4">
                    <Target size={20} color="#10B981" strokeWidth={2} />
                    <Text className="text-[16px] font-lexend-semibold text-gray-800">
                      Today's Goal
                    </Text>
                  </View>

                  <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-[14px] font-lexend-medium text-gray-700">
                        {dailyActivity.verses_read_today} /{" "}
                        {dailyActivity.daily_verse_goal} verses
                      </Text>
                      <View
                        className={`px-3 py-1 rounded-full ${dailyActivity.goal_completed ? "bg-green-100" : "bg-amber-100"}`}
                      >
                        <Text
                          className={`text-[12px] font-lexend-semibold ${dailyActivity.goal_completed ? "text-green-700" : "text-amber-700"}`}
                        >
                          {dailyActivity.goal_completed
                            ? "Complete! ✓"
                            : "In Progress"}
                        </Text>
                      </View>
                    </View>
                    <View className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <LinearGradient
                        colors={["#10B981", "#34D399"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          width: `${Math.min((dailyActivity.verses_read_today / dailyActivity.daily_verse_goal) * 100, 100)}%`,
                          height: "100%",
                          borderRadius: 100,
                        }}
                      />
                    </View>
                  </View>

                  {/* Today's Activity */}
                  <View className="bg-stone-50 rounded-2xl p-4">
                    <Text className="text-[13px] font-lexend-semibold text-gray-700 mb-3">
                      Today's Activity
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[12px]">❤️</Text>
                        <Text className="text-[12px] font-lexend-medium text-gray-600">
                          {dailyActivity.likes_today} likes
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[12px]">💾</Text>
                        <Text className="text-[12px] font-lexend-medium text-gray-600">
                          {dailyActivity.saves_today} saves
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[12px]">📤</Text>
                        <Text className="text-[12px] font-lexend-medium text-gray-600">
                          {dailyActivity.shares_today} shares
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[12px]">💬</Text>
                        <Text className="text-[12px] font-lexend-medium text-gray-600">
                          {dailyActivity.comments_today} comments
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Lifetime Stats Grid */}
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

                  {/* Verses Read */}
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
                      <Text className="text-[16px]">📖</Text>
                      <Text className="text-[13px] font-lexend-medium text-gray-600">
                        Verses Read
                      </Text>
                    </View>
                    <Text className="text-[24px] font-lexend-bold text-gray-800">
                      {stats.total_verses_read.toLocaleString()}
                    </Text>
                  </View>

                  {/* Total Interactions */}
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
                      <Text className="text-[16px]">💫</Text>
                      <Text className="text-[13px] font-lexend-medium text-gray-600">
                        Interactions
                      </Text>
                    </View>
                    <Text className="text-[24px] font-lexend-bold text-gray-800">
                      {stats.total_interactions.toLocaleString()}
                    </Text>
                  </View>

                  {/* Quests Done */}
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
                      <Text className="text-[16px]">🎯</Text>
                      <Text className="text-[13px] font-lexend-medium text-gray-600">
                        Quests Done
                      </Text>
                    </View>
                    <Text className="text-[24px] font-lexend-bold text-gray-800">
                      {stats.total_quests_completed.toLocaleString()}
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
                    New quests will appear daily. Keep reading verses!
                  </Text>
                </View>
              ) : (
                <>
                  {/* Daily Quests */}
                  {activeQuests.filter((q) => q.quest_type === "daily").length >
                    0 && (
                    <View className="mb-6">
                      <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                        Daily Quests
                      </Text>
                      {activeQuests
                        .filter((q) => q.quest_type === "daily")
                        .map((quest) => (
                          <QuestCard key={quest.id} quest={quest} />
                        ))}
                    </View>
                  )}

                  {/* Weekly Quests */}
                  {activeQuests.filter((q) => q.quest_type === "weekly")
                    .length > 0 && (
                    <View className="mb-6">
                      <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                        Weekly Quests
                      </Text>
                      {activeQuests
                        .filter((q) => q.quest_type === "weekly")
                        .map((quest) => (
                          <QuestCard key={quest.id} quest={quest} />
                        ))}
                    </View>
                  )}

                  {/* Monthly Quests */}
                  {activeQuests.filter((q) => q.quest_type === "monthly")
                    .length > 0 && (
                    <View className="mb-6">
                      <Text className="text-[16px] font-lexend-semibold text-gray-800 mb-3 px-1">
                        Monthly Quests
                      </Text>
                      {activeQuests
                        .filter((q) => q.quest_type === "monthly")
                        .map((quest) => (
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
              {userBadges.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-6xl mb-4">🏅</Text>
                  <Text className="text-[18px] font-lexend-semibold text-gray-800">
                    No Badges Yet
                  </Text>
                  <Text className="text-[14px] font-lexend-light text-gray-600 mt-2 text-center px-8">
                    Complete quests and reach milestones to earn badges!
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-3">
                  {userBadges.map((userBadge) => (
                    <BadgeCard
                      key={userBadge.id}
                      badge={userBadge.badge_definitions}
                      earnedAt={userBadge.earned_at}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Quest Card Component
function QuestCard({ quest }) {
  const progress =
    (quest.current_progress / quest.required_progress) * 100 || 0;
  const isComplete = quest.status === "completed";

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return ["#A7F3D0", "#6EE7B7"];
      case "medium":
        return ["#FDE68A", "#FCD34D"];
      case "hard":
        return ["#FCA5A5", "#F87171"];
      default:
        return ["#E5E7EB", "#D1D5DB"];
    }
  };

  return (
    <View
      className="bg-white rounded-[24px] p-5 mb-3 border border-stone-200/40"
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
            {quest.quest_templates.quest_name}
          </Text>
          <Text className="text-[13px] font-lexend-light text-gray-600 leading-[18px]">
            {quest.quest_templates.quest_description}
          </Text>
        </View>

        {/* Difficulty Badge */}
        <LinearGradient
          colors={getDifficultyColor(quest.quest_templates.difficulty)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 100,
          }}
        >
          <Text className="text-[11px] font-lexend-semibold text-gray-800 capitalize">
            {quest.quest_templates.difficulty}
          </Text>
        </LinearGradient>
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[12px] font-lexend-medium text-gray-700">
            {quest.current_progress} / {quest.required_progress}
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
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <Zap size={16} color="#F59E0B" strokeWidth={2} />
            <Text className="text-[13px] font-lexend-semibold text-gray-700">
              +{quest.xp_reward} XP
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Star size={16} color="#8B5CF6" strokeWidth={2} />
            <Text className="text-[13px] font-lexend-semibold text-gray-700">
              +{quest.points_reward} pts
            </Text>
          </View>
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
function BadgeCard({ badge, earnedAt }) {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return ["#D1D5DB", "#9CA3AF"];
      case "rare":
        return ["#93C5FD", "#60A5FA"];
      case "epic":
        return ["#C084FC", "#A855F7"];
      case "legendary":
        return ["#FBBF24", "#F59E0B"];
      default:
        return ["#E5E7EB", "#D1D5DB"];
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View
      className="bg-white rounded-[20px] p-4 border border-stone-200/40"
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
          colors={getRarityColor(badge.rarity)}
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
          <Text className="text-[32px]">{badge.badge_icon}</Text>
        </LinearGradient>

        {/* Rarity Label */}
        <View
          className={`px-2.5 py-1 rounded-full ${
            badge.rarity === "legendary"
              ? "bg-amber-100"
              : badge.rarity === "epic"
                ? "bg-purple-100"
                : badge.rarity === "rare"
                  ? "bg-blue-100"
                  : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-[10px] font-lexend-semibold uppercase ${
              badge.rarity === "legendary"
                ? "text-amber-700"
                : badge.rarity === "epic"
                  ? "text-purple-700"
                  : badge.rarity === "rare"
                    ? "text-blue-700"
                    : "text-gray-700"
            }`}
          >
            {badge.rarity}
          </Text>
        </View>
      </View>

      {/* Badge Info */}
      <Text className="text-[14px] font-lexend-semibold text-gray-800 text-center mb-1">
        {badge.badge_name}
      </Text>
      <Text className="text-[11px] font-lexend-light text-gray-600 text-center leading-[15px] mb-2">
        {badge.badge_description}
      </Text>

      {/* Earned Date */}
      <View className="bg-stone-50 rounded-full py-1.5 px-2">
        <Text className="text-[10px] font-lexend-medium text-gray-600 text-center">
          Earned {formatDate(earnedAt)}
        </Text>
      </View>
    </View>
  );
}
