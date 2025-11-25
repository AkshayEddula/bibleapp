import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BookOpen,
  ChartSpline,
  LibraryBig,
  UserRound,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import ExploreScreen from "../screens/tabs/exploreScreen";
import HomeScreen from "../screens/tabs/homeScreen";
import ProfileScreen from "../screens/tabs/profileScreen";
import StatsScreen from "../screens/tabs/statsScreen";

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const activeIndex = useSharedValue(state.index);
  const [tabBarWidth, setTabBarWidth] = useState(0);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 60,
      stiffness: 120,
    });
  }, [state.index]);

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setTabBarWidth(width);
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    if (tabBarWidth === 0) return { left: 0 };

    const numberOfTabs = 4;
    const horizontalPadding = 16;
    const availableWidth = tabBarWidth - horizontalPadding * 2;
    const tabWidth = availableWidth / numberOfTabs;
    const indicatorWidth = 70;

    const leftPosition =
      horizontalPadding +
      activeIndex.value * tabWidth +
      (tabWidth - indicatorWidth) / 2;

    return {
      left: leftPosition,
    };
  });

  return (
    <View style={styles.tabBar} onLayout={onLayout}>
      {tabBarWidth > 0 && (
        <Animated.View
          style={[styles.slidingIndicator, animatedIndicatorStyle]}
        />
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

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

        // Icon mapping
        const icons = {
          Home: BookOpen,
          Explore: LibraryBig,
          Stats: ChartSpline,
          Profile: UserRound,
        };

        const IconComponent = icons[route.name];

        return (
          <TabButton
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            IconComponent={IconComponent}
            label={route.name}
          />
        );
      })}
    </View>
  );
}

function TabButton({ isFocused, onPress, IconComponent, label }) {
  // Animate icon scale and opacity
  const scale = useSharedValue(isFocused ? 1 : 0.9);
  const opacity = useSharedValue(isFocused ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.9, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withSpring(isFocused ? 1 : 0.7, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      className="flex-1 items-center justify-center z-10"
      activeOpacity={0.7}
    >
      <View className="items-center justify-center">
        <Animated.View style={animatedIconStyle}>
          <IconComponent
            color={isFocused ? "#133bb7" : "#8E8E93"}
            strokeWidth={1.5}
            size={20}
            pointerEvents="none"

          />
        </Animated.View>
        {isFocused && (
          <Text className="font-lexend-medium text-[#133bb7] tracking-tight text-[10px] mt-0.5">
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
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
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 76,
    position: "absolute",
    bottom: 14,
    left: 20,
    right: 20,
    borderRadius: 40,
    borderWidth: 0.5,
    borderColor: "hsl(0, 0%, 89%)",
    backgroundColor: "hsl(0, 0%, 96%)",
    shadowColor: "hsl(0, 0%, 70%)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  slidingIndicator: {
    position: "absolute",
    height: 48,
    width: 70, // Fixed width for the pill
    backgroundColor: "hsl(0, 0%, 100%)",
    borderRadius: 18,
    shadowColor: "hsl(0, 0%, 70%)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
