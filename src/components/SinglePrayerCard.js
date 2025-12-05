import { BubbleChatIcon, FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text, View } from "react-native";

const categories = [
    { value: "Health", emoji: "❤️", colors: ["#f87171", "#fb923c"] },
    { value: "Family", emoji: "👨‍👩‍👧‍👦", colors: ["#34d399", "#10b981"] },
    { value: "Work", emoji: "💼", colors: ["#fbbf24", "#f59e0b"] },
    { value: "Spiritual Growth", emoji: "✨", colors: ["#a78bfa", "#8b5cf6"] },
    { value: "Financial", emoji: "💰", colors: ["#22d3ee", "#06b6d4"] },
    { value: "Relationships", emoji: "💕", colors: ["#f472b6", "#ec4899"] },
    { value: "Guidance", emoji: "🧭", colors: ["#818cf8", "#6366f1"] },
    { value: "Thanksgiving", emoji: "🙏", colors: ["#fbbf24", "#f59e0b"] },
];

const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

const getCategoryInfo = (category) => {
    return categories.find((c) => c.value === category) || categories[0];
};

const SinglePrayerCard = ({ prayer, onTogglePraying, onOpenComments }) => {
    const categoryInfo = getCategoryInfo(prayer.category);

    return (
        <View
            className="bg-white rounded-3xl mb-4 overflow-hidden border border-stone-200"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            {/* Prayer Header */}
            <LinearGradient
                colors={categoryInfo.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 20, paddingVertical: 14 }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <View className="w-9 h-9 rounded-full bg-white/90 items-center justify-center">
                            <Text className="text-sm font-lexend-semibold text-gray-700">
                                {prayer.author ? prayer.author[0] : "A"}
                            </Text>
                        </View>
                        <View>
                            <Text className="font-lexend-medium text-white text-sm">
                                {prayer.author}
                            </Text>
                            <Text className="text-white/80 text-xs font-lexend-light">
                                {timeAgo(prayer.created_at)}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                        <Text className="text-sm">{categoryInfo.emoji}</Text>
                        <Text className="text-white text-xs font-lexend-medium">
                            {prayer.category}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Prayer Content */}
            <View className="px-5 py-4">
                <View className="flex-row items-start gap-2 mb-2">
                    <Text className="text-xl">🙏</Text>
                    <Text className="text-base font-lexend-semibold text-gray-800 flex-1">
                        {prayer.title}
                    </Text>
                </View>
                <Text className="text-gray-700 leading-6 font-lexend-light text-sm">
                    {prayer.description}
                </Text>
            </View>

            {/* Action Bar */}
            <View className="px-5 pb-4 pt-2 border-t border-stone-100">
                <View className="flex-row items-center justify-between pt-2">
                    {/* Praying Button */}
                    <Pressable
                        onPress={() => onTogglePraying && onTogglePraying(prayer.id)}
                        className="flex-row items-center gap-2 px-3 py-2 rounded-full active:scale-95"
                        style={{
                            backgroundColor: prayer.isPraying
                                ? "#faf5ff"
                                : "transparent",
                            borderWidth: prayer.isPraying ? 1 : 0,
                            borderColor: "#e9d5ff",
                        }}
                    >
                        <HugeiconsIcon
                            icon={FavouriteIcon}
                            size={20}
                            color={prayer.isPraying ? "#a855f7" : "#78716c"}
                            fill={prayer.isPraying ? "#a855f7" : "transparent"}
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                        <Text
                            className={`text-sm font-lexend-medium ${prayer.isPraying
                                ? "text-purple-600"
                                : "text-gray-700"
                                }`}
                        >
                            {prayer.isPraying ? "Praying" : "Pray"}
                        </Text>
                        <Text
                            className={`text-sm font-lexend-semibold ${prayer.isPraying
                                ? "text-purple-600"
                                : "text-gray-500"
                                }`}
                        >
                            {prayer.prayingCount}
                        </Text>
                    </Pressable>

                    {/* Comments Button */}
                    <Pressable
                        onPress={() => onOpenComments && onOpenComments(prayer)}
                        className="flex-row items-center gap-2 px-3 py-2 rounded-full active:scale-95"
                    >
                        <HugeiconsIcon
                            icon={BubbleChatIcon}
                            size={20}
                            color="#78716c"
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                        <Text className="text-sm font-lexend-medium text-gray-700">
                            {prayer.commentCount}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default React.memo(SinglePrayerCard);
