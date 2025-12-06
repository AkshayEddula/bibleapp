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
import SingleTestimonialCard from "./SingleTestimonialCard";

const COMMENT_MAX_LENGTH = 250;

const HomePageTestimonialPreview = ({ navigation }) => {
    const { user } = useAuth();
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Comment Modal State
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedTestimony, setSelectedTestimony] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [sendingComment, setSendingComment] = useState(false);
    const [commentError, setCommentError] = useState("");

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
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
        `
                )
                .order("created_at", { ascending: false })
                .limit(2);

            if (error) throw error;

            if (!data || data.length === 0) {
                setTestimonials([]);
                return;
            }

            // Get like counts and reactions
            const testimonialsWithCounts = await Promise.all(
                data.map(async (testimony) => {
                    const [reactionCountsResult, commentsResult, userReactionsResult] = await Promise.all([
                        supabase.rpc('get_testimony_reaction_counts', { testimony_id_input: testimony.id }),
                        supabase
                            .from("testimony_comments")
                            .select("id", { count: "exact" })
                            .eq("testimony_id", testimony.id),
                        supabase
                            .from("testimony_reactions")
                            .select("reaction_type")
                            .eq("testimony_id", testimony.id)
                            .eq("user_id", user?.id)
                    ]);

                    // Parse reaction counts
                    const reactionCounts = reactionCountsResult.data?.[0] || {
                        praise_count: 0,
                        amen_count: 0,
                        blessed_count: 0,
                    };

                    const userReactions = new Set(
                        (userReactionsResult.data || []).map((r) => r.reaction_type),
                    );

                    return {
                        ...testimony,
                        author: testimony.profiles?.display_name || "Anonymous",
                        authorPhoto: testimony.profiles?.profile_photo_url,
                        reactionCounts,
                        commentCount: commentsResult.count || 0,
                        userReactions,
                        linkedPrayer: testimony.prayer_requests,
                    };
                })
            );

            setTestimonials(testimonialsWithCounts);
        } catch (error) {
            console.error("Error fetching preview testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const navigateToPosts = () => {
        navigation.navigate('Post');
    };

    const handleToggleReaction = async (testimonyId, reactionType) => {
        if (!testimonyId || !reactionType || !user?.id) return;

        const testimony = testimonials.find((t) => t.id === testimonyId);
        if (!testimony) return;

        const hasReacted = testimony.userReactions.has(reactionType);
        const previousState = testimonials;

        // Optimistic update
        setTestimonials((prev) =>
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
            setTestimonials(previousState);
            Alert.alert("Error", "Could not update reaction.");
        }
    };

    const handleOpenComments = (testimony) => {
        setSelectedTestimony(testimony);
        setShowCommentsModal(true);
        fetchComments(testimony.id);
    };

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const fetchComments = async (testimonyId) => {
        setLoadingComments(true);
        setCommentError("");

        try {
            if (!testimonyId) {
                throw new Error("Invalid testimony ID");
            }

            const { data, error } = await supabase
                .from("testimony_comments")
                .select(`
                    id,
                    comment_text,
                    created_at,
                    user_id,
                    profiles:user_id (
                        display_name
                    )
                `)
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
            setTestimonials(testimonials.map((t) =>
                t.id === selectedTestimony.id
                    ? { ...t, commentCount: t.commentCount + 1 }
                    : t
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
                {/* Updated loading indicator color to match new amber scheme */}
                <ActivityIndicator color="#B45309" />
            </View>
        );
    }

    return (
        <>
            <View className="mb-0 mt-8">
                {/* Updated Header: Using Prayer Wall's clean Stone/Amber design */}
                <View className="flex-row items-center justify-between mb-6 px-[12px]">
                    {/* Left: Title & Subtitle */}
                    <View>
                        <Text className="text-[22px] font-lexend-semibold tracking-[-0.5px] text-gray-900">
                            Testimony Wall
                        </Text>
                        <Text className="text-[12px] font-lexend mt-1 text-gray-500">
                            Stories of faith & gratitude
                        </Text>
                    </View>

                    {/* Right: "Add Story" styled like the 'ADD PRAYER' button */}
                    <Pressable
                        onPress={navigateToPosts}
                        className="active:opacity-70"
                    >
                        <View className="flex-row items-center gap-1.5 px-3.5 py-3 rounded-full border bg-amber-50 border-amber-200">
                            <HugeiconsIcon icon={PlusSignIcon} size={14} color="#B45309" strokeWidth={2.5} />
                            <Text className="text-[11px] font-lexend-semibold uppercase tracking-wider text-amber-700">
                                ADD STORY
                            </Text>
                        </View>
                    </Pressable>
                </View>

                {/* Testimonials List */}
                <View className="px-0">
                    {testimonials.length === 0 ? (
                        <View className="items-center py-12 bg-white rounded-[24px] border border-stone-200 border-dashed mx-1">
                            <Text className="text-3xl mb-3 opacity-50">✨</Text>
                            <Text className="text-stone-400 font-lexend text-sm">No testimonials yet</Text>
                        </View>
                    ) : (
                        testimonials.map((item) => (
                            <SingleTestimonialCard
                                key={item.id}
                                testimony={item}
                                onToggleReaction={handleToggleReaction}
                                onOpenComments={handleOpenComments}
                            />
                        ))
                    )}
                </View>

                {/* See More Button - Using neutral Stone/Indigo accents */}
                {testimonials.length > 0 && (
                    <Pressable
                        onPress={navigateToPosts}
                        className="flex-row items-center justify-center mt-2 py-3 active:opacity-60"
                    >
                        <Text className="text-stone-500 font-lexend-medium text-[13px] mr-1">
                            See all stories
                        </Text>
                        <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={1.5} size={16} color="#78716c" />
                    </Pressable>
                )}
            </View>

            {/* Comments Modal - Using Prayer Wall's clean modal structure (Stone/Amber accents) */}
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
                                    Encouragement
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    className="text-[12px] font-lexend text-stone-400 mt-0.5"
                                >
                                    {selectedTestimony?.title}
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
                                        {/* Simple Avatar */}
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

                        {/* Input Area */}
                        <View className="p-4 border-t border-stone-100 pb-8 bg-white">
                            {commentError ? (
                                <Text className="text-red-500 text-[11px] mb-2 font-lexend">{commentError}</Text>
                            ) : null}

                            <View className="flex-row gap-2 items-center">
                                <TextInput
                                    value={commentText}
                                    onChangeText={handleCommentTextChange}
                                    placeholder="Share your encouragement..."
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

export default React.memo(HomePageTestimonialPreview);