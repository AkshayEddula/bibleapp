import { LinearGradient } from "expo-linear-gradient";
import {
  Check,
  ChevronDown,
  MessageCircle,
  Sparkles,
  X
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
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

export default function TestimoniesScreen() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showPrayerDropdown, setShowPrayerDropdown] = useState(false);

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
          ),
          prayer_requests:prayer_request_id (
            title,
            description
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
            linkedPrayer: testimony.prayer_requests,
          };
        }),
      );

      setTestimonies(testimoniesWithCounts);
      console.log(testimoniesWithCounts);
    } catch (error) {
      console.error("Error fetching testimonies:", error);
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
    const testimony = testimonies.find((t) => t.id === testimonyId);
    if (!testimony) return;

    const hasReacted = testimony.userReactions.has(reactionType);

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
    setShowPrayerDropdown(false);
  };

  return (
    <View className="mb-8">
      {/* Section Header */}
      <View className="px-4 mb-4">
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
              <Sparkles size={16} color="white" strokeWidth={2.5} pointerEvents="none" />
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
                    <Sparkles size={24} color="white" strokeWidth={2.5} pointerEvents="none" />
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

                  {/* Prayer Link Badge - Show if linked to prayer */}
                  {testimony.prayer_request_id && (
                    <View
                      style={{
                        flexDirection: "row",
                        margin: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        backgroundColor: "#fafafa",
                        borderRadius: 14,
                      }}
                    >
                      {/* Left vertical thread line */}
                      <View
                        style={{
                          width: 3,
                          backgroundColor: "#d1d5db",
                          borderRadius: 999,
                          marginRight: 12,
                        }}
                      />

                      {/* Right content block */}
                      <View style={{ flex: 1 }}>
                        {/* Heading Row */}
                        <View className="flex-row items-center gap-2 mb-6">
                          <Text style={{ fontSize: 16 }}>🙏</Text>
                          <Text className="text-[15px] font-lexend text-gray-500">
                            Answered Prayer Testimony
                          </Text>
                        </View>

                        <View className="flex-row items-start gap-2 mb-2 ml-2">
                          {/* Title */}
                          <Text className="text-xl">✨</Text>

                          <Text className="font-lexend-medium text-[15px] text-gray-900">
                            {testimony.linkedPrayer.title}
                          </Text>
                        </View>

                        {/* Description */}
                        <Text className="font-lexend-light text-[14px] text-gray-500 leading-6 ml-2 mt-0">
                          {testimony.linkedPrayer.description}
                        </Text>
                      </View>
                    </View>
                  )}

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

                  <View className="px-5 pb-4 pt-2 border-t border-stone-100">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-lexend-medium text-gray-500">
                        {totalReactions > 0
                          ? `${totalReactions} ${totalReactions === 1 ? "reaction" : "reactions"
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
                          pointerEvents="none"
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

      {/* ADD TESTIMONY MODAL */}
      <Modal
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
                  <X size={24} color="#57534e" strokeWidth={2.5} pointerEvents="none" />
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
                    <ChevronDown
                      size={22}
                      color="#78716c"
                      style={{
                        transform: [
                          { rotate: showPrayerDropdown ? "180deg" : "0deg" },
                        ],
                      }}
                      pointerEvents="none"
                    />
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
                                  <Check size={18} color="#f59e0b" />
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
                                        <Check size={18} color="#f59e0b" />
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
      </Modal>

      {/* COMMENTS MODAL */}
      <Modal
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
                  <X size={24} color="#57534e" strokeWidth={2.5} pointerEvents="none" />
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
                      <MessageCircle size={20} color="white" pointerEvents="none" />
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
