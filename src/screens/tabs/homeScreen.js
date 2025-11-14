import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Bookmark, Heart } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

export default function HomeScreen() {
  const { isUserLoggedIn, user, logout, isLogoutLoading } = useAuth();
  const [verses, setVerses] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent double fetch in dev mode (StrictMode)
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    if (fetchedOnce.current) return; // block double fetch
    fetchedOnce.current = true;

    fetchVerses();
    countHandler();
  }, [isUserLoggedIn]);

  const fetchVerses = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supaError } = await supabase
        .from("bible_verses")
        .select();

      if (supaError) {
        setError(supaError.message);
      } else {
        setVerses(data);
        console.log(data);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const LikeHandler = async (verseId) => {
    console.log("Liked", verseId, user.id);
    try {
      const { data, error } = await supabase.from("verse_interactions").insert({
        user_id: user.id,
        verse_id: verseId,
        interaction_type: "like",
      });

      if (error) {
        console.log("Error During Liking Verse", error);
      }

      console.log("Added", data);
      return true;
    } catch (error) {
      console.error(error);
    }
  };

  const countHandler = async (
    verseId = "053f5104-b3e0-4c00-aabd-1ca03b538745",
  ) => {
    try {
      const { data, error } = await supabase
        .from("verse_interaction_counts")
        .select()
        .eq("verse_id", verseId)
        .single(); // <- return a single object instead of array

      if (error) {
        console.log("Error Fetching Count", error);
        return;
      }

      setCounts(data); // data is an object now
      console.log("Fetched count:", data); // log the returned data directly
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-200">
      <View className="flex-1 items-center px-4">
        <Text className="text-black text-2xl font-semibold mt-10">
          Home Screen
        </Text>

        {/* USER INFO */}
        <View className="items-center mt-4">
          <Text className="text-black">
            Name: {user?.user_metadata?.full_name ?? "Unknown"}
          </Text>
          <Text className="text-black">Email: {user?.email ?? "Unknown"}</Text>
        </View>

        {/* LOGOUT */}
        <Pressable
          className="bg-red-500 px-6 py-3 rounded-lg mt-6"
          disabled={isLogoutLoading}
          onPress={logout}
        >
          <Text className="text-white text-base">Logout</Text>
        </Pressable>

        {/* VERSES LIST */}
        <View className="w-full mt-8 max-h-[420px] rounded-lg">
          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator />
              <Text className="text-black mt-2">Loading verses...</Text>
            </View>
          )}

          {error && (
            <View className="py-4">
              <Text className="text-red-600 text-center">{error}</Text>
            </View>
          )}

          {!loading && verses.length === 0 && !error && (
            <View className="py-4">
              <Text className="text-black text-center">No verses found.</Text>
            </View>
          )}

          {!loading && verses.length > 0 && (
            <ScrollView className="px-1">
              {verses.map((verse, index) => (
                <View
                  key={verse.id ?? index}
                  className="bg-white p-4 mb-4 rounded-xl shadow"
                >
                  <Text className="font-bold text-black">
                    {verse.book} • Chapter {verse.chapter} • Verse {verse.verse}
                  </Text>
                  <Text className="mt-2 text-black">{verse.content}</Text>

                  {verse.meaning ? (
                    <Text className="mt-3 italic text-neutral-600">
                      {verse.meaning}
                    </Text>
                  ) : null}

                  <View className="flex flex-row gap-4 mt-6">
                    <TouchableOpacity onPress={() => LikeHandler(verse.id)}>
                      <Text>Like</Text>
                      <Text>{counts.like_count}</Text>
                    </TouchableOpacity>
                    <View>
                      <Bookmark />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
