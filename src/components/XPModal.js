import { LinearGradient } from "expo-linear-gradient";
import { Trophy, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function XPModal({ visible, onClose, stats }) {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            slideAnim.setValue(SCREEN_HEIGHT);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 90,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
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
            totalRange
        };
    };

    const levelProgress = calculateLevelProgress();

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end",
                }}
            >
                <Pressable style={{ position: "absolute", inset: 0 }} onPress={onClose} />

                <Animated.View
                    style={{
                        width: "100%",
                        backgroundColor: "white",
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                        transform: [{ translateY: slideAnim }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 16,
                        elevation: 20,
                        paddingBottom: 40, // Safe area padding
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={["#E0E7FF", "#C7D2FE"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 24, alignItems: "center", position: "relative", overflow: 'visible' }}
                    >
                        <Pressable
                            onPress={onClose}
                            className="absolute top-4 right-4 bg-white/20 p-2 rounded-full z-10"
                        >
                            <X size={20} color="#fff" pointerEvents="none" />
                        </Pressable>

                        <View className="flex-row items-center gap-4 mb-2 z-10">
                            {/* Trophy Icon */}
                            <View className="relative">
                                <View className="absolute inset-0 bg-white/30 blur-md rounded-full" />
                                <View className="w-20 h-20 rounded-full bg-indigo-500 items-center justify-center border-4 border-white/30">
                                    <Trophy size={40} color="#fff" fill="#fff" />
                                </View>
                            </View>

                            <View>
                                <Text className="text-indigo-900 font-lexend-bold text-[48px] leading-[48px] shadow-sm">
                                    {stats?.current_level || 1}
                                </Text>
                                <Text className="text-indigo-800 font-lexend-medium text-[14px] opacity-90 uppercase tracking-widest shadow-sm">
                                    Current Level
                                </Text>
                            </View>
                        </View>

                        {/* Background decorative elements */}
                        <View className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />
                        <View className="absolute top-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-xl" />
                    </LinearGradient>

                    <View className="p-6">
                        {/* Level Progress */}
                        <Text className="text-gray-800 font-lexend-bold text-[18px] mb-4">
                            Level Progress
                        </Text>

                        <View className="bg-stone-50 rounded-2xl p-5 mb-6 border border-stone-200">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-[13px] font-lexend-medium text-gray-600">
                                    Progress to Level {(stats?.current_level || 1) + 1}
                                </Text>
                                <Text className="text-[13px] font-lexend-bold text-indigo-600">
                                    {Math.floor(levelProgress.percentage)}%
                                </Text>
                            </View>

                            <View className="h-4 bg-white rounded-full overflow-hidden border border-stone-200 mb-2">
                                <LinearGradient
                                    colors={["#8B5CF6", "#6366F1"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        width: `${levelProgress.percentage}%`,
                                        height: "100%",
                                        borderRadius: 100,
                                    }}
                                />
                            </View>

                            <Text className="text-[12px] font-lexend text-gray-500 text-center">
                                <Text className="font-lexend-bold text-gray-900">{Math.floor(levelProgress.totalRange - levelProgress.progressInLevel).toLocaleString()}</Text> XP needed for next level
                            </Text>
                        </View>

                        {/* Stats Grid */}
                        <View className="flex-row gap-3 mb-6">
                            <View className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100 items-center">
                                <Text className="text-[12px] font-lexend-medium text-amber-600 mb-1 uppercase tracking-wider">Total XP</Text>
                                <Text className="text-[24px] font-lexend-bold text-amber-900">
                                    {stats.total_xp?.toLocaleString()}
                                </Text>
                            </View>
                            <View className="flex-1 bg-indigo-50 rounded-2xl p-4 border border-indigo-100 items-center">
                                <Text className="text-[12px] font-lexend-medium text-indigo-600 mb-1 uppercase tracking-wider">Next Level</Text>
                                <Text className="text-[24px] font-lexend-bold text-indigo-900">
                                    {levelProgress.next?.toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={onClose}
                            className="w-full active:scale-95"
                        >
                            <LinearGradient
                                colors={["#4F46E5", "#4338CA"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: 16, paddingVertical: 16, width: "100%" }}
                            >
                                <Text className="text-white text-center font-lexend-bold text-[16px]">
                                    Keep Going!
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
