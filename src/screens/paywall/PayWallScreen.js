import {
    Cancel01Icon,
    CheckmarkBadge01Icon,
    LockKeyIcon,
    Shield01Icon,
    SparklesIcon,
    StarIcon,
    ZapIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet, // Added StyleSheet
    Text,
    View
} from "react-native";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "../../context/SubscriptionContext";
import { images } from "../../utils";

const MOCK_PACKAGES = [
    {
        identifier: 'annual_premium',
        packageType: 'ANNUAL',
        product: {
            title: 'Yearly Access',
            priceString: '$59.99',
            description: 'Best for long-term growth',
            price: 59.99,
        }
    },
    {
        identifier: 'weekly_premium',
        packageType: 'WEEKLY',
        product: {
            title: 'Weekly Access',
            priceString: '$4.99',
            description: 'Flexible, cancel anytime',
            price: 4.99,
        }
    }
];

const PlanCard = ({ item, isSelected, onPress, badge, badgeColor }) => {
    return (
        <Pressable
            onPress={onPress}
            className={`p-[18px] rounded-[18px] border mb-4 relative ${isSelected
                ? 'bg-amber-500/10 border-amber-500'
                : 'bg-white/5 border-white/10'
                }`}
        >
            {badge && (
                <View
                    style={{ backgroundColor: badgeColor }}
                    className="absolute -top-2.5 right-4 px-2 py-1 rounded-md z-10"
                >
                    <Text className="text-white text-[10px] font-lexend font-bold tracking-widest">
                        {badge}
                    </Text>
                </View>
            )}

            <View className="flex-row items-center">
                <View className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center mr-3.5 ${isSelected ? 'border-amber-500' : 'border-neutral-600'
                    }`}>
                    {isSelected && <View className="w-3 h-3 rounded-full bg-amber-500" />}
                </View>

                <View className="flex-1 justify-center">
                    <Text className={`text-base font-lexend font-bold mb-0.5 ${isSelected ? 'text-white' : 'text-neutral-300'
                        }`}>
                        {item.product.title}
                    </Text>
                    <Text className="text-xs font-lexend font-medium text-neutral-400">
                        {item.product.description}
                    </Text>
                </View>

                <View className="items-end justify-center">
                    <Text className={`text-[17px] font-lexend font-bold -tracking-[0.5px] ${isSelected ? 'text-amber-500' : 'text-neutral-300'
                        }`}>
                        {item.product.priceString}
                    </Text>
                    <Text className="text-[11px] font-lexend font-medium text-neutral-500">
                        /{item.packageType === 'ANNUAL' ? 'year' : 'week'}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

const PaywallScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const {
        offerings,
        fetchOfferings,
        purchasePackage,
        restorePurchases,
    } = useSubscription();

    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const buttonScale = useSharedValue(1);

    const availablePackages = offerings?.availablePackages?.length > 0
        ? offerings.availablePackages
        : MOCK_PACKAGES;

    useEffect(() => {
        const annual = availablePackages.find(p => p.packageType === "ANNUAL");
        if (annual) setSelectedPackage(annual);
        else if (availablePackages.length > 0) setSelectedPackage(availablePackages[0]);
        fetchOfferings();
    }, []);

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        buttonScale.value = withSequence(withTiming(0.95, { duration: 100 }), withTiming(1, { duration: 100 }));
        setLoading(true);

        if (offerings?.availablePackages?.length === 0) {
            setTimeout(() => {
                setLoading(false);
                navigation.goBack();
            }, 1500);
            return;
        }

        try {
            const result = await purchasePackage(selectedPackage);
            if (result.success) navigation.goBack();
        } catch (e) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        await restorePurchases();
        setLoading(false);
        Alert.alert("Restored", "Your purchases have been restored.");
    };

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            <ImageBackground
                source={images.J1}
                className="flex-1 w-full h-full"
                resizeMode="cover"
                blurRadius={4}
            >
                {/* 1. SOLID DARK OVERLAY (Using className here is fine as it's a View) */}
                <View className="absolute w-full h-full bg-black/10" />

                {/* 2. GRADIENT OVERLAY (Using style because LinearGradient hates className) */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', '#000000']}
                    locations={[0, 0.45, 0.85]}
                    style={StyleSheet.absoluteFill} // <--- Fixed here
                />

                {/* --- HEADER --- */}
                <View style={{ marginTop: insets.top }} className="px-5 pt-2 items-start z-10 mb-2">
                    <Pressable
                        onPress={() => navigation.goBack()}
                        className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
                        hitSlop={20}
                    >
                        <HugeiconsIcon pointerEvents="none" icon={Cancel01Icon} size={24} color="rgba(255,255,255,0.8)" />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 24 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <Animated.View entering={FadeInDown.duration(800).springify()}>

                        {/* --- HERO SECTION --- */}
                        <View className="mb-6">
                            <View className="self-start bg-amber-500/40 px-2.5 py-1.5 rounded-[18px] mb-3 border border-amber-500/40">
                                <Text className="text-white text-[10px] font-lexend font-bold tracking-[-0.2px]">
                                    PREMIUM ACCESS
                                </Text>
                            </View>

                            <Text
                                style={{ textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
                                className="text-[32px] font-lexend font-bold text-white leading-tight mb-2 -tracking-[1px]"
                            >
                                Deepen your daily walk with God.
                            </Text>

                            <Text className="text-base font-lexend font-medium text-neutral-200 leading-6 mb-4 tracking-wide">
                                Unlock unlimited AI insights and devotionals to help you grow closer to Him.
                            </Text>

                            <View className="flex-row items-center self-start bg-white/10 pr-3 pl-1 py-1 rounded-full border border-white/10">
                                <View className="w-5 h-5 rounded-full bg-amber-500 items-center justify-center mr-2">
                                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} color="#FFF" variant="solid" />
                                </View>
                                <Text className="text-neutral-100 text-xs font-lexend font-semibold tracking-wide">
                                    Join thousands of growing believers
                                </Text>
                            </View>
                        </View>

                        {/* --- BENEFITS STRIP --- */}
                        <View className="flex-row justify-between items-center bg-black/40 rounded-2xl py-4 px-4 mb-6 border border-white/10">
                            <View className="flex-1 items-center gap-1.5">
                                <HugeiconsIcon icon={SparklesIcon} size={20} color="#FCD34D" variant="solid" />
                                <Text className="text-neutral-200 text-xs font-lexend font-semibold tracking-wide">Unlimited AI</Text>
                            </View>
                            <View className="w-[1px] h-5 bg-white/10" />
                            <View className="flex-1 items-center gap-1.5">
                                <HugeiconsIcon icon={Shield01Icon} size={20} color="#FCD34D" variant="solid" />
                                <Text className="text-neutral-200 text-xs font-lexend font-semibold tracking-wide">Ad-Free</Text>
                            </View>
                            <View className="w-[1px] h-5 bg-white/10" />
                            <View className="flex-1 items-center gap-1.5">
                                <HugeiconsIcon icon={StarIcon} size={20} color="#FCD34D" variant="solid" />
                                <Text className="text-neutral-200 text-xs font-lexend font-semibold tracking-wide">Exclusive</Text>
                            </View>
                        </View>

                        {/* --- PLANS --- */}
                        <View>
                            {availablePackages.map((pkg) => {
                                const isSelected = selectedPackage?.identifier === pkg.identifier;
                                const isAnnual = pkg.packageType === "ANNUAL";

                                let badge = isAnnual ? "BEST VALUE" : "MOST FLEXIBLE";
                                let badgeColor = isAnnual ? '#F59E0B' : '#3B82F6';

                                return (
                                    <PlanCard
                                        key={pkg.identifier}
                                        item={pkg}
                                        isSelected={isSelected}
                                        onPress={() => setSelectedPackage(pkg)}
                                        badge={badge}
                                        badgeColor={badgeColor}
                                    />
                                );
                            })}
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* --- FOOTER --- */}
                <View
                    style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }}
                    className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10 px-5 pt-4 shadow-2xl"
                >
                    <View className="flex-row items-center justify-center mb-3 gap-1.5">
                        <HugeiconsIcon icon={ZapIcon} size={14} color="#F59E0B" variant="solid" />
                        <Text className="text-amber-500 text-xs font-lexend font-semibold">
                            3-Day Free Trial included
                        </Text>
                    </View>

                    <Animated.View style={animatedButtonStyle}>
                        <Pressable
                            onPress={handlePurchase}
                            disabled={loading}
                            className="rounded-2xl overflow-hidden mb-3"
                        >
                            {/* FIXED BUTTON GRADIENT: Using style prop */}
                            <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <View className=" flex-row gap-[0.5px] items-center justify-center">
                                        <View className="items-center">
                                            <Text className="text-white text-[17px] font-lexend font-bold tracking-[-0.4px] ">
                                                Start Free Trial
                                            </Text>
                                            {/* <Text className="text-white/80 text-[11px] font-lexend font-medium">
                                                Then {selectedPackage?.product.priceString}/{selectedPackage?.packageType === 'ANNUAL' ? 'year' : 'week'}
                                            </Text> */}
                                        </View>
                                        <HugeiconsIcon pointerEvents="none" icon={ZapIcon} size={26} strokeWidth={1.8} color="#FFF" variant="solid" />
                                    </View>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>

                    <View className="flex-row items-center justify-center gap-2 opacity-60">
                        <Pressable onPress={handleRestore} hitSlop={15}>
                            <Text className="text-neutral-400 text-[11px] font-lexend font-medium">
                                Restore Purchases
                            </Text>
                        </Pressable>
                        <Text className="text-neutral-600 text-[10px]">•</Text>
                        <View className="flex-row items-center gap-1">
                            <HugeiconsIcon icon={LockKeyIcon} size={10} color="#666" />
                            <Text className="text-neutral-400 text-[11px] font-lexend font-medium">
                                Secured by Apple
                            </Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};

export default PaywallScreen;