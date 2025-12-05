import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSubscription } from "../../context/SubscriptionContext";

const PaywallScreen = () => {
    const navigation = useNavigation();
    const {
        offerings,
        fetchOfferings,
        purchasePackage,
        restorePurchases,
        isPremium,
    } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        setLoading(true);
        setError(null);
        console.log("📱 PaywallScreen: Loading offerings...");

        const result = await fetchOfferings();
        setLoading(false);

        if (!result) {
            console.log("❌ PaywallScreen: No offerings returned");
            setError("Unable to load subscription plans");
            // Show retry dialog
            Alert.alert(
                "Unable to Load Plans",
                "Please check your internet connection and try again.",
                [
                    { text: "Retry", onPress: loadOfferings },
                    { text: "Go Back", onPress: () => navigation.goBack() }
                ]
            );
        } else {
            console.log("✅ PaywallScreen: Offerings loaded successfully");
            // Auto-select first package if available
            if (result.availablePackages && result.availablePackages.length > 0) {
                setSelectedPackage(result.availablePackages[0]);
            }
        }
    };

    const handlePurchase = async (pkg) => {
        setLoading(true);
        console.log("💳 PaywallScreen: Starting purchase...");
        const result = await purchasePackage(pkg);
        setLoading(false);

        if (result.success) {
            console.log("✅ PaywallScreen: Purchase successful");
            navigation.goBack();
        } else if (!result.cancelled) {
            console.log("❌ PaywallScreen: Purchase failed");
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        console.log("🔄 PaywallScreen: Restoring purchases...");
        await restorePurchases();
        setLoading(false);
    };

    if (loading && !offerings && !error) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
        );
    }

    if (isPremium) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>You're Premium! 🎉</Text>
                <Text style={styles.description}>
                    You have access to all premium features
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (error && !offerings) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Oops! 😕</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={loadOfferings}
                >
                    <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.secondaryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Upgrade to Premium</Text>
                <Text style={styles.description}>
                    Unlock all features and get the best experience
                </Text>
            </View>

            <View style={styles.features}>
                <FeatureItem text="✨ Unlimited access to all features" />
                <FeatureItem text="🚀 Priority customer support" />
                <FeatureItem text="🎯 Advanced analytics" />
                <FeatureItem text="💾 Cloud backup" />
            </View>

            <View style={styles.packages}>
                {offerings?.availablePackages && offerings.availablePackages.length > 0 ? (
                    offerings.availablePackages.map((pkg) => (
                        <PackageCard
                            key={pkg.identifier}
                            package={pkg}
                            selected={selectedPackage?.identifier === pkg.identifier}
                            onSelect={() => setSelectedPackage(pkg)}
                        />
                    ))
                ) : (
                    <View style={styles.noPackagesContainer}>
                        <Text style={styles.noPackagesText}>
                            No subscription plans available at the moment.
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadOfferings}
                        >
                            <Text style={styles.retryButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {offerings?.availablePackages && offerings.availablePackages.length > 0 && (
                <>
                    <TouchableOpacity
                        style={[
                            styles.subscribeButton,
                            !selectedPackage && styles.subscribeButtonDisabled,
                        ]}
                        onPress={() => selectedPackage && handlePurchase(selectedPackage)}
                        disabled={!selectedPackage || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>
                                {selectedPackage
                                    ? `Subscribe - ${selectedPackage.product.priceString}`
                                    : "Select a Plan"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.restoreButton}
                        onPress={handleRestore}
                        disabled={loading}
                    >
                        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.footer}>
                Subscriptions auto-renew. Cancel anytime in your device settings.
            </Text>
        </ScrollView>
    );
};

const FeatureItem = ({ text }) => (
    <View style={styles.featureItem}>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const PackageCard = ({ package: pkg, selected, onSelect }) => {
    const getBadge = () => {
        if (pkg.packageType === "ANNUAL") return "Best Value";
        if (pkg.packageType === "MONTHLY") return "Popular";
        return null;
    };

    return (
        <TouchableOpacity
            style={[styles.packageCard, selected && styles.packageCardSelected]}
            onPress={onSelect}
        >
            {getBadge() && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{getBadge()}</Text>
                </View>
            )}
            <Text style={styles.packageTitle}>{pkg.product.title}</Text>
            <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
            <Text style={styles.packageDescription}>
                {pkg.product.description || pkg.product.subscriptionPeriod}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorTitle: {
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
    },
    header: {
        padding: 24,
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    features: {
        padding: 24,
        paddingTop: 0,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    featureText: {
        fontSize: 16,
        marginLeft: 8,
    },
    packages: {
        padding: 24,
        paddingTop: 0,
    },
    noPackagesContainer: {
        padding: 20,
        alignItems: "center",
    },
    noPackagesText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    packageCard: {
        borderWidth: 2,
        borderColor: "#E5E5E5",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        position: "relative",
    },
    packageCardSelected: {
        borderColor: "#007AFF",
        backgroundColor: "#F0F8FF",
    },
    badge: {
        position: "absolute",
        top: -10,
        right: 16,
        backgroundColor: "#FF3B30",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    packagePrice: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#007AFF",
        marginBottom: 4,
    },
    packageDescription: {
        fontSize: 14,
        color: "#666",
    },
    subscribeButton: {
        backgroundColor: "#007AFF",
        margin: 24,
        marginTop: 0,
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
    },
    subscribeButtonDisabled: {
        backgroundColor: "#CCC",
    },
    subscribeButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    restoreButton: {
        padding: 16,
        alignItems: "center",
    },
    restoreButtonText: {
        color: "#007AFF",
        fontSize: 16,
    },
    footer: {
        textAlign: "center",
        fontSize: 12,
        color: "#999",
        padding: 24,
        paddingTop: 0,
    },
    button: {
        backgroundColor: "#007AFF",
        padding: 16,
        borderRadius: 12,
        margin: 24,
        minWidth: 200,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
    },
    secondaryButton: {
        padding: 16,
        borderRadius: 12,
        minWidth: 200,
    },
    secondaryButtonText: {
        color: "#007AFF",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
    },
});

export default PaywallScreen;