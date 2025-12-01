import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function StoryCircle({ tag, color, icon, hasNew, onPress, isLoading }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="items-center mr-4"
      disabled={isLoading}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={hasNew ? color : ["#e7e5e4", "#d6d3d1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            padding: 3,
            shadowColor: hasNew ? color[1] : "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: hasNew ? 0.25 : 0.05,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="w-full h-full bg-white rounded-full items-center justify-center">
            {isLoading ? (
              <ActivityIndicator color={color[1]} />
            ) : (
              <Text className="text-[28px]">{icon}</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
      <Text className="text-xs font-lexend-medium text-gray-700 mt-2">
        {tag}
      </Text>
    </Pressable>
  );
}
