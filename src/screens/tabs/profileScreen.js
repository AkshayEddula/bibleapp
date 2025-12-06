import { Alert02Icon, Cancel01Icon, FavouriteIcon, Files02Icon, InformationDiamondIcon, Logout02Icon, MessageFavourite01Icon, Settings01Icon, ShieldEnergyIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import ReelsViewer from "../../components/ReelsViewer";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { supabase } from "../../lib/supabase";
import { images } from "../../utils";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 3; // 3 columns for verses
const POST_CARD_SIZE = (width - 48) / 2 - 6; // 2 columns for posts

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isPremium } = useSubscription();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // posts, liked, saved

  // Data states
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedVerses, setLikedVerses] = useState([]);
  const [savedVerses, setSavedVerses] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    postsCount: 0,
    likedCount: 0,
    savedCount: 0,
  });

  // Gamification Stats
  const [gamificationStats, setGamificationStats] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);

  // ReelsViewer state
  const [reelsVisible, setReelsVisible] = useState(false);
  const [reelsVerses, setReelsVerses] = useState([]);
  const [initialReelsIndex, setInitialReelsIndex] = useState(0);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Post Detail Modal State
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Breathing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Validation
      if (!user?.id) {
        console.warn("User not authenticated");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch profile with error handling
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Continue with other data even if profile fails
      } else {
        setProfile(profileData);
      }

      // Fetch Gamification Stats
      const { data: gameStats, error: gameError } = await supabase
        .from("gamification_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (gameError) {
        console.error("Error fetching gamification stats:", gameError);
      } else {
        setGamificationStats(gameStats);
      }

      // Fetch Badge Count
      const { count: badgesCount, error: badgesError } = await supabase
        .from("user_badges")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      if (badgesError) {
        console.error("Error fetching badges count:", badgesError);
      } else {
        setBadgeCount(badgesCount || 0);
      }

      // Fetch testimonials with counts and error handling
      const { data: testimonialsData, error: testimonialsError } = await supabase
        .from("testimonies")
        .select(`
          *,
          prayer_requests (
            title,
            description,
            category
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (testimonialsError) {
        console.error("Error fetching testimonials:", testimonialsError);
      }

      const testimonialsWithCounts = await Promise.all(
        (testimonialsData || []).map(async (t) => {
          try {
            const [reactionsResult, commentsResult] = await Promise.all([
              supabase
                .from("testimony_reactions")
                .select("id", { count: "exact" })
                .eq("testimony_id", t.id),
              supabase
                .from("testimony_comments")
                .select("id", { count: "exact" })
                .eq("testimony_id", t.id)
            ]);

            return {
              ...t,
              type: 'testimonial',
              likes_count: reactionsResult.count || 0,
              commentCount: commentsResult.count || 0
            };
          } catch (error) {
            console.error(`Error processing testimony ${t.id}:`, error);
            // Return testimony with default counts if processing fails
            return {
              ...t,
              type: 'testimonial',
              likes_count: 0,
              commentCount: 0
            };
          }
        })
      );

      // Fetch prayers with counts and error handling
      const { data: prayersData, error: prayersError } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (prayersError) {
        console.error("Error fetching prayers:", prayersError);
      }

      const prayersWithCounts = await Promise.all(
        (prayersData || []).map(async (p) => {
          try {
            const [reactionsResult, commentsResult] = await Promise.all([
              supabase
                .from("prayer_reactions")
                .select("id", { count: "exact" })
                .eq("prayer_request_id", p.id),
              supabase
                .from("prayer_comments")
                .select("id", { count: "exact" })
                .eq("prayer_request_id", p.id)
            ]);

            return {
              ...p,
              type: 'prayer',
              prayingCount: reactionsResult.count || 0,
              commentCount: commentsResult.count || 0
            };
          } catch (error) {
            console.error(`Error processing prayer ${p.id}:`, error);
            // Return prayer with default counts if processing fails
            return {
              ...p,
              type: 'prayer',
              prayingCount: 0,
              commentCount: 0
            };
          }
        })
      );

      // Combine and sort by date
      const combined = [
        ...testimonialsWithCounts,
        ...prayersWithCounts
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPosts(combined);

      // Fetch liked verses with error handling
      const { data: likedData, error: likedError } = await supabase
        .from("verse_interactions")
        .select(`
          *,
          bible_verses (*)
        `)
        .eq("user_id", user.id)
        .eq("interaction_type", "like")
        .order("created_at", { ascending: false });

      if (likedError) {
        console.error("Error fetching liked verses:", likedError);
        setLikedVerses([]);
      } else {
        setLikedVerses(likedData?.map(item => item.bible_verses).filter(Boolean) || []);
      }

      // Fetch saved verses with error handling
      const { data: savedData, error: savedError } = await supabase
        .from("verse_interactions")
        .select(`
          *,
          bible_verses (*)
        `)
        .eq("user_id", user.id)
        .eq("interaction_type", "save")
        .order("created_at", { ascending: false });

      if (savedError) {
        console.error("Error fetching saved verses:", savedError);
        setSavedVerses([]);
      } else {
        setSavedVerses(savedData?.map(item => item.bible_verses).filter(Boolean) || []);
      }

      // Update stats
      setStats({
        postsCount: combined?.length || 0,
        likedCount: likedData?.length || 0,
        savedCount: savedData?.length || 0,
      });

    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleVersePress = async (verse, index, allVerses) => {
    // Validation
    if (!verse || !allVerses || allVerses.length === 0) {
      console.warn("Invalid verse data");
      return;
    }

    setReelsLoading(true);
    setReelsVerses([]);
    setReelsVisible(true);

    try {
      // Fetch interaction counts for the verses
      const verseIds = allVerses.map(v => v.id).filter(Boolean);

      if (verseIds.length === 0) {
        setReelsVerses(allVerses);
        setInitialReelsIndex(index);
        setReelsLoading(false);
        return;
      }

      const { data: countsData, error: countsError } = await supabase
        .from("verse_interaction_counts")
        .select("*")
        .in("verse_id", verseIds);

      if (countsError) {
        console.error("Error fetching verse counts:", countsError);
        // Continue with verses without counts
      }

      const countsMap = (countsData || []).reduce((acc, curr) => {
        acc[curr.verse_id] = curr;
        return acc;
      }, {});

      const versesWithCounts = allVerses.map(v => ({
        ...v,
        verse_interaction_counts: countsMap[v.id] || {}
      }));

      setReelsVerses(versesWithCounts);
      setInitialReelsIndex(index);
    } catch (error) {
      console.error("Error in handleVersePress:", error);
      // Set verses without counts on error
      setReelsVerses(allVerses);
      setInitialReelsIndex(index);
    } finally {
      setReelsLoading(false);
    }
  };

  const renderVerseCard = ({ item, index }) => {
    const allVerses = activeTab === "liked" ? likedVerses : savedVerses;

    // Different gradient colors for liked vs saved
    const gradientColors = activeTab === "liked"
      ? ['rgba(167, 139, 250, 0.9)', 'rgba(139, 92, 246, 0.95)'] // Soft purple gradient for liked
      : ['rgba(59, 130, 246, 0.85)', 'rgba(37, 99, 235, 0.9)']; // Blue gradient for saved

    return (
      <Pressable
        onPress={() => handleVersePress(item, index, allVerses)}
        style={{
          width: CARD_SIZE,
          height: CARD_SIZE,
          margin: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.03)',
        }}
        className="overflow-hidden bg-white"
      >
        <Image
          source={images.J1}
          className="absolute w-full h-full"
          resizeMode="cover"
          blurRadius={8}
        />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
          }}
        >
          <View className="items-center">
            <Text className="text-white font-lexend-bold text-sm mb-1.5" numberOfLines={1}>
              {item.book}
            </Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-lexend-semibold text-xs">
                {item.chapter}:{item.verse}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const fetchPostDetails = async (post) => {
    // Validation
    if (!post || !post.id || !post.type) {
      console.warn("Invalid post data");
      setLoadingComments(false);
      return;
    }

    setLoadingComments(true);
    try {
      const isTestimonial = post.type === 'testimonial';
      const table = isTestimonial ? 'testimony_comments' : 'prayer_comments';
      const idField = isTestimonial ? 'testimony_id' : 'prayer_request_id';

      const { data, error } = await supabase
        .from(table)
        .select(`
          id,
          comment_text,
          created_at,
          user_id,
          profiles:user_id (
            display_name,
            profile_photo_url
          )
        `)
        .eq(idField, post.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        setPostComments([]);
      } else {
        setPostComments(data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setPostComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostPress = (post) => {
    if (!post) {
      console.warn("Invalid post");
      return;
    }
    setSelectedPost(post);
    setDetailModalVisible(true);
    fetchPostDetails(post);
  };


  const renderPostCard = ({ item }) => {
    const isTestimonial = item.type === 'testimonial';

    // Softer, more modern gradients
    const gradientColors = isTestimonial
      ? ['#fbbf24', '#f59e0b'] // Warm gold for testimonials
      : ['#a78bfa', '#8b5cf6']; // Soft purple for prayers

    return (
      <Pressable
        onPress={() => handlePostPress(item)}
        style={{
          width: POST_CARD_SIZE,
          height: POST_CARD_SIZE * 1.3,
          margin: 6,
          shadowColor: isTestimonial ? '#f59e0b' : '#8b5cf6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.03)',
        }}
        className="rounded-[28px] overflow-hidden bg-white"
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            padding: 16,
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-start">
            <View className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
              <Text className="text-white text-[10px] font-lexend-bold uppercase tracking-wider">
                {isTestimonial ? 'Story' : 'Prayer'}
              </Text>
            </View>
            <View className="bg-white/20 w-8 h-8 rounded-full items-center justify-center">
              <Text className="text-sm">{isTestimonial ? '✨' : '🙏'}</Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 justify-center py-2">
            <Text className="text-white font-lexend-bold text-lg leading-6 mb-2" numberOfLines={3}>
              {item.title}
            </Text>
            <Text className="text-white/90 font-lexend-medium text-xs leading-4" numberOfLines={2}>
              {isTestimonial ? item.content : item.description}
            </Text>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between pt-3 border-t border-white/20">
            <Text className="text-white/80 text-[10px] font-lexend-medium">
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <View className="flex-row items-center gap-2">
              {item.commentCount > 0 && (
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={MessageFavourite01Icon} size={10} color="rgba(255,255,255,0.9)" strokeWidth={2.5} pointerEvents="none" />
                  <Text className="text-white text-[10px] font-lexend-bold">
                    {item.commentCount}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-1">
                <HugeiconsIcon icon={FavouriteIcon} size={10} color="rgba(255,255,255,0.9)" strokeWidth={2.5} pointerEvents="none" />
                <Text className="text-white text-[10px] font-lexend-bold">
                  {isTestimonial ? item.likes_count : item.prayingCount}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderContent = () => {
    if (activeTab === "posts") {
      if (posts.length === 0) {
        return (
          <View className="flex-1 items-center justify-center py-20">
            <View className="bg-amber-50 w-20 h-20 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">📝</Text>
            </View>
            <Text className="text-gray-900 font-lexend-bold text-lg mb-2">No Posts Yet</Text>
            <Text className="text-gray-500 font-lexend-light text-center px-10">
              Share your testimonials and prayer requests to inspire others
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          key={activeTab} // Force re-render when tab changes
          data={posts}
          renderItem={renderPostCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12 }}
          scrollEnabled={false}
        />
      );
    }

    const data = activeTab === "liked" ? likedVerses : savedVerses;
    const emptyIcon = activeTab === "liked" ? "❤️" : "🔖";
    const emptyTitle = activeTab === "liked" ? "No Liked Verses" : "No Saved Verses";
    const emptyMessage = activeTab === "liked"
      ? "Verses you like will appear here"
      : "Verses you save will appear here";

    if (data.length === 0) {
      const bgColor = activeTab === "liked" ? "bg-red-50" : "bg-blue-50";
      return (
        <View className="flex-1 items-center justify-center py-20">
          <View className={`${bgColor} w-20 h-20 rounded-full items-center justify-center mb-4`}>
            <Text className="text-4xl">{emptyIcon}</Text>
          </View>
          <Text className="text-gray-900 font-lexend-bold text-lg mb-2">{emptyTitle}</Text>
          <Text className="text-gray-500 font-lexend-light text-center px-10">
            {emptyMessage}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key={activeTab} // Force re-render when tab changes
        data={data}
        renderItem={renderVerseCard}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 12 }}
        scrollEnabled={false}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6b7280" />
        </View>
      </SafeAreaView>
    );
  }





  return (
    <SafeAreaView className="flex-1 bg-white" edges={['none']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6b7280" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Beautiful Header with Lumi */}
        <View style={{ marginBottom: 20 }}>
          {/* Background Gradient & Decor */}
          <LinearGradient
            colors={['#FFFBEB', '#FEF3C7', '#f7f7f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 400,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            }}
          />

          {/* Decorative Orbs */}
          <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
          <View className="absolute top-[50] right-[-20] w-48 h-48 bg-orange-200/20 rounded-full blur-3xl" />

          {/* Settings Button */}
          <Pressable
            onPress={() => setSettingsVisible(true)}
            className="active:opacity-60"
            style={{
              position: 'absolute',
              top: 50,
              right: 24,
              zIndex: 100,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 16,
              padding: 12,
              backdropFilter: 'blur(10px)',
            }}
          >
            <HugeiconsIcon icon={Settings01Icon} size={22} color="#78716c" strokeWidth={2} pointerEvents="none" />
          </Pressable>

          {/* Header Content */}
          <View style={{ paddingTop: 40, paddingHorizontal: 24, alignItems: 'center' }}>

            {/* Animated Lumi Character */}
            <Animated.View
              style={{
                transform: [
                  { translateY: floatAnim },
                  { scale: scaleAnim }
                ],
                marginBottom: 24,
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.2,
                shadowRadius: 30,
              }}
            >
              <Image
                source={images.Char}
                style={{ width: 180, height: 180 }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* User Info Card - Glassmorphism */}
            <View
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.75)',
                borderRadius: 32,
                paddingVertical: 28,
                paddingHorizontal: 24,
                shadowColor: '#78350f',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.05,
                shadowRadius: 20,
                elevation: 5,
                borderWidth: 0.5,
                borderColor: '#e1e1e1',
              }}
            >
              <View className="items-center mb-2">
                <Text
                  className="text-gray-900 font-lexend-bold text-2xl mb-1"
                  numberOfLines={1}
                  style={{ letterSpacing: -0.5 }}
                >
                  {profile?.display_name || user.email?.split('@')[0]}
                </Text>
                <View className="bg-amber-100/50 px-3 py-1 rounded-full border border-amber-100">
                  <Text className="text-amber-800 font-lexend-medium text-xs">
                    {user.email}
                  </Text>
                </View>
              </View>

              {/* Gamification Stats */}
              {gamificationStats && (
                <View className="flex-row justify-between mt-6 pt-6 border-t border-gray-100">
                  {/* Level */}
                  <View className="items-center flex-1">
                    <Text className="text-gray-400 text-[10px] font-lexend-bold uppercase tracking-wider mb-1">
                      Level
                    </Text>
                    <Text className="text-gray-900 text-xl font-lexend-bold">
                      {gamificationStats.current_level}
                    </Text>
                  </View>

                  {/* XP */}
                  <View className="items-center flex-1 border-l border-gray-100">
                    <Text className="text-gray-400 text-[10px] font-lexend-bold uppercase tracking-wider mb-1">
                      XP
                    </Text>
                    <Text className="text-indigo-600 text-xl font-lexend-bold">
                      {gamificationStats.total_xp >= 1000
                        ? `${(gamificationStats.total_xp / 1000).toFixed(1)}k`
                        : gamificationStats.total_xp}
                    </Text>
                  </View>

                  {/* Badges */}
                  <View className="items-center flex-1 border-l border-gray-100">
                    <Text className="text-gray-400 text-[10px] font-lexend-bold uppercase tracking-wider mb-1">
                      Badges
                    </Text>
                    <Text className="text-amber-500 text-xl font-lexend-bold">
                      {badgeCount}
                    </Text>
                  </View>

                  {/* Streak */}
                  <View className="items-center flex-1 border-l border-gray-100">
                    <Text className="text-gray-400 text-[10px] font-lexend-bold uppercase tracking-wider mb-1">
                      Streak
                    </Text>
                    <Text className="text-orange-500 text-xl font-lexend-bold">
                      {gamificationStats.current_streak}🔥
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Upgrade to Premium Banner - Light Premium Theme */}
            {!isPremium && (
              <Pressable
                onPress={() => navigation.navigate("Paywall")}
                className="w-full mt-6"
              >
                <LinearGradient
                  colors={["#FFFBEB", "#ffffff"]} // Soft Warm Light Gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 1,
                    shadowColor: "#F59E0B",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                    borderWidth: 1,
                    borderColor: "#FEF3C7", // Amber-100/200
                  }}
                >
                  <View className="rounded-[23px] overflow-hidden p-5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4 flex-1">
                      <View className="w-12 h-12 rounded-full items-center justify-center bg-amber-100 border border-amber-200">
                        <HugeiconsIcon
                          icon={SparklesIcon}
                          size={24}
                          color="#D97706" // Amber-600
                          variant="solid"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-amber-950 font-lexend-bold text-lg leading-6">
                          Go Premium
                        </Text>
                        <Text className="text-amber-700/80 font-lexend-light text-xs mt-0.5 mr-2">
                          Unlock unlimited access & exclusive badges
                        </Text>
                      </View>
                    </View>

                    <View className="bg-amber-500 px-4 py-2 rounded-full shadow-sm shadow-amber-200">
                      <Text className="text-white font-lexend-bold text-xs tracking-wide">
                        UPGRADE
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>

        {/* Stats Cards - Beautiful Gradients */}
        <View style={{ paddingHorizontal: 20 }}>
          <View className="flex-row justify-between gap-2.5">
            <Pressable
              onPress={() => setActiveTab("posts")}
              className="flex-1"
              style={{
                shadowColor: activeTab === "posts" ? '#f59e0b' : '#94a3b8',
                shadowOffset: { width: 0, height: activeTab === "posts" ? 6 : 2 },
                shadowOpacity: activeTab === "posts" ? 0.25 : 0.1,
                shadowRadius: activeTab === "posts" ? 12 : 4,
                elevation: activeTab === "posts" ? 6 : 2,
                transform: [{ scale: activeTab === "posts" ? 1.02 : 1 }],
              }}
            >
              <LinearGradient
                colors={activeTab === "posts" ? ['#fbbf24', '#f59e0b'] : ['#fffbeb', '#fff7ed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderWidth: activeTab === "posts" ? 0 : 1,
                  borderColor: activeTab === "posts" ? 'transparent' : '#fcd34d',
                }}
              >
                <View className="items-center">
                  <Text
                    className="font-lexend-medium mb-0.5"
                    style={{
                      color: activeTab === "posts" ? '#ffffff' : '#92400e',
                      fontSize: 20,
                      letterSpacing: -1
                    }}
                  >
                    {stats.postsCount}
                  </Text>
                  <Text
                    className="font-lexend-semibold uppercase"
                    style={{
                      color: activeTab === "posts" ? 'rgba(255,255,255,0.9)' : '#b45309',
                      fontSize: 10,
                      letterSpacing: -0.2
                    }}
                  >
                    Posts
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("liked")}
              className="flex-1"
              style={{
                shadowColor: activeTab === "liked" ? '#8b5cf6' : '#94a3b8',
                shadowOffset: { width: 0, height: activeTab === "liked" ? 6 : 2 },
                shadowOpacity: activeTab === "liked" ? 0.25 : 0.1,
                shadowRadius: activeTab === "liked" ? 12 : 4,
                elevation: activeTab === "liked" ? 6 : 2,
                transform: [{ scale: activeTab === "liked" ? 1.02 : 1 }],
              }}
            >
              <LinearGradient
                colors={activeTab === "liked" ? ['#a78bfa', '#c4b5fd'] : ['#f5f3ff', '#ede9fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderWidth: activeTab === "liked" ? 0 : 1,
                  borderColor: activeTab === "liked" ? 'transparent' : '#ddd6fe',
                }}
              >
                <View className="items-center">
                  <Text
                    className="font-lexend-medium mb-0.5"
                    style={{
                      color: activeTab === "liked" ? '#ffffff' : '#5b21b6',
                      fontSize: 20,
                      letterSpacing: -0.4
                    }}
                  >
                    {stats.likedCount}
                  </Text>
                  <Text
                    className="font-lexend-semibold uppercase"
                    style={{
                      color: activeTab === "liked" ? 'rgba(255,255,255,0.9)' : '#7c3aed',
                      fontSize: 10,
                      letterSpacing: -0.2
                    }}
                  >
                    Liked
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("saved")}
              className="flex-1"
              style={{
                shadowColor: activeTab === "saved" ? '#3b82f6' : '#94a3b8',
                shadowOffset: { width: 0, height: activeTab === "saved" ? 6 : 2 },
                shadowOpacity: activeTab === "saved" ? 0.25 : 0.1,
                shadowRadius: activeTab === "saved" ? 12 : 4,
                elevation: activeTab === "saved" ? 6 : 2,
                transform: [{ scale: activeTab === "saved" ? 1.02 : 1 }],
              }}
            >
              <LinearGradient
                colors={activeTab === "saved" ? ['#60a5fa', '#3b82f6'] : ['#eff6ff', '#dbeafe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderWidth: activeTab === "saved" ? 0 : 1,
                  borderColor: activeTab === "saved" ? 'transparent' : '#bfdbfe',
                }}
              >
                <View className="items-center">
                  <Text
                    className="font-lexend-medium mb-0.5"
                    style={{
                      color: activeTab === "saved" ? '#ffffff' : '#1e40af',
                      fontSize: 20,
                      letterSpacing: -1.5
                    }}
                  >
                    {stats.savedCount}
                  </Text>
                  <Text
                    className="font-lexend-semibold uppercase"
                    style={{
                      color: activeTab === "saved" ? 'rgba(255,255,255,0.9)' : '#2563eb',
                      fontSize: 10,
                      letterSpacing: -0.2
                    }}
                  >
                    Saved
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 mt-6">{renderContent()}</View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* ReelsViewer */}
      <ReelsViewer
        visible={reelsVisible}
        onClose={() => setReelsVisible(false)}
        initialIndex={initialReelsIndex}
        verses={reelsVerses}
        likedVerses={new Set(likedVerses.map(v => v.id))}
        savedVerses={new Set(savedVerses.map(v => v.id))}
        loading={reelsLoading}
      />


      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View className="flex-1 bg-black/50" style={{ justifyContent: 'flex-end' }}>
          <View
            className="bg-white rounded-t-3xl"
            style={{
              height: '70%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 py-5 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-lexend-bold text-gray-900">Settings</Text>
                <Pressable
                  onPress={() => setSettingsVisible(false)}
                  className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full active:opacity-60"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={20} color="#374151" pointerEvents="none" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {/* App Info Section */}
              <View className="mb-6">
                <Text className="text-xs font-lexend-semibold text-gray-500 uppercase tracking-wider mb-3">App Information</Text>

                <View className="bg-amber-50 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center mr-3">
                      <HugeiconsIcon icon={Alert02Icon} size={20} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-lexend-semibold text-base">Version</Text>
                      <Text className="text-gray-500 font-lexend-light text-sm mt-0.5">1.0.0</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Subscription Section */}
              <View className="mb-6">
                <Text className="text-xs font-lexend-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Subscription
                </Text>

                <Pressable
                  className={`${isPremium ? "bg-amber-50" : "bg-gray-50"} rounded-2xl p-4 mb-3 active:scale-[0.98]`}
                  onPress={() => {
                    setSettingsVisible(false);
                    if (isPremium) {
                      // Navigate to manage subscription screen or show alert
                      // For now, simpler handling or navigate to a dedicated manage screen if it existed
                      Alert.alert("Manage Subscription", "To manage or cancel your subscription, please visit your Apple ID settings.", [
                        { text: "OK" }
                      ]);
                    } else {
                      navigation.navigate("Paywall");
                    }
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className={`w-12 h-12 ${isPremium ? "bg-amber-100" : "bg-gray-200"} rounded-full items-center justify-center mr-3`}>
                        <HugeiconsIcon
                          icon={isPremium ? SparklesIcon : InformationDiamondIcon}
                          size={20}
                          color={isPremium ? "#d97706" : "#4b5563"}
                          variant={isPremium ? "solid" : "stroke"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`${isPremium ? "text-amber-800" : "text-gray-900"} font-lexend-semibold text-base`}>
                          {isPremium ? "Premium Active" : "Free Plan"}
                        </Text>
                        <Text className={`${isPremium ? "text-amber-600" : "text-gray-500"} font-lexend-light text-sm mt-0.5`}>
                          {isPremium ? "Manage your subscription" : "Upgrade to unlock features"}
                        </Text>
                      </View>
                    </View>
                    {!isPremium && (
                      <View className="bg-gray-900 px-3 py-1.5 rounded-full">
                        <Text className="text-white text-xs font-lexend-medium">Upgrade</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* Legal Section */}
              <View className="mb-6">
                <Text className="text-xs font-lexend-semibold text-gray-500 uppercase tracking-wider mb-3">Legal</Text>

                <Pressable
                  className="bg-blue-50 rounded-2xl p-4 mb-3 active:bg-blue-100"
                  onPress={() => {/* Navigate to Terms */ }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                        <HugeiconsIcon icon={Files02Icon} size={20} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-lexend-semibold text-base">Terms of Service</Text>
                        <Text className="text-gray-500 font-lexend-light text-sm mt-0.5">Read our terms and conditions</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  className="bg-purple-50 rounded-2xl p-4 mb-3 active:bg-purple-100"
                  onPress={() => {/* Navigate to Privacy */ }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-3">
                        <HugeiconsIcon icon={ShieldEnergyIcon} size={20} color="#a855f7" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-lexend-semibold text-base">Privacy Policy</Text>
                        <Text className="text-gray-500 font-lexend-light text-sm mt-0.5">How we protect your data</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Account Section */}
              <View className="mb-6">
                <Text className="text-xs font-lexend-semibold text-gray-500 uppercase tracking-wider mb-3">Account</Text>

                <Pressable
                  className="bg-red-50 rounded-2xl p-4 active:bg-red-100"
                  onPress={() => {
                    setSettingsVisible(false);
                    setTimeout(() => logout(), 300);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mr-3">
                        <HugeiconsIcon icon={Logout02Icon} size={20} color="#ef4444" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-red-600 font-lexend-bold text-base">Sign Out</Text>
                        <Text className="text-red-400 font-lexend-light text-sm mt-0.5">Log out of your account</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Footer */}
              <View className="items-center py-6">
                <Image
                  source={images.Char}
                  style={{ width: 80, height: 80, opacity: 0.3 }}
                  resizeMode="contain"
                />
                <Text className="text-gray-400 font-lexend-light text-xs mt-2">Made with ❤️ for Bible readers</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 bg-black/50" style={{ justifyContent: 'flex-end' }}>
          <View
            className="bg-white rounded-t-3xl h-[90%]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-lexend-bold text-gray-900">
                  {selectedPost?.type === 'testimonial' ? 'Testimony' : 'Prayer Request'}
                </Text>
                <View className={`px-2.5 py-1 rounded-full ${selectedPost?.type === 'testimonial' ? 'bg-amber-100' : 'bg-purple-100'}`}>
                  <Text className={`text-xs font-lexend-medium ${selectedPost?.type === 'testimonial' ? 'text-amber-700' : 'text-purple-700'}`}>
                    {selectedPost?.type === 'testimonial' ? '✨' : '🙏'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDetailModalVisible(false)}
                className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full active:bg-gray-100"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} color="#374151" pointerEvents="none" />
              </Pressable>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Post Content */}
              <View className="p-6 border-b border-gray-100">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3 border border-gray-200">
                    {profile?.profile_photo_url ? (
                      <Image source={{ uri: profile.profile_photo_url }} className="w-full h-full rounded-full" />
                    ) : (
                      <Text className="text-gray-600 font-lexend-bold text-lg">
                        {profile?.display_name?.[0] || user.email?.[0]}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text className="text-gray-900 font-lexend-bold text-base">
                      {profile?.display_name || 'You'}
                    </Text>
                    <Text className="text-gray-500 font-lexend-light text-xs">
                      {selectedPost && new Date(selectedPost.created_at).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                <Text className="text-2xl font-lexend-bold text-gray-900 mb-3 leading-8">
                  {selectedPost?.title}
                </Text>

                <Text className="text-gray-700 font-lexend-regular text-base leading-7">
                  {selectedPost?.type === 'testimonial' ? selectedPost?.content : selectedPost?.description}
                </Text>

                {/* Stats Row */}
                <View className="flex-row items-center gap-6 mt-6 pt-4 border-t border-gray-100">
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon icon={FavouriteIcon} size={20} color="#ef4444" pointerEvents="none" />
                    <Text className="text-gray-600 font-lexend-medium">
                      {selectedPost?.type === 'testimonial' ? (selectedPost?.likes_count || 0) : (selectedPost?.prayingCount || 0)}
                      {selectedPost?.type === 'testimonial' ? ' Likes' : ' Praying'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon icon={MessageFavourite01Icon} size={20} color="#3b82f6" pointerEvents="none" />
                    <Text className="text-gray-600 font-lexend-medium">
                      {selectedPost?.commentCount || 0} Comments
                    </Text>
                  </View>
                </View>
              </View>

              {/* Comments Section */}
              <View className="p-6 bg-gray-50 min-h-[300px]">
                <Text className="text-gray-900 font-lexend-bold text-lg mb-4">Comments</Text>

                {loadingComments ? (
                  <ActivityIndicator color="#6b7280" />
                ) : postComments.length === 0 ? (
                  <View className="items-center justify-center py-10">
                    <Text className="text-4xl mb-2">💭</Text>
                    <Text className="text-gray-500 font-lexend-medium">No comments yet</Text>
                  </View>
                ) : (
                  postComments.map((comment) => (
                    <View key={comment.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                            {comment.profiles?.profile_photo_url ? (
                              <Image source={{ uri: comment.profiles.profile_photo_url }} className="w-full h-full rounded-full" />
                            ) : (
                              <Text className="text-xs font-lexend-bold text-gray-600">
                                {comment.profiles?.display_name?.[0] || '?'}
                              </Text>
                            )}
                          </View>
                          <Text className="text-gray-900 font-lexend-semibold text-sm">
                            {comment.profiles?.display_name || 'Anonymous'}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs font-lexend-light">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-gray-700 font-lexend-regular text-sm pl-10">
                        {comment.comment_text}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}