import { useNavigation } from "@react-navigation/native";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-gray-200 items-center justify-center gap-4">
      <Text className="text-gary-900 text-xl font-bold">
        This Is Onboarding Page
      </Text>
      <Pressable
        onPress={() => navigation.navigate("Login")}
        className="bg-white p-3 rounded-lg"
      >
        <Text>Go to Login!</Text>
      </Pressable>
    </SafeAreaView>
  );
}
