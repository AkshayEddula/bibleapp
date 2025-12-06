import { Cancel01Icon, ChampionIcon, Layers01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function XPModal({ visible, onClose, stats }) {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            slideAnim.setValue(SCREEN_HEIGHT);
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 100,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 8,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const calculateLevelProgress = () => {
        const currentLevel = stats?.current_level || 1;
        const totalXP = stats?.total_xp || 0;

        // Formula: XP required = level^2 * 150
        const nextLevelThreshold = Math.pow(currentLevel + 1, 2) * 150;
        const currentLevelThreshold = Math.pow(currentLevel, 2) * 150;

        const totalRange = nextLevelThreshold - currentLevelThreshold;
        const progressInLevel = totalXP - currentLevelThreshold;

        let percentage = (progressInLevel / totalRange) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        return {
            percentage,
            current: totalXP,
            next: nextLevelThreshold,
            progressInLevel,
            totalRange,
            xpNeeded: Math.floor(totalRange - progressInLevel)
        };
    };

    const levelProgress = calculateLevelProgress();
    const currentLevel = stats?.current_level || 1;

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Overlay */}
            <Animated.View
                style={{ opacity: fadeAnim }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            >
                <Pressable className="flex-1" onPress={onClose} />
            </Animated.View>

            {/* Modal Container */}
            <View className="flex-1 justify-end pointer-events-box-none">
                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        backgroundColor: "#FFFFFF",
                        borderTopLeftRadius: 36,
                        borderTopRightRadius: 36,
                        paddingBottom: 40,
                        overflow: "hidden",
                    }}
                >
                    {/* --- HERO HEADER --- */}
                    <View className="bg-indigo-50/80 pb-8 pt-6 rounded-b-[40px] relative overflow-hidden">

                        {/* Decorative Blobs */}
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200/40 rounded-full blur-3xl" />
                        <View className="absolute top-10 -left-10 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl" />

                        {/* Top Bar */}
                        <View className="flex-row justify-between items-center px-6 mb-4">
                            <View className="bg-white/60 px-3 py-1.5 rounded-full flex-row items-center border border-indigo-100/50">
                                <HugeiconsIcon icon={Layers01Icon} size={12} color="#6366F1" />
                                <Text className="text-indigo-900 font-lexend-bold text-xs ml-1.5 uppercase tracking-wide">
                                    Level Up
                                </Text>
                            </View>

                            <Pressable
                                onPress={onClose}
                                className="bg-white/80 w-8 h-8 items-center justify-center rounded-full border border-gray-100 shadow-sm active:bg-gray-100"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} color="#71717A" pointerEvents="none" />
                            </Pressable>
                        </View>

                        {/* Centerpiece */}
                        <View className="items-center justify-center mt-2">
                            {/* Trophy Container */}
                            <View className="relative mb-4">
                                {/* Glow behind trophy */}
                                <View className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full scale-110" />
                                <LinearGradient
                                    colors={['#818CF8', '#4F46E5']}

                                    style={{
                                        borderRadius: 24, width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center",
                                        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
                                        elevation: 5
                                    }}
                                >
                                    <HugeiconsIcon icon={ChampionIcon} size={42} strokeWidth={1} color="#FFFFFF" fill="#e6e6e6ff" />
                                </LinearGradient>
                            </View>

                            {/* Level Number */}
                            <Text className="text-indigo-950 font-lexend-medium text-[56px] leading-[56px] tracking-[-4px] w-full text-center">
                                Level {currentLevel}
                            </Text>
                            <Text className="text-indigo-400 font-lexend-medium text-sm mt-1">
                                Master of Consistency
                            </Text>
                        </View>
                    </View>

                    {/* --- BODY CONTENT --- */}
                    <View className="px-6 -mt-6">
                        {/* Progress Card */}
                        <View className="bg-white rounded-3xl p-5 shadow-lg shadow-indigo-100/50 border border-indigo-50">
                            <View className="flex-row justify-between items-end mb-3">
                                <Text className="text-gray-500 font-lexend-bold text-xs uppercase tracking-wider">
                                    XP Progress
                                </Text>
                                <Text className="text-indigo-600 font-lexend-bold text-lg">
                                    {Math.floor(levelProgress.percentage)}%
                                </Text>
                            </View>

                            {/* Bar Track */}
                            <View className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                                <LinearGradient
                                    colors={["#818CF8", "#4F46E5"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        width: `${levelProgress.percentage}%`,
                                        height: "100%",
                                        borderRadius: 100,
                                    }}
                                />
                            </View>

                            <View className="mt-3 flex-row justify-between items-center">
                                <Text className="text-gray-400 font-lexend-medium text-xs">
                                    Current
                                </Text>
                                <Text className="text-gray-800 font-lexend-semibold text-xs">
                                    <Text className="text-indigo-600">{levelProgress.xpNeeded.toLocaleString()}</Text> XP to Level {currentLevel + 1}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View className="flex-row gap-4 mt-6">
                            {/* Total XP Card */}
                            <View className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 items-start">
                                <View className="bg-amber-100 p-1.5 rounded-lg mb-2">
                                    <HugeiconsIcon icon={SparklesIcon} size={16} color="#D97706" fill="#D97706" />
                                </View>
                                <Text className="text-[20px] font-lexend-bold text-gray-900">
                                    {stats.total_xp?.toLocaleString()}
                                </Text>
                                <Text className="text-xs font-lexend-medium text-gray-400">
                                    Total XP Earned
                                </Text>
                            </View>

                            {/* Next Level Target Card */}
                            <View className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 items-start">
                                <View className="bg-indigo-100 p-1.5 rounded-lg mb-2">
                                    <HugeiconsIcon icon={Layers01Icon} size={16} color="#4F46E5" />
                                </View>
                                <Text className="text-[20px] font-lexend-bold text-gray-900">
                                    {levelProgress.next?.toLocaleString()}
                                </Text>
                                <Text className="text-xs font-lexend-medium text-gray-400">
                                    Next Milestone
                                </Text>
                            </View>
                        </View>

                        {/* Footer Button */}
                        <View className="mt-8">
                            <Pressable
                                onPress={onClose}
                                className="w-full active:scale-[0.98] transition-transform"
                            >
                                <LinearGradient
                                    colors={["#4F46E5", "#3730A3"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ borderRadius: 20, paddingVertical: 18, width: "100%", alignItems: 'center' }}
                                >
                                    <Text className="text-white font-lexend-bold text-lg tracking-wide">
                                        Keep Going!
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}