import { ArrowLeft02Icon, Bookmark02Icon, BubbleChatIcon, Cancel01Icon, FavouriteIcon, LockIcon, Sent02Icon, SentIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { supabase } from "../lib/supabase";
import { images } from "../utils";

const { width, height } = Dimensions.get("window");

const DAILY_FREE_LIMIT = 5;

export default function ReelsViewer({
    visible,
    onClose,
    initialIndex = 0,
    verses = [],
    likedVerses = new Set(),
    savedVerses = new Set(),
    onInteraction,
    onViewVerse, // New prop for view recording
    loading = false,
    navigation
}) {
    // const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const { user } = useAuth();
    const { isPremium } = useSubscription();

    // Track viewed verses in this session to prevent duplicate view recording
    const [viewedVerses, setViewedVerses] = useState(new Set());

    // Daily Limit State
    const [unlockedVerses, setUnlockedVerses] = useState(new Set());
    const [dailyLimitReached, setDailyLimitReached] = useState(false);

    // Comment State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [sendingComment, setSendingComment] = useState(false);
    const [activeVerseId, setActiveVerseId] = useState(null);

    // Loading state management - completely self-contained
    const [isInternalLoading, setIsInternalLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [prevVersesLength, setPrevVersesLength] = useState(verses.length);

    // Load unlocked verses for today
    useEffect(() => {
        if (visible) {
            loadUnlockedVerses();
        }
    }, [visible]);

    const loadUnlockedVerses = async () => {
        if (isPremium) return; // No limit for premium

        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `reels_unlocked_${today}`;
            const stored = await AsyncStorage.getItem(key);

            if (stored) {
                const parsed = JSON.parse(stored);
                setUnlockedVerses(new Set(parsed));
                if (parsed.length >= DAILY_FREE_LIMIT) {
                    setDailyLimitReached(true);
                }
            } else {
                // New day, reset
                setUnlockedVerses(new Set());
                setDailyLimitReached(false);
            }
        } catch (error) {
            console.error("Error loading unlocked verses:", error);
        }
    };

    const unlockVerse = async (verseId) => {
        if (isPremium) return; // Always unlocked
        if (unlockedVerses.has(verseId)) return; // Already unlocked

        if (unlockedVerses.size >= DAILY_FREE_LIMIT) {
            setDailyLimitReached(true);
            return;
        }

        try {
            const newSet = new Set(unlockedVerses);
            newSet.add(verseId);
            setUnlockedVerses(newSet);

            if (newSet.size >= DAILY_FREE_LIMIT) {
                setDailyLimitReached(true);
            }

            const today = new Date().toISOString().split('T')[0];
            const key = `reels_unlocked_${today}`;
            await AsyncStorage.setItem(key, JSON.stringify([...newSet]));
            console.log(`Unlocked verse ${verseId}. Total unlocked today: ${newSet.size}`);
        } catch (error) {
            console.error("Error unlocking verse:", error);
        }
    };

    // When modal opens, start loading
    useEffect(() => {
        if (visible) {
            // Modal just opened
            if (verses.length === 0) {
                // Empty verses means we're loading
                setIsInternalLoading(true);
                setHasLoadedOnce(false);
            } else {
                // We have verses, not loading
                setIsInternalLoading(false);
                setHasLoadedOnce(true);
            }
        } else {
            // Modal closed, reset
            setIsInternalLoading(false);
            setHasLoadedOnce(false);
            setViewedVerses(new Set()); // Clear viewed verses for next session
        }
    }, [visible]);

    // Detect when verses are cleared (going from >0 to 0) while modal is open
    useEffect(() => {
        if (visible) {
            if (prevVersesLength > 0 && verses.length === 0) {
                // Verses were cleared - we're loading new content
                setIsInternalLoading(true);
                setHasLoadedOnce(false);
            } else if (verses.length > 0) {
                // Data arrived, stop loading
                setIsInternalLoading(false);
                setHasLoadedOnce(true);
            }
            setPrevVersesLength(verses.length);
        }
    }, [visible, verses.length, prevVersesLength]);

    // Sync with loading prop if provided
    useEffect(() => {
        if (visible && loading !== undefined) {
            setIsInternalLoading(loading);
        }
    }, [visible, loading]);

    // Scroll to initial index when opening
    useEffect(() => {
        if (visible && flatListRef.current && verses.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: initialIndex,
                    animated: false,
                });
            }, 100);
        }
    }, [visible, initialIndex]);

    // Use useCallback instead of useRef to ensure we have access to latest state
    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        console.log('🔍 onViewableItemsChanged triggered, viewable items:', viewableItems.length);

        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            setCurrentIndex(index);
            if (verses[index]) {
                const verseId = verses[index].id;
                setActiveVerseId(verseId);

                // Attempt to unlock logic
                unlockVerse(verseId);

                // Only record view interaction if technically "unlocked" or premium
                // (Optional: currently we enforce limit by overlay, so maybe we allow recording view behind overlay? 
                //  Better to only record if visible. If locked, user can't "see" it properly.)
                const isLocked = !isPremium && !unlockedVerses.has(verseId) && unlockedVerses.size >= DAILY_FREE_LIMIT;

                if (!isLocked) {
                    // Record view if this verse hasn't been viewed in this session
                    if (onViewVerse && !viewedVerses.has(verseId)) {
                        console.log('📊 Recording view for verse:', verseId);
                        setViewedVerses(prev => new Set(prev).add(verseId));
                        onViewVerse(verseId);
                    }
                }
            }
        }
    }, [verses, viewedVerses, onViewVerse, isPremium, unlockedVerses]);

    // Record view for initial verse when verses are loaded
    useEffect(() => {
        if (visible && verses.length > 0 && initialIndex >= 0 && initialIndex < verses.length) {
            const initialVerse = verses[initialIndex];
            // Try unlock initial
            unlockVerse(initialVerse.id);

            if (initialVerse && onViewVerse && !viewedVerses.has(initialVerse.id)) {
                // Check lock status for initial
                const isLocked = !isPremium && !unlockedVerses.has(initialVerse.id) && unlockedVerses.size >= DAILY_FREE_LIMIT;
                if (!isLocked) {
                    console.log('📊 Recording initial view for verse:', initialVerse.id);
                    setViewedVerses(prev => new Set(prev).add(initialVerse.id));
                    onViewVerse(initialVerse.id);
                }
            }
        }
    }, [visible, verses.length, initialIndex]);

    // Set initial active verse
    useEffect(() => {
        if (visible && verses.length > 0 && activeVerseId === null) {
            setActiveVerseId(verses[initialIndex]?.id);
        }
    }, [visible, verses, initialIndex]);

    // Fetch comments when modal opens
    useEffect(() => {
        if (showComments && activeVerseId) {
            fetchComments(activeVerseId);
        }
    }, [showComments, activeVerseId]);

    const fetchComments = async (verseId) => {
        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from("verse_interactions")
                .select(`
                    id,
                    comment,
                    created_at,
                    user_id,
                    profiles:user_id (
                        display_name,
                        email
                    )
                `)
                .eq("verse_id", verseId)
                .eq("interaction_type", "comment")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const formattedComments = data.map((item) => ({
                id: item.id,
                user: item.profiles?.full_name || item.profiles?.email?.split("@")[0] || "Anonymous",
                text: item.comment,
                time: formatTimeAgo(new Date(item.created_at)),
                isCurrentUser: user ? item.user_id === user.id : false,
            }));

            setComments(formattedComments);
        } catch (error) {
            console.error("Error fetching comments:", error);
            Alert.alert("Error", "Could not load comments.");
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !activeVerseId) return;

        setSendingComment(true);
        try {
            const { data, error } = await supabase
                .from("verse_interactions")
                .insert({
                    user_id: user.id,
                    verse_id: activeVerseId,
                    interaction_type: "comment",
                    comment: commentText.trim(),
                })
                .select(`
                    id,
                    comment,
                    created_at,
                    user_id,
                    profiles:user_id (
                        display_name,
                        email
                    )
                `)
                .single();

            if (error) throw error;

            const newComment = {
                id: data.id,
                user: data.profiles?.full_name || data.profiles?.email?.split("@")[0] || "You",
                text: data.comment,
                time: "Just now",
                isCurrentUser: true,
            };

            setComments([newComment, ...comments]);
            setCommentText("");

            // Update parent count if possible (optional, but good for consistency)
            if (onInteraction) {
                // We just pass a dummy 'comment' type to trigger any optimistic updates if needed
                // But typically comments are just viewed in the modal. 
                // To update the count on the main screen, we'd need to increment it manually.
                onInteraction(activeVerseId, 'comment');
            }

        } catch (error) {
            console.error("Error adding comment:", error);
            Alert.alert("Error", "Failed to add comment. Please try again.");
        } finally {
            setSendingComment(false);
        }
    };

    const handleShare = async (verse) => {
        try {
            const result = await Share.share({
                message: `"${verse.content}" - ${verse.book} ${verse.chapter}:${verse.verse}\n\nShared via LumiVerse ✨`,
            });

            if (result.action === Share.sharedAction) {
                if (onInteraction) {
                    onInteraction(verse.id, 'share');
                }
            }
        } catch (error) {
            console.error("Error sharing:", error.message);
            Alert.alert("Error", "Could not share verse.");
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

    const renderItem = ({ item, index }) => {
        const currentVerse = verses[index] || item;
        const counts = currentVerse.verse_interaction_counts || {};
        const isLiked = likedVerses.has(currentVerse.id);
        const isSaved = savedVerses.has(currentVerse.id);

        // Check if locked
        // Locked if NOT premium AND limit reached AND not in unlocked set
        // (Note: we use useSubscription hook above for isPremium)
        const isLocked = !isPremium && !unlockedVerses.has(currentVerse.id) && unlockedVerses.size >= DAILY_FREE_LIMIT;

        return (
            <View style={{ width, height, backgroundColor: "black" }}>
                {/* Background Image (Blurred) */}
                <View className="absolute inset-0">
                    <Image
                        source={images.J1}
                        className="w-full h-full"
                        resizeMode="cover"
                        blurRadius={isLocked ? 30 : 10}
                    />
                    {/* Dark Overlay for readability */}
                    <View className={`absolute inset-0 ${isLocked ? 'bg-black/80' : 'bg-black/40'}`} />
                </View>

                {isLocked ? (
                    // LOCKED STATE OVERLAY
                    <View className="flex-1 items-center justify-center px-8 z-50">
                        <View className="mb-6 w-20 h-20 bg-white/10 rounded-full items-center justify-center border border-white/20">
                            <HugeiconsIcon icon={LockIcon} size={40} color="white" />
                        </View>
                        <Text className="text-white font-lexend-bold text-2xl text-center mb-2">
                            Daily Limit Reached
                        </Text>
                        <Text className="text-white/70 font-lexend-light text-center text-lg mb-8 leading-6">
                            You've viewed your 5 free verses for today. Upgrade to Premium for unlimited access.
                        </Text>

                        <Pressable
                            className="bg-white w-full py-4 rounded-xl mb-4 active:scale-95 transition-all"
                            onPress={() => {
                                onClose();
                                navigation.navigate('Paywall');
                            }}
                        >
                            <Text className="text-black text-center font-lexend-bold text-lg">
                                Upgrade to Premium
                            </Text>
                        </Pressable>

                        <Pressable
                            className="py-2"
                            onPress={onClose}
                        >
                            <Text className="text-white/60 font-lexend-medium">
                                Maybe Later
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    // UNLOCKED CONTENT
                    <>
                        <View
                            className="flex-1 justify-center px-8"
                            style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 80 }}
                        >
                            <Text className="text-white font-lexend-bold text-3xl text-center leading-10 mb-6">
                                "{currentVerse.content}"
                            </Text>
                            <Text className="text-white/80 font-lexend-medium text-xl text-center mb-8">
                                {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
                            </Text>

                            {/* Meaning / Context */}
                            {currentVerse.meaning && (
                                <View className="bg-white/10 p-4 rounded-xl border border-white/10">
                                    <Text className="text-white/90 font-lexend-light text-sm text-center leading-5">
                                        {currentVerse.meaning}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Right Side Actions */}
                        <View
                            className="absolute flex-row right-10 left-10 bottom-8 items-center gap-12"
                            style={{ paddingBottom: insets.bottom }}
                        >
                            {/* View Count - Display Only, Not Clickable */}
                            <View className="items-center gap-1">
                                <HugeiconsIcon
                                    icon={ViewIcon}
                                    size={30}
                                    color="white"
                                    fill="transparent"
                                    strokeWidth={1.5}
                                />
                                <Text className="text-white text-xs font-lexend-medium">{counts.view_count || 0}</Text>
                            </View>

                            {/* Like Button */}
                            <Pressable
                                className="items-center gap-1"
                                hitSlop={10}
                                onPress={() => onInteraction && onInteraction(currentVerse.id, 'like')}
                            >
                                <HugeiconsIcon
                                    icon={FavouriteIcon}
                                    size={30}
                                    color={isLiked ? "#ef4444" : "white"}
                                    fill={isLiked ? "#ef4444" : "transparent"}
                                    strokeWidth={1.5}
                                    pointerEvents="none"
                                />
                                <Text className="text-white text-xs font-lexend-medium">{counts.like_count || 0}</Text>
                            </Pressable>

                            {/* Comment Button */}
                            <Pressable
                                className="items-center gap-1"
                                hitSlop={10}
                                onPress={() => {
                                    setActiveVerseId(currentVerse.id);
                                    setShowComments(true);
                                }}
                            >
                                <HugeiconsIcon icon={BubbleChatIcon} size={30} color="white" strokeWidth={1.5} pointerEvents="none" />
                                <Text className="text-white text-xs font-lexend-medium">{counts.comment_count || 0}</Text>
                            </Pressable>

                            {/* Save Button */}
                            <Pressable
                                className="items-center gap-1"
                                hitSlop={10}
                                onPress={() => onInteraction && onInteraction(currentVerse.id, 'save')}
                            >
                                <HugeiconsIcon
                                    icon={Bookmark02Icon}
                                    size={30}
                                    color={isSaved ? "#eab308" : "white"}
                                    fill={isSaved ? "#eab308" : "transparent"}
                                    strokeWidth={1.5}
                                    pointerEvents="none"
                                />
                                <Text className="text-white text-xs font-lexend-medium">{counts.save_count || 0}</Text>
                            </Pressable>

                            {/* Share Button */}
                            <Pressable
                                className="items-center gap-1"
                                hitSlop={10}
                                onPress={() => handleShare(currentVerse)}
                            >
                                <HugeiconsIcon icon={SentIcon} size={30} color="white" strokeWidth={1.5} pointerEvents="none" />
                                <Text className="text-white text-xs font-lexend-medium">{counts.share_count || 0}</Text>
                            </Pressable>
                        </View>
                    </>
                )}
            </View>
        );
    };

    if (!visible) return null;

    // Determine effective loading state
    const isLoading = loading || isInternalLoading;
    const isEmpty = !isLoading && verses.length === 0;

    // Debug logging
    console.log('ReelsViewer render:', {
        loading,
        isInternalLoading,
        isLoading,
        isEmpty,
        versesLength: verses.length,
        isPremium,
        unlockedCount: unlockedVerses.size,
        limitReached: dailyLimitReached
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black">
                <StatusBar barStyle="light-content" />

                {/* Content Logic */}
                {isLoading ? (
                    // Loading State
                    <View className="flex-1 items-center justify-center bg-black">
                        <Image
                            source={images.J1}
                            className="absolute w-full h-full"
                            resizeMode="cover"
                            blurRadius={20}
                        />
                        <View className="absolute inset-0 bg-black/70" />

                        <View className="items-center z-10">
                            <ActivityIndicator size="large" color="#F9C846" />
                            <Text className="text-white font-lexend-medium text-lg mt-4">
                                Loading verses...
                            </Text>
                        </View>
                    </View>
                ) : isEmpty ? (
                    // Empty State
                    <View className="flex-1 items-center justify-center bg-black">
                        <Image
                            source={images.J1}
                            className="absolute w-full h-full"
                            resizeMode="cover"
                            blurRadius={20}
                        />
                        <View className="absolute inset-0 bg-black/80" />

                        <View className="items-center z-10 px-10">
                            <Text className="text-4xl mb-4">🔍</Text>
                            <Text className="text-white font-lexend-bold text-xl text-center mb-2">
                                No Verses Found
                            </Text>
                            <Text className="text-white/60 font-lexend-light text-center leading-5">
                                We couldn't find any verses for this selection. Try exploring other books or chapters.
                            </Text>
                        </View>
                    </View>
                ) : (
                    // Content State
                    <FlatList
                        ref={flatListRef}
                        data={verses}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        pagingEnabled
                        vertical
                        showsVerticalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                        getItemLayout={(data, index) => ({
                            length: height,
                            offset: height * index,
                            index,
                        })}
                    />
                )}

                {/* Back Button - Moved after FlatList to ensure z-index priority */}
                <Pressable
                    onPress={onClose}
                    className="absolute left-4 p-2 bg-black/40 rounded-full"
                    style={{ top: insets.top + 10, zIndex: 100 }}
                    hitSlop={20}
                >
                    <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="white" pointerEvents="none" />
                </Pressable>

                {/* Comments Modal */}
                <Modal
                    visible={showComments}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowComments(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1 bg-black/60 justify-end"
                    >
                        <View className="bg-white rounded-t-[32px] h-[70%] overflow-hidden shadow-2xl">
                            {/* Modal Header */}
                            <View className="px-6 py-4 border-b border-gray-100 flex-row justify-between items-center">
                                <Text className="text-lg font-lexend-bold text-gray-900">Comments</Text>
                                <Pressable onPress={() => setShowComments(false)} className="p-2">
                                    <HugeiconsIcon icon={Cancel01Icon} size={24} color="black" pointerEvents="none" />
                                </Pressable>
                            </View>

                            {/* Comments List */}
                            <ScrollView className="flex-1 px-6">
                                {loadingComments ? (
                                    <View className="py-10">
                                        <ActivityIndicator color="#F9C846" />
                                    </View>
                                ) : comments.length === 0 ? (
                                    <View className="py-10 items-center">
                                        <Text className="text-4xl mb-2">💬</Text>
                                        <Text className="text-gray-500 font-lexend-medium">No comments yet</Text>
                                        <Text className="text-gray-400 text-sm mt-1">Start the conversation!</Text>
                                    </View>
                                ) : (
                                    comments.map((comment) => (
                                        <View key={comment.id} className="py-4 border-b border-gray-50">
                                            <View className="flex-row gap-3">
                                                <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center">
                                                    <Text className="text-indigo-600 font-bold text-xs">
                                                        {comment.user[0].toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <View className="flex-row items-center gap-2 mb-1">
                                                        <Text className="font-lexend-medium text-gray-900 text-sm">
                                                            {comment.user}
                                                        </Text>
                                                        <Text className="text-gray-400 text-xs">{comment.time}</Text>
                                                    </View>
                                                    <Text className="text-gray-600 font-lexend-light leading-5">
                                                        {comment.text}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>

                            {/* Input Area */}
                            <View className="p-4 border-t border-gray-100 bg-white pb-8">
                                <View className="flex-row items-center gap-3">
                                    <TextInput
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        placeholder="Add a comment..."
                                        className="flex-1 bg-gray-100 rounded-full px-4 py-3 font-lexend-medium text-gray-900"
                                        placeholderTextColor="#9ca3af"
                                    />
                                    <Pressable
                                        onPress={handleAddComment}
                                        disabled={!commentText.trim() || sendingComment}
                                        className={`w-10 h-10 rounded-full items-center justify-center ${commentText.trim() ? "bg-indigo-600" : "bg-gray-200"
                                            }`}
                                    >
                                        {sendingComment ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <HugeiconsIcon icon={Sent02Icon} size={18} color="white" pointerEvents="none" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </Modal>
    );
}
