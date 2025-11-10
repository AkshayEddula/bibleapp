import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvide = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      console.log("Checking login status...");
      const userToken = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");

      if (userToken && userData) {
        setUser(JSON.parse(userData));
        setIsUserLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // need supabase logic and all

      console.log("Logging in...", email);

      if (!email) {
        return { success: false, message: "Email is required" };
      }

      const userData = {
        name: "akshay",
        email: email,
        id: Math.random().toString(36).substring(2, 9),
        token: Math.random().toString(36).substring(2, 9),
      };

      await AsyncStorage.setItem("userToken", userData.token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      setIsUserLoggedIn(true);
      return { success: true, message: "Logged in successfully" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "An error occurred" };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      setIsUserLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error(error);
      return { success: false, message: "An error occurred" };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isUserLoggedIn }}
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
