import { Cancel01Icon, CheckmarkCircle01Icon, Fire02Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, ScrollView, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const StreakModal = ({ visible, onClose, streak = 0, history = [], monthTitle = "" }) => {
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

    if (!visible) return null;

    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    // Calculate next milestone (e.g., if streak is 7, next is 10, 14, 30, etc.)
    const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : Math.ceil((streak + 1) / 10) * 10;
    const daysLeft = nextMilestone - streak;

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
                        height: SCREEN_HEIGHT * 0.85, // Slightly shorter for a cleaner look
                        backgroundColor: "#FFFFFF",
                        borderTopLeftRadius: 36,
                        borderTopRightRadius: 36,
                        overflow: "hidden",
                    }}
                >
                    {/* --- NEW HEADER DESIGN --- */}
                    <View className="bg-orange-50/80 pb-6 pt-6 rounded-b-[40px] relative overflow-hidden">

                        {/* Decorative Background Blobs */}
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200/40 rounded-full blur-3xl" />
                        <View className="absolute top-10 -left-10 w-32 h-32 bg-yellow-200/40 rounded-full blur-3xl" />

                        {/* Top Bar */}
                        <View className="flex-row justify-between items-center px-6 mb-2">
                            <View className="bg-white/60 px-3 py-1.5 rounded-full flex-row items-center border border-orange-100/50">
                                <HugeiconsIcon icon={StarIcon} size={12} color="#F59E0B" fill="#F59E0B" />
                                <Text className="text-orange-800 font-lexend-bold text-xs ml-1.5">
                                    {daysLeft} days to {nextMilestone}
                                </Text>
                            </View>

                            <Pressable
                                onPress={onClose}
                                className="bg-white/80 w-8 h-8 items-center justify-center rounded-full border border-gray-100 shadow-sm active:bg-gray-100"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} pointerEvents="none" size={16} color="#71717A" />
                            </Pressable>
                        </View>

                        {/* Main Stats Cluster */}
                        <View className="items-center justify-center mt-2">
                            {/* Icon & Glow */}
                            <View className="relative mb-2">
                                <View className="absolute inset-0 bg-orange-400/30 blur-2xl rounded-full" />
                                <HugeiconsIcon icon={Fire02Icon} pointerEvents="none" size={48} color="#F97316" fill="#F97316" />
                            </View>

                            {/* Big Number */}
                            <View className="flex-row items-baseline">
                                <Text className="text-gray-900 font-lexend-semibold text-[64px] leading-[64px] tracking-tighter">
                                    {streak}
                                </Text>
                                <Text className="text-gray-400 font-lexend-semibold text-xl ml-2 uppercase tracking-wide">
                                    Days
                                </Text>
                            </View>

                            <Text className="text-orange-600/80 font-lexend-medium text-sm mt-1">
                                You are consistently faithful!
                            </Text>
                        </View>
                    </View>

                    {/* --- BODY CONTENT --- */}
                    <ScrollView
                        className="flex-1 -mt-4" // Negative margin to tuck under the rounded header
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 100 }}
                    >
                        {/* CALENDAR CARD */}
                        <View className="bg-white">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-gray-900 font-lexend-bold text-lg">
                                    {monthTitle}
                                </Text>
                                {/* Legend */}
                                <View className="flex-row gap-3">
                                    <View className="flex-row items-center gap-1">
                                        <View className="w-2 h-2 rounded-full bg-orange-500" />
                                        <Text className="text-xs text-gray-400 font-lexend">Done</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <View className="w-2 h-2 rounded-full bg-gray-200" />
                                        <Text className="text-xs text-gray-400 font-lexend">Missed</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Weekday Labels */}
                            <View className="flex-row justify-between mb-3 border-b border-gray-100 pb-2">
                                {weekDays.map((day, index) => (
                                    <View key={index} style={{ width: '14.28%' }} className="items-center">
                                        <Text className="text-gray-400 font-lexend-semibold text-xs opacity-60">
                                            {day}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Days Grid */}
                            <View className="flex-row flex-wrap row-gap-4">
                                {history.map((item, index) => {
                                    if (item.type === 'padding') return <View key={index} style={{ width: '14.28%', height: 44 }} />;

                                    const isActive = item.status === 'active';
                                    const isToday = item.isToday;
                                    const isMissed = item.status === 'missed';

                                    return (
                                        <View key={item.id} style={{ width: '14.28%', height: 44 }} className="items-center justify-center">
                                            <Pressable
                                                className={`w-10 h-10 rounded-full items-center justify-center ${isActive
                                                    ? "bg-[#F97316] shadow-sm shadow-orange-200"
                                                    : isToday
                                                        ? "bg-white border-2 border-orange-200"
                                                        : "bg-gray-50/50"
                                                    }`}
                                            >
                                                {isActive ? (
                                                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="white" strokeWidth={4} />
                                                ) : (
                                                    <Text className={`font-lexend-semibold text-sm ${isMissed ? "text-gray-300" : isToday ? "text-orange-500" : "text-gray-500"
                                                        }`}>
                                                        {item.dayNum}
                                                    </Text>
                                                )}
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* INFO BOX */}
                        <View className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex-row gap-4 items-start">
                            <View className="bg-green-100 p-2 rounded-full">
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#16A34A" strokeWidth={3} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-lexend-bold text-sm mb-1">
                                    Blessing Multiplier (1.1x)
                                </Text>
                                <Text className="text-gray-500 font-lexend text-xs leading-5">
                                    Your diligence brings a continuous blessing. Maintain your commitment to earn exclusive rewards.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* --- FOOTER BUTTON --- */}
                    <View className="p-6 bg-white border-t border-gray-50 absolute bottom-0 left-0 right-0">
                        <Pressable
                            onPress={onClose}
                            className="bg-[#18181B] w-full py-4 rounded-2xl items-center shadow-lg shadow-gray-200 active:scale-[0.99] transition-transform"
                        >
                            <Text className="text-white font-lexend-bold text-lg tracking-wide">
                                Amen!
                            </Text>
                        </Pressable>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

export default StreakModal;