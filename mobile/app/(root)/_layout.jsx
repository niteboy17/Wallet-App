import { useUser } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null; // this is for a better ux

  if (!isSignedIn) return <Redirect href={"/sign-in"} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios" ? "transparent" : COLORS.card,
          borderTopColor: Platform.OS === "ios" ? "transparent" : COLORS.border,
          height: 76,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 14 : 10,
          marginHorizontal: 14,
          marginBottom: 10,
          marginTop: 0,
          borderRadius: 28,
          position: "absolute",
          overflow: "hidden",
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.12,
          shadowRadius: 10,
          elevation: Platform.OS === "android" ? 8 : 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
          ) : null,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="presets"
        options={{
          title: "Automation",
          tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}
