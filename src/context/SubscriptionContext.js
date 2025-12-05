import { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import Purchases from "react-native-purchases";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const SubscriptionContext = createContext();

// RevenueCat API Keys
const REVENUECAT_API_KEY = {
    ios: "appl_PWVeIKAHxtuXhjAtDrgZPtZhBVY",
    android: "goog_oLwukHHrarojRdHLMUZnoZfPhIQ",
};

export const SubscriptionProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [offerings, setOfferings] = useState(null);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize RevenueCat
    useEffect(() => {
        initializeRevenueCat();
    }, []);

    // Link user to RevenueCat when they log in
    useEffect(() => {
        if (user?.id) {
            linkUserToRevenueCat(user.id);
            checkSubscriptionStatus();
        }
    }, [user]);

    const initializeRevenueCat = async () => {
        try {
            const apiKey =
                Platform.OS === "ios"
                    ? REVENUECAT_API_KEY.ios
                    : REVENUECAT_API_KEY.android;

            // Enable debug logs to see what's happening
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

            await Purchases.configure({ apiKey });

            // Set up listener for customer info updates
            Purchases.addCustomerInfoUpdateListener((info) => {
                updateCustomerInfo(info);
            });

            console.log("✅ RevenueCat initialized successfully");
            console.log("Platform:", Platform.OS);

            // Test fetch offerings immediately after initialization
            try {
                const offerings = await Purchases.getOfferings();
                console.log("📦 Initial offerings check:", JSON.stringify(offerings, null, 2));
            } catch (offerError) {
                console.error("❌ Error fetching initial offerings:", offerError);
            }

        } catch (error) {
            console.error("❌ Error initializing RevenueCat:", error);
            console.error("Error details:", error.message);
        }
    };

    const linkUserToRevenueCat = async (userId) => {
        try {
            await Purchases.logIn(userId);
            console.log("✅ User linked to RevenueCat:", userId);
        } catch (error) {
            console.error("❌ Error linking user to RevenueCat:", error);
        }
    };

    const updateCustomerInfo = (info) => {
        console.log("📊 Updating customer info:", info);
        setCustomerInfo(info);
        const premium = info.entitlements.active["premium"] !== undefined;
        setIsPremium(premium);
        console.log("Premium status:", premium);

        // Sync with Supabase
        syncSubscriptionStatus(premium, info);
    };

    const checkSubscriptionStatus = async () => {
        try {
            setIsLoading(true);
            console.log("🔍 Checking subscription status...");
            const info = await Purchases.getCustomerInfo();
            updateCustomerInfo(info);
        } catch (error) {
            console.error("❌ Error checking subscription:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const syncSubscriptionStatus = async (isPremium, info) => {
        if (!user?.id) return;

        try {
            const expirationDate = info.entitlements.active["premium"]?.expirationDate;

            await supabase.from("subscriptions").upsert(
                {
                    user_id: user.id,
                    is_premium: isPremium,
                    subscription_expiry: expirationDate,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );

            console.log("✅ Subscription status synced to Supabase");
        } catch (error) {
            console.error("❌ Error syncing subscription to Supabase:", error);
        }
    };

    const fetchOfferings = async () => {
        try {
            console.log("🔄 Fetching offerings...");
            const offerings = await Purchases.getOfferings();

            console.log("📦 Offerings response:", offerings);
            console.log("📦 All offerings:", Object.keys(offerings.all));
            console.log("📦 Current offering:", offerings.current?.identifier);

            if (offerings.current) {
                console.log("📦 Available packages:", offerings.current.availablePackages.length);
                offerings.current.availablePackages.forEach((pkg, index) => {
                    console.log(`Package ${index + 1}:`, {
                        identifier: pkg.identifier,
                        packageType: pkg.packageType,
                        product: {
                            identifier: pkg.product.identifier,
                            title: pkg.product.title,
                            price: pkg.product.priceString,
                        }
                    });
                });

                setOfferings(offerings.current);
                return offerings.current;
            } else {
                console.warn("⚠️ No current offering found");
                console.log("Available offerings:", Object.keys(offerings.all));
                Alert.alert(
                    "Configuration Issue",
                    "Unable to load subscription plans. Please try again later or contact support."
                );
                return null;
            }
        } catch (error) {
            console.error("❌ Error fetching offerings:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            console.error("Full error:", JSON.stringify(error, null, 2));

            Alert.alert(
                "Error Loading Plans",
                "There was a problem loading subscription options. Please check your internet connection and try again.\n\nError: " + (error.message || "Unknown error")
            );
            return null;
        }
    };

    const purchasePackage = async (pkg) => {
        try {
            console.log("💳 Attempting purchase:", pkg.identifier);
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            updateCustomerInfo(customerInfo);

            if (customerInfo.entitlements.active["premium"]) {
                Alert.alert(
                    "Success! 🎉",
                    "You now have premium access to all features!"
                );
                return { success: true };
            }
            return { success: false, message: "Purchase did not complete" };
        } catch (error) {
            if (error.userCancelled) {
                console.log("ℹ️ User cancelled purchase");
                return { success: false, cancelled: true };
            }
            console.error("❌ Purchase error:", error);
            Alert.alert("Purchase Failed", error.message);
            return { success: false, message: error.message };
        }
    };

    const restorePurchases = async () => {
        try {
            console.log("🔄 Restoring purchases...");
            const customerInfo = await Purchases.restorePurchases();
            updateCustomerInfo(customerInfo);

            if (customerInfo.entitlements.active["premium"]) {
                Alert.alert("Success", "Your purchases have been restored!");
                return { success: true };
            } else {
                Alert.alert(
                    "No Purchases Found",
                    "We couldn't find any purchases to restore."
                );
                return { success: false, message: "No purchases found" };
            }
        } catch (error) {
            console.error("❌ Restore error:", error);
            Alert.alert("Restore Failed", error.message);
            return { success: false, message: error.message };
        }
    };

    const getSubscriptionInfo = () => {
        if (!isPremium || !customerInfo?.entitlements.active["premium"]) {
            return null;
        }

        const entitlement = customerInfo.entitlements.active["premium"];
        return {
            isActive: true,
            willRenew: entitlement.willRenew,
            expirationDate: entitlement.expirationDate,
            productIdentifier: entitlement.productIdentifier,
            periodType: entitlement.periodType,
        };
    };

    return (
        <SubscriptionContext.Provider
            value={{
                isPremium,
                isLoading,
                offerings,
                customerInfo,
                checkSubscriptionStatus,
                fetchOfferings,
                purchasePackage,
                restorePurchases,
                getSubscriptionInfo,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error(
            "useSubscription must be used within a SubscriptionProvider"
        );
    }
    return context;
};