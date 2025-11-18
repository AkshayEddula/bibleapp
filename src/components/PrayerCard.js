// PrayerWallScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Heart, MessageCircle, Plus, X, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function PrayerWallScreen() {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [submittingPrayer, setSubmittingPrayer] = useState(false);

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
      const { data, error } = await supabase
        .from("prayer_requests")
        .select(
          `
          id,
          title,
          description,
          category,
          created_at,
          profiles:user_id (
            display_name,
            profile_photo_url
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const prayersWithCounts = await Promise.all(
        data.map(async (prayer) => {
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
        }),
      );

      setPrayers(prayersWithCounts);
    } catch (error) {
      console.error("Error fetching prayers:", error);
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
    const prayer = prayers.find((p) => p.id === prayerId);
    const isCurrentlyPraying = prayer.isPraying;

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
      setPrayers(
        prayers.map((p) =>
          p.id === prayerId
            ? {
                ...p,
                isPraying: isCurrentlyPraying,
                prayingCount: isCurrentlyPraying
                  ? p.prayingCount + 1
                  : p.prayingCount - 1,
              }
            : p,
        ),
      );
    }
  };

  const handleAddPrayer = async () => {
    if (!newPrayer.title.trim() || !newPrayer.description.trim()) return;

    setSubmittingPrayer(true);
    try {
      const { data, error } = await supabase
        .from("prayer_requests")
        .insert({
          user_id: user.id,
          title: newPrayer.title,
          description: newPrayer.description,
          category: newPrayer.category,
        })
        .select(
          `
          id,
          title,
          description,
          category,
          created_at,
          profiles:user_id (
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
      alert("Failed to add prayer. Please try again.");
    } finally {
      setSubmittingPrayer(false);
    }
  };

  const fetchComments = async (prayerId) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("prayer_comments")
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
        .eq("prayer_request_id", prayerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedComments = data.map((comment) => ({
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
    if (!commentText.trim() || !selectedPrayer) return;

    setSendingComment(true);
    try {
      const { data, error } = await supabase
        .from("prayer_comments")
        .insert({
          prayer_request_id: selectedPrayer.id,
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

      setComments([newComment, ...comments]);
      setPrayers(
        prayers.map((p) =>
          p.id === selectedPrayer.id
            ? { ...p, commentCount: p.commentCount + 1 }
            : p,
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

  const openComments = (prayer) => {
    setSelectedPrayer(prayer);
    setShowCommentsModal(true);
    fetchComments(prayer.id);
  };

  // Add Prayer Card Component
  const AddPrayerCard = () => (
    <Pressable
      onPress={() => setShowAddModal(true)}
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
              <Plus size={24} color="white" strokeWidth={2.5} />
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
    <SafeAreaView className="flex-1 ">
      {/* Header */}
      <View className="b px-4 pt-0 pb-4 border-b border-stone-200">
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
            onPress={() => setShowAddModal(true)}
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
              <Plus size={20} color="white" strokeWidth={2.5} />
              <Text className="text-white font-lexend-medium text-sm">
                Add Prayer
              </Text>
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
                    className="bg-white rounded-3xl mb-4 overflow-hidden border border-stone-200"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    {/* Prayer Header */}
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
                              {prayer.author[0]}
                            </Text>
                          </View>
                          <View>
                            <Text className="font-lexend-medium text-white text-sm">
                              {prayer.author}
                            </Text>
                            <Text className="text-white/80 text-xs font-lexend-light">
                              {timeAgo(prayer.created_at)}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                          <Text className="text-sm">{categoryInfo.emoji}</Text>
                          <Text className="text-white text-xs font-lexend-medium">
                            {prayer.category}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Prayer Content */}
                    <View className="px-5 py-4">
                      <View className="flex-row items-start gap-2 mb-2">
                        <Text className="text-xl">🙏</Text>
                        <Text className="text-base font-lexend-semibold text-gray-800 flex-1">
                          {prayer.title}
                        </Text>
                      </View>
                      <Text className="text-gray-700 leading-6 font-lexend-light text-sm">
                        {prayer.description}
                      </Text>
                    </View>

                    {/* Action Bar */}
                    <View className="px-5 pb-4 pt-2 border-t border-stone-100">
                      <View className="flex-row items-center justify-between pt-2">
                        {/* Praying Button */}
                        <Pressable
                          onPress={() => handleTogglePraying(prayer.id)}
                          className="flex-row items-center gap-2 px-3 py-2 rounded-full active:scale-95"
                          style={{
                            backgroundColor: prayer.isPraying
                              ? "#faf5ff"
                              : "transparent",
                            borderWidth: prayer.isPraying ? 1 : 0,
                            borderColor: "#e9d5ff",
                          }}
                        >
                          <Heart
                            size={20}
                            color={prayer.isPraying ? "#a855f7" : "#78716c"}
                            fill={prayer.isPraying ? "#a855f7" : "transparent"}
                            strokeWidth={2}
                          />
                          <Text
                            className={`text-sm font-lexend-medium ${
                              prayer.isPraying
                                ? "text-purple-600"
                                : "text-gray-700"
                            }`}
                          >
                            {prayer.isPraying ? "Praying" : "Pray"}
                          </Text>
                          <Text
                            className={`text-sm font-lexend-semibold ${
                              prayer.isPraying
                                ? "text-purple-600"
                                : "text-gray-500"
                            }`}
                          >
                            {prayer.prayingCount}
                          </Text>
                        </Pressable>

                        {/* Comments Button */}
                        <Pressable
                          onPress={() => openComments(prayer)}
                          className="flex-row items-center gap-2 px-3 py-2 rounded-full active:scale-95"
                        >
                          <MessageCircle
                            size={20}
                            color="#78716c"
                            strokeWidth={2}
                          />
                          <Text className="text-sm font-lexend-medium text-gray-700">
                            {prayer.commentCount}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

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
              shadowOpacity: 0.1,
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
                  <X size={20} color="#57534e" />
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
                  maxLength={500}
                />
                <Text className="text-xs text-gray-500 mt-1 text-right font-lexend-light">
                  {newPrayer.description.length}/500
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
                  <X size={20} color="#57534e" />
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
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1 bg-stone-50 rounded-full border border-stone-200 px-5 py-3 font-lexend-light text-sm text-gray-800"
                  multiline
                  maxLength={500}
                  editable={!sendingComment}
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
                      <Send size={18} strokeWidth={2} color="#212121" />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
