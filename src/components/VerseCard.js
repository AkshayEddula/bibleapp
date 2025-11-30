import { LinearGradient } from "expo-linear-gradient";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const COMMENT_MAX_LENGTH = 250;

export const VerseCard = ({
  verse,
  isLiked,
  isSaved = false,
  counts,
  onToggleLike,
  onToggleSave,
  onView,
  onShare,
  headerText = "Daily Verse", // Default header
}) => {
  const { user } = useAuth();
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Trigger view recording on mount
  useEffect(() => {
    if (onView) {
      onView();
    }
  }, []);

  const handleSave = () => {
    setLocalSaved(!localSaved);
    if (onToggleSave) {
      onToggleSave(verse.id);
    }
  };

  // Sync isSaved prop with local state
  useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

  // Fetch comments when modal opens
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setLoadingComments(true);
    setFetchError("");

    try {
      if (!verse?.id) {
        throw new Error("Invalid verse data");
      }

      const { data, error } = await supabase
        .from("verse_interactions")
        .select(
          `
          id,
          comment,
          created_at,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        `,
        )
        .eq("verse_id", verse.id)
        .eq("interaction_type", "comment")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format comments for display
      const formattedComments = (data || []).map((item) => ({
        id: item.id,
        user:
          item.profiles?.display_name ||
          item.profiles?.email?.split("@")[0] ||
          "Anonymous",
        text: item.comment || "",
        time: formatTimeAgo(new Date(item.created_at)),
        isCurrentUser: item.user_id === user?.id,
      }));

      setComments(formattedComments);
      setFetchError("");
    } catch (error) {
      console.error("Error fetching comments:", error);
      setFetchError("Failed to load comments. Please try again.");
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
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

    if (!verse?.id) {
      setCommentError("Invalid verse data");
      return;
    }

    setSendingComment(true);

    try {
      const { data, error } = await supabase
        .from("verse_interactions")
        .insert({
          user_id: user.id,
          verse_id: verse.id,
          interaction_type: "comment",
          comment: trimmedComment,
        })
        .select(
          `
          id,
          comment,
          created_at,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        `,
        )
        .single();

      if (error) throw error;

      // Add new comment to the list
      const newComment = {
        id: data.id,
        user:
          data.profiles?.display_name ||
          data.profiles?.email?.split("@")[0] ||
          "You",
        text: data.comment,
        time: "Just now",
        isCurrentUser: true,
      };

      setComments([newComment, ...comments]);
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

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `"${verse.content}" - ${verse.book} ${verse.chapter}:${verse.verse}\n\nShared via LumiVerse ✨`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log("Shared via", result.activityType);
        } else {
          // shared
          console.log("Shared successfully");
        }

        // Record the share interaction
        if (onShare) {
          onShare(verse.id);
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      console.error("Error sharing:", error.message);
    }
  };

  return (
    <>
      <View
        className="bg-white rounded-[28px] mb-0 overflow-hidden border border-stone-200/40"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Verse Header with Gradient */}
        <LinearGradient
          colors={["#fffbeb", "#fef3c7", "#fde68a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="font-lexend-medium text-[17px] text-amber-800">
              {headerText}
            </Text>
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="font-lexend-semibold text-amber-900 text-[14px]">
              {verse.book} {verse.chapter}:{verse.verse}
            </Text>
          </View>
        </LinearGradient>

        {/* Verse Content */}
        <View className="px-6 py-6">
          <Text className="text-gray-800 leading-[25px] font-lexend text-[16px]">
            "{verse.content}"
          </Text>

          {/* Meaning Section */}
          {verse.meaning ? (
            <View className="mt-5 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-[20px] border border-indigo-100/60">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-6 h-6 bg-indigo-100 rounded-full items-center justify-center">
                  <Text className="text-[13px]">💡</Text>
                </View>
                <Text className="text-[13px] font-lexend-semibold text-indigo-800">
                  Reflection
                </Text>
              </View>
              <Text className="text-gray-700 font-lexend-light text-[14px] leading-[21px]">
                {verse.meaning}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Bar */}
        <View className="px-6 pb-5 pt-2 border-t border-stone-100/80">
          <View className="flex-row items-center justify-between pt-3">
            {/* Like Button */}
            <Pressable
              onPress={() => onToggleLike(verse.id)}
              className="flex-row items-center gap-2 active:scale-95 px-3 py-2 rounded-full"
              style={{
                backgroundColor: isLiked ? "#fef2f2" : "transparent",
              }}
            >
              <Heart
                size={21}
                color={isLiked ? "#ef4444" : "#57534e"}
                fill={isLiked ? "#ef4444" : "transparent"}
                strokeWidth={2}
                pointerEvents="none"
              />
              <Text
                className={`text-[14px] font-lexend-medium ${isLiked ? "text-red-500" : "text-gray-700"}`}
              >
                {counts.like_count}
              </Text>
            </Pressable>

            {/* Comment Button */}
            <Pressable
              onPress={() => setShowComments(true)}
              className="flex-row items-center gap-2 active:scale-95 px-3 py-2 rounded-full"
            >
              <MessageCircle size={21} color="#57534e" strokeWidth={2} pointerEvents="none" />
              <Text className="text-[14px] font-lexend-medium text-gray-700">
                {counts.comment_count || 0}
              </Text>
            </Pressable>

            {/* Share Button */}
            <Pressable
              onPress={handleShare}
              className="flex-row items-center gap-2 active:scale-95 px-3 py-2 rounded-full"
            >
              <Share2 size={20} color="#57534e" strokeWidth={2} pointerEvents="none" />
              <Text className="text-[14px] font-lexend-medium text-gray-700">
                {counts.share_count || 0}
              </Text>
            </Pressable>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="active:scale-95 px-3 py-2 rounded-full"
              style={{
                backgroundColor: localSaved ? "#fffbeb" : "transparent",
              }}
            >
              <Bookmark
                size={21}
                color={localSaved ? "#F59E0B" : "#57534e"}
                fill={localSaved ? "#F59E0B" : "transparent"}
                strokeWidth={2}
                pointerEvents="none"
              />
            </Pressable>

            {/* View Count (Read Only) */}
            <View className="flex-row items-center gap-2 px-3 py-2">
              <Eye size={20} color="#9ca3af" strokeWidth={2} pointerEvents="none" />
              <Text className="text-[13px] font-lexend-medium text-gray-400">
                {counts.view_count || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-[32px] h-[80%]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 py-5 border-b border-stone-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-lexend-semibold text-gray-800">
                  Comments
                </Text>
                <Pressable
                  onPress={() => setShowComments(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-60"
                >
                  <X size={18} strokeWidth={2} color="#212121" pointerEvents="none" />
                </Pressable>
              </View>
              <Text className="text-sm font-lexend-light text-gray-600 mt-1">
                {verse.book} {verse.chapter}:{verse.verse}
              </Text>
            </View>

            {/* Comments List */}
            <ScrollView className="flex-1 px-6 py-4">
              {fetchError ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-5xl mb-3">⚠️</Text>
                  <Text className="text-base font-lexend-semibold text-red-600 mb-2">
                    {fetchError}
                  </Text>
                  <Pressable
                    onPress={fetchComments}
                    className="mt-3 bg-gray-100 px-4 py-2 rounded-full active:scale-95"
                  >
                    <Text className="text-sm font-lexend-medium text-gray-700">
                      Try Again
                    </Text>
                  </Pressable>
                </View>
              ) : loadingComments ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator color="#F9C846" size="large" />
                  <Text className="text-sm font-lexend-light text-gray-500 mt-3">
                    Loading comments...
                  </Text>
                </View>
              ) : comments.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-5xl mb-3">💬</Text>
                  <Text className="text-base font-lexend-semibold text-gray-800">
                    No comments yet
                  </Text>
                  <Text className="text-sm font-lexend-light text-gray-500 mt-1">
                    Be the first to share your thoughts!
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
                  Share your thoughts
                </Text>
                <Text className={`text-xs font-lexend-medium ${commentText.length > COMMENT_MAX_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
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
                      <Send size={18} strokeWidth={2} color="#212121" pointerEvents="none" />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
