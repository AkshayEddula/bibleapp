import { LinearGradient } from "expo-linear-gradient";
import { Zap } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { images } from "../utils";

const { width, height } = Dimensions.get("window");

const CelebrationModal = ({ visible, items = [], onClose }) => {
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

    if (!items || items.length === 0) return null;

    const isMultiple = items.length > 1;
    const totalXp = items.reduce((sum, { item }) => sum + (item.xp_reward || 0), 0);

    // Determine styles based on first item or generic for multiple
    const firstItem = items[0];
    const isQuest = firstItem.type === "quest";

    const gradientColors = isMultiple
        ? ["#FEE8A0", "#F9C846"] // Gold for multiple
        : (isQuest ? ["#E0E7FF", "#C7D2FE"] : ["#FEF3C7", "#FDE68A"]);

    const textColor = isMultiple || !isQuest ? "text-amber-900" : "text-indigo-900";
    const buttonColors = isMultiple || !isQuest ? ["#F59E0B", "#D97706"] : ["#4F46E5", "#4338CA"];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
                    <View
                        className="bg-white rounded-[40px] overflow-hidden w-full items-center"
                        style={{ maxHeight: height * 0.75 }}
                    >
                        {/* Header Background */}
                        <LinearGradient
                            colors={gradientColors}
                            style={{ width: "100%", height: 140, alignItems: "center", justifyContent: "center" }}
                        >
                            <View style={{ marginTop: 40 }}>
                                <Image
                                    source={images.Char}
                                    style={{ width: 140, height: 140 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </LinearGradient>

                        <ScrollView
                            className="w-full"
                            contentContainerStyle={{
                                paddingHorizontal: 32,
                                paddingTop: 48,
                                paddingBottom: 32,
                                alignItems: 'center'
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text className={`text-[28px] font-lexend-bold ${textColor} text-center mb-2`}>
                                {isMultiple ? "Achievements Unlocked!" : (isQuest ? "Quest Complete!" : "Badge Unlocked!")}
                            </Text>

                            {isMultiple ? (
                                <View className="w-full mb-6">
                                    <Text className="text-[16px] font-lexend text-gray-600 text-center mb-4">
                                        You've earned {items.length} new achievements!
                                    </Text>
                                    <View className="w-full gap-3">
                                        {items.map(({ type, item }, index) => (
                                            <View key={index} className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <View className="flex-row items-center gap-3 flex-1">
                                                    <View className={`p-2 rounded-full ${type === 'quest' ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                                                        <Zap size={16} color={type === 'quest' ? '#4F46E5' : '#D97706'} fill={type === 'quest' ? '#4F46E5' : '#D97706'} />
                                                    </View>
                                                    <Text className="font-lexend-medium text-gray-800 flex-1" numberOfLines={1}>
                                                        {item.title || item.name}
                                                    </Text>
                                                </View>
                                                <Text className="font-lexend-bold text-gray-600">+{item.xp_reward} XP</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <Text className="text-[16px] font-lexend text-gray-600 text-center mb-6 leading-[24px]">
                                    You've successfully {isQuest ? "completed" : "earned"}{"\n"}
                                    <Text className={`font-lexend-bold ${isQuest ? "text-indigo-600" : "text-amber-600"} text-[18px]`}>
                                        {firstItem.item.title || firstItem.item.name}
                                    </Text>
                                </Text>
                            )}

                            {/* Total Reward Badge */}
                            <View className={`px-6 py-3 rounded-2xl mb-2 flex-row items-center gap-3 ${isMultiple ? "bg-amber-50" : (isQuest ? "bg-indigo-50" : "bg-amber-50")}`}>
                                <View className={`p-2 rounded-full ${isMultiple ? "bg-amber-100" : (isQuest ? "bg-indigo-100" : "bg-amber-100")}`}>
                                    <Zap size={24} color={isMultiple ? "#D97706" : (isQuest ? "#4F46E5" : "#D97706")} fill={isMultiple ? "#D97706" : (isQuest ? "#4F46E5" : "#D97706")} />
                                </View>
                                <View>
                                    <Text className="text-[12px] font-lexend-medium text-gray-500 uppercase tracking-wider">
                                        {isMultiple ? "Total Reward" : "Reward"}
                                    </Text>
                                    <Text className={`text-[20px] font-lexend-bold ${textColor}`}>
                                        +{totalXp} XP
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Fixed Footer Button */}
                        <View className="w-full px-8 pb-8 pt-2 bg-white">
                            <Pressable
                                onPress={onClose}
                                className="w-full active:scale-95"
                            >
                                <LinearGradient
                                    colors={buttonColors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 20, paddingVertical: 16, width: "100%" }}
                                >
                                    <Text className="text-white text-center font-lexend-bold text-[16px]">
                                        Praise God! 🙌
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
