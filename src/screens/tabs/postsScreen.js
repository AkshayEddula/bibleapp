import { useState } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrayerWallScreen from "../../components/PrayerCard";
import TestimoniesScreen from "../../components/TestimonalCard";

export default function PostsScreen() {
    const [activeTab, setActiveTab] = useState("testimonials");

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header & Tabs Container */}
            <View style={styles.headerContainer}>
                <View style={styles.tabContainer}>
                    {/* Testimonials Tab */}
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === "testimonials" && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab("testimonials")}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "testimonials" && styles.activeTabText,
                            ]}
                        >
                            Testimonies
                        </Text>
                    </TouchableOpacity>

                    {/* Prayers Tab */}
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === "prayers" && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab("prayers")}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "prayers" && styles.activeTabText,
                            ]}
                        >
                            Prayer Wall
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.contentContainer}>
                {activeTab === "testimonials" ? (
                    <TestimoniesScreen />
                ) : (
                    <PrayerWallScreen />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        zIndex: 10,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        borderRadius: 16,
        padding: 4,
        height: 50,
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    activeTabButton: {
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    tabText: {
        fontSize: 14,
        fontFamily: "Lexend-Regular",
        color: "#6b7280",
        fontWeight: "500",
    },
    activeTabText: {
        color: "#1f2937",
        fontWeight: "600",
        fontFamily: "Lexend-SemiBold",
    },
    contentContainer: {
        flex: 1,
        marginHorizontal: 24,
    },
});
