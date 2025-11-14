import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  View,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Sparkles, Heart, Shield, BookOpen } from "lucide-react-native";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
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
      colors={["#fffaf4", "#fff9e6", "#fff4d4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-6">
        <Animated.View
          style={[
            fadeStyle,
            { flex: 1, justifyContent: "center", alignItems: "center" },
          ]}
        >
          {/* Lumi Character */}
          <Animated.View style={floatStyle} className="relative mb-8">
            <Image
              source={lumi}
              className="w-[260px] h-[260px]"
              resizeMode="contain"
            />
            <Animated.View
              style={[
                sparkleStyle,
                { position: "absolute", top: 15, right: 25 },
              ]}
            >
              <Sparkles size={32} color="#F9C846" fill="#FEE8A0" />
            </Animated.View>
            <Animated.View
              style={[
                sparkleStyle,
                { position: "absolute", bottom: 40, left: 20 },
              ]}
            >
              <Sparkles size={24} color="#F9C846" fill="#FEE8A0" />
            </Animated.View>
          </Animated.View>

          {/* Text Section */}
          <View className="items-center gap-3 px-8">
            <Text className="text-[34px] font-lexend text-gray-800 text-center leading-tight">
              Let’s Get Started
            </Text>
            <Text className="text-[15px] text-gray-600 text-center font-lexend-light leading-6">
              Sign in or create your account to{"\n"}join our community of faith
              & prayer.
            </Text>
          </View>

          {/* Google Button */}
          <Pressable
            onPress={HandleSignin}
            disabled={isLoading}
            className="mt-10 rounded-[20px] overflow-hidden active:scale-95 w-[85%]"
            style={{
              shadowColor: "#F9C846",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={
                isLoading
                  ? ["#e4e4e7", "#a1a1aa", "#e4e4e7"]
                  : ["#FEE8A0", "#F9C846", "#F6B73C"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 20,
                gap: 12,
                borderWidth: 0.6,
                borderColor: "rgba(255,255,255,0.6)",
              }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#3f3f46" />
                  <Text className="text-[18px] font-lexend-medium text-gray-700">
                    Connecting...
                  </Text>
                </>
              ) : (
                <>
                  <AntDesign name="google" size={22} color="#57534e" />
                  <Text className="text-[18px] font-lexend-medium text-gray-800">
                    Continue with Google
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Features List */}
          <View className="w-full px-6 mt-10 gap-3">
            <Feature
              icon={<Heart size={18} color="#f59e0b" fill="#fbbf24" />}
              text="Join a loving community of believers"
            />
            <Feature
              icon={<Sparkles size={18} color="#f59e0b" fill="#fbbf24" />}
              text="Share & receive heartfelt prayers"
            />
            <Feature
              icon={<BookOpen size={18} color="#f59e0b" fill="#fbbf24" />}
              text="Discover Bible Reels & Daily Verses"
            />
            <Feature
              icon={<Shield size={18} color="#f59e0b" />}
              text="Safe, secure & private space"
            />
          </View>
        </Animated.View>

        {/* Bottom */}
        <View className="pb-6 items-center gap-1">
          <Text className="text-[12px] text-gray-400 font-lexend-light">
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
          <Text className="text-[13px] text-amber-600 font-lexend mt-1">
            Spreading light, one prayer at a time ✨
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Feature({ icon, text }) {
  return (
    <View className="flex-row items-center gap-3 px-2">
      <View className="bg-amber-100/60 p-2 rounded-full">{icon}</View>
      <Text className="text-[14px] text-gray-600 font-lexend-light flex-1">
        {text}
      </Text>
    </View>
  );
}
