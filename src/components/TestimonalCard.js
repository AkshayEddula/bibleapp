import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  Sparkles,
  MessageCircle,
  Share2,
  X,
  Check,
  ChevronDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

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

export default function TestimoniesScreen() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showPrayerSelect, setShowPrayerSelect] = useState(false);

  const [selectedTestimony, setSelectedTestimony] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [submittingTestimony, setSubmittingTestimony] = useState(false);

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
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const testimoniesWithCounts = await Promise.all(
        data.map(async (testimony) => {
          const { data: reactions } = await supabase
            .from("testimony_reactions")
            .select("reaction_type")
            .eq("testimony_id", testimony.id);

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

          const { count: commentCount } = await supabase
            .from("testimony_comments")
            .select("id", { count: "exact", head: true })
            .eq("testimony_id", testimony.id);

          const { data: userReactionsData } = await supabase
            .from("testimony_reactions")
            .select("reaction_type")
            .eq("testimony_id", testimony.id)
            .eq("user_id", user.id);

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
          };
        }),
      );

      setTestimonies(testimoniesWithCounts);
    } catch (error) {
      console.error("Error fetching testimonies:", error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch user's own prayer requests (for linking when creating a testimony)
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
    const testimony = testimonies.find((t) => t.id === testimonyId);
    if (!testimony) return;

    const hasReacted = testimony.userReactions.has(reactionType);

    // Optimistic UI update
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
      // rollback - refetch to ensure consistent state
      fetchTestimonies();
    }
  };

  const handleAddTestimony = async () => {
    if (!newTestimony.title.trim() || !newTestimony.content.trim()) return;

    setSubmittingTestimony(true);
    try {
      const { data, error } = await supabase
        .from("testimonies")
        .insert({
          user_id: user.id,
          title: newTestimony.title,
          content: newTestimony.content,
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
      alert("Failed to add testimony. Please try again.");
    } finally {
      setSubmittingTestimony(false);
    }
  };

  const fetchComments = async (testimonyId) => {
    setLoadingComments(true);
    try {
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
        text: comment.comment_text,
        time: timeAgo(comment.created_at),
        isCurrentUser: comment.user_id === user.id,
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTestimony) return;

    setSendingComment(true);
    try {
      const { data, error } = await supabase
        .from("testimony_comments")
        .insert({
          testimony_id: selectedTestimony.id,
          user_id: user.id,
          comment_text: commentText.trim(),
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
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setSendingComment(false);
    }
  };

  const openComments = (testimony) => {
    setSelectedTestimony(testimony);
    setShowCommentsModal(true);
    fetchComments(testimony.id);
  };

  const openAddModal = () => {
    console.log("Opening add modal");
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
    setShowPrayerSelect(false);
  };

  const openPrayerSelect = () => {
    console.log("Opening prayer select, current prayers:", userPrayers);
    setShowPrayerSelect(true);
  };

  // --- JSX Render Start ---
  return (
    <View className="mb-8">
      {/* Section Header */}
      <View className="px-0 mb-4">
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
              <Sparkles size={16} color="white" strokeWidth={2.5} />
              <Text className="text-white font-lexend-medium text-xs">
                Share
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

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
                    <Sparkles size={24} color="white" strokeWidth={2.5} />
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
                  className="bg-white rounded-3xl mb-4 overflow-hidden border border-stone-200"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  {testimony.is_featured && (
                    <LinearGradient
                      colors={["#fbbf24", "#f59e0b"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text className="text-white text-xs font-lexend-semibold text-center">
                        ⭐ FEATURED TESTIMONY
                      </Text>
                    </LinearGradient>
                  )}

                  <LinearGradient
                    colors={categoryInfo.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-9 h-9 rounded-full bg-white/90 items-center justify-center">
                          <Text className="text-sm font-lexend-semibold text-gray-700">
                            {testimony.author ? testimony.author[0] : "A"}
                          </Text>
                        </View>
                        <View>
                          <Text className="font-lexend-medium text-white text-sm">
                            {testimony.author}
                          </Text>
                          <Text className="text-white/80 text-xs font-lexend-light">
                            {timeAgo(testimony.created_at)}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                        <Text className="text-sm">{categoryInfo.emoji}</Text>
                        <Text className="text-white text-xs font-lexend-medium">
                          {testimony.category}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                  {/* Body */}
                  <View className="px-5 py-4">
                    <View className="flex-row items-start gap-2 mb-2">
                      <Text className="text-xl">✨</Text>
                      <Text className="text-base font-lexend-semibold text-gray-800 flex-1">
                        {testimony.title}
                      </Text>
                    </View>
                    <Text className="text-gray-700 leading-6 font-lexend-light text-sm">
                      {testimony.content}
                    </Text>
                  </View>

                  {/* Reactions */}
                  <View className="px-5 pb-3">
                    <View className="flex-row items-center gap-2">
                      {reactions.map((reaction) => {
                        const count =
                          testimony.reactionCounts[`${reaction.type}_count`] ||
                          0;
                        const isActive = testimony.userReactions.has(
                          reaction.type,
                        );

                        return (
                          <TouchableOpacity
                            key={reaction.type}
                            onPress={() =>
                              handleToggleReaction(testimony.id, reaction.type)
                            }
                            activeOpacity={0.7}
                            style={{
                              backgroundColor: isActive
                                ? `${reaction.color}15`
                                : "#f5f5f4",
                              borderWidth: isActive ? 1 : 0,
                              borderColor: isActive
                                ? reaction.color
                                : "transparent",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 100,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Text className="text-sm">{reaction.emoji}</Text>
                            {count > 0 && (
                              <Text
                                className="text-xs font-lexend-medium"
                                style={{
                                  color: isActive ? reaction.color : "#78716c",
                                }}
                              >
                                {count}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Footer Row */}
                  <View className="px-5 pb-4 pt-2 border-t border-stone-100">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-lexend-medium text-gray-500">
                        {totalReactions > 0
                          ? `${totalReactions} ${
                              totalReactions === 1 ? "reaction" : "reactions"
                            }`
                          : "Be the first to react"}
                      </Text>

                      <TouchableOpacity
                        onPress={() => openComments(testimony)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 100,
                          backgroundColor: "#f5f5f4",
                        }}
                      >
                        <MessageCircle
                          size={18}
                          color="#78716c"
                          strokeWidth={2}
                        />
                        <Text className="text-sm font-lexend-medium text-gray-700">
                          {testimony.commentCount}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* FIXED ADD TESTIMONY MODAL (85% Height) */}
      {/* --------------------------------------------------------------------- */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          {/* Close Area */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          />

          {/* Modal Body */}
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
            {/* Header */}
            <View className="px-6 py-4 border-b border-stone-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-lexend-semibold text-gray-800">
                  Share Your Testimony
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  activeOpacity={0.6}
                >
                  <X size={24} color="#57534e" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scroll Content */}
            <ScrollView
              className="flex-1 px-6 py-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {/* Prayer Link */}
              <View className="mb-4">
                <Text className="text-sm font-lexend-semibold text-gray-700 mb-2">
                  Link to Prayer Request (Optional)
                </Text>

                <TouchableOpacity
                  onPress={openPrayerSelect}
                  activeOpacity={0.6}
                  style={{
                    backgroundColor: "#fafaf9",
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#e7e5e4",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 56,
                  }}
                >
                  <Text
                    className={`font-lexend text-sm flex-1 ${
                      selectedPrayerTitle
                        ? "text-gray-800 font-lexend-medium"
                        : "text-gray-400"
                    }`}
                    numberOfLines={1}
                  >
                    {selectedPrayerTitle || "Tap to select a prayer request"}
                  </Text>
                  <ChevronDown size={22} color="#78716c" />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View className="mb-4">
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
              </View>

              {/* Content */}
              <View className="mb-4">
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
              <View className="mb-4">
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
      </Modal>

      {/* --------------------------------------------------------------------- */}
      {/* PRAYER SELECTION MODAL */}
      {/* --------------------------------------------------------------------- */}
      {/* PRAYER SELECTION MODAL */}
      <Modal
        visible={showPrayerSelect}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrayerSelect(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          {/* Close when tapping outside */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowPrayerSelect(false)}
          />

          {/* Modal */}
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              height: "75%",
              overflow: "hidden",
              paddingBottom: 6,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#e7e5e4",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1f2937",
                  }}
                >
                  Select Prayer Request
                </Text>

                <TouchableOpacity
                  onPress={() => setShowPrayerSelect(false)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <X size={26} color="#57534e" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: "#78716c" }}>
                Choose which prayer this testimony answers
              </Text>
            </View>

            {/* LIST AREA */}
            <View style={{ flex: 1 }}>
              <ScrollView
                style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {/* LOADING */}
                {loadingPrayers ? (
                  <View
                    style={{
                      alignItems: "center",
                      paddingTop: 80,
                    }}
                  >
                    <ActivityIndicator size="large" color="#F9C846" />
                    <Text style={{ marginTop: 10, color: "#78716c" }}>
                      Loading your prayers...
                    </Text>
                  </View>
                ) : userPrayers.length === 0 ? (
                  /* NO PRAYERS */
                  <View
                    style={{
                      alignItems: "center",
                      paddingTop: 80,
                    }}
                  >
                    <Text style={{ fontSize: 50 }}>🙏</Text>
                    <Text
                      style={{ fontSize: 18, fontWeight: "600", marginTop: 10 }}
                    >
                      No prayers found
                    </Text>
                    <Text
                      style={{
                        textAlign: "center",
                        color: "#78716c",
                        marginTop: 6,
                      }}
                    >
                      You can still share your testimony without linking a
                      prayer
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* "No linked prayer" option */}
                    <TouchableOpacity
                      onPress={() => handleSelectPrayer(null)}
                      activeOpacity={0.7}
                      style={{ marginBottom: 12 }}
                    >
                      <View
                        style={{
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor:
                            newTestimony.prayer_request_id === null
                              ? "#fbbf24"
                              : "#e7e5e4",
                          backgroundColor:
                            newTestimony.prayer_request_id === null
                              ? "#fef3c7"
                              : "white",
                          paddingHorizontal: 20,
                          paddingVertical: 16,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color:
                              newTestimony.prayer_request_id === null
                                ? "#78350f"
                                : "#1f2937",
                          }}
                        >
                          No linked prayer
                        </Text>

                        {newTestimony.prayer_request_id === null && (
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor: "#f59e0b",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={18} color="white" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* ACTUAL PRAYER ITEMS */}
                    {userPrayers.map((prayer) => {
                      const selected =
                        newTestimony.prayer_request_id === prayer.id;

                      return (
                        <TouchableOpacity
                          key={prayer.id}
                          activeOpacity={0.7}
                          onPress={() => handleSelectPrayer(prayer)}
                          style={{ marginBottom: 12 }}
                        >
                          <View
                            style={{
                              borderRadius: 16,
                              borderWidth: 2,
                              borderColor: selected ? "#fbbf24" : "#e7e5e4",
                              backgroundColor: selected ? "#fef3c7" : "white",
                              paddingHorizontal: 20,
                              paddingVertical: 16,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: "600",
                                  color: selected ? "#78350f" : "#1f2937",
                                }}
                              >
                                {prayer.title}
                              </Text>

                              <Text
                                style={{
                                  fontSize: 12,
                                  marginTop: 4,
                                  color: selected ? "#92400e" : "#78716c",
                                }}
                              >
                                {timeAgo(prayer.created_at)}
                              </Text>
                            </View>

                            {selected && (
                              <View
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 13,
                                  backgroundColor: "#f59e0b",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginLeft: 12,
                                }}
                              >
                                <Check size={18} color="white" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* --------------------------------------------------------------------- */}
      {/* COMMENTS MODAL */}
      {/* --------------------------------------------------------------------- */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          {/* Outside Press Closes */}
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
            {/* Header */}
            <View className="px-6 py-4 border-b border-stone-200">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-lexend-semibold text-gray-800">
                  Comments
                </Text>
                <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                  <X size={24} color="#57534e" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <Text className="text-sm font-lexend-light text-gray-600">
                {selectedTestimony?.title}
              </Text>
            </View>

            {/* Comments List */}
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

            {/* Add Comment */}
            <View className="px-6 py-4 border-t border-stone-200 bg-white">
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add encouragement..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1 bg-stone-50 rounded-full border border-stone-200 px-5 py-3 text-sm"
                  multiline
                  maxLength={500}
                  editable={!sendingComment}
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
                      <MessageCircle size={20} color="white" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
