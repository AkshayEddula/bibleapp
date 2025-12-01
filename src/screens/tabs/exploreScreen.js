import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Bookmark, BookOpen, Heart, MessageCircle, Play, Search, Share2, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReelsViewer from "../../components/ReelsViewer";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { images } from "../../utils";

const { width } = Dimensions.get("window");
const GAP = 12;
const PADDING = 24;
const COLUMN_WIDTH = (width - (PADDING * 2) - GAP) / 2;

const NT_BOOKS = [
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

// Exact colors from HomeScreen storyTags
const TRENDING_COLORS = {
  liked: ["#FF9A9E", "#FECFEF"], // Strength
  saved: ["#FEE8A0", "#F9C846"], // Faith
  shared: ["#3b82f6", "#2563eb"], // Custom Blue for Share
  commented: ["#C1E1C1", "#A8E6CF"], // Encouragement
};

export default function ExploreScreen() {
  const [loading, setLoading] = useState(true);
  const [trendingVerses, setTrendingVerses] = useState({
    liked: [],
    saved: [],
    shared: [],
    commented: [],
  });
  const [randomChapters, setRandomChapters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [likedVerses, setLikedVerses] = useState(new Set());
  const [savedVerses, setSavedVerses] = useState(new Set());

  // Reels State
  const [reelsVisible, setReelsVisible] = useState(false);
  const [reelsVerses, setReelsVerses] = useState([]);
  const [initialReelsIndex, setInitialReelsIndex] = useState(0);
  const [reelsLoading, setReelsLoading] = useState(false); // New state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchExploreData();
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchExploreData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Trending Content (Most Liked, Saved, Shared, Commented)
      const fetchTrending = async (countColumn) => {
        // Step A: Get top IDs and counts
        const { data: countsData, error: countsError } = await supabase
          .from("verse_interaction_counts")
          .select("*")
          .order(countColumn, { ascending: false })
          .limit(10);

        if (countsError) throw countsError;
        if (!countsData || countsData.length === 0) return [];

        const verseIds = countsData.map(c => c.verse_id);
        const countsMap = countsData.reduce((acc, curr) => {
          acc[curr.verse_id] = curr;
          return acc;
        }, {});

        // Step B: Get verse details
        const { data: versesData, error: versesError } = await supabase
          .from("bible_verses")
          .select("*")
          .in("id", verseIds);

        if (versesError) throw versesError;

        // Step C: Merge and Sort (to maintain order from Step A)
        const merged = versesData.map(v => ({
          ...v,
          verse_interaction_counts: countsMap[v.id]
        }));

        // Sort again because .in() doesn't guarantee order
        return merged.sort((a, b) => {
          const countA = a.verse_interaction_counts[countColumn] || 0;
          const countB = b.verse_interaction_counts[countColumn] || 0;
          return countB - countA;
        });
      };

      const [liked, saved, shared, commented] = await Promise.all([
        fetchTrending("like_count"),
        fetchTrending("save_count"),
        fetchTrending("share_count"),
        fetchTrending("comment_count"),
      ]);

      setTrendingVerses({ liked, saved, shared, commented });

      // 2. Fetch Random Chapters (Initial Load)
      await fetchChapters();

      // 3. Fetch User Interactions (Likes, Saves)
      if (user) {
        const [likesResult, savesResult] = await Promise.all([
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "like"),
          supabase
            .from("verse_interactions")
            .select("verse_id")
            .eq("user_id", user.id)
            .eq("interaction_type", "save"),
        ]);

        if (likesResult.data) {
          setLikedVerses(new Set(likesResult.data.map((item) => item.verse_id)));
        }
        if (savesResult.data) {
          setSavedVerses(new Set(savesResult.data.map((item) => item.verse_id)));
        }
      }

    } catch (error) {
      console.error("Error fetching explore data:", error);
      Alert.alert("Connection Issue", "Could not load explore content. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Optimized search for large datasets
      // Use textSearch if available, otherwise use ilike
      const { data: versesData, error: versesError } = await supabase
        .from("bible_verses")
        .select("id, book, chapter, verse, content")
        .or(`content.ilike.%${query}%,book.ilike.%${query}%`)
        .limit(30); // Limit to 30 results for performance

      if (versesError) throw versesError;

      // Don't fetch interaction counts for search results to improve performance
      // They'll be loaded when user opens the verse in ReelsViewer
      setSearchResults(versesData || []);
    } catch (error) {
      console.error("Error searching:", error);
      Alert.alert("Search Error", "Something went wrong while searching.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleInteraction = async (verseId, type) => {
    if (!user) return;

    // Handle Share (Always Increment)
    if (type === "share") {
      // Update count locally
      setReelsVerses(prev => prev.map(v => {
        if (v.id === verseId) {
          const counts = v.verse_interaction_counts || {};
          return {
            ...v,
            verse_interaction_counts: {
              ...counts,
              share_count: (counts.share_count || 0) + 1
            }
          };
        }
        return v;
      }));

      // API Call
      try {
        await supabase.from("verse_interactions").insert({
          user_id: user.id,
          verse_id: verseId,
          interaction_type: "share",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        Alert.alert("Error", "Could not share verse.");
      }
      return;
    }

    // Handle Like & Save (Toggle)
    const isLike = type === "like";
    const isSave = type === "save";

    if (!isLike && !isSave) return; // Should not happen

    const currentState = isLike ? likedVerses : savedVerses;
    const setState = isLike ? setLikedVerses : setSavedVerses;
    const isCurrentlyActive = currentState.has(verseId);

    // Optimistic Update
    const newState = new Set(currentState);
    if (isCurrentlyActive) {
      newState.delete(verseId);
    } else {
      newState.add(verseId);
    }
    setState(newState);

    // Update counts in reelsVerses (if visible)
    setReelsVerses(prev => prev.map(v => {
      if (v.id === verseId) {
        const counts = v.verse_interaction_counts || {};
        const countKey = `${type} _count`;
        return {
          ...v,
          verse_interaction_counts: {
            ...counts,
            [countKey]: (counts[countKey] || 0) + (isCurrentlyActive ? -1 : 1)
          }
        };
      }
      return v;
    }));

    try {
      if (isCurrentlyActive) {
        await supabase
          .from("verse_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("verse_id", verseId)
          .eq("interaction_type", type);
      } else {
        await supabase.from("verse_interactions").insert({
          user_id: user.id,
          verse_id: verseId,
          interaction_type: type,
        });
      }
    } catch (error) {
      console.error(`Error toggling ${type}: `, error);
      setState(currentState);
      Alert.alert("Error", `Could not ${type} verse.`);
    }
  };

  const fetchChapters = async (bookFilter = null) => {
    try {
      // Simplified query to ensure we get data
      let query = supabase
        .from("bible_verses")
        .select("id, book, chapter, verse, content");
      // Removed strict 'New Testament' filter to ensure data flow, 
      // can re-add if we are sure about the data consistency.
      // .eq("testament", "New Testament");

      if (bookFilter) {
        query = query.eq("book", bookFilter);
      }

      // Fetch a smaller chunk to be faster, but enough to find unique chapters
      const { data: randomVerses, error: randomError } = await query.limit(500);

      if (randomError) throw randomError;

      if (!randomVerses || randomVerses.length === 0) {
        console.log("No verses found");
        setRandomChapters([]);
        return;
      }

      const uniqueChapters = [];
      const seen = new Set();

      // Shuffle first to get random chapters
      const shuffled = randomVerses.sort(() => 0.5 - Math.random());

      for (const v of shuffled) {
        const key = `${v.book} -${v.chapter} `;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueChapters.push({
            id: v.id,
            book: v.book,
            chapter: v.chapter,
            preview: v.content,
          });
        }
        if (uniqueChapters.length >= 20) break; // Show more chapters
      }

      setRandomChapters(uniqueChapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      Alert.alert("Error", "Could not load chapters.");
    }
  };

  const handleOpenReels = (verses, index) => {
    setReelsVerses(verses);
    setInitialReelsIndex(index);
    setReelsVisible(true);
  };

  const handleChapterPress = async (chapter) => {
    try {
      // IMPORTANT: Set loading FIRST, then clear verses, THEN open modal
      setReelsLoading(true);
      setReelsVerses([]);
      setReelsVisible(true);

      // Fetch verses
      const { data: versesData, error: versesError } = await supabase
        .from("bible_verses")
        .select("*")
        .eq("book", chapter.book)
        .eq("chapter", chapter.chapter)
        .order("verse", { ascending: true });

      if (versesError) throw versesError;

      // Fetch interaction counts for these verses
      const verseIds = versesData.map(v => v.id);
      const { data: countsData, error: countsError } = await supabase
        .from("verse_interaction_counts")
        .select("*")
        .in("verse_id", verseIds);

      // Merge counts with verses (don't throw error if counts fail)
      const countsMap = (countsData || []).reduce((acc, curr) => {
        acc[curr.verse_id] = curr;
        return acc;
      }, {});

      const versesWithCounts = versesData.map(v => ({
        ...v,
        verse_interaction_counts: countsMap[v.id] || {}
      }));

      // Update with actual data
      setReelsVerses(versesWithCounts);
      setInitialReelsIndex(0);
    } catch (error) {
      console.error("Error fetching chapter verses:", error);
      Alert.alert("Error", "Could not open chapter.");
    } finally {
      setReelsLoading(false); // Stop loading
    }
  };

  const handleBookPress = (book) => {
    // Set loading state SYNCHRONOUSLY before any async operations
    setReelsLoading(true);
    setReelsVerses([]);
    setReelsVisible(true);

    // Then start the async fetch
    fetchBookVerses(book);
  };

  const fetchBookVerses = async (book) => {
    try {
      console.log("Fetching verses for book:", book);

      // Artificial delay to ensure loading state is visible (and to prevent flickering)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch all verses from the book
      // Use ilike for case-insensitive matching just in case
      let { data: versesData, error: versesError } = await supabase
        .from("bible_verses")
        .select("*")
        .eq("book", book)
        .order("chapter", { ascending: true })
        .order("verse", { ascending: true })
        .limit(500);

      // If exact match fails, try case-insensitive
      if (!versesData || versesData.length === 0) {
        console.log("No exact match, trying ilike for:", book);
        const { data: retryData, error: retryError } = await supabase
          .from("bible_verses")
          .select("*")
          .ilike("book", book)
          .order("chapter", { ascending: true })
          .order("verse", { ascending: true })
          .limit(500);

        if (!retryError && retryData) {
          versesData = retryData;
          versesError = null;
        }
      }

      if (versesError) throw versesError;

      console.log(`Found ${versesData?.length || 0} verses for book: ${book}`);

      if (!versesData || versesData.length === 0) {
        // Don't set verses, let finally block set loading to false
        // This will trigger the empty state in ReelsViewer
        // Don't return - let finally execute
      } else {
        // Only fetch interaction counts if we have verses
        const verseIds = versesData.map(v => v.id);
        const { data: countsData } = await supabase
          .from("verse_interaction_counts")
          .select("*")
          .in("verse_id", verseIds);

        // Merge counts with verses
        const countsMap = (countsData || []).reduce((acc, curr) => {
          acc[curr.verse_id] = curr;
          return acc;
        }, {});

        const versesWithCounts = versesData.map(v => ({
          ...v,
          verse_interaction_counts: countsMap[v.id] || {}
        }));

        setReelsVerses(versesWithCounts);
        setInitialReelsIndex(0);
      }
    } catch (error) {
      console.error("Error fetching book verses:", error);
      Alert.alert("Error", "Could not load book.");
    } finally {
      setReelsLoading(false); // Always stop loading, whether we found verses or not
    }
  };

  const renderTrendingCard = (title, count, icon, colors, data) => (
    <Pressable
      onPress={() => handleOpenReels(data, 0)}
      style={{
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH * 1.3,
        marginBottom: 16,
        // Shadow on the container
        shadowColor: colors[0],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <View
        className="flex-1 rounded-[24px] overflow-hidden bg-white"
        style={{
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            padding: 20,
            justifyContent: 'space-between'
          }}
        >
          {/* Top Section */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)'
            }}>
              {icon}
            </View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)'
            }}>
              <Text className="text-white text-[10px] font-lexend-bold tracking-wide">TOP 10</Text>
            </View>
          </View>

          {/* Bottom Section with Lumi */}
          <View className="flex-row items-end justify-between">
            <View style={{ flex: 0.8, marginRight: 8, zIndex: 10 }}>
              <Text className="text-white/95 font-lexend-semibold text-xs uppercase tracking-wider mb-1">{title}</Text>
              <Text className="text-white font-lexend-bold text-3xl">{count}</Text>
            </View>
            <Image
              source={images.Char}
              style={{
                width: 72,
                height: 72,
                position: 'absolute',
                right: -16,
                bottom: -16,
                opacity: 0.95
              }}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={["#fdfcfb", "#f7f5f2", "#fdfcfb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header & Search */}
          <View className="px-6 py-4 mb-2">
            <Text className="text-3xl font-lexend-medium text-gray-900 mb-4">Explore</Text>

            <View className="flex-row items-center bg-white border border-gray-200/60 rounded-[18px] px-5 py-5 shadow-sm">
              <Search size={20} color="#9ca3af" />
              <TextInput
                placeholder="Search verses, topics, or books..."
                className="flex-1 ml-3 font-lexend-medium text-gray-900 text-[15px]"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  className="ml-2 active:opacity-50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color="#9ca3af" pointerEvents="none" />
                </Pressable>
              )}
            </View>
          </View>

          {loading ? (
            <View className="py-20">
              <ActivityIndicator size="large" color="#F9C846" />
            </View>
          ) : searchQuery.trim().length > 0 ? (
            // Search Results View
            <>
              <View className="px-6 mb-4">
                <Text className="text-lg font-lexend-bold text-gray-900 mb-2">
                  Search Results
                </Text>
                <Text className="text-sm font-lexend-light text-gray-500">
                  {isSearching ? "Searching..." : `Found ${searchResults.length} verse${searchResults.length !== 1 ? 's' : ''}`}
                </Text>
              </View>

              {isSearching ? (
                <View className="py-20">
                  <ActivityIndicator size="large" color="#F9C846" />
                </View>
              ) : searchResults.length === 0 ? (
                <View className="items-center py-20 px-6">
                  <Text className="text-5xl mb-4">🔍</Text>
                  <Text className="text-lg font-lexend-semibold text-gray-800 mb-2">
                    No results found
                  </Text>
                  <Text className="text-sm font-lexend-light text-gray-500 text-center">
                    Try searching for different keywords or book names
                  </Text>
                </View>
              ) : (
                <View className="px-6">
                  <View className="flex-row flex-wrap justify-between">
                    {searchResults.map((verse, index) => (
                      <Pressable
                        key={verse.id}
                        onPress={() => handleOpenReels(searchResults, index)}
                        style={{
                          width: COLUMN_WIDTH,
                          height: 100,
                          marginBottom: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        <View
                          className="flex-1 rounded-2xl overflow-hidden bg-white"
                          style={{
                            borderWidth: 1,
                            borderColor: '#f3f4f6'
                          }}
                        >
                          <View className="flex-1 p-4 justify-between">
                            <View>
                              <Text className="text-gray-900 font-lexend-bold text-base mb-1">
                                {verse.book}
                              </Text>
                              <Text className="text-gray-500 font-lexend-medium text-xs">
                                Chapter {verse.chapter}:{verse.verse}
                              </Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                              <Text className="text-gray-400 font-lexend-light text-xs flex-1" numberOfLines={1}>
                                {verse.content.substring(0, 30)}...
                              </Text>
                              <ArrowRight size={14} color="#9ca3af" />
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Trending Grid (Lumi Style) */}
              <View className="px-6 mb-10">
                <Text className="text-lg font-lexend-bold text-gray-900 mb-5">Trending Now</Text>
                <View className="flex-row flex-wrap justify-between">
                  {renderTrendingCard("Most Liked", trendingVerses.liked.length, <Heart size={22} color="white" fill="white" />, TRENDING_COLORS.liked, trendingVerses.liked)}
                  {renderTrendingCard("Most Saved", trendingVerses.saved.length, <Bookmark size={22} color="white" fill="white" />, TRENDING_COLORS.saved, trendingVerses.saved)}
                  {renderTrendingCard("Most Shared", trendingVerses.shared.length, <Share2 size={22} color="white" />, TRENDING_COLORS.shared, trendingVerses.shared)}
                  {renderTrendingCard("Most Discussed", trendingVerses.commented.length, <MessageCircle size={22} color="white" />, TRENDING_COLORS.commented, trendingVerses.commented)}
                </View>
              </View>

              {/* NT Books Grid (Modern Tiles) */}
              <View className="px-6 mb-10">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-lexend-bold text-gray-900">New Testament</Text>
                  <ArrowRight size={20} color="#9ca3af" />
                </View>

                <View className="flex-row flex-wrap justify-between">
                  {NT_BOOKS.map((book, index) => {
                    // Cycle through gradient colors for variety
                    const gradientSets = [
                      {
                        gradient: ['#dbeafe', '#bfdbfe'],
                        light: '#EFF6FF',
                        accent: '#93c5fd',
                        icon: '📖'
                      },
                      {
                        gradient: ['#d1fae5', '#a7f3d0'],
                        light: '#F0FDF4',
                        accent: '#6ee7b7',
                        icon: '✨'
                      },
                      {
                        gradient: ['#fed7aa', '#fdba74'],
                        light: '#FEF3C7',
                        accent: '#fb923c',
                        icon: '🕊️'
                      },
                      {
                        gradient: ['#e9d5ff', '#d8b4fe'],
                        light: '#FCE7F3',
                        accent: '#c084fc',
                        icon: '💫'
                      },
                    ];

                    const colorSet = gradientSets[index % 4];

                    return (
                      <Pressable
                        key={book}
                        onPress={() => handleBookPress(book)}
                        style={{
                          width: COLUMN_WIDTH,
                          height: 140,
                          marginBottom: 16,
                          shadowColor: colorSet.accent,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 4,
                        }}
                      >
                        <View
                          className="flex-1 rounded-3xl overflow-hidden"
                          style={{
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.6)',
                          }}
                        >
                          <LinearGradient
                            colors={colorSet.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              flex: 1,
                              padding: 16,
                              justifyContent: 'space-between'
                            }}
                          >
                            {/* Decorative circles in background */}
                            <View style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.4)' }} />
                            <View style={{ position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                            {/* Top section with icon and badge */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
                              <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2
                              }}>
                                <Text style={{ fontSize: 24 }}>{colorSet.icon}</Text>
                              </View>

                              {/* Chapter count badge */}
                              <View style={{
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.8)'
                              }}>
                                <Text className="text-gray-700 text-[10px] font-lexend-bold">NEW</Text>
                              </View>
                            </View>

                            {/* Bottom section with book name */}
                            <View style={{ zIndex: 10 }}>
                              <Text className="text-gray-800 font-lexend-bold text-[16px] leading-5 mb-1" numberOfLines={2}>
                                {book}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <View style={{
                                  width: 20,
                                  height: 2,
                                  backgroundColor: 'rgba(0,0,0,0.2)',
                                  borderRadius: 1,
                                  marginRight: 6
                                }} />
                                <Text className="text-gray-600 text-[11px] font-lexend-medium">Testament</Text>
                              </View>
                            </View>
                          </LinearGradient>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Random Chapters Grid (Lumi Cards) */}
              <View className="px-6">
                <View className="flex-row items-center mb-5 gap-2">
                  <BookOpen size={22} color="#3b82f6" />
                  <Text className="text-lg font-lexend-bold text-gray-900">Discover Chapters</Text>
                </View>

                {randomChapters.length === 0 ? (
                  <View className="items-center py-10">
                    <Text className="text-gray-400 font-lexend-medium">No chapters found</Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap justify-between">
                    {randomChapters.map((chapter) => (
                      <Pressable
                        key={`${chapter.book} -${chapter.chapter} `}
                        onPress={() => handleChapterPress(chapter)}
                        className="rounded-[24px]"
                        style={{
                          width: COLUMN_WIDTH,
                          height: COLUMN_WIDTH * 1.5,
                          marginBottom: 16,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 4,
                        }}
                      >
                        <View
                          className="flex-1 overflow-hidden bg-gray-900 rounded-[24px]"

                        >
                          <ImageBackground
                            source={images.J1}
                            className="flex-1"
                            resizeMode="cover"
                            blurRadius={10}
                            style={{
                              borderRadius: 24
                            }}
                          >
                            <LinearGradient
                              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)']}
                              style={{
                                flex: 1,
                                width: '100%',
                                height: '100%',
                                padding: 18,
                                justifyContent: 'space-between'
                              }}
                            >
                              {/* Top Badge Section */}
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{
                                  backgroundColor: 'rgba(255,255,255,0.3)',
                                  paddingHorizontal: 14,
                                  paddingVertical: 7,
                                  borderRadius: 20,
                                  borderWidth: 1.5,
                                  borderColor: 'rgba(255,255,255,0.2)'
                                }}>
                                  <Text className="text-white text-[12px] font-lexend-bold uppercase tracking-wider">
                                    Ch. {chapter.chapter}
                                  </Text>
                                </View>
                                <View style={{
                                  backgroundColor: 'rgba(255,255,255,0.3)',
                                  padding: 10,
                                  borderRadius: 20,
                                  borderWidth: 1.5,
                                  borderColor: 'rgba(255,255,255,0.2)'
                                }}>
                                  <Play size={16} color="white" fill="white" />
                                </View>
                              </View>

                              {/* Bottom Content Section */}
                              <View>
                                {/* Book Name - Single Line */}
                                <Text
                                  className="text-white font-lexend-bold text-[18px] leading-5 mb-2"
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.7}
                                >
                                  {chapter.book}
                                </Text>

                                {/* Subtitle with Lumi */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                      width: 20,
                                      height: 2.5,
                                      backgroundColor: 'rgba(255,255,255,0.6)',
                                      borderRadius: 2,
                                      marginRight: 6
                                    }} />
                                    <Text className="text-white/90 text-[12px] font-lexend-semibold">
                                      Read Now
                                    </Text>
                                  </View>

                                  {/* Lumi Mascot */}
                                  <View style={{ marginRight: -8 }}>
                                    <Image
                                      source={images.Char}
                                      style={{ width: 64, height: 64 }}
                                      resizeMode="contain"
                                    />
                                  </View>
                                </View>
                              </View>
                            </LinearGradient>
                          </ImageBackground>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <ReelsViewer
        visible={reelsVisible}
        onClose={() => setReelsVisible(false)}
        verses={reelsVerses}
        initialIndex={initialReelsIndex}
        likedVerses={likedVerses}
        savedVerses={savedVerses}
        loading={reelsLoading}
        onInteraction={toggleInteraction}
      />
    </LinearGradient>
  );
}
