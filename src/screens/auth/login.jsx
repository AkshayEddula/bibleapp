import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Pressable, TextInput } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState(" ");

  const HandleSignin = (email) => {
    login(email);
    // navigation.navigate("HomeScreen");
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center gap-3 px-8">
      <Text className="text-2xl font-bold">This is Login Screen</Text>
      <TextInput
        placeholder="Email"
        className="border border-gray-300 text-gray-700 px-4 py-4 rounded-[14px] w-full"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable
        onPress={() => HandleSignin(email)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        <Text className="text-lg">Login</Text>
      </Pressable>
    </SafeAreaView>
  );
}
