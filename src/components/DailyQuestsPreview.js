import { ArrowRight01Icon, CheckmarkCircle02Icon, CircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Pressable,
    Text,
    View,
    useColorScheme
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { images } from "../utils";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 100; // Slightly reduced height for vertical stacking

const DailyQuestsPreview = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Animation values
    const shimmer = useSharedValue(0);
    const bgScale = useSharedValue(1);
    const bgOpacity = useSharedValue(0.3);

    useEffect(() => {
        shimmer.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 2000 })
            ),
            -1,
            false
        );

        bgScale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 8000 }),
                withTiming(1, { duration: 8000 })
            ),
            -1,
            false
        );

        bgOpacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 3000 }),
                withTiming(0.3, { duration: 3000 })
            ),
            -1,
            false
        );
    }, []);

    useEffect(() => {
        if (user) {
            fetchDailyQuests();
        }
    }, [user]);

    const fetchDailyQuests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_user_quests', {
                p_user_id: user.id
            });

            if (error) throw error;

            if (data) {
                // Filter for daily quests only and deduplicate
                const uniqueQuests = Object.values(
                    data.reduce((acc, curr) => {
                        if (!acc[curr.id]) acc[curr.id] = curr;
                        return acc;
                    }, {})
                ).filter(q => q.quest_type === 'daily');

                // Sort: Incomplete first
                uniqueQuests.sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1));

                setQuests(uniqueQuests);
            }
        } catch (error) {
            console.error("Error fetching daily quests:", error);
        } finally {
            setLoading(false);
        }
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
            <View className="mx-6 mb-4 mt-4">
                <View
                    style={{
                        shadowColor: isDark ? "#000" : "#d1d5db",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0.2 : 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                    }}
                    className={`rounded-3xl border ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200/60'
                        } p-5`}
                >
                    <View className="mb-6">
                        <Text className={`text-2xl font-lexend-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            Daily Quests
                        </Text>
                        <View className={`h-2 w-1/3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </View>
                    <View className="gap-4">
                        {[1, 2, 3].map((i) => (
                            <View
                                key={i}
                                style={{ height: CARD_HEIGHT }}
                                className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl w-full`}
                            />
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    if (quests.length === 0) return null;

    const completedCount = quests.filter(q => q.is_completed).length;
    const totalCount = quests.length;
    const overallProgress = (completedCount / totalCount) * 100;

    return (
        <View className="mx-6 mb-4 mt-4">
            <View
                style={{
                    shadowColor: isDark ? "#000" : "#d1d5db",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                }}
                className={`rounded-[32px] p-1 bg-white ${isDark ? 'bg-[#111827]' : 'bg-white'}`}
            >
                <View className="p-5 pb-2">
                    {/* Improved Header */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className={`text-2xl font-lexend-bold tracking-tight ${isDark ? 'text-gray-50' : 'text-gray-900'}`}>
                                    Daily Quests
                                </Text>
                                <Text className={`text-sm font-lexend mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Complete tasks to earn XP
                                </Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-full border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <Text className={`text-xs font-lexend-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {completedCount}/{totalCount} Done
                                </Text>
                            </View>
                        </View>

                        {/* Header Progress Bar */}
                        <View className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Animated.View
                                style={{
                                    width: `${overallProgress}%`,
                                    height: '100%',
                                    backgroundColor: isDark ? '#F59E0B' : '#d97706',
                                    borderRadius: 99
                                }}
                            />
                        </View>
                    </View>

                    {/* Vertical Quest Cards (Limit 3) */}
                    <View className="gap-4">
                        {quests.slice(0, 3).map((quest) => {
                            const progress = Math.min((quest.progress / quest.requirement_count) * 100, 100);

                            return (
                                <Pressable
                                    key={quest.id}
                                    onPress={() => navigation.navigate('Stats')}
                                    style={({ pressed }) => ({
                                        opacity: pressed ? 0.95 : 1,
                                        transform: [{ scale: pressed ? 0.99 : 1 }],
                                    })}
                                >
                                    <Animated.View style={shimmerStyle}>
                                        <View
                                            style={{
                                                height: CARD_HEIGHT,
                                                borderRadius: 20,
                                                overflow: "hidden",
                                                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                                borderWidth: 1,
                                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            {/* Animated Background */}
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
                                                blurRadius={20}
                                            />

                                            {/* Overlay */}
                                            <LinearGradient
                                                colors={
                                                    isDark
                                                        ? ["rgba(17, 24, 39, 0.8)", "rgba(17, 24, 39, 0.95)"]
                                                        : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.98)"]
                                                }
                                                style={{ position: "absolute", width: "100%", height: "100%" }}
                                            />

                                            {/* Card Content */}
                                            <View className="flex-1 p-4 justify-between flex-row items-center">
                                                {/* Left Side: Text & Progress */}
                                                <View className="flex-1 pr-4">
                                                    <View className="flex-row items-center gap-2 mb-2">
                                                        {quest.is_completed && (
                                                            <View className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`} />
                                                        )}
                                                        <Text
                                                            className={`font-lexend-semibold text-[15px] flex-1 ${isDark
                                                                ? quest.is_completed ? 'text-gray-500 line-through' : 'text-gray-100'
                                                                : quest.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'
                                                                }`}
                                                            numberOfLines={1}
                                                        >
                                                            {quest.title}
                                                        </Text>
                                                    </View>

                                                    <View className="flex-row items-center gap-3">
                                                        <View className={`px-2 py-0.5 rounded-md border ${isDark
                                                            ? 'bg-amber-500/10 border-amber-500/20'
                                                            : 'bg-amber-50 border-amber-200/60'
                                                            }`}>
                                                            <Text className={`text-[10px] font-lexend-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                                                                +{quest.xp_reward} XP
                                                            </Text>
                                                        </View>

                                                        {/* Mini Progress Bar inside card */}
                                                        <View className="flex-1 h-1.5 rounded-full bg-gray-200/50 overflow-hidden dark:bg-gray-700">
                                                            <View
                                                                style={{
                                                                    width: `${progress}%`,
                                                                    height: '100%',
                                                                    backgroundColor: quest.is_completed ? '#22C55E' : '#F59E0B'
                                                                }}
                                                            />
                                                        </View>
                                                        <Text className={`text-[10px] font-lexend ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {quest.progress}/{quest.requirement_count}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Right Side: Icon */}
                                                <View>
                                                    {quest.is_completed ? (
                                                        <HugeiconsIcon
                                                            icon={CheckmarkCircle02Icon}
                                                            size={24}
                                                            color={isDark ? "#4ADE80" : "#22C55E"}
                                                            variant="solid"
                                                        />
                                                    ) : (
                                                        <HugeiconsIcon
                                                            icon={CircleIcon}
                                                            size={24}
                                                            color={isDark ? "#4B5563" : "#9CA3AF"}
                                                        />
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    </Animated.View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Footer - View All Button */}
                <Pressable
                    onPress={() => navigation.navigate('Stats')}
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                    })}
                >
                    <View className={`mx-2 mb-2 p-4 flex-row items-center justify-center rounded-[24px] ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <Text className={`text-sm font-lexend-semibold mr-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            View All Quests
                        </Text>
                        <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={18}
                            color={isDark ? "#D1D5DB" : "#4B5563"}
                        />
                    </View>
                </Pressable>
            </View>
        </View>
    );
};

export default DailyQuestsPreview;