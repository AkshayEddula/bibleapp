
// PrayerWallScreen.js
import { Award01Icon, BookOpen01Icon, BubbleChatIcon, Cancel01Icon, FavouriteIcon, InfinityIcon, LockIcon, Sent02Icon, SparklesIcon, Target02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { supabase } from "../lib/supabase";

const categories = [
  { value: "Health", emoji: "❤️", colors: ["#f87171", "#fb923c"] },
  { value: "Family", emoji: "👨‍👩‍👧‍👦", colors: ["#34d399", "#10b981"] },
  { value: "Work", emoji: "💼", colors: ["#fbbf24", "#f59e0b"] },
  { value: "Spiritual Growth", emoji: "✨", colors: ["#a78bfa", "#8b5cf6"] },
  { value: "Financial", emoji: "💰", colors: ["#22d3ee", "#06b6d4"] },
  { value: "Relationships", emoji: "💕", colors: ["#f472b6", "#ec4899"] },
  { value: "Guidance", emoji: "🧭", colors: ["#818cf8", "#6366f1"] },
  { value: "Thanksgiving", emoji: "🙏", colors: ["#fbbf24", "#f59e0b"] },
];

const COMMENT_MAX_LENGTH = 250;

const PrayerWallScreen = React.memo(function PrayerWallScreen() {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [submittingPrayer, setSubmittingPrayer] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const [newPrayer, setNewPrayer] = useState({
    title: "",
    description: "",
    category: "Health",
  });

  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.warn("User not authenticated");
        setPrayers([]);
        return;
      }

      const { data, error } = await supabase
        .from("prayer_requests")
        .select(
          `
id,
  title,
  description,
  category,
  created_at,
  profiles: user_id(
    display_name,
    profile_photo_url
  )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setPrayers([]);
        return;
      }

      const prayersWithCounts = await Promise.all(
        data.map(async (prayer) => {
          try {
            const [reactionsResult, commentsResult, userReactionResult] =
              await Promise.all([
                supabase
                  .from("prayer_reactions")
                  .select("id", { count: "exact" })
                  .eq("prayer_request_id", prayer.id),
                supabase
                  .from("prayer_comments")
                  .select("id", { count: "exact" })
                  .eq("prayer_request_id", prayer.id),
                supabase
                  .from("prayer_reactions")
                  .select("id")
                  .eq("prayer_request_id", prayer.id)
                  .eq("user_id", user.id)
                  .single(),
              ]);

            return {
              ...prayer,
              author: prayer.profiles?.display_name || "Anonymous",
              authorPhoto: prayer.profiles?.profile_photo_url,
              prayingCount: reactionsResult.count || 0,
              commentCount: commentsResult.count || 0,
              isPraying: !!userReactionResult.data,
            };
          } catch (prayerError) {
            console.error(`Error processing prayer ${prayer.id}: `, prayerError);
            // Return prayer with default values if processing fails
            return {
              ...prayer,
              author: prayer.profiles?.display_name || "Anonymous",
              authorPhoto: prayer.profiles?.profile_photo_url,
              prayingCount: 0,
              commentCount: 0,
              isPraying: false,
            };
          }
        }),
      );

      setPrayers(prayersWithCounts);
    } catch (error) {
      console.error("Error fetching prayers:", error);
      setPrayers([]);
      Alert.alert("Connection Issue", "Could not load prayers.");
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getCategoryInfo = (category) => {
    return categories.find((c) => c.value === category) || categories[0];
  };

  const handleTogglePraying = async (prayerId) => {
    // Validation
    if (!prayerId) {
      console.error("Invalid prayer ID");
      return;
    }

    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    const prayer = prayers.find((p) => p.id === prayerId);
    if (!prayer) {
      console.error("Prayer not found");
      return;
    }

    const isCurrentlyPraying = prayer.isPraying;
    const previousState = prayers;

    // Optimistic update
    setPrayers(
      prayers.map((p) =>
        p.id === prayerId
          ? {
            ...p,
            isPraying: !isCurrentlyPraying,
            prayingCount: isCurrentlyPraying
              ? p.prayingCount - 1
              : p.prayingCount + 1,
          }
          : p,
      ),
    );

    try {
      if (isCurrentlyPraying) {
        const { error } = await supabase
          .from("prayer_reactions")
          .delete()
          .eq("prayer_request_id", prayerId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prayer_reactions").insert({
          prayer_request_id: prayerId,
          user_id: user.id,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling prayer:", error);
      // Rollback to previous state on error
      setPrayers(previousState);
      Alert.alert("Error", "Could not update prayer status.");
    }
  };

  const { isPremium } = useSubscription();
  const navigation = useNavigation();

  const handleOpenAddModal = async () => {
    if (!isPremium) {
      // Check existing prayer count
      const { count, error } = await supabase
        .from('prayer_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error("Error checking prayer limit:", error);
        // Fallback: allow add if check fails, or show error? Let's be generous on error.
      } else if (count >= 1) {
        setShowLimitModal(true);
        return;
      }
    }
    setShowAddModal(true);
  };

  const handleAddPrayer = async () => {
    // Validation
    const trimmedTitle = newPrayer.title.trim();
    const trimmedDescription = newPrayer.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      console.error("Title and description are required");
      return;
    }

    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    if (trimmedTitle.length > 100) {
      console.error("Title too long");
      return;
    }

    if (trimmedDescription.length > 1000) {
      console.error("Description too long");
      return;
    }

    setSubmittingPrayer(true);
    try {
      const { data, error } = await supabase
        .from("prayer_requests")
        .insert({
          user_id: user.id,
          title: trimmedTitle,
          description: trimmedDescription,
          category: newPrayer.category,
        })
        .select(
          `
id,
  title,
  description,
  category,
  created_at,
  profiles: user_id(
    display_name,
    profile_photo_url
  )
    `,
        )
        .single();

      if (error) throw error;

      const newPrayerData = {
        ...data,
        author: data.profiles?.display_name || "You",
        authorPhoto: data.profiles?.profile_photo_url,
        prayingCount: 0,
        commentCount: 0,
        isPraying: false,
      };

      setPrayers([newPrayerData, ...prayers]);
      setNewPrayer({ title: "", description: "", category: "Health" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding prayer:", error);
      // Don't close modal on error so user can retry
      Alert.alert("Error", "Failed to add prayer request.");
    } finally {
      setSubmittingPrayer(false);
    }
  };

  const fetchComments = async (prayerId) => {
    setLoadingComments(true);
    setFetchError("");

    try {
      if (!prayerId) {
        throw new Error("Invalid prayer ID");
      }

      const { data, error } = await supabase
        .from("prayer_comments")
        .select(
          `
id,
  comment_text,
  created_at,
  user_id,
  profiles: user_id(
    display_name
  )
        `,
        )
        .eq("prayer_request_id", prayerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedComments = (data || []).map((comment) => ({
        id: comment.id,
        user: comment.profiles?.display_name || "Anonymous",
        text: comment.comment_text || "",
        time: timeAgo(comment.created_at),
        isCurrentUser: comment.user_id === user?.id,
      }));

      setComments(formattedComments);
      setFetchError("");
    } catch (error) {
      console.error("Error fetching comments:", error);
      setFetchError("Failed to load comments. Please try again.");
      setComments([]);
      Alert.alert("Error", "Could not load comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    // Clear previous errors
    setCommentError("");

    // Validation
    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      setCommentError("Comment cannot be empty");
      return;
    }

    if (trimmedComment.length > COMMENT_MAX_LENGTH) {
      setCommentError(`Comment must be ${COMMENT_MAX_LENGTH} characters or less`);
      return;
    }

    if (!user?.id) {
      setCommentError("You must be logged in to comment");
      return;
    }

    if (!selectedPrayer?.id) {
      setCommentError("Invalid prayer data");
      return;
    }

    setSendingComment(true);

    try {
      const { data, error } = await supabase
        .from("prayer_comments")
        .insert({
          prayer_request_id: selectedPrayer.id,
          user_id: user.id,
          comment_text: trimmedComment,
        })
        .select(
          `
id,
  comment_text,
  created_at,
  user_id,
  profiles: user_id(
    display_name
  )
        `,
        )
        .single();

      if (error) throw error;

      const newComment = {
        id: data.id,
        user: data.profiles?.display_name || "You",
        text: data.comment_text,
        time: "Just now",
        isCurrentUser: true,
      };

      setComments([newComment, ...comments]);
      setPrayers(
        prayers.map((p) =>
          p.id === selectedPrayer.id
            ? { ...p, commentCount: p.commentCount + 1 }
            : p,
        ),
      );
      setCommentText("");
      setCommentError("");
    } catch (error) {
      console.error("Error adding comment:", error);

      // Provide user-friendly error messages
      if (error.message?.includes("network")) {
        setCommentError("Network error. Please check your connection.");
      } else if (error.message?.includes("duplicate")) {
        setCommentError("This comment was already posted.");
      } else {
        setCommentError("Failed to post comment. Please try again.");
        Alert.alert("Error", "Failed to post comment.");
      }
    } finally {
      setSendingComment(false);
    }
  };

  // Handle comment text change with validation
  const handleCommentTextChange = (text) => {
    // Remove newlines to prevent multiline input
    const singleLineText = text.replace(/[\r\n]+/g, ' ');

    // Enforce character limit
    if (singleLineText.length <= COMMENT_MAX_LENGTH) {
      setCommentText(singleLineText);
      setCommentError("");
    } else {
      setCommentError(`Maximum ${COMMENT_MAX_LENGTH} characters allowed`);
    }
  };

  const openComments = (prayer) => {
    setSelectedPrayer(prayer);
    setShowCommentsModal(true);
    fetchComments(prayer.id);
  };

  // Add Prayer Card Component
  const AddPrayerCard = () => (
    <Pressable
      onPress={handleOpenAddModal}
      className="active:scale-[0.98]"
    >
      <LinearGradient
        colors={["#fffbeb", "#fef3c7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,

          marginBottom: 16,
          borderWidth: 2,
          borderColor: "#fde68a",
          borderStyle: "dashed",
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-lexend-medium text-gray-800 mb-1">
              Share a Prayer Request
            </Text>
            <Text className="text-sm font-lexend-light text-gray-600">
              Let the community pray with you
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full items-center justify-center ml-3">
            <LinearGradient
              colors={["#fbbf24", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HugeiconsIcon icon={SparklesIcon} size={26} color="white" strokeWidth={1.5} pointerEvents="none" />
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  // Empty State Component
  const EmptyState = () => (
    <View className="items-center justify-center py-16 px-6">
      <Text className="text-[56px] mb-4">🙏</Text>
      <Text className="text-lg font-lexend-semibold text-gray-800 mb-2">
        No prayers yet
      </Text>
      <Text className="text-sm font-lexend-light text-gray-500 text-center max-w-xs">
        Be the first to share a prayer request and start building a community of
        faith
      </Text>
    </View>
  );

  return (
    <View className="flex-1 mb-8 mt-4 ">
      {/* Header */}
      <View className=" px-4 pt-0 pb-4 border-b border-stone-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-lexend-semibold text-gray-800">
              Prayer Wall
            </Text>
            <Text className="text-sm font-lexend-light text-gray-500 mt-0.5">
              Share and support in prayer
            </Text>
          </View>
          <Pressable
            onPress={handleOpenAddModal}
            className="active:scale-95"
          >
            <LinearGradient
              colors={["#fbbf24", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 100,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text className="text-white font-lexend-medium text-sm tracking-tight">
                Add Prayer
              </Text>
              <HugeiconsIcon icon={SparklesIcon} size={22} color="white" strokeWidth={1.5} pointerEvents="none" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Prayer Feed */}
      <ScrollView
        className="flex-1 px-0 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#F9C846" size="large" />
            <Text className="text-gray-700 mt-3 font-lexend-light text-sm">
              Loading prayers...
            </Text>
          </View>
        ) : (
          <>
            <AddPrayerCard />

            {prayers.length === 0 ? (
              <EmptyState />
            ) : (
              prayers.map((prayer) => {
                const categoryInfo = getCategoryInfo(prayer.category);
                return (

                  <View
                    key={prayer.id}
                    className="bg-white rounded-[24px] mb-4 overflow-hidden border border-stone-200"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    {/* Thin Gradient Top Bar */}
                    <LinearGradient
                      colors={[...categoryInfo.colors, "#FFFFFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 4, width: "100%" }}
                    />

                    <View className="px-6 pt-5 pb-4">
                      {/* Header: User Info & Category */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-2.5">
                          <View className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center border border-stone-100">
                            <Text className="text-[11px] font-lexend-semibold text-stone-500">
                              {prayer.author ? prayer.author[0].toUpperCase() : "A"}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-[13px] mb-1 font-lexend-medium text-stone-700 leading-4">
                              {prayer.author}
                            </Text>
                            <Text className="text-[11px] font-lexend text-stone-400 leading-3">
                              {timeAgo(prayer.created_at)}
                            </Text>
                          </View>
                        </View>

                        {/* Minimal Category Badge */}
                        <View className="bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                          <Text className="text-[10px]">{categoryInfo.emoji}</Text>
                          <Text className="text-[10px] font-lexend-medium text-stone-500 uppercase tracking-wide">
                            {prayer.category}
                          </Text>
                        </View>
                      </View>

                      {/* Content */}
                      <Text className="text-[17px] font-lexend-semibold text-stone-800 leading-[24px] mb-1.5 tracking-tight">
                        {prayer.title}
                      </Text>
                      <Text className="text-[15px] font-lexend-light text-stone-600 leading-[24px]">
                        {prayer.description}
                      </Text>
                    </View>

                    {/* Action Footer */}
                    <View className="px-4 py-3 border-t border-stone-100 flex-row items-center gap-2 bg-stone-50/30">
                      {/* Praying Button */}
                      <Pressable
                        onPress={() => handleTogglePraying(prayer.id)}
                        className="flex-row items-center gap-1.5 px-3 py-2 rounded-full active:bg-stone-100"
                      >
                        <HugeiconsIcon
                          icon={FavouriteIcon}
                          size={22}
                          color={prayer.isPraying ? "#EF4444" : "#57534E"}
                          fill={prayer.isPraying ? "#EF4444" : "transparent"}
                          strokeWidth={1.5}
                          pointerEvents="none"
                        />
                        <Text
                          className={`text-[13px] font-lexend ${prayer.isPraying
                            ? "text-red-500 font-medium"
                            : "text-stone-500"
                            }`}
                        >
                          {prayer.prayingCount > 0 ? prayer.prayingCount : "Pray"}
                        </Text>
                      </Pressable>

                      {/* Comments Button */}
                      <Pressable
                        onPress={() => openComments(prayer)}
                        className="flex-row items-center gap-1.5 px-3 py-2 rounded-full active:bg-stone-100"
                      >
                        <HugeiconsIcon
                          icon={BubbleChatIcon}
                          size={22}
                          color="#57534E"
                          strokeWidth={1.5}
                          pointerEvents="none"
                        />
                        <Text className="text-[13px] font-lexend text-stone-500">
                          {prayer.commentCount > 0 ? prayer.commentCount : "Comment"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })

            )}
          </>
        )}
      </ScrollView>

      {/* Limit Upsell Modal */}
      <Modal
        visible={showLimitModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <LinearGradient
            colors={["#ffffff", "#fefce8"]}
            style={{
              width: "100%",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 40,
              alignItems: "center",
              shadowColor: "#fbbf24",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 10,
              borderTopWidth: 1,
              borderColor: "#fde68a",
            }}
          >
            {/* Handle Bar */}
            <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-8" />

            {/* Close Button */}
            <Pressable
              onPress={() => setShowLimitModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-stone-100"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#78716c" pointerEvents="none" />
            </Pressable>

            {/* Header Section */}
            <View className="items-center mb-8">
              <View className="mb-4 items-center gap-2">
                <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center">
                  <HugeiconsIcon icon={LockIcon} size={40} color="#f59e0b" variant="solid" />
                </View>
                <View className=" bg-gradient-to-r from-amber-500 to-orange-500 rounded-full px-3 py-1 shadow-sm border border-white">
                  <Text className="text-[10px] font-lexend-bold text-amber-600 uppercase tracking-wider bg-white px-2 py-0.5 rounded-full">
                    PREMIUM
                  </Text>
                </View>
              </View>

              <Text className="text-2xl font-lexend-bold text-gray-900 text-center mb-2">
                Unlock Everything
              </Text>
              <Text className="text-sm font-lexend-light text-gray-500 text-center max-w-[260px]">
                Remove all limits and accelerate your spiritual journey.
              </Text>
            </View>

            {/* Features List */}
            <View className="w-full mb-8 gap-y-4">
              {/* Feature 1 */}
              <View className="flex-row items-center gap-4 bg-white/60 p-3 rounded-2xl border border-stone-100">
                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                  <HugeiconsIcon icon={InfinityIcon} size={22} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-lexend-semibold text-gray-800">Unlimited Prayers</Text>
                  <Text className="text-xs text-gray-500 font-lexend-light">Share your heart without limits</Text>
                </View>
              </View>

              {/* Feature 2 */}
              <View className="flex-row items-center gap-4 bg-white/60 p-3 rounded-2xl border border-stone-100">
                <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                  <HugeiconsIcon icon={Target02Icon} size={22} color="#9333ea" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-lexend-semibold text-gray-800">Weekly Quests</Text>
                  <Text className="text-xs text-gray-500 font-lexend-light">Unlock exclusive spiritual challenges</Text>
                </View>
              </View>

              {/* Feature 3 */}
              <View className="flex-row items-center gap-4 bg-white/60 p-3 rounded-2xl border border-stone-100">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <HugeiconsIcon icon={Award01Icon} size={22} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-lexend-semibold text-gray-800">Exclusive Badges</Text>
                  <Text className="text-xs text-gray-500 font-lexend-light">Earn rare achievements</Text>
                </View>
              </View>

              {/* Feature 4 */}
              <View className="flex-row items-center gap-4 bg-white/60 p-3 rounded-2xl border border-stone-100">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <HugeiconsIcon icon={BookOpen01Icon} size={22} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-lexend-semibold text-gray-800">Unlimited Verses</Text>
                  <Text className="text-xs text-gray-500 font-lexend-light">Access the full depth of scripture</Text>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <Pressable
              onPress={() => {
                setShowLimitModal(false);
                navigation.navigate("Paywall");
              }}
              className="w-full active:scale-[0.98] transition-all mb-4"
            >
              <LinearGradient
                colors={["#fbbf24", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 18,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#f59e0b",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text className="text-white font-lexend-bold text-lg tracking-wide">
                  Upgrade to Premium
                </Text>
                <HugeiconsIcon icon={SparklesIcon} size={26} pointerEvents="none" color="#fff" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setShowLimitModal(false)}
              className="py-2"
            >
              <Text className="text-gray-400 font-lexend-medium text-sm">Maybe Later</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </Modal>

      {/* Add Prayer Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-[28px] h-[85%]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-stone-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-lexend-semibold text-gray-800">
                  Share Prayer Request
                </Text>
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-60"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={20} color="#57534e" pointerEvents="none" />
                </Pressable>
              </View>
            </View>

            <ScrollView
              className="flex-1 px-6 py-5"
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <View className="mb-4">
                <Text className="text-sm font-lexend-medium text-gray-700 mb-2">
                  Prayer Title
                </Text>
                <TextInput
                  value={newPrayer.title}
                  onChangeText={(text) =>
                    setNewPrayer({ ...newPrayer, title: text })
                  }
                  placeholder="e.g., Pray for my father's surgery"
                  placeholderTextColor="#9ca3af"
                  className="bg-stone-50 rounded-2xl border border-stone-200 px-4 py-3 font-lexend text-sm text-gray-800"
                  maxLength={100}
                />
                <Text className="text-xs text-gray-500 mt-1 text-right font-lexend-light">
                  {newPrayer.title.length}/100
                </Text>
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-sm font-lexend-medium text-gray-700 mb-2">
                  Description
                </Text>
                <TextInput
                  value={newPrayer.description}
                  onChangeText={(text) =>
                    setNewPrayer({ ...newPrayer, description: text })
                  }
                  placeholder="Share more details about your prayer request..."
                  placeholderTextColor="#9ca3af"
                  className="bg-stone-50 rounded-2xl border border-stone-200 px-4 py-3 font-lexend text-sm text-gray-800"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text className="text-xs text-gray-500 mt-1 text-right font-lexend-light">
                  {newPrayer.description.length}/1000
                </Text>
              </View>

              {/* Category Selection */}
              <View className="mb-4">
                <Text className="text-sm font-lexend-medium text-gray-700 mb-2">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.value}
                      onPress={() =>
                        setNewPrayer({ ...newPrayer, category: cat.value })
                      }
                      className="active:scale-95"
                    >
                      {newPrayer.category === cat.value ? (
                        <LinearGradient
                          colors={cat.colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 12,
                          }}
                        >
                          <Text className="text-sm">{cat.emoji}</Text>
                          <Text className="text-white text-xs font-lexend-medium">
                            {cat.value}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-stone-200">
                          <Text className="text-sm">{cat.emoji}</Text>
                          <Text className="text-gray-700 text-xs font-lexend-medium">
                            {cat.value}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View className="px-6 py-4 border-t border-stone-200 flex-row gap-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 rounded-full border border-stone-200 items-center active:opacity-60"
              >
                <Text className="text-gray-700 font-lexend-medium text-sm">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddPrayer}
                disabled={
                  !newPrayer.title.trim() ||
                  !newPrayer.description.trim() ||
                  submittingPrayer
                }
                className="flex-1 active:scale-95"
                style={{
                  opacity:
                    !newPrayer.title.trim() ||
                      !newPrayer.description.trim() ||
                      submittingPrayer
                      ? 0.5
                      : 1,
                }}
              >
                <LinearGradient
                  colors={["#fbbf24", "#f59e0b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 100,
                    alignItems: "center",
                  }}
                >
                  {submittingPrayer ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-lexend-medium text-sm">
                      Share Prayer
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-[28px] h-[80%]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-stone-200">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-lexend-semibold text-gray-800">
                  Comments
                </Text>
                <Pressable
                  onPress={() => setShowCommentsModal(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-60"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={20} color="#57534e" pointerEvents="none" />
                </Pressable>
              </View>
              <Text className="text-sm font-lexend-light text-gray-600">
                {selectedPrayer?.title}
              </Text>
            </View>

            {/* Comments List */}
            <ScrollView
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {loadingComments ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator color="#F9C846" size="large" />
                  <Text className="text-sm font-lexend-light text-gray-500 mt-3">
                    Loading comments...
                  </Text>
                </View>
              ) : comments.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-[48px] mb-3">💬</Text>
                  <Text className="text-base font-lexend-semibold text-gray-800">
                    No comments yet
                  </Text>
                  <Text className="text-sm font-lexend-light text-gray-500 mt-1">
                    Be the first to share encouragement!
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} className="mb-5">
                    <View className="flex-row items-start gap-3">
                      <LinearGradient
                        colors={["#8B5CF6", "#6366F1"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 100,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text className="text-white font-lexend-semibold text-sm">
                          {comment.user[0].toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="font-lexend-medium text-gray-800 text-sm">
                            {comment.user}
                          </Text>
                          <Text className="font-lexend-light text-gray-400 text-xs">
                            {comment.time}
                          </Text>
                        </View>
                        <Text className="font-lexend-light text-gray-700 text-sm leading-5">
                          {comment.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View className="px-6 py-4 border-t border-stone-200 bg-white">
              {/* Error Message */}
              {commentError ? (
                <View className="mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
                  <Text className="text-red-600 font-lexend-medium text-xs">
                    {commentError}
                  </Text>
                </View>
              ) : null}

              {/* Character Counter */}
              <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-xs font-lexend-light text-gray-400">
                  Share your prayers
                </Text>
                <Text className={`text - xs font - lexend - medium ${commentText.length > COMMENT_MAX_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'} `}>
                  {commentText.length}/{COMMENT_MAX_LENGTH}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <TextInput
                  value={commentText}
                  onChangeText={handleCommentTextChange}
                  placeholder="Add a comment..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1 bg-stone-50 rounded-full border border-stone-200 px-5 py-3 font-lexend-light text-sm text-gray-800"
                  maxLength={COMMENT_MAX_LENGTH}
                  editable={!sendingComment}
                  returnKeyType="send"
                  onSubmitEditing={handleAddComment}
                  blurOnSubmit={false}
                />
                <Pressable
                  onPress={handleAddComment}
                  disabled={!commentText.trim() || sendingComment}
                  className="active:scale-95"
                  style={{
                    opacity: !commentText.trim() || sendingComment ? 0.5 : 1,
                  }}
                >
                  <LinearGradient
                    colors={["#f2f2f2", "#f1f1f1", "#fafafa"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#e1e1e1",
                    }}
                  >
                    {sendingComment ? (
                      <ActivityIndicator size="small" color="#212121" />
                    ) : (
                      <HugeiconsIcon icon={Sent02Icon} size={18} strokeWidth={2} color="#212121" pointerEvents="none" />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default PrayerWallScreen;