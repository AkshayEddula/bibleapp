import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import AntDesign from "@expo/vector-icons/AntDesign";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "942516298171-al6kdttr6l68q12ufptpslc8jp7kl1db.apps.googleusercontent.com",
  offlineAccess: false,
  iosClientId:
    "942516298171-70qf0hvo1rfn5704gnbg27mq2d6iorhv.apps.googleusercontent.com",
  googleServicePlistPath: "",
  openIdRealm: "",
  profileImageSize: 120,
});

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading, setIsLoading } = useAuth();

  const HandleSignin = async () => {
    setIsLoading(true);
    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Initiate Google Sign-In
      const res = await GoogleSignin.signIn();

      if (isSuccessResponse(res)) {
        const { data } = res;
        console.log("Google sign in successful:", data.user?.email);

        // Authenticate with Supabase
        const result = await login(data);

        if (result.success) {
          console.log("Login successful, profile:", result.profile);
          Alert.alert("Success", "Logged in successfully!");
          // Navigation will be handled automatically by your root navigator
        } else {
          Alert.alert("Error", result.message);
        }
      } else {
        console.log("Google sign in was cancelled");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      Alert.alert("Error", error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center gap-3 px-8 bg-white">
      <Text className="text-2xl font-lexend-medium mb-4">Welcome</Text>

      <Pressable
        onPress={HandleSignin}
        disabled={isLoading}
        className={`flex flex-row items-center justify-center gap-2 bg-gray-300 px-6 py-3 rounded-[22px] ${
          isLoading ? "opacity-50" : ""
        }`}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color="black" />
            <Text className="text-lg font-lexend-medium ml-2">Loading...</Text>
          </>
        ) : (
          <>
            <AntDesign name="google" size={20} color="black" />
            <Text className="text-lg font-lexend-medium">
              Sign In With Google
            </Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
