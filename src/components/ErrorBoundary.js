import * as Updates from 'expo-updates';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch (e) {
            // Fallback if expo-updates is not available (e.g. dev mode)
            // In dev mode, we can just reset state to try re-rendering
            this.setState({ hasError: false, error: null, errorInfo: null });
        }
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FEF2F2' }}>
                    <View className="flex-1 items-center justify-center px-6">
                        <View className="bg-red-100 p-6 rounded-full mb-6">
                            <AlertTriangle size={48} color="#EF4444" strokeWidth={2} />
                        </View>

                        <Text className="text-2xl font-lexend-bold text-gray-900 mb-2 text-center">
                            Oops! Something went wrong
                        </Text>

                        <Text className="text-gray-600 font-lexend-light text-center mb-8 leading-6">
                            We're sorry, but the app encountered an unexpected error.
                            Our team has been notified.
                        </Text>

                        {/* Action Buttons */}
                        <View className="w-full gap-4">
                            <Pressable
                                onPress={this.handleReset}
                                className="bg-red-500 w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90 shadow-sm"
                            >
                                <RefreshCcw size={20} color="white" />
                                <Text className="text-white font-lexend-semibold text-base">
                                    Try Again
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={this.handleRestart}
                                className="bg-white border border-red-200 w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 active:bg-gray-50"
                            >
                                <Home size={20} color="#EF4444" />
                                <Text className="text-red-500 font-lexend-semibold text-base">
                                    Restart App
                                </Text>
                            </Pressable>
                        </View>

                        {/* Error Details (Dev only or hidden) */}
                        {__DEV__ && (
                            <ScrollView className="mt-8 w-full max-h-40 bg-white/50 rounded-xl p-4 border border-red-100">
                                <Text className="text-red-800 font-mono text-xs">
                                    {this.state.error?.toString()}
                                </Text>
                            </ScrollView>
                        )}
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
