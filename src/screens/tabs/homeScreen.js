import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, Pressable } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function HomeScreen() {
  const { isUserLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    console.log("HomeScreen mounted");
    if (isUserLoggedIn) {
      console.log("User is logged in");
    } else {
      console.log("User is not logged in");
    }
  }, [user, isUserLoggedIn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "hsl(0, 0%, 90%)" }}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-black">Home Screen</Text>
        <View className="flex flex-col items-center justify-center mt-4">
          <Text className="text-black">Name: {user.name}</Text>
          <Text className="text-black">email: {user.email}</Text>
          <Text className="text-black">Token: {user.token}</Text>
        </View>
        <Pressable
          className="bg-red-500 px-4 py-2 rounded mt-4"
          onPress={logout}
        >
          <Text className="text-white">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
