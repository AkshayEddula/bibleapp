import { LinearGradient } from "expo-linear-gradient";
import { Zap } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, Modal, Pressable, Text, View } from "react-native";
import { images } from "../utils";

const { width } = Dimensions.get("window");

const CelebrationModal = ({ visible, item, onClose, type }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 15,
                stiffness: 100,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    if (!item) return null;

    const isQuest = type === "quest";
    const gradientColors = isQuest
        ? ["#E0E7FF", "#C7D2FE"] // Blue/Indigo for Quest
        : ["#FEF3C7", "#FDE68A"]; // Amber/Gold for Badge

    const iconColor = isQuest ? "#4F46E5" : "#D97706";
    const textColor = isQuest ? "text-indigo-900" : "text-amber-900";
    const accentColor = isQuest ? "text-indigo-600" : "text-amber-600";

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark semi-transparent background
                }}
            >
                <Animated.View
                    className="w-full max-w-sm items-center"
                    style={{
                        transform: [{ scale: scaleAnim }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 20 },
                        shadowOpacity: 0.25,
                        shadowRadius: 30,
                        elevation: 20,
                    }}
                >
                    {/* Card Container */}
                    <View className="bg-white rounded-[40px] overflow-hidden w-full items-center pb-8">

                        {/* Header Background */}
                        <LinearGradient
                            colors={gradientColors}
                            style={{ width: "100%", height: 140, alignItems: "center", justifyContent: "center" }}
                        >
                            {/* Mascot */}
                            <View style={{ marginTop: 40 }}>
                                <Image
                                    source={images.Char}
                                    style={{ width: 140, height: 140 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </LinearGradient>

                        <View className="px-8 pt-12 items-center w-full">
                            <Text className={`text-[28px] font-lexend-bold ${textColor} text-center mb-2`}>
                                {isQuest ? "Quest Complete!" : "Badge Unlocked!"}
                            </Text>

                            <Text className="text-[16px] font-lexend text-gray-600 text-center mb-6 leading-[24px]">
                                You've successfully {isQuest ? "completed" : "earned"}{"\n"}
                                <Text className={`font-lexend-bold ${accentColor} text-[18px]`}>
                                    {item.title || item.name}
                                </Text>
                            </Text>

                            {/* Reward Badge */}
                            <View className={`px-6 py-3 rounded-2xl mb-8 flex-row items-center gap-3 ${isQuest ? "bg-indigo-50" : "bg-amber-50"}`}>
                                <View className={`p-2 rounded-full ${isQuest ? "bg-indigo-100" : "bg-amber-100"}`}>
                                    <Zap size={24} color={iconColor} fill={iconColor} />
                                </View>
                                <View>
                                    <Text className="text-[12px] font-lexend-medium text-gray-500 uppercase tracking-wider">
                                        Reward
                                    </Text>
                                    <Text className={`text-[20px] font-lexend-bold ${textColor}`}>
                                        +{item.xp_reward} XP
                                    </Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={onClose}
                                className="w-full active:scale-95"
                            >
                                <LinearGradient
                                    colors={isQuest ? ["#4F46E5", "#4338CA"] : ["#F59E0B", "#D97706"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 20, paddingVertical: 16, width: "100%" }}
                                >
                                    <Text className="text-white text-center font-lexend-bold text-[16px]">
                                        Awesome!
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default CelebrationModal;
