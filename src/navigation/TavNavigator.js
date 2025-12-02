import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import { Award05Icon, Home01Icon, Navigation04Icon, SparklesIcon, UserAiIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from "@hugeicons/react-native";
import ExploreScreen from "../screens/tabs/exploreScreen";
import HomeScreen from "../screens/tabs/homeScreen";
import PostsScreen from "../screens/tabs/postsScreen";
import ProfileScreen from "../screens/tabs/profileScreen";
import StatsScreen from "../screens/tabs/statsScreen";

const Tab = createBottomTabNavigator();

// --- Configuration ---
const COLORS = {
  primary: "#F9C846",        // Warm Yellow (matches home screen)
  middleBtnBg: "#F9C846",    // Warm Yellow
  middleBtnIcon: "#1E293B",  // Dark Gray for contrast
  inactive: "#9CA3AF",       // Subtle gray
  background: "#FDFCFB",     // Matches home screen gradient
  border: "#F7F5F2",         // Subtle border
  textActive: "#1E293B",     // Dark text
  gradientStart: "#FDFCFB",
  gradientEnd: "#F7F5F2",
};

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.tabBar,
        // {
        //   paddingTop: 10,
        //   paddingBottom: Platform.OS === "ios" ? 10 : 0,
        //   height: 70 + (Platform.OS === "ios" ? 10 : 0),
        // },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Check if this is the middle button (Index 2 in a 5-tab layout)
        const isMiddle = index === 2;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Icon Mapping
        const icons = {
          Home: Home01Icon,
          Explore: Navigation04Icon,
          Post: SparklesIcon,
          Stats: Award05Icon,
          Profile: UserAiIcon,
        };

        const IconName = icons[route.name];

        // --- RENDER MIDDLE BUTTON ---
        if (isMiddle) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.middleButtonContainer}
            >
              <View style={styles.middleButtonCircle}>
                <HugeiconsIcon
                  icon={IconName}
                  color="#fafafa"
                  size={28}
                  strokeWidth={1.3}
                  pointerEvents="none"
                />
              </View>
            </TouchableOpacity>
          );
        }

        // --- RENDER STANDARD TAB ---
        const iconColor = isFocused ? COLORS.primary : COLORS.inactive;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <HugeiconsIcon
                icon={IconName}
                color={iconColor}
                size={26}
                strokeWidth={isFocused ? 1.5 : 1.3}
                pointerEvents="none"
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: iconColor,
                  fontWeight: isFocused ? "600" : "400"
                },
              ]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Post" component={PostsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(156, 163, 175, 0.12)",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 84,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    // paddingTop: 8,
  },
  iconContainer: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
    fontFamily: "Lexend-Regular", // Make sure you have Lexend font loaded
  },
  // --- Middle Button Styles ---
  middleButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    // paddingTop: 8,
  },
  middleButtonCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.middleBtnBg,
    alignItems: "center",
    justifyContent: "center",
    // Warm glow shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});