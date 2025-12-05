import { ArrowRight02Icon, Sent02Icon, StarsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
import { Dimensions, Image, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { images } from "../../utils";

const { width, height } = Dimensions.get("window");

// Dummy character placeholder
const lumi = images.Char;

// --- 1. PSYCHOLOGY-DRIVEN COPYWRITING (IMPROVED & BIBLE-FOCUSED) ---
// Following top app formulas: Short, benefit-focused, specific + Clear Bible connection
const slides = [
  {
    key: "1",
    title: "The Bible,\nYour Way 📖✨",
    subtitle: "God's Word in 5 minutes. Modern, beautiful, daily.",
    bubble: "Hi! I'm Lumi. Ready to fall in love with Scripture? 👇",
    gradient: ["#ffffff", "#fffbf2", "#fff4d6"], // Warm/Gold (Divine/Light)
    bubbleGradient: ["#FFF9E6", "#FFEEB8"], // Rich cream to gold
    bubbleText: "#7C2D12", // Deep amber brown
    buttonText: "Let's Start",
  },
  {
    key: "2",
    title: "Pray Together,\nGrow Together 🙏",
    subtitle: "10K believers praying. Share requests. Feel support.",
    bubble: "Real community. Real faith. Real prayers answered!",
    gradient: ["#ffffff", "#f2f7ff", "#e0edff"], // Blue/Calm (Trust/Peace)
    bubbleGradient: ["#EFF6FF", "#DBEAFE"], // Light blue to sky
    bubbleText: "#1E3A8A", // Deep blue
    buttonText: "Next",
  },
  {
    key: "3",
    title: "Daily Bible\nReading Made Fun 🔥",
    subtitle: "Streaks. Badges. Deeper faith. Actually stick with it.",
    bubble: "90% read Scripture daily after week 1!",
    gradient: ["#ffffff", "#fff2f5", "#ffe0e8"], // Red/Pink (Love/Passion/Heart)
    bubbleGradient: ["#FFF1F2", "#FECDD3"], // Soft rose to pink
    bubbleText: "#881337", // Deep rose
    buttonText: "Next",
  },
  {
    key: "4",
    title: "Your Bible\nJourney Starts Now 🕊️",
    subtitle: "Join thousands discovering God's Word daily.",
    bubble: "Let's transform your walk with Christ together! ✨",
    gradient: ["#ffffff", "#f4fff6", "#e0ffe6"], // Green (Growth/Life)
    bubbleGradient: ["#F0FDF4", "#DCFCE7"], // Mint to light green
    bubbleText: "#14532D", // Deep green
    buttonText: "Open My Bible",
  },
];

const Pagination = ({ count, activeIndex }) => {
  return (
    <View className="flex-row gap-2 justify-center mb-6">
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <Animated.View
            key={i}
            className={`h-2 rounded-full ${isActive ? "bg-yellow-500 w-8" : "bg-gray-200 w-2"}`}
            style={{ transition: 'all 0.3s ease' }}
          />
        );
      })}
    </View>
  );
};

export default function LumiOnboarding() {
  const navigation = useNavigation();

  // Shared Values
  const currentIndex = useSharedValue(0);
  const fade = useSharedValue(0); // Text fade
  const float = useSharedValue(0); // Character breathing
  const bubbleScale = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // Reset
      fade.value = 0;
      bubbleScale.value = 0;

      // Entrance Animation
      fade.value = withTiming(1, { duration: 800 });
      bubbleScale.value = withDelay(400, withSpring(1));

      // Continuous Floating Animation for Lumi Character
      float.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }, [])
  );

  // Helper for Spring animation
  const withSpring = (toValue) => {
    'worklet';
    return withTiming(toValue, {
      duration: 500,
      easing: Easing.out(Easing.back(1.5)),
    });
  };

  const handleNext = () => {
    if (currentIndex.value < slides.length - 1) {
      // Animate out
      fade.value = withTiming(0, { duration: 300 }, () => {
        currentIndex.value += 1;
        // Animate in
        fade.value = withTiming(1, { duration: 500 });
      });
      // Pop bubble logic
      bubbleScale.value = withTiming(0, { duration: 200 }, () => {
        bubbleScale.value = withDelay(200, withSpring(1));
      });
    } else {
      navigation.navigate("Login");
    }
  };

  const skipToLogin = () => {
    navigation.navigate("Login");
  };

  // Styles
  const slideContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(-currentIndex.value * width, { duration: 500, easing: Easing.out(Easing.cubic) }) }],
  }));

  const textFadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: interpolate(fade.value, [0, 1], [20, 0]) }],
  }));

  const characterFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const bubblePopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: bubbleScale.value,
  }));

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: Constants.statusBarHeight }}>
      {/* Top Bar (Skip Button) */}
      <View className="absolute top-12 w-full z-50 flex-row justify-end px-6 pt-2">
        <Pressable onPress={skipToLogin} hitSlop={20}>
          <Text className="text-gray-400 font-lexend-medium tracking-tighter text-[16px]">Skip</Text>
        </Pressable>
      </View>

      {/* Main Slide Container */}
      <Animated.View style={[{ flexDirection: "row", width: width * slides.length, height: "100%" }, slideContainerStyle]}>
        {slides.map((slide, index) => (
          <LinearGradient
            key={slide.key}
            colors={slide.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ width, flex: 1 }}
          >
            <View className="flex-1 justify-between items-center pb-8 pt-12">

              {/* Top Section: Character & Bubble */}
              <View className="items-center justify-center flex-1 w-full px-4">

                {/* IMPROVED BUBBLE - Better visibility & colors */}
                <Animated.View style={[bubblePopStyle, { marginBottom: 20, maxWidth: '90%' }]}>
                  {/* Rich, colorful bubble that matches each slide's theme */}
                  <LinearGradient
                    colors={slide.bubbleGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      borderRadius: 24,
                      borderWidth: 2,
                      borderColor: "rgba(255, 255, 255, 0.8)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.15,
                      shadowRadius: 20,
                      elevation: 10,
                    }}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <HugeiconsIcon icon={Sent02Icon} size={18} color={slide.bubbleText} />
                      <Text
                        style={{
                          fontSize: 15,
                          color: slide.bubbleText,
                          fontFamily: 'Lexend-Medium',
                          textAlign: 'center',
                          lineHeight: 22,
                          letterSpacing: -0.3
                        }}
                      >
                        {slide.bubble}
                      </Text>
                    </View>
                  </LinearGradient>

                  {/* Custom Pointer with matching color */}
                  <View
                    className="absolute bottom-[-14px] left-1/2 -ml-3"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 12,
                      borderRightWidth: 12,
                      borderTopWidth: 16,
                      borderStyle: 'solid',
                      backgroundColor: 'transparent',
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor: slide.bubbleGradient[1], // Match bubble's end color
                    }}
                  />

                  {/* Shadow for the pointer */}
                  <View
                    className="absolute bottom-[-16px] left-1/2 -ml-3"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 12,
                      borderRightWidth: 12,
                      borderTopWidth: 16,
                      borderStyle: 'solid',
                      backgroundColor: 'transparent',
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor: 'rgba(0,0,0,0.08)',
                      zIndex: -1,
                    }}
                  />
                </Animated.View>

                {/* Character */}
                <Animated.View style={characterFloatStyle}>
                  <Image
                    source={lumi}
                    className="w-[300px] h-[300px]"
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>

              {/* Bottom Section: Text & Controls */}
              <Animated.View style={[textFadeStyle, { width: "100%", paddingHorizontal: 32 }]}>

                {/* Text Content */}
                <View className="items-center mb-10">
                  <Text className="text-[34px] font-lexend-bold text-gray-900 text-center leading-[42px] tracking-tight mb-4">
                    {slide.title}
                  </Text>
                  <Text className="text-[17px] text-gray-500 text-center font-lexend-light leading-7 px-2">
                    {slide.subtitle}
                  </Text>
                </View>

                {/* Pagination Dots */}
                <View className="flex-row justify-center gap-2 mb-8">
                  {slides.map((_, i) => (
                    <View key={i} className={`h-2 rounded-full ${index === i ? "bg-yellow-500 w-6" : "bg-gray-300 w-2"}`} />
                  ))}
                </View>

                {/* Primary Button */}
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
                  className="w-full"
                >
                  <LinearGradient
                    colors={["#FFD600", "#FFB800"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingVertical: 20,
                      borderRadius: 24,
                      shadowColor: "#FFB800",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 8,
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255,255,255,0.4)"
                    }}
                  >
                    <Text className="text-[18px] text-amber-950 font-lexend-bold mr-2">
                      {slide.buttonText}
                    </Text>
                    {index === slides.length - 1 ? (
                      <HugeiconsIcon icon={StarsIcon} strokeWidth={1.5} size={26} color="#451a03" pointerEvents="none" />
                    ) : (
                      <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} size={26} color="#451a03" pointerEvents="none" />
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

            </View>
          </LinearGradient>
        ))}
      </Animated.View>
    </View>
  );
}