import { PlayCircle02Icon, QuoteUpIcon, Video01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    View,
    useColorScheme
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import { supabase } from "../lib/supabase";
import { images } from "../utils";
import ReelsViewer from "./ReelsViewer";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.6;
const CARD_HEIGHT = 340;

const VerseReelsPreview = ({ navigation, likedVerses, savedVerses, onInteraction, onViewVerse }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReelsViewer, setShowReelsViewer] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Animation values
    const shimmer = useSharedValue(0);
    const bgScale = useSharedValue(1);
    const bgOpacity = useSharedValue(0.3);

    useEffect(() => {
        shimmer.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );

        bgScale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );

        bgOpacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, []);

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        try {
            setLoading(true);
            const { count } = await supabase
                .from("bible_verses")
                .select("*", { count: "exact", head: true });

            const randomOffsets = new Set();
            while (randomOffsets.size < 5 && randomOffsets.size < count) {
                randomOffsets.add(Math.floor(Math.random() * (count || 1)));
            }

            const versePromises = Array.from(randomOffsets).map(offset =>
                supabase
                    .from("bible_verses")
                    .select("*")
                    .range(offset, offset)
                    .limit(1)
                    .single()
            );

            const results = await Promise.all(versePromises);
            const verses = results.filter(r => r.data).map(r => r.data);

            const verseIds = verses.map(v => v.id);
            const { data: countsData } = await supabase
                .from("verse_interaction_counts")
                .select("*")
                .in("verse_id", verseIds);

            const countsMap = (countsData || []).reduce((acc, curr) => {
                acc[curr.verse_id] = curr;
                return acc;
            }, {});

            const versesWithCounts = verses.map(v => ({
                ...v,
                verse_interaction_counts: countsMap[v.id] || {}
            }));

            setReels(versesWithCounts);
        } catch (error) {
            console.error("Error fetching verse reels:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInteraction = async (verseId, type) => {
        setReels(currentReels => currentReels.map(verse => {
            if (verse.id !== verseId) return verse;
            const counts = verse.verse_interaction_counts || {};
            let newCounts = { ...counts };

            if (type === 'like') {
                const isLiked = likedVerses.has(verseId);
                newCounts.like_count = Math.max(0, (newCounts.like_count || 0) + (isLiked ? -1 : 1));
            } else if (type === 'save') {
                const isSaved = savedVerses.has(verseId);
                newCounts.save_count = Math.max(0, (newCounts.save_count || 0) + (isSaved ? -1 : 1));
            } else if (type === 'share') {
                newCounts.share_count = (newCounts.share_count || 0) + 1;
            }

            return { ...verse, verse_interaction_counts: newCounts };
        }));

        if (onInteraction) onInteraction(verseId, type);
    };

    const handleCardPress = (index) => {
        setSelectedIndex(index);
        setShowReelsViewer(true);
    };

    const shimmerStyle = useAnimatedStyle(() => ({
        opacity: shimmer.value * 0.1 + 0.9,
    }));

    const bgAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: bgScale.value }],
        opacity: bgOpacity.value,
    }));

    if (loading) {
        return (
            <View className="mb-8 mt-4">
                <View className="items-center justify-center mb-6">
                    <Text className={`text-2xl font-lexend-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Verse Reels
                    </Text>
                    <View className={`h-1.5 w-16 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 20 }}
                >
                    {[1, 2, 3].map((i) => (
                        <View
                            key={i}
                            style={{
                                width: CARD_WIDTH,
                                height: CARD_HEIGHT,
                            }}
                            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[32px] overflow-hidden`}
                        >
                            <ActivityIndicator
                                className="flex-1 self-center"
                                color={isDark ? "#f59e0b" : "#d97706"}
                            />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <>
            <View className="mb-8 mt-2">
                {/* Centered Header Section */}
                <View className="flex-row items-center justify-between mb-6 px-[28px]">
                    {/* Left */}
                    <View>
                        <Text className={`text-[22px] font-lexend-semibold tracking-[-0.5px] 
      ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Verse Reels
                        </Text>

                        <Text className={`text-[12px] font-lexend mt-1 
      ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Divine wisdom • Short video verses
                        </Text>
                    </View>

                    {/* Right Badge */}
                    <View className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border 
      ${isDark ?
                            'bg-amber-500/10 border-amber-500/40' :
                            'bg-amber-50 border-amber-200'
                        }`}>
                        <View className={`w-1.5 h-1.5 rounded-full 
      ${isDark ? 'bg-amber-400' : 'bg-amber-700'}`} />
                        <Text className={`text-[11px] font-lexend-semibold uppercase tracking-wider
      ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                            {reels.length} NEW
                        </Text>
                    </View>
                </View>


                {/* Cards Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 20 }}
                    decelerationRate="fast"
                    snapToInterval={CARD_WIDTH + 20}
                >
                    {reels.map((verse, index) => (
                        <Pressable
                            key={`${verse.id}-${index}`}
                            onPress={() => handleCardPress(index)}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.95 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            })}
                        >
                            <Animated.View style={shimmerStyle}>
                                <View
                                    style={{
                                        width: CARD_WIDTH,
                                        height: CARD_HEIGHT,
                                        borderRadius: 32,
                                        overflow: "hidden",
                                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: isDark ? 0.4 : 0.1,
                                        shadowRadius: 16,
                                        elevation: 8,
                                        // Cleaner border integration
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                                    }}
                                >
                                    {/* Background Layer */}
                                    <Animated.Image
                                        source={images.J1}
                                        style={[
                                            {
                                                position: "absolute",
                                                width: "120%",
                                                height: "120%",
                                                left: "-10%",
                                                top: "-10%",
                                            },
                                            bgAnimatedStyle
                                        ]}
                                        resizeMode="cover"
                                        blurRadius={12}
                                    />

                                    {/* Gradients */}
                                    <LinearGradient
                                        colors={isDark
                                            ? ["rgba(0,0,0,0.2)", "rgba(0,0,0,0.5)", "#000000"]
                                            : ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.7)", "#FFFFFF"]
                                        }
                                        locations={[0, 0.65, 1]}
                                        style={{ position: "absolute", inset: 0 }}
                                    />

                                    {/* Content Container */}
                                    <View className="flex-1 p-5 relative justify-between">

                                        {/* Smaller Watermark Icon */}
                                        <View className="absolute top-6 left-5 opacity-[0.08]">
                                            <HugeiconsIcon
                                                icon={QuoteUpIcon}
                                                size={42}
                                                color={isDark ? "white" : "black"}
                                                variant="solid"
                                            />
                                        </View>

                                        {/* Top: Video Indicator Pill */}
                                        <View className="flex-row justify-end">
                                            <View className={`px-2.5 py-1 rounded-full backdrop-blur-md flex-row items-center gap-1.5 ${isDark ? 'bg-white/10' : 'bg-black/5'
                                                }`}>
                                                <HugeiconsIcon
                                                    icon={Video01Icon}
                                                    size={12}
                                                    color={isDark ? "white" : "#374151"}
                                                    variant="solid"
                                                />
                                                <Text className={`text-[10px] font-lexend-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                                    Reel
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Middle: Verse Text */}
                                        <View className="flex-1 justify-center py-2 pl-1">
                                            <Text
                                                className={`font-lexend-semibold text-[18px] leading-[26px] tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-800'
                                                    }`}
                                                numberOfLines={6}
                                                style={{ textShadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'transparent', textShadowRadius: 3 }}
                                            >
                                                {verse.content}
                                            </Text>
                                        </View>

                                        {/* Bottom: Clean Reference & Action */}
                                        <View className="flex-row items-center justify-between mt-2 pt-2">
                                            <View className="flex-1">
                                                <Text
                                                    className={`text-[10px] font-lexend-bold uppercase tracking-widest mb-0.5 ${isDark ? 'text-amber-500' : 'text-amber-600'
                                                        }`}
                                                >
                                                    Scripture
                                                </Text>
                                                <Text className={`text-sm font-lexend-bold ${isDark ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>
                                                    {verse.book} {verse.chapter}:{verse.verse}
                                                </Text>
                                            </View>

                                            <View
                                                style={{
                                                    shadowColor: "#f59e0b",
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 8,
                                                }}
                                            >
                                                <LinearGradient
                                                    colors={["#f59e0b", "#d97706"]}
                                                    style={{ padding: 10, borderRadius: 99 }}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                >
                                                    <HugeiconsIcon
                                                        icon={PlayCircle02Icon}
                                                        size={22}
                                                        color="white"
                                                        variant="solid"
                                                    />
                                                </LinearGradient>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            <ReelsViewer
                visible={showReelsViewer}
                onClose={() => setShowReelsViewer(false)}
                verses={reels}
                initialIndex={selectedIndex}
                likedVerses={likedVerses}
                savedVerses={savedVerses}
                onInteraction={handleInteraction}
                onViewVerse={onViewVerse}
            />
        </>
    );
};

export default React.memo(VerseReelsPreview);