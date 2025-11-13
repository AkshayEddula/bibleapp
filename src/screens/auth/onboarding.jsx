import React, { useEffect } from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { images } from "../../utils";

const { width } = Dimensions.get("window");

// Dummy character import placeholder
const lumi = images.Char;

const slides = [
  {
    key: "1",
    title: "Welcome to LumiVerse 🌤️",
    subtitle:
      "A home for prayer, peace, and purpose.\nShare your faith journey and feel God’s love through community.",
    bubble: "Hey friend, I’m Lumi! Let’s walk in light together 🕊️",
    gradient: ["#fdfcfb", "#f7f5f2", "#fdfcfb"],
    buttonText: "Let’s Begin →",
  },
  {
    key: "2",
    title: "Share What’s on Your Heart",
    subtitle:
      "Post your prayer requests and lift others up.\nEvery prayer strengthens our circle of faith.",
    bubble: "You’re never alone — someone is always praying with you 🙏",
    gradient: ["#fff9e6", "#fef4cc", "#fff9e6"],
    buttonText: "Next →",
  },
  {
    key: "3",
    title: "Celebrate God’s Goodness",
    subtitle:
      "Share testimonies, earn faith points, and inspire others with your story.\nWatch your light grow day by day.",
    bubble: "Let’s shine bright together! ✨",
    gradient: ["#fffaf4", "#fff2e0", "#fffaf4"],
    buttonText: "Continue →",
  },
];

export default function LumiOnboarding() {
  const navigation = useNavigation();

  const currentIndex = useSharedValue(0);
  const fade = useSharedValue(0);
  const translate = useSharedValue(30);
  const bubble = useSharedValue(0);
  const exitFade = useSharedValue(1);

  useEffect(() => {
    fade.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.ease),
    });
    translate.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
    bubble.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value * exitFade.value,
    transform: [{ translateY: translate.value }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value * exitFade.value,
    transform: [{ translateY: interpolate(bubble.value, [0, 1], [15, 0]) }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -currentIndex.value * width }],
  }));

  const nextSlide = () => {
    if (currentIndex.value < slides.length - 1) {
      // fade current out then fade next in
      fade.value = withTiming(0, { duration: 400 }, () => {
        currentIndex.value += 1;
        fade.value = withTiming(1, { duration: 600 });
      });
      bubble.value = withTiming(0, { duration: 300 }, () => {
        bubble.value = withDelay(300, withTiming(1, { duration: 500 }));
      });
    } else {
      // last slide → fade out + navigate
      exitFade.value = withTiming(0, { duration: 600 });
      setTimeout(() => {
        runOnJS(navigation.navigate)("Login");
      }, 700);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        style={[
          {
            flexDirection: "row",
            width: width * slides.length,
            height: "100%",
          },
          slideStyle,
        ]}
      >
        {slides.map((slide, index) => (
          <LinearGradient
            key={slide.key}
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width, flex: 1 }}
          >
            <SafeAreaView className="flex-1 justify-between items-center py-10 px-6">
              <Animated.View
                style={[fadeStyle, { alignItems: "center", gap: 16 }]}
              >
                <Animated.View style={bubbleStyle}>
                  <View
                    className="bg-white rounded-3xl px-6 py-4 border border-stone-200/60"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                    }}
                  >
                    <Text className="text-[15px] text-gray-700 font-lexend-light text-center">
                      {slide.bubble}
                    </Text>
                  </View>
                  <View
                    className="absolute -bottom-2 left-1/2 -ml-2 w-4 h-4 bg-white rotate-45"
                    style={{
                      borderLeftWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: "rgba(231, 229, 228, 0.6)",
                    }}
                  />
                </Animated.View>

                <Image
                  source={lumi}
                  className="w-[350px] h-[350px]"
                  resizeMode="contain"
                />
              </Animated.View>

              <Animated.View style={[fadeStyle, { width: "100%", gap: 28 }]}>
                <View className="items-center">
                  <Text className="text-[28px] font-lexend text-gray-800 text-center leading-tight">
                    {slide.title}
                  </Text>
                  <Text className="text-[16px] text-gray-600 text-center mt-3 font-lexend-light leading-7">
                    {slide.subtitle}
                  </Text>
                </View>

                <Pressable
                  onPress={nextSlide}
                  className="mx-4 rounded-[18px] overflow-hidden active:scale-95"
                >
                  <LinearGradient
                    colors={["#FEE8A0", "#F9C846", "#F6B73C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      borderWidth: 0.5,
                      borderColor: "rgba(255,255,255,0.6)",
                      shadowColor: "#F9C846",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Text className="text-[18px] text-gray-800 font-lexend-medium tracking-tight">
                      {slide.buttonText}
                    </Text>
                    <Sparkles strokeWidth={2} color="#57534e" size={22} />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </SafeAreaView>
          </LinearGradient>
        ))}
      </Animated.View>
    </View>
  );
}
