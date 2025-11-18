// HomeScreen.js - Updated with Stories Header
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Bell, Menu, Flame } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { VerseCard } from "../../components/VerseCard";
import { StoryCircle } from "../../components/StoriesCard";
import PrayerWallScreen from "../../components/PrayerCard";
import TestimoniesScreen from "../../components/TestimonalCard";

const { width } = Dimensions.get("window");

const storyTags = [
  {
    id: 1,
    tag: "Faith",
    color: ["#FEE8A0", "#F9C846"],
    icon: "✨",
    hasNew: true,
  },
  {
    id: 2,
    tag: "Wisdom",
    color: ["#E0C3FC", "#8EC5FC"],
    icon: "📖",
    hasNew: true,
  },
  {
    id: 3,
    tag: "Hope",
    color: ["#FFE5B4", "#FFB347"],
    icon: "🌤️",
    hasNew: false,
  },
  {
    id: 4,
    tag: "Love",
    color: ["#FFD6E8", "#FF9ECD"],
    icon: "💛",
    hasNew: true,
  },
  {
    id: 5,
    tag: "Peace",
    color: ["#C1E1C1", "#A8E6CF"],
    icon: "🕊️",
    hasNew: false,
  },
  {
    id: 6,
    tag: "Grace",
    color: ["#F6D5F7", "#E5B3E6"],
    icon: "🙏",
    hasNew: true,
  },
];

export default function HomeScreen() {
  const { isUserLoggedIn, user, logout, isLogoutLoading } = useAuth();
  const [verses, setVerses] = useState([]);
  const [likedVerses, setLikedVerses] = useState(new Set());
  const [savedVerses, setSavedVerses] = useState(new Set());
  const [verseCounts, setVerseCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (!isUserLoggedIn) return;
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    initializeData();
  }, [isUserLoggedIn]);

  const initializeData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [versesResult, likesResult, savesResult, countsResult] =
        await Promise.all([
          supabase.from("bible_verses").select("*").limit(1),
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "like"),
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "save"),
          supabase.from("verse_interaction_counts").select("*"),
        ]);

      if (versesResult.error) {
        setError(versesResult.error.message);
      } else {
        setVerses(versesResult.data);
      }

      if (likesResult.data) {
        setLikedVerses(new Set(likesResult.data.map((item) => item.verse_id)));
      }

      if (savesResult.data) {
        setSavedVerses(new Set(savesResult.data.map((item) => item.verse_id)));
      }

      if (countsResult.data) {
        const countsMap = {};
        countsResult.data.forEach((count) => {
          countsMap[count.verse_id] = count;
        });
        setVerseCounts(countsMap);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error initializing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInteraction = async (verseId, type, currentState, setState) => {
    const isCurrentlyActive = currentState.has(verseId);

    // Optimistic update
    const newState = new Set(currentState);
    if (isCurrentlyActive) {
      newState.delete(verseId);
    } else {
      newState.add(verseId);
    }
    setState(newState);

    // Update count optimistically
    const countKey = `${type}_count`;
    setVerseCounts((prev) => ({
      ...prev,
      [verseId]: {
        ...prev[verseId],
        [countKey]:
          (prev[verseId]?.[countKey] || 0) + (isCurrentlyActive ? -1 : 1),
      },
    }));

    try {
      if (isCurrentlyActive) {
        const { error } = await supabase
          .from("verse_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("verse_id", verseId)
          .eq("interaction_type", type);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("verse_interactions").insert({
          user_id: user.id,
          verse_id: verseId,
          interaction_type: type,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error toggling ${type}:`, error);

      // Revert optimistic update
      setState(currentState);
      setVerseCounts((prev) => ({
        ...prev,
        [verseId]: {
          ...prev[verseId],
          [countKey]:
            (prev[verseId]?.[countKey] || 0) + (isCurrentlyActive ? 1 : -1),
        },
      }));

      setError(`Failed to update ${type}. Please try again.`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const toggleLike = (verseId) => {
    toggleInteraction(verseId, "like", likedVerses, setLikedVerses);
  };

  const toggleSave = (verseId) => {
    toggleInteraction(verseId, "save", savedVerses, setSavedVerses);
  };

  const getVerseCount = (verseId) => {
    return (
      verseCounts[verseId] || {
        like_count: 0,
        comment_count: 0,
        save_count: 0,
        share_count: 0,
      }
    );
  };

  const handleStoryPress = (tag) => {
    console.log(`Pressed ${tag} story`);
    // Navigate to story viewer or filter verses by tag
  };

  return (
    <LinearGradient
      colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[24px] font-lexend-medium text-gray-800">
              lumiverse
            </Text>
            <View className="flex-row items-center gap-5">
              <Pressable className="active:opacity-60">
                <Calendar size={24} color="#1f2937" strokeWidth={2} />
              </Pressable>
              <Pressable className="active:opacity-60">
                <Flame size={24} color="#1f2937" strokeWidth={2} />
              </Pressable>
              <Pressable className="active:opacity-60 relative">
                <Bell size={24} color="#1f2937" strokeWidth={2} />
                <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Stories Section */}
        <View className="mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingVertical: 8,
            }}
          >
            {storyTags.map((story) => (
              <StoryCircle
                key={story.id}
                tag={story.tag}
                color={story.color}
                icon={story.icon}
                hasNew={story.hasNew}
                onPress={() => handleStoryPress(story.tag)}
              />
            ))}
          </ScrollView>
        </View>

        {/* VERSES LIST */}
        <View className="flex-1 px-5">
          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator color="#F9C846" />
              <Text className="text-gray-700 mt-2 font-lexend-light">
                Loading verses...
              </Text>
            </View>
          )}

          {error && (
            <View className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-200">
              <Text className="text-red-600 text-center font-lexend-light">
                {error}
              </Text>
            </View>
          )}

          {!loading && verses.length === 0 && !error && (
            <View className="py-4">
              <Text className="text-gray-700 text-center font-lexend-light">
                No verses found.
              </Text>
            </View>
          )}

          {!loading && verses.length > 0 && (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 80 }}
              showsVerticalScrollIndicator={false}
            >
              {verses.map((verse) => (
                <VerseCard
                  key={verse.id}
                  verse={verse}
                  isLiked={likedVerses.has(verse.id)}
                  isSaved={savedVerses.has(verse.id)}
                  counts={getVerseCount(verse.id)}
                  onToggleLike={toggleLike}
                  onToggleSave={toggleSave}
                />
              ))}
              <PrayerWallScreen />
              <TestimoniesScreen />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
