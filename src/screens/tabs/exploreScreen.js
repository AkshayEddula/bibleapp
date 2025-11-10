import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "hsl(0, 0%, 90%)" }}>
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-lexend-medium">Explore Screen</Text>
      </View>
    </SafeAreaView>
  );
}
