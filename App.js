import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "./global.css";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
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
    "Inter-Regular": require("./assets/fonts/Inter_24pt-Regular.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter_24pt-Bold.ttf"),
    "Inter-ExtraBold": require("./assets/fonts/Inter_24pt-ExtraBold.ttf"),
    "Inter-ExtraLight": require("./assets/fonts/Inter_24pt-ExtraLight.ttf"),
    "Inter-Light": require("./assets/fonts/Inter_24pt-Light.ttf"),
    "Inter-Medium": require("./assets/fonts/Inter_24pt-Medium.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter_24pt-SemiBold.ttf"),
    "Inter-Thin": require("./assets/fonts/Inter_24pt-Thin.ttf"),
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
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
