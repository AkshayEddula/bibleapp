import { NavigationContainer } from "@react-navigation/native";
import { View, Text } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import "./global.css";
import { AuthProvide } from "./src/context/AuthContext";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "Lexend-Regular": require("./assets/fonts/Lexend-Regular.ttf"),
    "Lexend-Bold": require("./assets/fonts/Lexend-Bold.ttf"),
    "Lexend-ExtraBold": require("./assets/fonts/Lexend-ExtraBold.ttf"),
    "Lexend-ExtraLight": require("./assets/fonts/Lexend-ExtraLight.ttf"),
    "Lexend-Light": require("./assets/fonts/Lexend-Light.ttf"),
    "Lexend-Medium": require("./assets/fonts/Lexend-Medium.ttf"),
    "Lexend-SemiBold": require("./assets/fonts/Lexend-SemiBold.ttf"),
    "Lexend-Thin": require("./assets/fonts/Lexend-Thin.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      console.log("Fonts loaded");
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // Or return a loading component
  }

  return (
    <AuthProvide>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvide>
  );
}
