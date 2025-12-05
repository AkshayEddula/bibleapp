import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import PrayerWallScreen from "../components/PrayerCard";
import TestimoniesScreen from "../components/TestimonalCard";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/login";
import OnboardingScreen from "../screens/auth/onboarding";
import OnboardingSteps from "../screens/auth/onboardingSteps"; // Add this import
import PaywallScreen from "../screens/paywall/PayWallScreen";
import TabNavigator from "./TavNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isUserLoggedIn, profile, isLoading } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#F9C846" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {isUserLoggedIn ? (
        // Check if user needs onboarding
        profile?.is_onboarded === false ? (
          <Stack.Screen
            name="OnboardingSteps"
            component={OnboardingSteps}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Tabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Prayers" component={PrayerWallScreen} />
            <Stack.Screen name="Testimonies" component={TestimoniesScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          </>
        )
      ) : (
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
