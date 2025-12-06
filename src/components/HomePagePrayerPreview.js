import { ArrowRight02Icon, BubbleChatIcon, Cancel01Icon, PlusSignIcon, Sent02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import SinglePrayerCard from "./SinglePrayerCard";

const COMMENT_MAX_LENGTH = 250;

const HomePagePrayerPreview = ({ navigation }) => {
    const { user } = useAuth();
    const [prayers, setPrayers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Comment Modal State
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedPrayer, setSelectedPrayer] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [sendingComment, setSendingComment] = useState(false);
    const [commentError, setCommentError] = useState("");

    useEffect(() => {
        fetchPrayers();
    }, []);

    const fetchPrayers = async () => {
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
        `
                )
                .order("created_at", { ascending: false })
                .limit(2);

            if (error) throw error;

            if (!data || data.length === 0) {
                setPrayers([]);
                return;
            }

            // Get full counts for the cards
            const prayersWithCounts = await Promise.all(
                data.map(async (prayer) => {
                    const [reactionsResult, commentsResult, userReactionResult] = await Promise.all([
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
                            .eq("user_id", user?.id)
                            .single(),
                    ]);

                    return {
                        ...prayer,
                        author: prayer.profiles?.display_name || "Anonymous",
                        prayingCount: reactionsResult.count || 0,
                        commentCount: commentsResult.count || 0,
                        isPraying: !!userReactionResult.data,
                    };
                })
            );

            setPrayers(prayersWithCounts);
        } catch (error) {
            console.error("Error fetching preview prayers:", error);
        } finally {
            setLoading(false);
        }
    };

    const navigateToPosts = () => {
        navigation.navigate('Post');
    };

    const handleTogglePraying = async (prayerId) => {
        if (!prayerId || !user?.id) return;

        const prayer = prayers.find((p) => p.id === prayerId);
        if (!prayer) return;

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
            setPrayers(previousState);
            Alert.alert("Error", "Could not update prayer status.");
        }
    };

    const handleOpenComments = (prayer) => {
        setSelectedPrayer(prayer);
        setShowCommentsModal(true);
        fetchComments(prayer.id);
    };

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const fetchComments = async (prayerId) => {
        setLoadingComments(true);
        setCommentError("");

        try {
            if (!prayerId) {
                throw new Error("Invalid prayer ID");
            }

            const { data, error } = await supabase
                .from("prayer_comments")
                .select(`
                    id,
                    comment_text,
                    created_at,
                    user_id,
                    profiles:user_id (
                        display_name
                    )
                `)
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
            setCommentError("");
        } catch (error) {
            console.error("Error fetching comments:", error);
            setCommentError("Failed to load comments. Please try again.");
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        setCommentError("");
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
                .select(`
                    id,
                    comment_text,
                    created_at,
                    user_id,
                    profiles:user_id (
                        display_name
                    )
                `)
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
            setPrayers(prayers.map((p) =>
                p.id === selectedPrayer.id
                    ? { ...p, commentCount: p.commentCount + 1 }
                    : p
            ));
            setCommentText("");
            setCommentError("");
        } catch (error) {
            console.error("Error adding comment:", error);
            setCommentError("Failed to post comment. Please try again.");
        } finally {
            setSendingComment(false);
        }
    };

    const handleCommentTextChange = (text) => {
        const singleLineText = text.replace(/[\r\n]+/g, ' ');
        if (singleLineText.length <= COMMENT_MAX_LENGTH) {
            setCommentText(singleLineText);
            setCommentError("");
        } else {
            setCommentError(`Maximum ${COMMENT_MAX_LENGTH} characters allowed`);
        }
    };

    if (loading) {
        return (
            <View className="py-8 items-center">
                <ActivityIndicator color="#B45309" />
            </View>
        );
    }

    return (
        <>
            <View className="mb-0 mt-8">
                {/* Updated Header: 
                  Based on the "Verse Reels" reference (Amber colors, specific typography).
                */}
                <View className="flex-row items-center justify-between mb-6 px-[12px]">
                    {/* Left: Title & Subtitle */}
                    <View>
                        <Text className="text-[22px] font-lexend-semibold tracking-[-0.5px] text-gray-900">
                            Prayer Wall
                        </Text>
                        <Text className="text-[12px] font-lexend mt-1 text-gray-500">
                            Share burdens • Find peace
                        </Text>
                    </View>

                    {/* Right: "Add Prayer" styled like the 'NEW' badge in reference */}
                    <Pressable
                        onPress={navigateToPosts}
                        className="active:opacity-70"
                    >
                        <View className="flex-row items-center gap-1.5 px-3.5 py-3 rounded-full border bg-amber-50 border-amber-200">
                            <HugeiconsIcon icon={PlusSignIcon} size={14} color="#B45309" strokeWidth={2.5} />
                            <Text className="text-[11px] font-lexend-semibold uppercase tracking-wider text-amber-700">
                                ADD PRAYER
                            </Text>
                        </View>
                    </Pressable>
                </View>

                {/* Prayers List */}
                <View className="px-0">
                    {prayers.length === 0 ? (
                        <View className="items-center py-12 bg-white rounded-[24px] border border-stone-200 border-dashed mx-1">
                            <Text className="text-3xl mb-3 opacity-50">🙏</Text>
                            <Text className="text-stone-400 font-lexend text-sm">No prayers yet</Text>
                        </View>
                    ) : (
                        prayers.map((prayer) => (
                            <SinglePrayerCard
                                key={prayer.id}
                                prayer={prayer}
                                onTogglePraying={handleTogglePraying}
                                onOpenComments={handleOpenComments}
                            />
                        ))
                    )}
                </View>

                {/* See More Button */}
                {prayers.length > 0 && (
                    <Pressable
                        onPress={navigateToPosts}
                        className="flex-row items-center justify-center mt-2 py-3 active:opacity-60"
                    >
                        <Text className="text-stone-500 font-lexend-medium text-[13px] mr-1">
                            View all prayers
                        </Text>
                        <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={1.5} size={16} color="#78716c" />
                    </Pressable>
                )}
            </View>

            {/* Comments Modal */}
            <Modal
                visible={showCommentsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCommentsModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end"
                >
                    <Pressable
                        className="absolute inset-0 bg-black/20"
                        onPress={() => setShowCommentsModal(false)}
                    />

                    <View className="bg-white rounded-t-[28px] h-[75%] w-full overflow-hidden shadow-xl">
                        {/* Handle */}
                        <View className="items-center pt-3 pb-2 bg-white">
                            <View className="w-10 h-1 bg-stone-200 rounded-full" />
                        </View>

                        {/* Modal Header */}
                        <View className="px-6 pb-3 border-b border-stone-100 flex-row justify-between items-center bg-white">
                            <View className="flex-1 mr-4">
                                <Text className="text-[17px] font-lexend-semibold text-stone-800">
                                    Prayer Support
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    className="text-[12px] font-lexend text-stone-400 mt-0.5"
                                >
                                    {selectedPrayer?.title}
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => setShowCommentsModal(false)}
                                className="bg-stone-50 p-1.5 rounded-full"
                            >
                                <HugeiconsIcon pointerEvents="none" icon={Cancel01Icon} size={20} color="#666" strokeWidth={1.5} />
                            </Pressable>
                        </View>

                        {/* Comments List */}
                        <ScrollView
                            className="flex-1 px-6"
                            contentContainerStyle={{ paddingVertical: 16 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {loadingComments ? (
                                <View className="items-center justify-center py-12">
                                    <ActivityIndicator color="#B45309" size="small" />
                                </View>
                            ) : comments.length === 0 ? (
                                <View className="items-center justify-center py-12 opacity-50">
                                    <HugeiconsIcon pointerEvents="none" icon={BubbleChatIcon} size={32} color="#a8a29e" />
                                    <Text className="text-stone-400 mt-2 font-lexend text-sm">
                                        No comments yet
                                    </Text>
                                </View>
                            ) : (
                                comments.map((comment) => (
                                    <View key={comment.id} className="mb-5 flex-row gap-3">
                                        <View className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center border border-stone-200">
                                            <Text className="text-[11px] font-bold text-stone-500">
                                                {comment.user[0].toUpperCase()}
                                            </Text>
                                        </View>
                                        <View className="flex-1 pt-0.5">
                                            <View className="flex-row items-baseline gap-2 mb-0.5">
                                                <Text className="text-[13px] font-lexend-medium text-stone-700">
                                                    {comment.isCurrentUser ? "You" : comment.user}
                                                </Text>
                                                <Text className="text-[10px] text-stone-400 font-lexend">
                                                    {comment.time}
                                                </Text>
                                            </View>
                                            <Text className="text-[14px] text-stone-600 font-lexend leading-[20px]">
                                                {comment.text}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        {/* Comment Input */}
                        <View className="p-4 border-t border-stone-100 pb-8 bg-white">
                            {commentError ? (
                                <Text className="text-red-500 text-[11px] mb-2 font-lexend">
                                    {commentError}
                                </Text>
                            ) : null}

                            <View className="flex-row gap-2 items-center">
                                <TextInput
                                    value={commentText}
                                    onChangeText={handleCommentTextChange}
                                    placeholder="Write a prayer or encouragement..."
                                    placeholderTextColor="#a8a29e"
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-5 py-3 text-[14px] font-lexend text-stone-800"
                                    maxLength={COMMENT_MAX_LENGTH}
                                    editable={!sendingComment}
                                    returnKeyType="send"
                                    onSubmitEditing={handleAddComment}
                                />
                                <Pressable
                                    onPress={handleAddComment}
                                    disabled={!commentText.trim() || sendingComment}
                                    className={`w-11 h-11 rounded-full items-center justify-center ${commentText.trim() && !sendingComment ? 'bg-stone-800' : 'bg-stone-200'}`}
                                >
                                    {sendingComment ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <HugeiconsIcon pointerEvents="none" icon={Sent02Icon} size={20} color={commentText.trim() ? "white" : "#a8a29e"} variant="solid" />
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

export default React.memo(HomePagePrayerPreview);