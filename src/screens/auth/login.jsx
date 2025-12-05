import AntDesign from "@expo/vector-icons/AntDesign";
import { StarsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { images } from "../../utils";

GoogleSignin.configure({
  webClientId:
    "942516298171-al6kdttr6l68q12ufptpslc8jp7kl1db.apps.googleusercontent.com",
  iosClientId:
    "942516298171-70qf0hvo1rfn5704gnbg27mq2d6iorhv.apps.googleusercontent.com",
});

const lumi = images.Char;

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading, setIsLoading } = useAuth();

  // Animations
  const fade = useSharedValue(0);
  const float = useSharedValue(0);
  const sparkle = useSharedValue(1);
  const exit = useSharedValue(1);

  useEffect(() => {
    fade.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    sparkle.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value * exit.value,
    transform: [{ scale: withTiming(exit.value, { duration: 500 }) }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
    opacity: sparkle.value - 0.3,
  }));

  const HandleSignin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const res = await GoogleSignin.signIn();
      if (isSuccessResponse(res)) {
        const { data } = res;
        const result = await login(data);
        if (result.success) {
          // Animate exit and navigate
          exit.value = withTiming(0, { duration: 700 }, () => {
            // runOnJS(navigation.navigate)("Home");
          });
        } else {
          Alert.alert("Error", result.message);
        }
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FFFDF7", "#FFF9EB", "#FFF4D6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, paddingTop: Constants.statusBarHeight }}
    >
      <View className="flex-1">
        <Animated.View style={[fadeStyle, { flex: 1 }]}>

          {/* Top Section: Character + Sparkles */}
          <View className="flex-1 justify-center items-center pt-12">
            <Animated.View style={floatStyle} className="relative">
              <Image
                source={lumi}
                className="w-[300px] h-[300px]"
                resizeMode="contain"
              />
              <Animated.View
                style={[sparkleStyle, { position: "absolute", top: 25, right: 35 }]}
              >
                <HugeiconsIcon icon={StarsIcon} size={34} color="#F59E0B" fill="#FCD34D" />
              </Animated.View>
              <Animated.View
                style={[sparkleStyle, { position: "absolute", bottom: 55, left: 30 }]}
              >
                <HugeiconsIcon icon={StarsIcon} size={28} color="#F59E0B" fill="#FCD34D" />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Bottom Section: Content */}
          <View className="px-7 pb-10">

            {/* Headline */}
            <View className="items-center mb-10">
              <Text className="text-[40px] font-lexend-bold text-gray-900 text-center leading-[46px] mb-3 tracking-tight">
                Welcome to{"\n"}LumiVerse 📖
              </Text>
              <Text className="text-[15px] text-gray-600 text-center font-lexend-light leading-6 px-4">
                Join thousands reading the Bible{"\n"}and praying together daily
              </Text>
            </View>

            {/* Google Sign In Button - PRIMARY CTA */}
            <Pressable
              onPress={HandleSignin}
              disabled={isLoading}
              className="rounded-[28px] overflow-hidden mb-6"
              style={({ pressed }) => [
                {
                  shadowColor: isLoading ? "#9CA3AF" : "#F59E0B",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isLoading ? 0.2 : 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={isLoading ? ["#E5E7EB", "#D1D5DB"] : ["#FDE68A", "#FCD34D", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 20,
                  gap: 12,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255, 255, 255, 0.6)",
                }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#6B7280" />
                    <Text className="text-[17px] font-lexend-bold text-gray-700">
                      Signing you in...
                    </Text>
                  </>
                ) : (
                  <>
                    <View className="bg-white rounded-full p-1.5 shadow-sm">
                      <AntDesign name="google" size={20} color="#4285F4" />
                    </View>
                    <Text className="text-[17px] font-lexend-bold text-amber-950">
                      Continue with Google
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider with text */}
            <View className="flex-row items-center mb-7">
              <View className="flex-1 h-[1px] bg-amber-200/40" />
              <Text className="text-[12px] text-amber-700/60 font-lexend-medium px-4">
                Trusted by 10,000+ believers
              </Text>
              <View className="flex-1 h-[1px] bg-amber-200/40" />
            </View>

            {/* Feature Pills - Compact */}
            <View className="flex-row flex-wrap justify-center gap-2.5 mb-2">
              <View className="bg-white/70 px-5 py-3 rounded-full border border-amber-100/80 shadow-sm">
                <Text className="text-[13px] text-amber-900 font-lexend-semibold">
                  📖 Daily Bible
                </Text>
              </View>
              <View className="bg-white/70 px-5 py-3 rounded-full border border-amber-100/80 shadow-sm">
                <Text className="text-[13px] text-amber-900 font-lexend-semibold">
                  🙏 Prayer Circle
                </Text>
              </View>
              <View className="bg-white/70 px-5 py-3 rounded-full border border-amber-100/80 shadow-sm">
                <Text className="text-[13px] text-amber-900 font-lexend-semibold">
                  🔥 Faith Streaks
                </Text>
              </View>
            </View>

            {/* Bottom Legal */}
            <Text className="text-[10px] text-gray-400 font-lexend-light text-center mt-6 leading-4">
              By continuing, you agree to our{"\n"}Terms of Service & Privacy Policy
            </Text>
          </View>

        </Animated.View>
      </View>
    </LinearGradient>
  );
}