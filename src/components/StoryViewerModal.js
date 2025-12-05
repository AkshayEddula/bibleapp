import { LinearGradient } from "expo-linear-gradient";
import {
    Image,
    Modal,
    Pressable,
    StatusBar,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useEffect, useRef, useState } from "react";

export default function StoryViewerModal({
    visible,
    onClose,
    stories = [],
    initialIndex = 0,
}) {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef(null);
    const STORY_DURATION = 5000; // 5 seconds per story

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            setProgress(0);
            startTimer();
        } else {
            stopTimer();
        }
        return () => stopTimer();
    }, [visible, initialIndex]);

    useEffect(() => {
        if (visible) {
            setProgress(0);
            startTimer();
        }
    }, [currentIndex]);

    const startTimer = () => {
        stopTimer();
        const startTime = Date.now();

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = elapsed / STORY_DURATION;

            if (newProgress >= 1) {
                handleNext();
            } else {
                setProgress(newProgress);
            }
        }, 16); // ~60fps
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        } else {
            // Restart current story or close? Instagram stays on first.
            setProgress(0);
            startTimer();
        }
    };

    const handlePressIn = () => {
        stopTimer();
    };

    const handlePressOut = () => {
        startTimer();
    };

    if (!visible || stories.length === 0) return null;

    const currentStory = stories[currentIndex];

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                <StatusBar barStyle="dark-content" />

                {/* Background Image/Gradient */}
                <View className="absolute inset-0">
                    {currentStory.image_url ? (
                        <Image
                            source={{ uri: currentStory.image_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={["#FFF3E0", "#FFE0B2", "#FFCC80"]} // Warm Morning Sun Gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="w-full h-full"
                        />
                    )}
                </View>

                {/* Main Container with Safe Area Insets */}
                <View
                    className="flex-1"
                    style={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom }}
                >
                    {/* Progress Bars */}
                    <View className="flex-row gap-1 px-2 mb-4">
                        {stories.map((_, index) => (
                            <View
                                key={index}
                                className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden"
                            >
                                <View
                                    className="h-full bg-gray-900 rounded-full"
                                    style={{
                                        width:
                                            index < currentIndex
                                                ? "100%"
                                                : index === currentIndex
                                                    ? `${progress * 100}%`
                                                    : "0%",
                                    }}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Header */}
                    <View className="flex-row items-center justify-between px-4 mb-10">
                        <View className="flex-row items-center gap-3">
                            {/* User Avatar (Placeholder) */}
                            <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center border border-orange-200">
                                <Text className="text-orange-600 font-bold">L</Text>
                            </View>
                            <Text className="text-gray-900 font-lexend-medium text-sm">
                                LumiVerse • {currentStory.tag || "Daily"}
                            </Text>
                        </View>
                        <Pressable onPress={onClose} className="p-2 bg-white/50 rounded-full z-10 shadow-sm">
                            <HugeiconsIcon icon={Cancel01Icon} size={24} color="#1f2937" pointerEvents="none" />
                        </Pressable>
                    </View>

                    {/* Content */}
                    <View className="flex-1 justify-center px-8">
                        <Text className="text-gray-900 font-lexend-bold text-2xl text-center leading-9 mb-6">
                            "{currentStory.content}"
                        </Text>
                        <Text className="text-gray-600 font-lexend-medium text-lg text-center">
                            {currentStory.book} {currentStory.chapter}:{currentStory.verse}
                        </Text>
                    </View>

                    {/* Touch Navigation Areas */}
                    <View className="absolute inset-0 flex-row mt-20 mb-20">
                        <Pressable
                            className="flex-1"
                            onPress={handlePrevious}
                            onLongPress={handlePressIn}
                            onPressOut={handlePressOut}
                        />
                        <Pressable
                            className="flex-1"
                            onPress={handleNext}
                            onLongPress={handlePressIn}
                            onPressOut={handlePressOut}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
