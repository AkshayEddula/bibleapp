import {
  Bookmark02Icon,
  BubbleChatIcon,
  Cancel01Icon,
  FavouriteIcon,
  QuoteUpIcon,
  Sent02Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  onShare,
  headerText = "Daily Verse",
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

  useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setLoadingComments(true);
    setFetchError("");
    try {
      if (!verse?.id) throw new Error("Invalid verse");
      const { data, error } = await supabase
        .from("verse_interactions")
        .select(`id, comment, created_at, user_id, profiles:user_id (display_name, email)`)
        .eq("verse_id", verse.id)
        .eq("interaction_type", "comment")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComments((data || []).map((item) => ({
        id: item.id,
        user: item.profiles?.display_name || item.profiles?.email?.split("@")[0] || "Anonymous",
        text: item.comment || "",
        time: formatTimeAgo(new Date(item.created_at)),
        isCurrentUser: item.user_id === user?.id,
      })));
    } catch (error) {
      console.error(error);
      setFetchError("Could not load comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const handleAddComment = async () => {
    setCommentError("");
    const trimmed = commentText.trim();
    if (!trimmed) return setCommentError("Write something first");
    if (!user?.id) return setCommentError("Please login");

    setSendingComment(true);
    try {
      const { data, error } = await supabase
        .from("verse_interactions")
        .insert({
          user_id: user.id,
          verse_id: verse.id,
          interaction_type: "comment",
          comment: trimmed,
        })
        .select(`id, comment, created_at, user_id, profiles:user_id (display_name, email)`)
        .single();

      if (error) throw error;

      setComments([{
        id: data.id,
        user: data.profiles?.display_name || "You",
        text: data.comment,
        time: "Now",
        isCurrentUser: true,
      }, ...comments]);
      setCommentText("");
    } catch (error) {
      setCommentError("Failed to post.");
    } finally {
      setSendingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${verse.content}" - ${verse.book} ${verse.chapter}:${verse.verse}`,
      });
      if (onShare) onShare(verse.id);
    } catch (e) {
      Alert.alert("Error", "Could not share");
    }
  };

  const handleSave = () => {
    setLocalSaved(!localSaved);
    if (onToggleSave) onToggleSave(verse.id);
  };

  return (
    <>
      {/* --- Main Card Container --- */}
      <View
        className="bg-white rounded-[24px] mb-2 mx-1 overflow-hidden relative border border-stone-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Top Gradient Bar - Thinner and subtler */}
        <LinearGradient
          colors={["#F59E0B", "#FEF3C7", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 4, width: "100%" }}
        />

        {/* Watermark Quote Icon */}
        <View
          className="absolute top-12 right-6 opacity-[0.04]"
          pointerEvents="none"
        >
          <HugeiconsIcon pointerEvents="none" icon={QuoteUpIcon} size={100} color="#000" />
        </View>

        {/* Content Section */}
        <View className="px-6 pt-5 pb-4">

          {/* Header Badge & Reference */}
          <View className="mb-3">
            <View className="flex-row items-center gap-2 mb-1.5">
              <View className="w-1 h-3.5 bg-amber-400 rounded-full" />
              <Text className="text-[11px] font-lexend-medium text-stone-500 uppercase tracking-wide">
                {headerText}
              </Text>
            </View>
            <Text className="text-[17px] font-lexend-semibold text-stone-800 tracking-tight">
              {verse.book} {verse.chapter}:{verse.verse}
            </Text>
          </View>

          {/* Verse Text - Reduced weight and size for elegance */}
          <Text className="text-[16px] leading-[26px] font-lexend text-stone-700">
            "{verse.content}"
          </Text>

          {/* Insight / Meaning - Clean border style */}
          {verse.meaning ? (
            <View className="mt-5 pt-4 border-t border-stone-100/80">
              <Text className="text-[11px] font-lexend-medium text-stone-400 mb-1">
                REFLECTION
              </Text>
              <Text className="text-[13px] leading-[20px] font-lexend-light text-stone-600">
                {verse.meaning}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Footer */}
        <View className="px-4 py-3 border-t border-stone-100 flex-row justify-between items-center bg-stone-50/40">

          {/* Left Actions */}
          <View className="flex-row items-center gap-2">
            {/* Like Button */}
            <Pressable
              onPress={() => onToggleLike(verse.id)}
              className="flex-row items-center gap-1.5 px-2 py-2 rounded-full active:bg-stone-100"
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                size={24} // Increased size
                color={isLiked ? "#EF4444" : "#57534E"}
                fill={isLiked ? "#EF4444" : "transparent"}
                strokeWidth={1.5}
                pointerEvents="none"
              />
              {counts.like_count > 0 && (
                <Text className={`text-[13px] font-lexend ${isLiked ? "text-red-500 font-medium" : "text-stone-500"}`}>
                  {counts.like_count}
                </Text>
              )}
            </Pressable>

            {/* Comment Button */}
            <Pressable
              onPress={() => setShowComments(true)}
              className="flex-row items-center gap-1.5 px-2 py-2 rounded-full active:bg-stone-100"
            >
              <HugeiconsIcon pointerEvents="none" icon={BubbleChatIcon} size={24} color="#57534E" strokeWidth={1.5} />
              {counts.comment_count > 0 && (
                <Text className="text-[13px] font-lexend text-stone-500">
                  {counts.comment_count}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Right Actions */}
          <View className="flex-row items-center gap-2">
            <Pressable onPress={handleShare} className="p-2 rounded-full active:bg-stone-100">
              <HugeiconsIcon pointerEvents="none" icon={SentIcon} size={24} color="#57534E" strokeWidth={1.5} />
            </Pressable>
            <Pressable onPress={handleSave} className="p-2 rounded-full active:bg-stone-100">
              <HugeiconsIcon pointerEvents="none" icon={Bookmark02Icon}
                size={24}
                color={localSaved ? "#F59E0B" : "#57534E"}
                fill={localSaved ? "#F59E0B" : "transparent"}
                strokeWidth={1.5}
              />
            </Pressable>
          </View>

        </View>
      </View>

      {/* --- Comments Modal --- */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <Pressable
            className="absolute inset-0 bg-black/20"
            onPress={() => setShowComments(false)}
          />

          <View className="bg-white rounded-t-[28px] h-[75%] w-full overflow-hidden shadow-xl">
            {/* Handle */}
            <View className="items-center pt-3 pb-2 bg-white">
              <View className="w-10 h-1 bg-stone-200 rounded-full" />
            </View>

            {/* Header */}
            <View className="px-6 pb-3 border-b border-stone-100 flex-row justify-between items-center bg-white">
              <Text className="text-[17px] font-lexend-semibold text-stone-800">Discussion</Text>
              <Pressable onPress={() => setShowComments(false)} className="bg-stone-50 p-1.5 rounded-full">
                <HugeiconsIcon pointerEvents="none" icon={Cancel01Icon} size={20} color="#666" />
              </Pressable>
            </View>

            {/* List */}
            <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 16 }}>
              {fetchError ? (
                <Text className="text-center text-red-500 mt-8 font-lexend text-sm">{fetchError}</Text>
              ) : loadingComments ? (
                <ActivityIndicator className="mt-8" color="#F59E0B" />
              ) : comments.length === 0 ? (
                <View className="items-center mt-12 opacity-50">
                  <HugeiconsIcon pointerEvents="none" icon={BubbleChatIcon} size={32} color="#a8a29e" />
                  <Text className="text-stone-400 mt-2 font-lexend text-sm">No thoughts yet</Text>
                </View>
              ) : (
                comments.map((c) => (
                  <View key={c.id} className="mb-5 flex-row gap-3">
                    <View className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center border border-stone-200">
                      <Text className="text-[11px] font-bold text-stone-500">{c.user[0].toUpperCase()}</Text>
                    </View>
                    <View className="flex-1 pt-0.5">
                      <View className="flex-row items-baseline gap-2 mb-0.5">
                        <Text className="text-[13px] font-lexend-medium text-stone-700">{c.isCurrentUser ? "You" : c.user}</Text>
                        <Text className="text-[10px] text-stone-400 font-lexend">{c.time}</Text>
                      </View>
                      <Text className="text-[14px] text-stone-600 font-lexend leading-[20px]">{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input */}
            <View className="p-4 border-t border-stone-100 pb-8 bg-white">
              {commentError ? <Text className="text-red-500 text-[11px] mb-2 font-lexend">{commentError}</Text> : null}
              <View className="flex-row gap-2 items-center">
                <TextInput
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-5 py-3 text-[14px] font-lexend text-stone-800"
                  placeholder="Share your reflection..."
                  placeholderTextColor="#a8a29e"
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={COMMENT_MAX_LENGTH}
                />
                <Pressable
                  onPress={handleAddComment}
                  disabled={!commentText.trim() || sendingComment}
                  className={`w-11 h-11 rounded-full items-center justify-center ${commentText.trim() ? 'bg-stone-800' : 'bg-stone-200'}`}
                >
                  {sendingComment ? <ActivityIndicator size="small" color="white" /> : <HugeiconsIcon pointerEvents="none" icon={Sent02Icon} size={20} color={commentText.trim() ? "white" : "#a8a29e"} variant="solid" />}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};