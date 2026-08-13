import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { AppDateProvider } from "../context/AppDateContext";

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <AppDateProvider>
        <SafeScreen>
          <Slot />
        </SafeScreen>
      </AppDateProvider>
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}
