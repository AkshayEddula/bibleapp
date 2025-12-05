import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSubscription } from "../../context/SubscriptionContext";

const PremiumGate = ({ children, feature = "this feature" }) => {
    const { isPremium, isLoading } = useSubscription();
    const navigation = useNavigation();

    if (isLoading) {
        return null;
    }

    if (!isPremium) {
        return (
            <View style={styles.container}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>Premium Feature</Text>
                <Text style={styles.description}>
                    Upgrade to premium to access {feature}
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate("Paywall")}
                >
                    <Text style={styles.buttonText}>Upgrade Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
    },
    button: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
});

export default PremiumGate;