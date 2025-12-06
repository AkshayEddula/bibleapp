import { ArrowDown01Icon, Award01Icon, BookOpen01Icon, BubbleChatIcon, Cancel01Icon, InfinityIcon, LockIcon, Sent02Icon, SparklesFreeIcons, SparklesIcon, Target02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
  { value: "Other", emoji: "💫", colors: ["#94a3b8", "#64748b"] },
];

const reactions = [
  { type: "praise", emoji: "🙌", label: "Praise", color: "#f59e0b" },
  { type: "amen", emoji: "🙏", label: "Amen", color: "#8b5cf6" },
  { type: "blessed", emoji: "✨", label: "Blessed", color: "#ec4899" },
];

const COMMENT_MAX_LENGTH = 250;

const TestimoniesScreen = React.memo(function TestimoniesScreen() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showPrayerDropdown, setShowPrayerDropdown] = useState(false);

  const [selectedTestimony, setSelectedTestimony] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [submittingTestimony, setSubmittingTestimony] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const [userPrayers, setUserPrayers] = useState([]);
  const [loadingPrayers, setLoadingPrayers] = useState(false);

  const [newTestimony, setNewTestimony] = useState({
    title: "",
    content: "",
    category: "Thanksgiving",
    prayer_request_id: null,
  });

  const [selectedPrayerTitle, setSelectedPrayerTitle] = useState("");

  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.warn("User not authenticated");
        setTestimonies([]);
        return;
      }

      const { data, error } = await supabase
        .from("testimonies")
        .select(
          `
          id,
          title,
          content,
          category,
          is_featured,
          created_at,
          prayer_request_id,
          profiles:user_id (
            display_name,
            profile_photo_url
          ),
          prayer_requests:prayer_request_id (
            title,
            description
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setTestimonies([]);
        return;
      }

      const testimoniesWithCounts = await Promise.all(
        data.map(async (testimony) => {
          try {
            // Fetch reactions with error handling
            const { data: reactions, error: reactionsError } = await supabase
              .from("testimony_reactions")
              .select("reaction_type")
              .eq("testimony_id", testimony.id);

            if (reactionsError) {
              console.error(`Error fetching reactions for testimony ${testimony.id}:`, reactionsError);
            }

            const reactionCounts = {
              praise_count:
                reactions?.filter((r) => r.reaction_type === "praise").length ||
                0,
              amen_count:
                reactions?.filter((r) => r.reaction_type === "amen").length || 0,
              blessed_count:
                reactions?.filter((r) => r.reaction_type === "blessed").length ||
                0,
            };

            // Fetch comment count with error handling
            const { count: commentCount, error: commentError } = await supabase
              .from("testimony_comments")
              .select("id", { count: "exact", head: true })
              .eq("testimony_id", testimony.id);

            if (commentError) {
              console.error(`Error fetching comment count for testimony ${testimony.id}:`, commentError);
            }

            // Fetch user reactions with error handling
            const { data: userReactionsData, error: userReactionsError } = await supabase
              .from("testimony_reactions")
              .select("reaction_type")
              .eq("testimony_id", testimony.id)
              .eq("user_id", user.id);

            if (userReactionsError) {
              console.error(`Error fetching user reactions for testimony ${testimony.id}:`, userReactionsError);
            }

            const userReactions = new Set(
              (userReactionsData || []).map((r) => r.reaction_type),
            );

            return {
              ...testimony,
              author: testimony.profiles?.display_name || "Anonymous",
              authorPhoto: testimony.profiles?.profile_photo_url,
              reactionCounts,
              commentCount: commentCount || 0,
              userReactions,
              linkedPrayer: testimony.prayer_requests,
            };
          } catch (testimonyError) {
            console.error(`Error processing testimony ${testimony.id}:`, testimonyError);
            // Return testimony with default values if processing fails
            return {
              ...testimony,
              author: testimony.profiles?.display_name || "Anonymous",
              authorPhoto: testimony.profiles?.profile_photo_url,
              reactionCounts: { praise_count: 0, amen_count: 0, blessed_count: 0 },
              commentCount: 0,
              userReactions: new Set(),
              linkedPrayer: testimony.prayer_requests,
            };
          }
        }),
      );

      setTestimonies(testimoniesWithCounts);
    } catch (error) {
      console.error("Error fetching testimonies:", error);
      // Set empty array on error to show empty state
      setTestimonies([]);
      Alert.alert("Connection Issue", "Could not load testimonies.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPrayers = async () => {
    console.log("Starting to fetch prayers for user:", user?.id);
    if (!user?.id) return;
    setLoadingPrayers(true);
    try {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("id, title, created_at, has_testimony")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prayers:", error);
        throw error;
      }

      console.log("Successfully fetched prayers:", data);
      setUserPrayers(data || []);
    } catch (error) {
      console.error("Error in fetchUserPrayers:", error);
      setUserPrayers([]);
    } finally {
      setLoadingPrayers(false);
    }
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "";
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

  const handleToggleReaction = async (testimonyId, reactionType) => {
    // Validation
    if (!testimonyId || !reactionType) {
      console.error("Invalid testimony ID or reaction type");
      return;
    }

    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    const testimony = testimonies.find((t) => t.id === testimonyId);
    if (!testimony) {
      console.error("Testimony not found");
      return;
    }

    const hasReacted = testimony.userReactions.has(reactionType);
    const previousState = testimonies;

    // Optimistic update
    setTestimonies((prev) =>
      prev.map((t) => {
        if (t.id === testimonyId) {
          const newUserReactions = new Set(t.userReactions);
          const countKey = `${reactionType}_count`;

          if (hasReacted) {
            newUserReactions.delete(reactionType);
          } else {
            newUserReactions.add(reactionType);
          }

          return {
            ...t,
            userReactions: newUserReactions,
            reactionCounts: {
              ...t.reactionCounts,
              [countKey]: hasReacted
                ? Math.max(0, t.reactionCounts[countKey] - 1)
                : t.reactionCounts[countKey] + 1,
            },
          };
        }
        return t;
      }),
    );

    try {
      if (hasReacted) {
        const { error } = await supabase
          .from("testimony_reactions")
          .delete()
          .eq("testimony_id", testimonyId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("testimony_reactions").insert({
          testimony_id: testimonyId,
          user_id: user.id,
          reaction_type: reactionType,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      // Rollback to previous state on error
      setTestimonies(previousState);
      Alert.alert("Error", "Could not update reaction.");
    }
  };

  const handleAddTestimony = async () => {
    // Validation
    const trimmedTitle = newTestimony.title.trim();
    const trimmedContent = newTestimony.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      console.error("Title and content are required");
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

    if (trimmedContent.length > 1000) {
      console.error("Content too long");
      return;
    }

    setSubmittingTestimony(true);
    try {
      const { data, error } = await supabase
        .from("testimonies")
        .insert({
          user_id: user.id,
          title: trimmedTitle,
          content: trimmedContent,
          category: newTestimony.category,
          prayer_request_id: newTestimony.prayer_request_id,
        })
        .select(
          `
          id,
          title,
          content,
          category,
          is_featured,
          created_at,
          prayer_request_id,
          profiles:user_id (
            display_name,
            profile_photo_url
          ),
          prayer_requests:prayer_request_id (
            title,
            description
          )
        `,
        )
        .single();

      if (error) throw error;

      const newTestimonyData = {
        ...data,
        author: data.profiles?.display_name || "You",
        authorPhoto: data.profiles?.profile_photo_url,
        reactionCounts: { praise_count: 0, amen_count: 0, blessed_count: 0 },
        commentCount: 0,
        userReactions: new Set(),
        linkedPrayer: data.prayer_requests,
      };

      setTestimonies((prev) => [newTestimonyData, ...prev]);
      setNewTestimony({
        title: "",
        content: "",
        category: "Thanksgiving",
        prayer_request_id: null,
      });
      setSelectedPrayerTitle("");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding testimony:", error);
      // Don't close modal on error so user can retry
      Alert.alert("Error", "Failed to add testimony.");
    } finally {
      setSubmittingTestimony(false);
    }
  };

  const fetchComments = async (testimonyId) => {
    setLoadingComments(true);
    setFetchError("");

    try {
      if (!testimonyId) {
        throw new Error("Invalid testimony ID");
      }

      const { data, error } = await supabase
        .from("testimony_comments")
        .select(
          `
          id,
          comment_text,
          created_at,
          user_id,
          profiles:user_id (
            display_name
          )
        `,
        )
        .eq("testimony_id", testimonyId)
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

    if (!selectedTestimony?.id) {
      setCommentError("Invalid testimony data");
      return;
    }

    setSendingComment(true);

    try {
      const { data, error } = await supabase
        .from("testimony_comments")
        .insert({
          testimony_id: selectedTestimony.id,
          user_id: user.id,
          comment_text: trimmedComment,
        })
        .select(
          `
          id,
          comment_text,
          created_at,
          user_id,
          profiles:user_id (
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

      setComments((prev) => [newComment, ...prev]);
      setTestimonies((prev) =>
        prev.map((t) =>
          t.id === selectedTestimony.id
            ? { ...t, commentCount: (t.commentCount || 0) + 1 }
            : t,
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

  const openComments = (testimony) => {
    setSelectedTestimony(testimony);
    setShowCommentsModal(true);
    fetchComments(testimony.id);
  };

  const { isPremium } = useSubscription();
  const navigation = useNavigation();

  const openAddModal = async () => {
    console.log("Opening add modal");

    if (!isPremium) {
      // Check existing testimony count
      const { count, error } = await supabase
        .from('testimonies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error("Error checking testimony limit:", error);
      } else if (count >= 1) {
        setShowLimitModal(true);
        return;
      }
    }

    setShowAddModal(true);
    fetchUserPrayers();
  };

  const handleSelectPrayer = (prayer) => {
    console.log("Selected prayer:", prayer);
    if (prayer) {
      setNewTestimony((prev) => ({ ...prev, prayer_request_id: prayer.id }));
      setSelectedPrayerTitle(prayer.title);
    } else {
      setNewTestimony((prev) => ({ ...prev, prayer_request_id: null }));
      setSelectedPrayerTitle("");
    }
    setShowPrayerDropdown(false);
  };

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      <View className="mb-8 mt-4">
        {/* Section Header */}
        <View className="px-4 mb-4 border-b border-stone-200">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xl font-lexend-semibold text-gray-800">
                ✨ Testimonies
              </Text>
              <Text className="text-xs font-lexend-light text-gray-500 mt-0.5">
                Stories of God's faithfulness
              </Text>
            </View>
            <TouchableOpacity onPress={openAddModal} activeOpacity={0.7}>
              <LinearGradient
                colors={["#fbbf24", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 100,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <HugeiconsIcon icon={SparklesIcon} size={22} color="white" strokeWidth={1.5} pointerEvents="none" />
                <Text className="text-white font-lexend-medium text-xs">
                  Share
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-0">

          {/* Testimonies Content */}
          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#F9C846" size="large" />
              <Text className="text-gray-700 mt-3 font-lexend-light text-sm">
                Loading testimonies...
              </Text>
            </View>
          ) : (
            <>
              {/* Add Card */}
              <TouchableOpacity
                onPress={openAddModal}
                activeOpacity={0.7}
                style={{ marginBottom: 16 }}
              >
                <LinearGradient
                  colors={["#fef3c7", "#fde68a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: "#fbbf24",
                    borderStyle: "dashed",
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-lexend-medium text-gray-800 mb-1">
                        Share Your Testimony
                      </Text>
                      <Text className="text-sm font-lexend-light text-gray-600">
                        Encourage others with God's faithfulness
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
              </TouchableOpacity>

              {testimonies.length === 0 ? (
                <View className="items-center justify-center py-12 px-6">
                  <Text className="text-[48px] mb-3">✨</Text>
                  <Text className="text-base font-lexend-semibold text-gray-800 mb-2">
                    No testimonies yet
                  </Text>
                  <Text className="text-sm font-lexend-light text-gray-500 text-center max-w-xs">
                    Be the first to share how God has worked in your life
                  </Text>
                </View>
              ) : (
                testimonies.map((testimony) => {
                  const categoryInfo = getCategoryInfo(testimony.category);
                  const totalReactions =
                    (testimony.reactionCounts?.praise_count || 0) +
                    (testimony.reactionCounts?.amen_count || 0) +
                    (testimony.reactionCounts?.blessed_count || 0);

                  return (
                    <View
                      key={testimony.id}
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

                      {/* Featured Banner */}
                      {testimony.is_featured && (
                        <View className="bg-amber-500/10 border-b border-amber-200 py-2 items-center">
                          <Text className="text-amber-700 text-[11px] font-lexend-semibold tracking-wider">
                            ✨ FEATURED STORY
                          </Text>
                        </View>
                      )}

                      <View className="px-6 pt-5 pb-4">
                        {/* Header: User Info & Category */}
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center gap-2.5">
                            {/* Avatar */}
                            <View className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center border border-stone-100">
                              <Text className="text-[11px] font-lexend-semibold text-stone-500">
                                {testimony.author ? testimony.author[0].toUpperCase() : "A"}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-[13px] font-lexend-medium text-stone-700 leading-4">
                                {testimony.author}
                              </Text>
                              <Text className="text-[11px] font-lexend text-stone-400 leading-3">
                                {timeAgo(testimony.created_at)}
                              </Text>
                            </View>
                          </View>

                          {/* Minimal Category Badge */}
                          <View className="bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                            <Text className="text-[10px]">{categoryInfo.emoji}</Text>
                            <Text className="text-[10px] font-lexend-medium text-stone-500 uppercase tracking-wide">
                              {testimony.category}
                            </Text>
                          </View>
                        </View>

                        {/* Content */}
                        <Text className="text-[17px] font-lexend-semibold text-stone-800 leading-[24px] mb-1.5 tracking-tight">
                          {testimony.title}
                        </Text>
                        <Text className="text-[15px] font-lexend-light text-stone-600 leading-[24px]">
                          {testimony.content}
                        </Text>
                      </View>

                      {/* Linked Prayer Block */}
                      {testimony.prayer_request_id && testimony.linkedPrayer && (
                        <View className="mx-4 mb-4 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                          <View className="px-4 py-3 border-b border-stone-100 bg-white">
                            <Text className="text-[11px] font-lexend-semibold uppercase tracking-wider text-stone-500">
                              Linked to Prayer Request
                            </Text>
                          </View>
                          <View className="p-4">
                            <Text className="text-[14px] font-lexend-medium text-stone-800 mb-1">
                              {testimony.linkedPrayer.title}
                            </Text>
                            <Text className="text-[13px] font-lexend-light text-stone-500 leading-[18px]" numberOfLines={2}>
                              {testimony.linkedPrayer.description}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Action Footer */}
                      <View className="px-4 py-3 border-t border-stone-100 flex-row items-center justify-between bg-stone-50/30">
                        <View className="flex-row items-center gap-2">
                          {/* Reactions */}
                          {reactions.map((reaction) => {
                            const count = testimony.reactionCounts[`${reaction.type}_count`] || 0;
                            const isActive = testimony.userReactions.has(reaction.type);

                            return (
                              <TouchableOpacity
                                key={reaction.type}
                                onPress={() => handleToggleReaction(testimony.id, reaction.type)}
                                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full active:bg-stone-100 ${isActive ? 'border border-current' : ''}`}
                                style={{ borderColor: reaction.color }}
                              >
                                <Text className="text-xl leading-none">{reaction.emoji}</Text>
                                {count > 0 && (
                                  <Text
                                    className={`text-[13px] font-lexend ${isActive ? 'font-medium' : ''}`}
                                    style={{ color: isActive ? reaction.color : '#57534E' }}
                                  >
                                    {count}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Comment Button */}
                        <Pressable
                          onPress={() => openComments(testimony)}
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
                            {testimony.commentCount > 0 ? testimony.commentCount : "Comment"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )
          }

          {/* Limit Upsell Modal */}
          < Modal
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
                <TouchableOpacity
                  onPress={() => setShowLimitModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-stone-100"
                >
                  <HugeiconsIcon icon={Cancel01Icon} pointerEvents="none" size={20} color="#78716c" />
                </TouchableOpacity>

                {/* Header Section */}
                <View className="items-center mb-8">
                  <View className="mb-4 relative items-center gap-y-2">
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
                      <Text className="text-sm font-lexend-semibold text-gray-800">Unlimited Testimonies</Text>
                      <Text className="text-xs text-gray-500 font-lexend-light">Share your story without limits</Text>
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
                <TouchableOpacity
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
                      display: "flex",
                      flexDirection: "row",
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
                    <HugeiconsIcon icon={SparklesFreeIcons} size={26} color="#fafafa" pointerEvents="none" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowLimitModal(false)}
                  className="py-2"
                >
                  <Text className="text-gray-400 font-lexend-medium text-sm">Maybe Later</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Modal >

          {/* ADD TESTIMONY MODAL */}
          < Modal
            visible={showAddModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowAddModal(false)}
          >
            <View className="flex-1 bg-black/60 justify-end">
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setShowAddModal(false)}
              />

              <View
                className="bg-white rounded-t-[28px]"
                style={{
                  height: "85%",
                  maxHeight: "85%",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <View className="px-6 py-4 border-b border-stone-200">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-lexend-semibold text-gray-800">
                      Share Your Testimony
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddModal(false)}
                      activeOpacity={0.6}
                    >
                      <HugeiconsIcon pointerEvents="none" icon={Cancel01Icon} size={24} color="#57534e" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  className="flex-1 px-6 py-5"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  {/* Prayer Link Dropdown */}
                  <View className="mb-4">
                    <Text className="text-sm font-lexend-semibold text-gray-700 mb-2">
                      Link to Prayer Request (Optional)
                    </Text>

                    <View style={{ position: "relative", zIndex: 1000 }}>
                      <TouchableOpacity
                        onPress={() => setShowPrayerDropdown(!showPrayerDropdown)}
                        activeOpacity={0.6}
                        style={{
                          backgroundColor: "#fafaf9",
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: showPrayerDropdown ? "#fbbf24" : "#e7e5e4",
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          minHeight: 56,
                        }}
                      >
                        <Text
                          className={`font-lexend text-sm flex-1 ${selectedPrayerTitle
                            ? "text-gray-800 font-lexend-medium"
                            : "text-gray-400"
                            }`}
                          numberOfLines={1}
                        >
                          {selectedPrayerTitle || "Select a prayer request"}
                        </Text>
                        {/* <ChevronDown
                          size={22}
                          color="#78716c"
                          style={{
                            transform: [
                              { rotate: showPrayerDropdown ? "180deg" : "0deg" },
                            ],
                          }}
                          pointerEvents="none"
                        /> */}
                      </TouchableOpacity>

                      {/* Dropdown Menu */}
                      {showPrayerDropdown && (
                        <View
                          style={{
                            position: "absolute",
                            top: 60,
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: "#e7e5e4",
                            maxHeight: 250,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 8,
                            zIndex: 1001,
                          }}
                        >
                          <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 250 }}
                            nestedScrollEnabled={true}
                          >
                            {loadingPrayers ? (
                              <View
                                style={{
                                  paddingVertical: 40,
                                  alignItems: "center",
                                }}
                              >
                                <ActivityIndicator size="small" color="#F9C846" />
                                <Text
                                  style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: "#78716c",
                                  }}
                                >
                                  Loading prayers...
                                </Text>
                              </View>
                            ) : (
                              <>
                                {/* None option */}
                                <TouchableOpacity
                                  onPress={() => handleSelectPrayer(null)}
                                  activeOpacity={0.7}
                                  style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    borderBottomWidth: 1,
                                    borderBottomColor: "#f5f5f4",
                                    backgroundColor:
                                      newTestimony.prayer_request_id === null
                                        ? "#fef3c7"
                                        : "transparent",
                                  }}
                                >
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 14,
                                        fontWeight: "500",
                                        color:
                                          newTestimony.prayer_request_id === null
                                            ? "#78350f"
                                            : "#1f2937",
                                      }}
                                    >
                                      None (No linked prayer)
                                    </Text>
                                    {newTestimony.prayer_request_id === null && (
                                      <HugeiconsIcon icon={ArrowDown01Icon} pointerEvents="none" size={18} color="#f59e0b" />
                                    )}
                                  </View>
                                </TouchableOpacity>

                                {/* Prayer list */}
                                {userPrayers.length === 0 ? (
                                  <View
                                    style={{
                                      paddingVertical: 24,
                                      paddingHorizontal: 16,
                                      alignItems: "center",
                                    }}
                                  >
                                    <Text style={{ fontSize: 32 }}>🙏</Text>
                                    <Text
                                      style={{
                                        fontSize: 13,
                                        color: "#78716c",
                                        marginTop: 8,
                                        textAlign: "center",
                                      }}
                                    >
                                      No prayer requests found
                                    </Text>
                                  </View>
                                ) : (
                                  userPrayers.map((prayer, index) => {
                                    const selected =
                                      newTestimony.prayer_request_id === prayer.id;

                                    return (
                                      <TouchableOpacity
                                        key={prayer.id}
                                        onPress={() => handleSelectPrayer(prayer)}
                                        activeOpacity={0.7}
                                        style={{
                                          paddingHorizontal: 16,
                                          paddingVertical: 14,
                                          borderBottomWidth:
                                            index < userPrayers.length - 1 ? 1 : 0,
                                          borderBottomColor: "#f5f5f4",
                                          backgroundColor: selected
                                            ? "#fef3c7"
                                            : "transparent",
                                        }}
                                      >
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <View
                                            style={{ flex: 1, marginRight: 12 }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 14,
                                                fontWeight: "500",
                                                color: selected
                                                  ? "#78350f"
                                                  : "#1f2937",
                                              }}
                                              numberOfLines={2}
                                            >
                                              {prayer.title}
                                            </Text>
                                            <Text
                                              style={{
                                                fontSize: 11,
                                                color: selected
                                                  ? "#92400e"
                                                  : "#78716c",
                                                marginTop: 2,
                                              }}
                                            >
                                              {timeAgo(prayer.created_at)}
                                            </Text>
                                          </View>
                                          {selected && (

                                            <HugeiconsIcon icon={ArrowDown01Icon} pointerEvents="none" size={18} color="#f59e0b" />
                                          )}
                                        </View>
                                      </TouchableOpacity>
                                    );
                                  })
                                )}
                              </>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Title */}
                  <View className="mb-4" style={{ zIndex: 1 }}>
                    <Text className="text-sm font-lexend-semibold text-gray-700 mb-2">
                      Title *
                    </Text>
                    <TextInput
                      value={newTestimony.title}
                      onChangeText={(text) =>
                        setNewTestimony((prev) => ({
                          ...prev,
                          title: text,
                        }))
                      }
                      placeholder="e.g., God Healed My Father!"
                      placeholderTextColor="#9ca3af"
                      className="bg-stone-50 rounded-2xl border-2 border-stone-200 px-4 py-3 font-lexend text-sm text-gray-800"
                      maxLength={100}
                    />
                    <Text className="text-xs text-gray-500 mt-1 text-right">
                      {newTestimony.title.length}/100
                    </Text>
                  </View>

                  {/* Content */}
                  <View className="mb-4" style={{ zIndex: 1 }}>
                    <Text className="text-sm font-lexend-semibold text-gray-700 mb-2">
                      Your Testimony *
                    </Text>
                    <TextInput
                      value={newTestimony.content}
                      onChangeText={(text) =>
                        setNewTestimony((prev) => ({
                          ...prev,
                          content: text,
                        }))
                      }
                      placeholder="Share how God answered your prayer..."
                      placeholderTextColor="#9ca3af"
                      className="bg-stone-50 rounded-2xl border-2 border-stone-200 px-4 py-3 font-lexend text-sm text-gray-800"
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                      maxLength={1000}
                      style={{ minHeight: 120 }}
                    />
                    <Text className="text-xs text-gray-500 mt-1 text-right">
                      {newTestimony.content.length}/1000
                    </Text>
                  </View>

                  {/* Category */}
                  <View className="mb-4" style={{ zIndex: 1 }}>
                    <Text className="text-sm font-lexend-semibold text-gray-700 mb-2">
                      Category
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                      {categories.map((cat) => {
                        const selected = newTestimony.category === cat.value;

                        return (
                          <TouchableOpacity
                            key={cat.value}
                            onPress={() =>
                              setNewTestimony((prev) => ({
                                ...prev,
                                category: cat.value,
                              }))
                            }
                            activeOpacity={0.7}
                          >
                            {selected ? (
                              <LinearGradient
                                colors={cat.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 6,
                                  paddingHorizontal: 14,
                                  paddingVertical: 9,
                                  borderRadius: 14,
                                }}
                              >
                                <Text className="text-sm">{cat.emoji}</Text>
                                <Text className="text-white text-xs font-lexend-semibold">
                                  {cat.value}
                                </Text>
                              </LinearGradient>
                            ) : (
                              <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-stone-200 bg-white">
                                <Text className="text-sm">{cat.emoji}</Text>
                                <Text className="text-gray-700 text-xs font-lexend-medium">
                                  {cat.value}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {/* Footer */}
                <View className="px-6 py-4 border-t border-stone-200 flex-row gap-3 bg-white">
                  <TouchableOpacity
                    onPress={() => setShowAddModal(false)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 100,
                      borderWidth: 2,
                      borderColor: "#e7e5e4",
                      alignItems: "center",
                    }}
                  >
                    <Text className="text-gray-700 font-lexend-semibold text-sm">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddTestimony}
                    disabled={
                      !newTestimony.title.trim() ||
                      !newTestimony.content.trim() ||
                      submittingTestimony
                    }
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      opacity:
                        !newTestimony.title.trim() ||
                          !newTestimony.content.trim() ||
                          submittingTestimony
                          ? 0.5
                          : 1,
                    }}
                  >
                    <LinearGradient
                      colors={["#fbbf24", "#f59e0b"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 14,
                        borderRadius: 100,
                        alignItems: "center",
                      }}
                    >
                      {submittingTestimony ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-lexend-semibold text-sm">
                          Share Testimony
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal >

          {/* COMMENTS MODAL */}
          < Modal
            visible={showCommentsModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowCommentsModal(false)}
          >
            <View className="flex-1 bg-black/60 justify-end">
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setShowCommentsModal(false)}
              />

              <View
                className="bg-white rounded-t-[28px]"
                style={{
                  height: "80%",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <View className="px-6 py-4 border-b border-stone-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-lg font-lexend-semibold text-gray-800">
                      Comments
                    </Text>
                    <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                      <HugeiconsIcon icon={Cancel01Icon} size={24} color="#57534e" strokeWidth={2.5} pointerEvents="none" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-sm font-lexend-light text-gray-600">
                    {selectedTestimony?.title}
                  </Text>
                </View>

                <ScrollView
                  className="flex-1 px-6 py-4"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  {loadingComments ? (
                    <View className="items-center justify-center py-12">
                      <ActivityIndicator color="#F9C846" size="large" />
                      <Text className="text-sm text-gray-500 mt-3">
                        Loading comments...
                      </Text>
                    </View>
                  ) : comments.length === 0 ? (
                    <View className="items-center justify-center py-12">
                      <Text className="text-[48px] mb-3">💬</Text>
                      <Text className="text-base font-lexend-semibold text-gray-800">
                        No comments yet
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        Be the first to share encouragement!
                      </Text>
                    </View>
                  ) : (
                    comments.map((comment) => (
                      <View key={comment.id} className="mb-5">
                        <View className="flex-row items-start gap-3">
                          <LinearGradient
                            colors={["#fbbf24", "#f59e0b"]}
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
                              <Text className="text-gray-400 text-xs">
                                {comment.time}
                              </Text>
                            </View>

                            <Text className="text-gray-700 text-sm leading-5">
                              {comment.text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

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
                      Share encouragement
                    </Text>
                    <Text className={`text-xs font-lexend-medium ${commentText.length > COMMENT_MAX_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {commentText.length}/{COMMENT_MAX_LENGTH}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <TextInput
                      value={commentText}
                      onChangeText={handleCommentTextChange}
                      placeholder="Add encouragement..."
                      placeholderTextColor="#9ca3af"
                      className="flex-1 bg-stone-50 rounded-full border border-stone-200 px-5 py-3 text-sm"
                      maxLength={COMMENT_MAX_LENGTH}
                      editable={!sendingComment}
                      returnKeyType="send"
                      onSubmitEditing={handleAddComment}
                      blurOnSubmit={false}
                    />

                    <TouchableOpacity
                      onPress={handleAddComment}
                      disabled={!commentText.trim() || sendingComment}
                      activeOpacity={0.7}
                      style={{
                        opacity: !commentText.trim() || sendingComment ? 0.5 : 1,
                      }}
                    >
                      <LinearGradient
                        colors={["#fbbf24", "#f59e0b"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sendingComment ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <HugeiconsIcon pointerEvents="none" icon={Sent02Icon} size={20} color="white" strokeWidth={2} />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal >
        </View >
      </View >

    </ScrollView >
  );
});

export default TestimoniesScreen;
