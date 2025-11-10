import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StatsScreen() {
  return (
    <SafeAreaView
      className="items-center justify-center"
      style={{ flex: 1, backgroundColor: "hsl(0, 0%, 90%)" }}
    >
      <Text className="text-2xl font-lexend-medium">Stats Screen</Text>
    </SafeAreaView>
  );
}
