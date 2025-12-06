import { BubbleChatIcon, FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text, View } from "react-native";

// Keep categories for the gradient strip, but removed colorful badges
const categories = [
    { value: "Health", emoji: "❤️", colors: ["#FCA5A5", "#EF4444"] },
    { value: "Family", emoji: "👨‍👩‍👧‍👦", colors: ["#6EE7B7", "#10B981"] },
    { value: "Work", emoji: "💼", colors: ["#FCD34D", "#F59E0B"] },
    { value: "Spiritual Growth", emoji: "✨", colors: ["#C4B5FD", "#8B5CF6"] },
    { value: "Financial", emoji: "💰", colors: ["#67E8F9", "#06B6D4"] },
    { value: "Relationships", emoji: "💕", colors: ["#F9A8D4", "#EC4899"] },
    { value: "Guidance", emoji: "🧭", colors: ["#93C5FD", "#3B82F6"] },
    { value: "Thanksgiving", emoji: "🙏", colors: ["#FDE68A", "#D97706"] },
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
            className="bg-white rounded-[24px] mb-4 mx-1 overflow-hidden border border-stone-200"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 3,
            }}
        >
            {/* Thin Gradient Top Bar - Subtle touch of color */}
            <LinearGradient
                colors={[...categoryInfo.colors, "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 4, width: "100%" }}
            />

            <View className="px-6 pt-5 pb-4">
                {/* Header: User Info & Category */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2.5">
                        <View className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center border border-stone-100">
                            <Text className="text-[11px] font-lexend-semibold text-stone-500">
                                {prayer.author ? prayer.author[0].toUpperCase() : "A"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-[13px] mb-1 font-lexend-medium text-stone-700 leading-4">
                                {prayer.author}
                            </Text>
                            <Text className="text-[11px] font-lexend text-stone-400 leading-3">
                                {timeAgo(prayer.created_at)}
                            </Text>
                        </View>
                    </View>

                    {/* Minimal Category Badge */}
                    <View className="bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                        <Text className="text-[10px]">{categoryInfo.emoji}</Text>
                        <Text className="text-[10px] font-lexend-medium text-stone-500 uppercase tracking-wide">
                            {prayer.category}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <Text className="text-[17px] font-lexend-semibold text-stone-800 leading-[24px] mb-1.5 tracking-tight">
                    {prayer.title}
                </Text>
                <Text className="text-[15px] font-lexend-light text-stone-600 leading-[24px]">
                    {prayer.description}
                </Text>
            </View>

            {/* Action Footer */}
            <View className="px-4 py-3 border-t border-stone-100 flex-row items-center gap-2 bg-stone-50/30">
                {/* Praying Button */}
                <Pressable
                    onPress={() => onTogglePraying && onTogglePraying(prayer.id)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full active:bg-stone-100"
                >
                    <HugeiconsIcon
                        icon={FavouriteIcon}
                        size={22}
                        color={prayer.isPraying ? "#EF4444" : "#57534E"}
                        fill={prayer.isPraying ? "#EF4444" : "transparent"}
                        strokeWidth={1.5}
                        pointerEvents="none"
                    />
                    <Text
                        className={`text-[13px] font-lexend ${prayer.isPraying
                            ? "text-red-500 font-medium"
                            : "text-stone-500"
                            }`}
                    >
                        {prayer.prayingCount > 0 ? prayer.prayingCount : "Pray"}
                    </Text>
                </Pressable>

                {/* Comments Button */}
                <Pressable
                    onPress={() => onOpenComments && onOpenComments(prayer)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full active:bg-stone-100"
                >
                    <HugeiconsIcon
                        icon={BubbleChatIcon}
                        size={22}
                        color="#57534E"
                        strokeWidth={1.5}
                        pointerEvents="none"
                    />
                    <Text className="text-[13px] font-lexend text-stone-500">
                        {prayer.commentCount > 0 ? prayer.commentCount : "Comment"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default React.memo(SinglePrayerCard);