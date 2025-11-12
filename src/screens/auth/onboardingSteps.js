import { Check, CircleChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { TextInput } from "react-native";
import { ScrollView } from "react-native";

import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "react-native";

export default function OnboardingSteps() {
  const [activeVersion, SetActiveVersion] = useState(1);
  const [target, setTarget] = useState(1);
  const [selectCategroies, setSelectCategroies] = useState([0, 1, 2]);
  const [step, setStep] = useState(0);
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

  const { profile, updateProfile } = useAuth();

  const onboardingQuestions = [
    "What Version You Prefer ?",
    "What your daily Target ?",
    "Select More Than 3 Categroies",
  ];

  const toogleCategories = (index) => {
    if (selectCategroies.includes(index)) {
      setSelectCategroies(selectCategroies.filter((i) => i !== index));
    } else {
      setSelectCategroies([...selectCategroies, index]);
    }
  };

  // console.log(target);

  const categories = [
    "Faith",
    "Hope",
    "Love",
    "Wisdom",
    "Peace",
    "Encouragement",
    "Strength",
    "Forgiveness",
    "Prayer",
    "Healing",
    "Joy",
    "Guidance",
  ];

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <View>
              <Text className="text-[18px] font-lexend-medium tracking-tighter">
                {onboardingQuestions[step]}
              </Text>
            </View>
            <ScrollView className="mt-6 h-5/6">
              <View className="flex gap-y-4">
                {bibleVersions.map((version, index) => (
                  <Pressable
                    onPress={() => SetActiveVersion(index)}
                    key={index}
                    className={`flex flex-row px-6  ${activeVersion === index ? "bg-[#133bb7]" : "bg-gray-200"} items-center justify-center rounded-[16px] border-[0.5px] border-[#e1e1e1] py-3`}
                  >
                    <Text
                      className={`text-[20px] ${activeVersion === index ? "text-white" : "text-black"} font-lexend-light tracking-tighter`}
                    >
                      {version}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      case 1:
        return (
          <View>
            <View>
              <Text className="text-[18px] font-lexend-medium tracking-tighter">
                {onboardingQuestions[step]}
              </Text>
            </View>
            <View className="h-5/6 flex items-center justify-center">
              {/* <Text>This is step 2</Text>*/}
              <TextInput
                value={String(target)}
                onChangeText={(text) => setTarget(text)}
                placeholder="Enter Target Verses"
                className="border-[0.5px] text-center font-lexend text-[18px] px-3 border-[#212121]/50 w-full py-3 rounded-[16px]"
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <View>
              <Text className="text-[18px] font-lexend-medium tracking-tighter">
                {onboardingQuestions[step]}
              </Text>
            </View>
            <ScrollView className="h-5/6 px-4 py-4">
              <View className="flex flex-row flex-wrap gap-4">
                {categories.map((category, index) => (
                  <Pressable
                    onPress={() => toogleCategories(index)}
                    className={`${selectCategroies.includes(index) ? "bg-[#133bb7]" : "bg-gray-200"} rounded-lg p-6 flex-1 min-w-[46%] max-w-[48%]`}
                    key={index}
                  >
                    <Text
                      className={`${selectCategroies.includes(index) ? "text-white" : "text-gray-900"}   font-medium text-base`}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        );
    }
  };

  const NextHandler = async (step) => {
    if (step === 2) {
      const selectedCategoryNames = selectCategroies.map(
        (index) => categories[index],
      );
      console.log(
        bibleVersions[activeVersion],
        target,
        selectedCategoryNames,
        profile,
      );

      // inserting in supabase
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
          {
            onConflict: "user_id",
          },
        );

        if (error) {
          console.error("Supabase error:", error);
          Alert.alert("Error", "Failed to save preferences");
          return { success: false, error };
        }

        // Only update profile if no error
        await updateProfile({ is_onboarded: true });
        Alert.alert("Success", "Preferences saved!");
        return { success: true };
      } catch (error) {
        console.error("Error saving preferences:", error);
        Alert.alert("Error", error.message);
        return { success: false, error };
      }
    } else if (step >= 0 && step < 2) {
      setStep(step + 1);
    } else {
      console.log("no step is there");
    }
  };

  return (
    <SafeAreaView>
      <View className="mx-4">
        <View className="flex flex-row justify-between items-center">
          <Text className="text-[16px] font-lexend tracking-tighter">
            Onboarding Steps
          </Text>
        </View>
        {/* questions*/}
        <View className="my-4">
          {/* questions */}

          {renderContent()}
          <View className="pt-4">
            <Pressable
              onPress={() => NextHandler(step)}
              className="flex border-[0.5px] border-[#e1e1e1] items-center py-3 rounded-[14px] bg-[#133bb7]"
            >
              <Text className="text-[18px] font-lexend tracking-tighter text-white">
                Next
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
