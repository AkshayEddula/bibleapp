import { useNavigation } from "@react-navigation/native";
import { Image, Animated } from "react-native";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../utils";
import { ChevronRight, Sparkles } from "lucide-react-native";
import { useEffect, useRef } from "react";

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Decorative gradient circles */}
      {/* <View className="absolute top-10 right-10 w-32 h-32 bg-primary-light/10 rounded-full blur-3xl" />*/}
      {/* <View className="absolute bottom-32 left-10 w-40 h-40 bg-primary-light/10 rounded-full blur-3xl" />*/}

      <View className="flex-1 items-center justify-between pt-12 pb-8 px-6">
        {/* Top section with logo/image */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
          className="flex-1 justify-center"
        >
          <View className="relative">
            {/* Subtle glow effect behind image */}
            <View className="absolute inset-0 bg-primary-light/20 rounded-full blur-2xl scale-90" />
            <Image
              source={images.Char}
              className="w-[320px] h-[320px]"
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Bottom section with text and button */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="w-full gap-y-8"
        >
          {/* Text content */}
          <View className="gap-y-5 px-2">
            <View className="items-center gap-y-3">
              <Text className="text-[32px] font-lexend tracking-tighter text-center leading-tight">
                Welcome to{"\n"}
                <Text className="text-primary-light">LumiVerse</Text> 🌤️
              </Text>
              <View className="w-16 h-1 bg-primary-light/30 rounded-full" />
            </View>

            <Text className="text-[17px] leading-8 text-center font-lexend-light tracking-tight text-gray-600 px-2">
              A sacred space for prayer, peace, and purpose. Share your faith
              journey and embrace God's love through community.
            </Text>
          </View>

          {/* Button with enhanced styling */}
          <Pressable
            className="flex flex-row gap-x-2 items-center justify-center bg-primary-light rounded-2xl py-5 px-6 mx-2 shadow-lg active:scale-95"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="text-[19px] text-background font-lexend-medium tracking-tight">
              Let's Begin
            </Text>
            <Sparkles strokeWidth={2} color="#fafaf8" size={22} />
          </Pressable>

          {/* Optional footer text */}
          <Text className="text-[13px] text-center font-lexend-light text-gray-400 px-8">
            Join thousands in a journey of faith and fellowship
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
