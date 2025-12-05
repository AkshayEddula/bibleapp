import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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

const reactions = [
    { type: "praise", emoji: "🙌", label: "Praise", color: "#f59e0b" },
    { type: "amen", emoji: "🙏", label: "Amen", color: "#8b5cf6" },
    { type: "blessed", emoji: "✨", label: "Blessed", color: "#10b981" },
];

const timeAgo = (dateString) => {
    if (!dateString) return "";
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

const SingleTestimonialCard = ({ testimony, onToggleReaction, onOpenComments }) => {
    const categoryInfo = getCategoryInfo(testimony.category);
    const totalReactions =
        (testimony.reactionCounts?.praise_count || 0) +
        (testimony.reactionCounts?.amen_count || 0) +
        (testimony.reactionCounts?.blessed_count || 0);

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
            {testimony.is_featured && (
                <LinearGradient
                    colors={["#fbbf24", "#f59e0b"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                    }}
                >
                    <Text className="text-white text-xs font-lexend-semibold text-center">
                        ⭐ FEATURED TESTIMONY
                    </Text>
                </LinearGradient>
            )}

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
                                {testimony.author ? testimony.author[0] : "A"}
                            </Text>
                        </View>
                        <View>
                            <Text className="font-lexend-medium text-white text-sm">
                                {testimony.author}
                            </Text>
                            <Text className="text-white/80 text-xs font-lexend-light">
                                {timeAgo(testimony.created_at)}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                        <Text className="text-sm">{categoryInfo.emoji}</Text>
                        <Text className="text-white text-xs font-lexend-medium">
                            {testimony.category}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Prayer Link Badge - Show if linked to prayer */}
            {testimony.linkedPrayer && (
                <View
                    style={{
                        flexDirection: "row",
                        margin: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        backgroundColor: "#fafafa",
                        borderRadius: 14,
                    }}
                >
                    {/* Left vertical thread line */}
                    <View
                        style={{
                            width: 3,
                            backgroundColor: "#d1d5db",
                            borderRadius: 999,
                            marginRight: 12,
                        }}
                    />

                    {/* Right content block */}
                    <View style={{ flex: 1 }}>
                        {/* Heading Row */}
                        <View className="flex-row items-center gap-2 mb-6">
                            <Text style={{ fontSize: 16 }}>🙏</Text>
                            <Text className="text-[15px] font-lexend text-gray-500">
                                Answered Prayer Testimony
                            </Text>
                        </View>

                        <View className="flex-row items-start gap-2 mb-2 ml-2">
                            {/* Title */}
                            <Text className="text-xl">✨</Text>

                            <Text className="font-lexend-medium text-[15px] text-gray-900">
                                {testimony.linkedPrayer.title}
                            </Text>
                        </View>

                        {/* Description */}
                        <Text className="font-lexend-light text-[14px] text-gray-500 leading-6 ml-2 mt-0">
                            {testimony.linkedPrayer.description}
                        </Text>
                    </View>
                </View>
            )}

            <View className="px-5 py-4">
                <View className="flex-row items-start gap-2 mb-2">
                    <Text className="text-xl">✨</Text>
                    <Text className="text-base font-lexend-semibold text-gray-800 flex-1">
                        {testimony.title}
                    </Text>
                </View>
                <Text className="text-gray-700 leading-6 font-lexend-light text-sm">
                    {testimony.content}
                </Text>
            </View>

            <View className="px-5 pb-3">
                <View className="flex-row items-center gap-2">
                    {reactions.map((reaction) => {
                        const count =
                            testimony.reactionCounts[`${reaction.type}_count`] ||
                            0;
                        const isActive = testimony.userReactions && testimony.userReactions.has(
                            reaction.type,
                        );

                        return (
                            <TouchableOpacity
                                key={reaction.type}
                                onPress={() =>
                                    onToggleReaction && onToggleReaction(testimony.id, reaction.type)
                                }
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: isActive
                                        ? `${reaction.color}15`
                                        : "#f5f5f4",
                                    borderWidth: isActive ? 1 : 0,
                                    borderColor: isActive
                                        ? reaction.color
                                        : "transparent",
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 100,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Text className="text-sm">{reaction.emoji}</Text>
                                {count > 0 && (
                                    <Text
                                        className="text-xs font-lexend-medium"
                                        style={{
                                            color: isActive ? reaction.color : "#78716c",
                                        }}
                                    >
                                        {count}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View className="px-5 pb-4 pt-2 border-t border-stone-100">
                <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-lexend-medium text-gray-500">
                        {totalReactions > 0
                            ? `${totalReactions} ${totalReactions === 1 ? "reaction" : "reactions"
                            }`
                            : "Be the first to react"}
                    </Text>

                    <TouchableOpacity
                        onPress={() => onOpenComments && onOpenComments(testimony)}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 100,
                            backgroundColor: "#f5f5f4",
                        }}
                    >
                        <HugeiconsIcon
                            icon={BubbleChatIcon}
                            size={18}
                            color="#78716c"
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                        <Text className="text-sm font-lexend-medium text-gray-700">
                            {testimony.commentCount}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default React.memo(SingleTestimonialCard);
