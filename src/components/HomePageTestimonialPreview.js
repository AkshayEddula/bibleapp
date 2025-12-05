import { ArrowRight02Icon, Cancel01Icon, PlusSignIcon, Sent02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
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
                <ActivityIndicator color="#F9C846" />
            </View>
        );
    }

    return (
        <>
            <View className="mb-4 mt-4">
                {/* Premium Header */}
                <View className="px-0 mb-4">
                    <LinearGradient
                        colors={["#ffffff", "#fbfaf5", "#ffffff"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            borderRadius: 18,
                            padding: 20,
                            flexDirection: "row",
                            alignItems: "center",
                            borderColor: "#f1e8d1",
                            borderWidth: 0.8,
                            justifyContent: "space-between",
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                        }}
                    >
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                <Text className="text-2xl">✨</Text>
                                <Text className="text-xl font-lexend-bold text-gray-900">
                                    Testimonials
                                </Text>
                            </View>
                            <Text className="text-xs font-lexend text-gray-600">
                                Stories of faith & gratitude
                            </Text>
                        </View>

                        <Pressable
                            onPress={navigateToPosts}
                            className="active:scale-95"
                        >
                            <View
                                style={{
                                    backgroundColor: "#ffffff",
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 50,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    shadowColor: "#ea580c",
                                    shadowOpacity: 0.15,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowRadius: 6,
                                    elevation: 2,
                                }}
                            >
                                <HugeiconsIcon icon={PlusSignIcon} size={18} color="#ea580c" strokeWidth={2.5} />
                                <Text className="text-orange-600 font-lexend-semibold text-xs">
                                    Add Story
                                </Text>
                            </View>
                        </Pressable>
                    </LinearGradient>
                </View>

                {/* Testimonials List */}
                <View className="px-0">
                    {testimonials.length === 0 ? (
                        <View className="items-center py-8">
                            <Text className="text-2xl mb-2">✨</Text>
                            <Text className="text-gray-500 font-lexend-light text-sm">No testimonials yet</Text>
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

                {/* See More Button */}
                {testimonials.length > 0 && (
                    <Pressable
                        onPress={navigateToPosts}
                        className="flex-row items-center justify-center mt-0 py-2 active:opacity-60"
                    >
                        <Text className="text-indigo-600 font-lexend-medium text-sm mr-1">
                            See all testimonials
                        </Text>
                        <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} size={18} color="#4f46e5" />
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
                        <View className="px-6 py-4 border-b border-stone-200">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-lg font-lexend-semibold text-gray-800">
                                    Comments
                                </Text>
                                <Pressable
                                    onPress={() => setShowCommentsModal(false)}
                                    className="w-8 h-8 items-center justify-center active:opacity-60"
                                >
                                    <HugeiconsIcon pointerEvents="none" icon={Cancel01Icon} size={20} color="#57534e" strokeWidth={2} />
                                </Pressable>
                            </View>
                            <Text className="text-sm font-lexend-light text-gray-600">
                                {selectedTestimony?.title}
                            </Text>
                        </View>

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
                                                colors={["#f59e0b", "#ea580c"]}
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

                        <View className="px-6 py-4 border-t border-stone-200 bg-white">
                            {commentError ? (
                                <View className="mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
                                    <Text className="text-red-600 font-lexend-medium text-xs">
                                        {commentError}
                                    </Text>
                                </View>
                            ) : null}

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
                                        colors={["#f59e0b", "#ea580c"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 100,
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
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default React.memo(HomePageTestimonialPreview);
