import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Flame, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, Modal, Pressable, Text, View } from "react-native";
import { images } from "../utils";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const StreakModal = ({ visible, onClose, streak = 0, history = [], quests = [] }) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
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
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 20,
                        paddingBottom: 40, // Safe area padding
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={["#FF9A9E", "#FECFEF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 24, alignItems: "center", position: "relative", overflow: 'visible' }}
                    >
                        <Pressable
                            onPress={onClose}
                            className="absolute top-4 right-4 bg-white/20 p-2 rounded-full z-10"
                        >
                            <X size={20} color="#fff" />
                        </Pressable>

                        <View className="flex-row items-center gap-4 mb-2 z-10">
                            {/* Lumi Mascot */}
                            <View className="relative">
                                <View className="absolute inset-0 bg-white/30 blur-md rounded-full" />
                                <Image
                                    source={images.Char}
                                    style={{ width: 80, height: 80 }}
                                    resizeMode="contain"
                                />
                            </View>

                            <View>
                                <Text className="text-white font-lexend-bold text-[48px] leading-[48px] shadow-sm">
                                    {streak}
                                </Text>
                                <Text className="text-white font-lexend-medium text-[14px] opacity-90 uppercase tracking-widest shadow-sm">
                                    Day Streak
                                </Text>
                            </View>
                        </View>

                        {/* Background decorative elements */}
                        <View className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                        <View className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    </LinearGradient>

                    <View className="p-6">
                        {/* Weekly Progress */}
                        <Text className="text-gray-800 font-lexend-bold text-[18px] mb-4">
                            Weekly Activity
                        </Text>

                        <View className="flex-row justify-between mb-8 bg-gray-50 p-4 rounded-2xl">
                            {displayHistory.length > 0 ? (
                                displayHistory.map((day, index) => (
                                    <View key={index} className="items-center gap-2">
                                        <View
                                            className={`w-8 h-8 rounded-full items-center justify-center ${day.active ? "bg-orange-500" : "bg-gray-200"
                                                }`}
                                        >
                                            {day.active && <Flame size={14} color="#fff" fill="#fff" />}
                                        </View>
                                        <Text className={`text-[12px] font-lexend-medium ${day.active ? "text-orange-600" : "text-gray-400"
                                            }`}>
                                            {day.day}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text className="text-gray-400 font-lexend text-center w-full">No activity data yet</Text>
                            )}
                        </View>

                        {/* Streak Quests */}
                        <Text className="text-gray-800 font-lexend-bold text-[18px] mb-4">
                            Keep the Streak Alive!
                        </Text>

                        <View className="gap-3 mb-6">
                            {quests.length > 0 ? (
                                quests.map((quest, index) => (
                                    <View key={index} className="flex-row items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${quest.completed ? "bg-green-100" : "bg-orange-100"
                                            }`}>
                                            {quest.completed ? (
                                                <CheckCircle2 size={20} color="#16A34A" />
                                            ) : (
                                                <Flame size={20} color="#EA580C" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-800 font-lexend-semibold text-[14px]">
                                                {quest.title}
                                            </Text>
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-gray-500 font-lexend text-[12px]">
                                                    {quest.reward} XP
                                                </Text>
                                                {!quest.completed && quest.total > 0 && (
                                                    <Text className="text-orange-500 font-lexend-medium text-[12px]">
                                                        • {quest.progress}/{quest.total}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        {!quest.completed && (
                                            <View className="bg-orange-50 px-3 py-1 rounded-full">
                                                <Text className="text-orange-600 font-lexend-medium text-[10px] uppercase">
                                                    Go
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))
                            ) : (
                                <Text className="text-gray-400 font-lexend text-center py-4">
                                    All caught up for today!
                                </Text>
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
                                style={{ borderRadius: 16, paddingVertical: 16, width: "100%" }}
                            >
                                <Text className="text-white text-center font-lexend-bold text-[16px]">
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
