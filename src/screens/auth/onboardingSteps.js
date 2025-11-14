import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Check,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Target,
  Heart,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function OnboardingSteps() {
  const [activeVersion, setActiveVersion] = useState(0);
  const [target, setTarget] = useState("1");
  const [selectCategories, setSelectCategories] = useState([0, 1, 2]);
  const [step, setStep] = useState(0);

  const { profile, updateProfile } = useAuth();

  // Animations
  const fadeIn = useSharedValue(0);
  const slideIn = useSharedValue(30);

  useEffect(() => {
    fadeIn.value = 0;
    slideIn.value = 30;
    fadeIn.value = withTiming(1, { duration: 500 });
    slideIn.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
  }, [step]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideIn.value }],
  }));

  const bibleVersions = [
    "KJV",
    "NKJV",
    "NIV",
    "NLT",
    "ESV",
    "NASB",
    "RSV",
    "NRSV",
    "CSB",
    "HCSB",
    "AMP",
    "GNT",
    "CEV",
    "MSG",
    "TPT",
    "NCV",
    "NET",
    "WEB",
    "MEV",
    "CEB",
    "GW",
    "YLT",
    "ASV",
    "NABRE",
    "NJB",
    "JB",
    "Douay-Rheims",
    "RVR1960",
    "NVI",
    "DHH",
    "TLA",
    "ERV-HI",
    "HINOV",
    "Telugu OV",
    "Telugu BSI",
    "Tamil OV",
    "Tamil BSI",
    "Malayalam OV",
    "Malayalam BSI",
  ];

  const categories = [
    "Faith",
    "Hope",
    "Love",
    "Wisdom",
    "Peace",
    "Strength",
    "Forgiveness",
    "Prayer",
    "Healing",
    "Joy",
    "Guidance",
  ];

  const onboardingQuestions = [
    {
      title: "Choose Your Bible Version",
      subtitle: "Select the translation you prefer for daily verses",
      icon: BookOpen,
    },
    {
      title: "Set Your Daily Goal",
      subtitle: "How many verses would you like to read each day?",
      icon: Target,
    },
    {
      title: "Pick Your Interests",
      subtitle: "Select at least 3 categories that resonate with you",
      icon: Heart,
    },
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
          "Almost there!",
          "Please select at least 3 categories to continue",
        );
        return;
      }

      const selectedCategoryNames = selectCategories.map(
        (index) => categories[index],
      );

      try {
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: profile.id,
            preferred_versions: [bibleVersions[activeVersion]],
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
          "Your preferences have been saved successfully!",
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
          "Hold on!",
          "Please enter a valid daily goal (at least 1 verse)",
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
    const IconComponent = onboardingQuestions[step].icon;

    switch (step) {
      case 0:
        return (
          <Animated.View style={contentStyle} className="flex-1">
            <ScrollView
              className="flex-1 px-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="gap-3">
                {bibleVersions.map((version, index) => (
                  <Pressable
                    onPress={() => setActiveVersion(index)}
                    key={index}
                    className="active:scale-[0.98]"
                  >
                    <LinearGradient
                      colors={
                        activeVersion === index
                          ? ["#FEE8A0", "#F9C846"]
                          : ["#fafafa", "#f5f5f5"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingHorizontal: 24,
                        paddingVertical: 16,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor:
                          activeVersion === index ? "#FCD34D" : "#E5E7EB",
                        shadowColor:
                          activeVersion === index ? "#F9C846" : "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: activeVersion === index ? 0.2 : 0.05,
                        shadowRadius: 4,
                        elevation: activeVersion === index ? 4 : 1,
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-[18px] font-lexend-medium ${
                            activeVersion === index
                              ? "text-gray-800"
                              : "text-gray-700"
                          }`}
                        >
                          {version}
                        </Text>
                        {activeVersion === index && (
                          <View className="bg-white rounded-full p-1">
                            <Check size={18} color="#F9C846" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 1:
        const quickGoals = [5, 10, 15, 20, 25];

        return (
          <Animated.View
            style={contentStyle}
            className="flex-1 justify-center items-center px-4"
          >
            <View className="w-full gap-6">
              <View className="items-center gap-3">
                <View className="bg-amber-100/60 p-4 rounded-full">
                  <Target size={40} color="#F9C846" strokeWidth={2} />
                </View>
                <Text className="text-[16px] text-gray-600 font-lexend-light text-center">
                  Set a goal that works for you
                </Text>
              </View>

              {/* Input field */}
              <View className="relative">
                <TextInput
                  value={String(target)}
                  onChangeText={(text) =>
                    setTarget(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="0"
                  keyboardType="number-pad"
                  maxLength={2}
                  className="border-2 border-amber-200 bg-white text-center font-lexend-medium text-[48px] px-6 w-full py-6 rounded-[24px]"
                  style={{
                    shadowColor: "#F9C846",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                />
                <Text className="text-center text-gray-500 font-lexend-light text-[15px] mt-3">
                  verses per day
                </Text>
              </View>

              {/* Quick goal buttons */}
              <View className="flex-row justify-center flex-wrap gap-3 mt-2">
                {quickGoals.map((num) => (
                  <Pressable
                    key={num}
                    onPress={() => setTarget(String(num))}
                    className={`px-5 py-3 rounded-full border ${
                      parseInt(target) === num
                        ? "bg-amber-300 border-amber-400"
                        : "bg-white border-gray-200"
                    } active:scale-95`}
                    style={{
                      shadowColor:
                        parseInt(target) === num ? "#F9C846" : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: parseInt(target) === num ? 0.2 : 0,
                      shadowRadius: 4,
                      elevation: parseInt(target) === num ? 3 : 0,
                    }}
                  >
                    <Text
                      className={`font-lexend-medium text-[16px] ${
                        parseInt(target) === num
                          ? "text-gray-800"
                          : "text-gray-600"
                      }`}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="bg-amber-50 rounded-[18px] p-4 border border-amber-100">
                <Text className="text-[13px] text-gray-600 font-lexend-light text-center">
                  💡 Most people start with 5–15 verses daily
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={contentStyle} className="flex-1">
            <ScrollView
              className="flex-1 px-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="flex-row flex-wrap gap-3">
                {categories.map((category, index) => (
                  <Pressable
                    onPress={() => toggleCategories(index)}
                    key={index}
                    className="active:scale-95"
                    style={{ width: "47%" }}
                  >
                    <LinearGradient
                      colors={
                        selectCategories.includes(index)
                          ? ["#FEE8A0", "#F9C846"]
                          : ["#fafafa", "#f5f5f5"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className={`p-5 rounded-[18px] border ${
                        selectCategories.includes(index)
                          ? "border-amber-300"
                          : "border-gray-200"
                      }`}
                      style={{
                        padding: 20,
                        borderRadius: 18,
                        border: 1,
                        borderColor: selectCategories.includes(index)
                          ? "#FCD34D"
                          : "#E5E7EB",
                        shadowColor: selectCategories.includes(index)
                          ? "#F9C846"
                          : "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: selectCategories.includes(index)
                          ? 0.2
                          : 0.05,
                        shadowRadius: 4,
                        elevation: selectCategories.includes(index) ? 4 : 1,
                      }}
                    >
                      <View className="gap-2">
                        <Text
                          className={`font-lexend-medium text-[16px] ${
                            selectCategories.includes(index)
                              ? "text-gray-800"
                              : "text-gray-700"
                          }`}
                        >
                          {category}
                        </Text>
                        {selectCategories.includes(index) && (
                          <View className="absolute top-0 right-0 bg-white rounded-full p-1">
                            <Check size={16} color="#F9C846" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>

              <View className="bg-amber-50 rounded-[18px] p-4 border border-amber-100 mt-4">
                <Text className="text-[13px] text-gray-600 font-lexend-light text-center">
                  ✨ Selected: {selectCategories.length} / {categories.length}
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        );
    }
  };

  return (
    <LinearGradient
      colors={["#fffbf5", "#fff9e6", "#fef8ed"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-5">
          {/* Header */}
          <View className="py-4">
            <View className="flex-row items-center justify-between mb-4">
              {step > 0 ? (
                <Pressable onPress={BackHandler} className="active:opacity-60">
                  <View className="flex-row items-center gap-1">
                    <ChevronLeft size={24} color="#57534e" strokeWidth={2.5} />
                    <Text className="text-[16px] font-lexend text-stone-700">
                      Back
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <View />
              )}

              <View className="flex-row gap-2">
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    className={`h-2 rounded-full ${
                      i === step ? "w-8 bg-amber-400" : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </View>
            </View>

            {/* Question Header */}
            <View className="gap-2 mb-6">
              <View className="flex-row items-center gap-2">
                <View className="bg-amber-100/60 p-2 rounded-full">
                  {React.createElement(onboardingQuestions[step].icon, {
                    size: 24,
                    color: "#F9C846",
                    strokeWidth: 2,
                  })}
                </View>
                <Text className="text-[24px] font-lexend text-gray-800 flex-1">
                  {onboardingQuestions[step].title}
                </Text>
              </View>
              <Text className="text-[15px] text-gray-600 font-lexend-light ml-12">
                {onboardingQuestions[step].subtitle}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1">{renderContent()}</View>

          {/* Next Button */}
          <View className="py-6">
            <Pressable
              onPress={() => NextHandler(step)}
              className="rounded-[20px] overflow-hidden active:scale-[0.97]"
              style={{
                shadowColor: "#F9C846",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <LinearGradient
                colors={["#FEE8A0", "#F9C846", "#F6B73C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 20,
                  gap: 8,
                  borderWidth: 0.5,
                  borderColor: "rgb(255 255 255 / 0.6)",
                }}
              >
                <Text className="text-[18px] font-lexend-medium text-gray-800">
                  {step === 2 ? "Complete Setup" : "Continue"}
                </Text>
                <Sparkles size={20} color="#57534e" fill="#FEE8A0" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
