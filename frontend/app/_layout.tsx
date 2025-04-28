import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { AuthProvider, DriverContextProvider, PassengerContextProvider, useAuth } from "@/contexts";
import * as Font from "expo-font";
import { ActivityIndicator, Alert } from "react-native";
import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import '../global.css';

SplashScreen.preventAutoHideAsync();

function AppProviders({ children }: { children: React.ReactNode }) {
  const { userAuth } = useAuth(); // Get authenticated user

  if (!userAuth) return children; // No user, no context required

  return userAuth.role === "verified-driver" ? (
    <DriverContextProvider>{children}</DriverContextProvider>
  ) : userAuth.role === "verified-passenger" ? (
    <PassengerContextProvider>{children}</PassengerContextProvider>
  ) : (
    children
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const loadFonts = async () => {
    await Font.loadAsync({
      Biski: require("../assets/fonts/BiskiTrial-Regular.otf"),
      Salsa: require("../assets/fonts/Salsa-Regular.ttf"),
      Handlee: require("../assets/fonts/Handlee-Regular.ttf"),
      Playpens: require("../assets/fonts/PlaypenSans-VariableFont_wght.ttf"),
      SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });
  };

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  const stripePublishableKey =
    Constants.expoConfig?.extra?.stripePublishableKey ||
    Constants.manifest?.extra?.stripePublishableKey;

  if (!stripePublishableKey) {
    Alert.alert("Configuration Error", "Stripe publishable key is missing in the environment file.");
    return null;
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <AuthProvider>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="signup" />
            <Stack.Screen name="login" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AppProviders>
      </AuthProvider>
    </StripeProvider>
  );
}
