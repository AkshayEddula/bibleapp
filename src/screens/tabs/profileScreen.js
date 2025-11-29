import { LinearGradient } from "expo-linear-gradient";
import { BookMarked, FileText, Heart, Info, LogOut, MessageSquare, Settings, Shield, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReelsViewer from "../../components/ReelsViewer";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { images } from "../../utils";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 3; // 3 columns for verses
const POST_CARD_SIZE = (width - 48) / 2 - 6; // 2 columns for posts

export default function ProfileScreen() {
  const { user, logout } = useAuth();
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

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Fetch testimonials with counts
      const { data: testimonialsData } = await supabase
        .from("testimonials")
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

      const testimonialsWithCounts = await Promise.all(
        (testimonialsData || []).map(async (t) => {
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
        })
      );

      // Fetch prayers with counts
      const { data: prayersData } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const prayersWithCounts = await Promise.all(
        (prayersData || []).map(async (p) => {
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
        })
      );

      // Combine and sort by date
      const combined = [
        ...testimonialsWithCounts,
        ...prayersWithCounts
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPosts(combined);

      // Fetch liked verses
      const { data: likedData } = await supabase
        .from("verse_interactions")
        .select(`
          *,
          bible_verses (*)
        `)
        .eq("user_id", user.id)
        .eq("interaction_type", "like")
        .order("created_at", { ascending: false });

      setLikedVerses(likedData?.map(item => item.bible_verses).filter(Boolean) || []);

      // Fetch saved verses
      const { data: savedData } = await supabase
        .from("verse_interactions")
        .select(`
          *,
          bible_verses (*)
        `)
        .eq("user_id", user.id)
        .eq("interaction_type", "save")
        .order("created_at", { ascending: false });

      setSavedVerses(savedData?.map(item => item.bible_verses).filter(Boolean) || []);

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
    setReelsLoading(true);
    setReelsVerses([]);
    setReelsVisible(true);

    // Fetch interaction counts for the verses
    const verseIds = allVerses.map(v => v.id);
    const { data: countsData } = await supabase
      .from("verse_interaction_counts")
      .select("*")
      .in("verse_id", verseIds);

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
    setReelsLoading(false);
  };

  const renderVerseCard = ({ item, index }) => {
    const allVerses = activeTab === "liked" ? likedVerses : savedVerses;

    // Different gradient colors for liked vs saved
    const gradientColors = activeTab === "liked"
      ? ['rgba(239, 68, 68, 0.85)', 'rgba(220, 38, 38, 0.9)'] // Red gradient for liked
      : ['rgba(59, 130, 246, 0.85)', 'rgba(37, 99, 235, 0.9)']; // Blue gradient for saved

    return (
      <Pressable
        onPress={() => handleVersePress(item, index, allVerses)}
        style={{
          width: CARD_SIZE,
          height: CARD_SIZE,
          margin: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}
        className="rounded-2xl overflow-hidden"
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

      if (error) throw error;

      setPostComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setDetailModalVisible(true);
    fetchPostDetails(post);
  };


  const renderPostCard = ({ item }) => {
    const isTestimonial = item.type === 'testimonial';

    // Beautiful gradients for different post types
    const gradientColors = isTestimonial
      ? ['#fbbf24', '#f59e0b', '#d97706'] // Warm gold gradient for testimonials
      : ['#8b5cf6', '#7c3aed', '#6d28d9']; // Purple gradient for prayers

    return (
      <Pressable
        onPress={() => handlePostPress(item)}
        style={{
          width: POST_CARD_SIZE,
          height: POST_CARD_SIZE * 1.2,
          margin: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
        className="rounded-3xl overflow-hidden"
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
          {/* Type Badge */}
          <View className="flex-row items-center gap-1.5 self-start bg-white/25 px-3 py-1.5 rounded-full mb-2">
            <Text className="text-[11px]">{isTestimonial ? '✨' : '🙏'}</Text>
            <Text className="text-white text-[10px] font-lexend-bold uppercase tracking-wide">
              {isTestimonial ? 'Testimony' : 'Prayer'}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-white font-lexend-bold text-sm mb-2 leading-5" numberOfLines={3}>
              {item.title}
            </Text>
            <Text className="text-white/90 font-lexend-regular text-xs leading-5" numberOfLines={4}>
              {isTestimonial ? item.content : item.description}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-white/20">
            <Text className="text-white/70 text-[10px] font-lexend-medium">
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            {isTestimonial && item.prayer_requests && (
              <View className="flex-row items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
                <MessageSquare size={11} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
                <Text className="text-white text-[10px] font-lexend-semibold">
                  {item.commentCount || 0}
                </Text>
              </View>
            )}
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
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6b7280" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Enhanced with Gradient */}
        <LinearGradient
          colors={['#fafafa', '#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingTop: 60,
            paddingBottom: 24,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#f3f4f6',
          }}
        >
          {/* Settings Button */}
          <Pressable
            onPress={() => setSettingsVisible(true)}
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              zIndex: 100,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Settings size={20} color="#6b7280" strokeWidth={2} pointerEvents="none" />
          </Pressable>

          {/* Profile Content */}
          <View>
            {/* Avatar with Gradient Border */}
            <View className="items-center mb-4">
              <View
                style={{
                  padding: 3,
                  borderRadius: 64,
                  marginBottom: 4,
                }}
              >
                <LinearGradient
                  colors={['#f59e0b', '#ef4444', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 3,
                    borderRadius: 64,
                  }}
                >
                  <View
                    className="w-24 h-24 rounded-full bg-white items-center justify-center"
                  >
                    {profile?.profile_photo_url ? (
                      <Image
                        source={{ uri: profile.profile_photo_url }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-gray-600 font-lexend-bold text-3xl">
                        {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Name and Email */}
            <View className="items-center mb-6">
              <Text className="text-gray-900 font-lexend-bold text-xl mb-1" numberOfLines={1}>
                {profile?.display_name || user.email?.split('@')[0]}
              </Text>
              <Text className="text-gray-500 font-lexend-regular text-sm" numberOfLines={1}>
                {user.email}
              </Text>
            </View>

            {/* Stats Card with Gradient Accents */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}>
                <Pressable
                  onPress={() => setActiveTab("posts")}
                  className="items-center"
                >
                  <View className="bg-amber-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-amber-600 font-lexend-bold text-lg">{stats.postsCount}</Text>
                  </View>
                  <Text className="text-gray-600 font-lexend-medium text-xs">Posts</Text>
                </Pressable>
                <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
                <Pressable
                  onPress={() => setActiveTab("liked")}
                  className="items-center"
                >
                  <View className="bg-red-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-red-600 font-lexend-bold text-lg">{stats.likedCount}</Text>
                  </View>
                  <Text className="text-gray-600 font-lexend-medium text-xs">Liked</Text>
                </Pressable>
                <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
                <Pressable
                  onPress={() => setActiveTab("saved")}
                  className="items-center"
                >
                  <View className="bg-blue-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-blue-600 font-lexend-bold text-lg">{stats.savedCount}</Text>
                  </View>
                  <Text className="text-gray-600 font-lexend-medium text-xs">Saved</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-200 px-6 mb-4 mt-4">
          <Pressable
            onPress={() => setActiveTab("posts")}
            className={`flex-1 items-center pb-3 border-b-2 ${activeTab === "posts" ? "border-amber-500" : "border-transparent"
              }`}
          >
            <MessageSquare
              size={20}
              color={activeTab === "posts" ? "#f59e0b" : "#9ca3af"}
              strokeWidth={2}
            />
            <Text
              className={`font-lexend-medium text-xs mt-1 ${activeTab === "posts" ? "text-amber-600" : "text-gray-500"
                }`}
            >
              Posts
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("liked")}
            className={`flex-1 items-center pb-3 border-b-2 ${activeTab === "liked" ? "border-red-500" : "border-transparent"
              }`}
          >
            <Heart
              size={20}
              color={activeTab === "liked" ? "#ef4444" : "#9ca3af"}
              fill={activeTab === "liked" ? "#ef4444" : "transparent"}
              strokeWidth={2}
            />
            <Text
              className={`font-lexend-medium text-xs mt-1 ${activeTab === "liked" ? "text-red-600" : "text-gray-500"
                }`}
            >
              Liked
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("saved")}
            className={`flex-1 items-center pb-3 border-b-2 ${activeTab === "saved" ? "border-blue-500" : "border-transparent"
              }`}
          >
            <BookMarked
              size={20}
              color={activeTab === "saved" ? "#3b82f6" : "#9ca3af"}
              fill={activeTab === "saved" ? "#3b82f6" : "transparent"}
              strokeWidth={2}
            />
            <Text
              className={`font-lexend-medium text-xs mt-1 ${activeTab === "saved" ? "text-blue-600" : "text-gray-500"
                }`}
            >
              Saved
            </Text>
          </Pressable>
        </View>

        {/* Content Grid */}
        {renderContent()}

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
                  <X size={20} color="#374151" pointerEvents="none" />
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
                      <Info size={20} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-lexend-semibold text-base">Version</Text>
                      <Text className="text-gray-500 font-lexend-light text-sm mt-0.5">1.0.0</Text>
                    </View>
                  </View>
                </View>
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
                        <FileText size={20} color="#3b82f6" />
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
                        <Shield size={20} color="#a855f7" />
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
                        <LogOut size={20} color="#ef4444" />
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
                <X size={20} color="#374151" pointerEvents="none" />
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
                    <Heart size={20} color="#ef4444" />
                    <Text className="text-gray-600 font-lexend-medium">
                      {selectedPost?.type === 'testimonial' ? (selectedPost?.likes_count || 0) : (selectedPost?.prayingCount || 0)}
                      {selectedPost?.type === 'testimonial' ? ' Likes' : ' Praying'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <MessageSquare size={20} color="#3b82f6" />
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