import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutLoading, setIsLogoutLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();

    // Listen for auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);

        if (session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);

          // Fetch user profile
          await fetchUserProfile(session.user.id);

          // Store session in AsyncStorage
          await AsyncStorage.setItem("userSession", JSON.stringify(session));
        } else {
          setUser(null);
          setProfile(null);
          setIsUserLoggedIn(false);
          await AsyncStorage.removeItem("userSession");
        }
      },
    );

    // Cleanup listener
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      console.log("Profile fetched:", data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const checkLoginStatus = async () => {
    try {
      console.log("Checking login status...");

      // Check if there's an active Supabase session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        return;
      }

      if (session?.user) {
        console.log("Active session found:", session.user.email);
        setUser(session.user);
        setIsUserLoggedIn(true);

        // Fetch user profile
        await fetchUserProfile(session.user.id);
      } else {
        console.log("No active session");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (googleData) => {
    try {
      console.log("Authenticating with Supabase...");

      // Sign in with Google idToken
      const { data: authData, error: authError } =
        await supabase.auth.signInWithIdToken({
          provider: "google",
          token: googleData.idToken,
        });

      if (authError) {
        console.error("Supabase authentication failed:", authError);
        Alert.alert("Authentication Error", authError.message);
        return { success: false, message: authError.message };
      }

      console.log("Supabase authentication successful:", authData.user?.email);

      // The trigger will automatically create the profile
      // Wait a moment for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch the profile (created by trigger)
      const userProfile = await fetchUserProfile(authData.user.id);

      setUser(authData.user);
      setProfile(userProfile);
      setIsUserLoggedIn(true);

      return {
        success: true,
        message: "Logged in successfully",
        profile: userProfile,
        needsOnboarding: !userProfile?.is_onboarded,
      };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "An error occurred" };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        return { success: false, message: "No user logged in" };
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: error.message };
      }

      console.log("Profile updated:", data);
      setProfile(data);
      return {
        success: true,
        message: "Profile updated successfully",
        profile: data,
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: "An error occurred" };
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out...");

      // Sign out from Supabase (this will trigger onAuthStateChange)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        return { success: false, message: error.message };
      }

      // Clear local storage
      await AsyncStorage.removeItem("userSession");

      setUser(null);
      setProfile(null);

      console.log("Logged out successfully");
      return { success: true, message: "Logged out successfully" };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: "An error occurred" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile, // Add this
        isLoading,
        isLogoutLoading,
        setIsLoading,
        login,
        logout,
        updateProfile, // Add this too if not already there
        isUserLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
