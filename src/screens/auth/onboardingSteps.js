import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Check,
  ChevronLeft,
  Edit3,
  Heart,
  Sparkles,
  Target,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function OnboardingSteps() {
  const [activeVersion, setActiveVersion] = useState(0);
  const [target, setTarget] = useState("10");
  const [selectCategories, setSelectCategories] = useState([]);
  const [step, setStep] = useState(0);
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const { profile, updateProfile } = useAuth();

  // Animations
  const fadeIn = useSharedValue(0);
  const slideIn = useSharedValue(30);

  useEffect(() => {
    fadeIn.value = 0;
    slideIn.value = 30;
    fadeIn.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    slideIn.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [step]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideIn.value }],
  }));

  const bibleVersions = [
    { name: "NIV", full: "New International Version", popular: true },
    { name: "ESV", full: "English Standard Version", popular: true },
    { name: "NLT", full: "New Living Translation", popular: true },
    { name: "KJV", full: "King James Version", popular: false },
    { name: "NKJV", full: "New King James Version", popular: false },
    { name: "NASB", full: "New American Standard", popular: false },
    { name: "MSG", full: "The Message", popular: false },
    { name: "AMP", full: "Amplified Bible", popular: false },
    { name: "CSB", full: "Christian Standard Bible", popular: false },
    { name: "NET", full: "New English Translation", popular: false },
  ];

  const categories = [
    { name: "Faith", emoji: "✨", color: "#FCD34D" },
    { name: "Hope", emoji: "🌟", color: "#A7F3D0" },
    { name: "Love", emoji: "❤️", color: "#FCA5A5" },
    { name: "Wisdom", emoji: "🦉", color: "#C4B5FD" },
    { name: "Peace", emoji: "🕊️", color: "#93C5FD" },
    { name: "Strength", emoji: "💪", color: "#FDE047" },
    { name: "Forgiveness", emoji: "🤝", color: "#FED7AA" },
    { name: "Prayer", emoji: "🙏", color: "#DDD6FE" },
    { name: "Healing", emoji: "💚", color: "#86EFAC" },
    { name: "Joy", emoji: "😊", color: "#FEF08A" },
    { name: "Guidance", emoji: "🧭", color: "#BAE6FD" },
  ];

  const toggleCategories = (index) => {
    if (selectCategories.includes(index)) {
      setSelectCategories(selectCategories.filter((i) => i !== index));
    } else {
      setSelectCategories([...selectCategories, index]);
    }
  };

  const NextHandler = async (currentStep) => {
    if (currentStep === 2) {
      if (selectCategories.length < 3) {
        Alert.alert(
          "Almost there! 🙏",
          "Please select at least 3 topics to personalize your experience"
        );
        return;
      }

      const selectedCategoryNames = selectCategories.map(
        (index) => categories[index].name,
      );

      try {
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: profile.id,
            preferred_versions: [bibleVersions[activeVersion].name],
            daily_verse_goal: parseInt(target),
            target_categories: selectedCategoryNames,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error) {
          console.error("Supabase error:", error);
          Alert.alert("Error", "Failed to save preferences");
          return { success: false, error };
        }

        await updateProfile({ is_onboarded: true });
        Alert.alert(
          "All Set! 🎉",
          "Your personalized Bible journey begins now!",
        );
        return { success: true };
      } catch (error) {
        console.error("Error saving preferences:", error);
        Alert.alert("Error", error.message);
        return { success: false, error };
      }
    } else if (currentStep >= 0 && currentStep < 2) {
      if (currentStep === 1 && (!target || parseInt(target) < 1)) {
        Alert.alert(
          "Hold on! 📖",
          "Please set a daily goal of at least 1 verse",
        );
        return;
      }
      setStep(currentStep + 1);
    }
  };

  const BackHandler = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View style={contentStyle} className="flex-1">
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 4 }}
            >
              {/* Popular Versions Section */}
              <Text className="text-[13px] text-amber-700 font-lexend-semibold mb-3 px-1">
                📖 MOST POPULAR
              </Text>
              <View className="gap-3 mb-6">
                {bibleVersions.filter(v => v.popular).map((version, index) => {
                  const actualIndex = bibleVersions.indexOf(version);
                  return (
                    <Pressable
                      onPress={() => setActiveVersion(actualIndex)}
                      key={actualIndex}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View
                        style={{
                          backgroundColor: activeVersion === actualIndex ? '#FFFBEB' : '#FFFFFF',
                          paddingHorizontal: 20,
                          paddingVertical: 18,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: activeVersion === actualIndex ? '#F59E0B' : '#E5E7EB',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.03,
                          shadowRadius: 3,
                          elevation: 1,
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-[18px] font-lexend-bold text-gray-900 mb-1">
                              {version.name}
                            </Text>
                            <Text className="text-[13px] text-gray-500 font-lexend-light">
                              {version.full}
                            </Text>
                          </View>
                          {activeVersion === actualIndex && (
                            <View className="bg-amber-500 rounded-full p-1.5">
                              <Check size={16} color="#FFFFFF" strokeWidth={3} />
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Other Versions Section */}
              <Text className="text-[13px] text-gray-500 font-lexend-semibold mb-3 px-1">
                OTHER VERSIONS
              </Text>
              <View className="gap-3">
                {bibleVersions.filter(v => !v.popular).map((version, index) => {
                  const actualIndex = bibleVersions.indexOf(version);
                  return (
                    <Pressable
                      onPress={() => setActiveVersion(actualIndex)}
                      key={actualIndex}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View
                        style={{
                          backgroundColor: activeVersion === actualIndex ? '#FFFBEB' : '#FFFFFF',
                          paddingHorizontal: 20,
                          paddingVertical: 18,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: activeVersion === actualIndex ? '#F59E0B' : '#F3F4F6',
                          shadowColor: activeVersion === actualIndex ? '#F59E0B' : '#000',
                          shadowOffset: { width: 0, height: activeVersion === actualIndex ? 4 : 2 },
                          shadowOpacity: activeVersion === actualIndex ? 0.15 : 0.05,
                          shadowRadius: activeVersion === actualIndex ? 8 : 3,
                          elevation: activeVersion === actualIndex ? 4 : 1,
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-[18px] font-lexend-bold text-gray-900 mb-1">
                              {version.name}
                            </Text>
                            <Text className="text-[13px] text-gray-500 font-lexend-light">
                              {version.full}
                            </Text>
                          </View>
                          {activeVersion === actualIndex && (
                            <View className="bg-amber-500 rounded-full p-1.5">
                              <Check size={16} color="#FFFFFF" strokeWidth={3} />
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 1:
        const goals = [
          { value: 3, label: "Light", subtitle: "3 verses/day · ~2 min", emoji: "🌱" },
          { value: 5, label: "Steady", subtitle: "5 verses/day · ~3 min", emoji: "📖" },
          { value: 10, label: "Committed", subtitle: "10 verses/day · ~5 min", emoji: "✨" },
          { value: 15, label: "Devoted", subtitle: "15 verses/day · ~8 min", emoji: "🔥" },
        ];

        return (
          <Animated.View
            style={contentStyle}
            className="flex-1 justify-center px-2"
          >
            <View className="gap-3">
              {goals.map((goal) => (
                <Pressable
                  key={goal.value}
                  onPress={() => {
                    setIsCustomGoal(false);
                    setTarget(String(goal.value));
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <View
                    style={{
                      backgroundColor: !isCustomGoal && parseInt(target) === goal.value ? '#FFFBEB' : '#FFFFFF',
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor: !isCustomGoal && parseInt(target) === goal.value ? '#F59E0B' : '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center px-4 py-4">
                      {/* Emoji Circle */}
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center mr-3.5 ${!isCustomGoal && parseInt(target) === goal.value ? 'bg-amber-100' : 'bg-gray-50'
                          }`}
                      >
                        <Text className="text-[24px]">{goal.emoji}</Text>
                      </View>

                      {/* Text Content */}
                      <View className="flex-1">
                        <Text className="text-[17px] font-lexend-bold text-gray-900 mb-0.5">
                          {goal.label}
                        </Text>
                        <Text className="text-[13px] text-gray-500 font-lexend-light">
                          {goal.subtitle}
                        </Text>
                      </View>

                      {/* Check Icon */}
                      {!isCustomGoal && parseInt(target) === goal.value && (
                        <View className="bg-amber-500 rounded-full p-1.5">
                          <Check size={16} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}

              {/* Custom Goal Option */}
              <Pressable
                onPress={() => {
                  setIsCustomGoal(true);
                  if (customValue) {
                    setTarget(customValue);
                  }
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    backgroundColor: isCustomGoal ? '#FFFBEB' : '#FFFFFF',
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: isCustomGoal ? '#F59E0B' : '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <View className="px-4 py-4">
                    <View className="flex-row items-center">
                      {/* Icon Circle */}
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center mr-3.5 ${isCustomGoal ? 'bg-amber-100' : 'bg-gray-50'
                          }`}
                      >
                        <Edit3 size={20} color={isCustomGoal ? '#F59E0B' : '#6B7280'} strokeWidth={2} />
                      </View>

                      {/* Text Content */}
                      <View className="flex-1">
                        <Text className="text-[17px] font-lexend-bold text-gray-900 mb-0.5">
                          Custom Goal
                        </Text>
                        <Text className="text-[13px] text-gray-500 font-lexend-light">
                          Set your own daily target
                        </Text>
                      </View>

                      {/* Check Icon */}
                      {isCustomGoal && customValue && parseInt(customValue) > 0 && (
                        <View className="bg-amber-500 rounded-full p-1.5">
                          <Check size={16} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    {/* Input Field - Only shown when custom is selected */}
                    {isCustomGoal && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center gap-2">
                          <TextInput
                            value={customValue}
                            onChangeText={(text) => {
                              // Only allow numbers
                              const numericValue = text.replace(/[^0-9]/g, '');
                              setCustomValue(numericValue);
                              setTarget(numericValue);
                            }}
                            placeholder="Enter verses"
                            keyboardType="number-pad"
                            maxLength={3}
                            autoFocus
                            className="text-[15px] font-lexend-medium text-gray-900 bg-white px-4 py-3 rounded-xl border-2 border-amber-200 min-w-[100px]"
                            placeholderTextColor="#9CA3AF"
                          />
                          <Text className="text-[14px] text-gray-600 font-lexend-medium">
                            verses/day
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>

              {/* Info Card */}
              <View className="bg-blue-50/60 rounded-xl p-4 mt-3 border border-blue-100/50">
                <Text className="text-[12px] text-blue-900 font-lexend-light text-center leading-5">
                  💡 Start small and build consistency
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={contentStyle} className="flex-1">
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 4 }}
            >
              {/* Progress Indicator */}
              <View className="mb-5">
                <LinearGradient
                  colors={selectCategories.length >= 3 ? ['#ECFDF5', '#D1FAE5'] : ['#FFFBEB', '#FEF3C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1.5,
                    borderColor: selectCategories.length >= 3 ? '#A7F3D0' : '#FDE68A',
                    shadowColor: selectCategories.length >= 3 ? '#10B981' : '#F59E0B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-9 h-9 rounded-full items-center justify-center ${selectCategories.length >= 3 ? 'bg-green-500' : 'bg-amber-500'}`}>
                        <Heart size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
                      </View>
                      <Text className="text-[15px] font-lexend-bold text-gray-900">
                        Your Selection
                      </Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-full ${selectCategories.length >= 3 ? 'bg-green-500' : 'bg-amber-500'}`}>
                      <Text className="text-[13px] font-lexend-bold text-white">
                        {selectCategories.length} / 3 {selectCategories.length >= 3 ? '✓' : ''}
                      </Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View className="h-3 bg-white/50 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={selectCategories.length >= 3 ? ['#10B981', '#059669'] : ['#FBBF24', '#F59E0B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: '100%',
                        width: `${Math.min((selectCategories.length / 3) * 100, 100)}%`,
                        borderRadius: 999
                      }}
                    />
                  </View>
                  {selectCategories.length < 3 && (
                    <Text className="text-[12px] text-amber-800 font-lexend-medium mt-2 text-center">
                      Select {3 - selectCategories.length} more topic{3 - selectCategories.length !== 1 ? 's' : ''} to continue
                    </Text>
                  )}
                </LinearGradient>
              </View>

              {/* Categories Grid */}
              <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
                {categories.map((category, index) => {
                  const isSelected = selectCategories.includes(index);
                  return (
                    <View
                      key={index}
                      style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}
                    >
                      <Pressable
                        onPress={() => toggleCategories(index)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.85 : 1,
                          transform: [{ scale: pressed ? 0.97 : 1 }]
                        })}
                      >
                        <LinearGradient
                          colors={isSelected
                            ? ['#FFFBEB', '#FEF3C7']
                            : ['#FFFFFF', '#FAFAFA']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            padding: 20,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: isSelected ? '#F59E0B' : '#E5E7EB',
                            shadowColor: isSelected ? '#F59E0B' : '#000',
                            shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                            shadowOpacity: isSelected ? 0.2 : 0.05,
                            shadowRadius: isSelected ? 8 : 3,
                            elevation: isSelected ? 4 : 1,
                            minHeight: 120,
                          }}
                        >
                          <View className="items-center justify-center gap-3 flex-1">
                            <View
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: isSelected ? category.color : '#F3F4F6',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: isSelected ? category.color : '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isSelected ? 0.3 : 0.1,
                                shadowRadius: 4,
                                elevation: 2
                              }}
                            >
                              <Text className="text-[28px]">{category.emoji}</Text>
                            </View>
                            <Text
                              className={`font-lexend-bold text-[15px] text-center ${isSelected ? "text-gray-900" : "text-gray-600"
                                }`}
                              numberOfLines={1}
                            >
                              {category.name}
                            </Text>
                          </View>
                          {isSelected && (
                            <View
                              className="absolute bg-amber-500 rounded-full p-1.5"
                              style={{
                                top: 6,
                                right: 6,
                                shadowColor: '#F59E0B',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.4,
                                shadowRadius: 4,
                                elevation: 3
                              }}
                            >
                              <Check size={14} color="#FFFFFF" strokeWidth={3.5} />
                            </View>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Info Card */}
              <LinearGradient
                colors={['#F5F3FF', '#EDE9FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  marginTop: 24,
                  borderWidth: 1.5,
                  borderColor: '#DDD6FE',
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 2
                }}
              >
                <View className="flex-row items-start gap-3">
                  <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center">
                    <Sparkles size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] text-purple-900 font-lexend-bold mb-1">
                      Personalized Content
                    </Text>
                    <Text className="text-[13px] text-purple-800 font-lexend-regular leading-5">
                      We'll curate daily verses that match your interests and help you grow spiritually
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </ScrollView>
          </Animated.View>
        );
    }
  };

  const stepTitles = [
    { title: "Choose Your Bible", subtitle: "Select your preferred translation", icon: BookOpen },
    { title: "Set Your Daily Goal", subtitle: "How many verses per day?", icon: Target },
    { title: "Pick Your Topics", subtitle: "What matters most to you?", icon: Heart },
  ];

  return (
    <LinearGradient
      colors={["#FFFDF7", "#FFF9EB", "#FFF4D6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 pt-2 pb-6">
            {/* Back button + Progress */}
            <View className="flex-row items-center justify-between mb-6">
              {step > 0 ? (
                <Pressable onPress={BackHandler} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                  <View className="flex-row items-center gap-1 py-2">
                    <ChevronLeft size={22} color="#78350F" strokeWidth={2.5} />
                    <Text className="text-[16px] font-lexend-semibold text-amber-900">
                      Back
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <View />
              )}

              {/* Progress dots */}
              <View className="flex-row gap-2">
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      height: 8,
                      width: i === step ? 28 : 8,
                      borderRadius: 4,
                      backgroundColor: i === step ? '#F59E0B' : i < step ? '#FCD34D' : '#E5E7EB',
                    }}
                  />
                ))}
              </View>

              <View style={{ width: 60 }} />
            </View>

            {/* Title Section */}
            <View className="gap-2">
              <Text className="text-[30px] font-lexend-bold text-gray-900 leading-tight">
                {stepTitles[step].title}
              </Text>
              <Text className="text-[15px] text-gray-600 font-lexend-light">
                {stepTitles[step].subtitle}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 px-6">{renderContent()}</View>

          {/* Next Button - Fixed at bottom */}
          <View className="px-6 pb-6 pt-4">
            <Pressable
              onPress={() => NextHandler(step)}
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }
              ]}
            >
              <LinearGradient
                colors={['#FDE68A', '#FCD34D', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 18,
                  gap: 10,
                  borderRadius: 20,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <Text className="text-[17px] font-lexend-bold text-amber-950">
                  {step === 2 ? "Start Reading 📖" : "Continue"}
                </Text>
                {step !== 2 && <Sparkles size={18} color="#78350F" fill="#FDE68A" />}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}