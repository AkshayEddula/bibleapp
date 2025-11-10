import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen from "../screens/auth/onboarding";
import LoginScreen from "../screens/auth/login";
import { useAuth } from "../context/AuthContext";
import TabNavigator from "./TavNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isUserLoggedIn } = useAuth();

  return (
    <Stack.Navigator>
      {isUserLoggedIn ? (
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
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
