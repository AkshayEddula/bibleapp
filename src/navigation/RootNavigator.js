import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen from "../screens/auth/onboarding";
import OnboardingSteps from "../screens/auth/onboardingSteps"; // Add this import
import LoginScreen from "../screens/auth/login";
import { useAuth } from "../context/AuthContext";
import TabNavigator from "./TavNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isUserLoggedIn, profile, isLoading } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return null; // Or a loading component
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
          <Stack.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
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
