import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text, View } from "react-native";

// Testimonial Categories (Keeping the clean Stone/Amber colors)
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

// Reactions definitions
const reactions = [
    { type: "praise", emoji: "🙌", label: "Praise", color: "#F59E0B" }, // Amber/Orange
    { type: "amen", emoji: "🙏", label: "Amen", color: "#8B5CF6" },     // Violet/Purple
    { type: "blessed", emoji: "✨", label: "Blessed", color: "#10B981" }, // Emerald/Green
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
            {/* Thin Gradient Top Bar */}
            <LinearGradient
                colors={[...categoryInfo.colors, "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 4, width: "100%" }}
            />

            {/* Featured Banner (Condensed) */}
            {testimony.is_featured && (
                <View className="bg-amber-500/10 border-b border-amber-200 py-2 items-center">
                    <Text className="text-amber-700 text-[11px] font-lexend-semibold tracking-wider">
                        ✨ FEATURED STORY
                    </Text>
                </View>
            )}

            <View className="px-6 pt-5 pb-4">
                {/* Header: User Info & Category */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2.5">
                        {/* Avatar */}
                        <View className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center border border-stone-100">
                            <Text className="text-[11px] font-lexend-semibold text-stone-500">
                                {testimony.author ? testimony.author[0].toUpperCase() : "A"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-[13px] font-lexend-medium text-stone-700 leading-4">
                                {testimony.author}
                            </Text>
                            <Text className="text-[11px] font-lexend text-stone-400 leading-3">
                                {timeAgo(testimony.created_at)}
                            </Text>
                        </View>
                    </View>

                    {/* Minimal Category Badge */}
                    <View className="bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                        <Text className="text-[10px]">{categoryInfo.emoji}</Text>
                        <Text className="text-[10px] font-lexend-medium text-stone-500 uppercase tracking-wide">
                            {testimony.category}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <Text className="text-[17px] font-lexend-semibold text-stone-800 leading-[24px] mb-1.5 tracking-tight">
                    {testimony.title}
                </Text>
                <Text className="text-[15px] font-lexend-light text-stone-600 leading-[24px]">
                    {testimony.content}
                </Text>
            </View>

            {/* Prayer Link Block - Cleaned up to match card style */}
            {testimony.linkedPrayer && (
                <View className="mx-4 mb-4 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                    <View className="px-4 py-3 border-b border-stone-100 bg-white">
                        <Text className="text-[11px] font-lexend-semibold uppercase tracking-wider text-stone-500">
                            Linked to Prayer Request
                        </Text>
                    </View>
                    <View className="p-4">
                        <Text className="text-[14px] font-lexend-medium text-stone-800 mb-1">
                            {testimony.linkedPrayer.title}
                        </Text>
                        <Text className="text-[13px] font-lexend-light text-stone-500 leading-[18px]" numberOfLines={2}>
                            {testimony.linkedPrayer.description}
                        </Text>
                    </View>
                </View>
            )}

            {/* Action Footer */}
            <View className="px-4 py-3 border-t border-stone-100 flex-row items-center justify-between bg-stone-50/30">
                <View className="flex-row items-center gap-2">
                    {/* Reactions */}
                    {reactions.map((reaction) => {
                        const count = testimony.reactionCounts[`${reaction.type}_count`] || 0;
                        const isActive = testimony.userReactions && testimony.userReactions.has(reaction.type);

                        return (
                            <Pressable
                                key={reaction.type}
                                onPress={() => onToggleReaction && onToggleReaction(testimony.id, reaction.type)}
                                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full active:bg-stone-100 ${isActive ? 'border border-current' : ''}`}
                                style={{ borderColor: reaction.color }}
                            >
                                <Text className="text-xl leading-none">{reaction.emoji}</Text>
                                {/* FIX: Only display the count if it is greater than 0 */}
                                {count > 0 && (
                                    <Text
                                        className={`text-[13px] font-lexend ${isActive ? 'font-medium' : ''}`}
                                        style={{ color: isActive ? reaction.color : '#57534E' }}
                                    >
                                        {count}
                                    </Text>
                                )}
                            </Pressable>
                        );
                    })}
                </View>

                {/* Comment Button */}
                <Pressable
                    onPress={() => onOpenComments && onOpenComments(testimony)}
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
                        {testimony.commentCount > 0 ? testimony.commentCount : "Comment"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default React.memo(SingleTestimonialCard);