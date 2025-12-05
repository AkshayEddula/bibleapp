import { Cancel01Icon, ChampionIcon, CheckmarkCircle01Icon, Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, Modal, Pressable, Text, View } from "react-native";
import { images } from "../utils";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const StreakModal = ({ visible, onClose, streak = 0, history = [], quests = [] }) => {
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

    // Use history directly
    const displayHistory = history;

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
                        elevation: 10,
                        paddingBottom: 40, // Safe area padding
                        overflow: "hidden",
                    }}
                >
                    {/* Header with Premium Gradient */}
                    <LinearGradient
                        colors={["#FF9A9E", "#FECFEF", "#FFF0F5"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 24, paddingBottom: 32, alignItems: "center", position: "relative", overflow: 'visible' }}
                    >
                        <Pressable
                            onPress={onClose}
                            className="absolute top-4 right-4 bg-white/30 p-2 rounded-full z-10 backdrop-blur-sm"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={20} color="#888888ff" pointerEvents="none" />
                        </Pressable>

                        <View className="flex-row items-center gap-6 mb-2 z-10">
                            {/* Lumi Mascot with Glow */}
                            <View className="relative">
                                <View className="absolute inset-0 bg-white/30 blur-xl rounded-full scale-125" />
                                <Image
                                    source={images.Char}
                                    style={{ width: 90, height: 90 }}
                                    resizeMode="contain"
                                />
                            </View>

                            <View>
                                <View className="flex-row items-baseline gap-2">
                                    <Text className="text-white font-lexend-bold text-[56px] leading-[56px] shadow-sm" style={{ textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                                        {streak}
                                    </Text>
                                    <HugeiconsIcon icon={Fire02Icon} size={32} color="#fff" fill="#fff" style={{ opacity: 0.9 }} />
                                </View>
                                <Text className="text-white font-lexend-medium text-[16px] opacity-90 uppercase tracking-widest shadow-sm">
                                    Day Streak
                                </Text>
                            </View>
                        </View>

                        {/* Background decorative elements */}
                        <View className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <View className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    </LinearGradient>

                    <View className="px-6 -mt-6">
                        {/* Weekly Activity Card */}
                        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
                            <View className="flex-row items-center gap-2 mb-4">
                                <HugeiconsIcon icon={Cancel01Icon} size={18} color="#4B5563" />
                                <Text className="text-gray-700 font-lexend-bold text-[16px]">
                                    This Week
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center">
                                {displayHistory.length > 0 ? (
                                    displayHistory.map((day, index) => (
                                        <View key={index} className="items-center gap-2">
                                            <View
                                                className={`w-9 h-9 rounded-full items-center justify-center border-2 ${day.active
                                                    ? "bg-orange-500 border-orange-500"
                                                    : "bg-gray-50 border-gray-100"
                                                    }`}
                                            >
                                                {day.active ? (
                                                    <HugeiconsIcon icon={Fire02Icon} size={16} color="#fff" fill="#fff" />
                                                ) : (
                                                    <View className="w-2 h-2 rounded-full bg-gray-200" />
                                                )}
                                            </View>
                                            <Text className={`text-[11px] font-lexend-medium ${day.active ? "text-orange-600" : "text-gray-400"
                                                }`}>
                                                {day.day}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text className="text-gray-400 font-lexend text-center w-full">No activity data yet</Text>
                                )}
                            </View>
                        </View>

                        {/* Streak Quests */}
                        <View className="flex-row items-center gap-2 mb-4">
                            <HugeiconsIcon icon={ChampionIcon} size={18} color="#4B5563" />
                            <Text className="text-gray-700 font-lexend-bold text-[16px]">
                                Streak Quests
                            </Text>
                        </View>

                        <View className="gap-3 mb-8">
                            {quests.length > 0 ? (
                                quests.map((quest, index) => (
                                    <View key={index} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex-row items-center">
                                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${quest.completed ? "bg-green-50" : "bg-orange-50"
                                            }`}>
                                            {quest.completed ? (
                                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} color="#16A34A" />
                                            ) : (
                                                <HugeiconsIcon icon={Fire02Icon} size={24} color="#EA580C" />
                                            )}
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-gray-800 font-lexend-semibold text-[15px] mb-1">
                                                {quest.title}
                                            </Text>

                                            {quest.completed ? (
                                                <View className="flex-row items-center gap-1">
                                                    <Text className="text-green-600 font-lexend-medium text-[12px]">
                                                        Completed
                                                    </Text>
                                                    <Text className="text-gray-400 font-lexend text-[12px]">
                                                        • +{quest.reward} XP
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View>
                                                    <View className="flex-row items-center justify-between mb-1.5">
                                                        <Text className="text-orange-600 font-lexend-medium text-[12px]">
                                                            {quest.progress} / {quest.total} Days
                                                        </Text>
                                                        <Text className="text-gray-500 font-lexend text-[12px]">
                                                            +{quest.reward} XP
                                                        </Text>
                                                    </View>
                                                    {/* Progress Bar */}
                                                    <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <View
                                                            className="h-full bg-orange-500 rounded-full"
                                                            style={{ width: `${Math.min((quest.progress / quest.total) * 100, 100)}%` }}
                                                        />
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="bg-gray-50 rounded-2xl p-6 items-center">
                                    <Text className="text-gray-400 font-lexend text-center">
                                        All quests completed! Come back tomorrow.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Pressable
                            onPress={onClose}
                            className="w-full active:scale-95"
                        >
                            <LinearGradient
                                colors={["#F97316", "#EA580C"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    borderRadius: 20,
                                    paddingVertical: 18,
                                    width: "100%",
                                    shadowColor: "#EA580C",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4
                                }}
                            >
                                <Text className="text-white text-center font-lexend-bold text-[18px] tracking-wide">
                                    Let's Go!
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default StreakModal;
