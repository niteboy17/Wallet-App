import Constants from "expo-constants";
import { Platform } from "react-native";

const defaultApiUrl = "http://localhost:5001/api";
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;
const localhostPattern = /(^|:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i;

function getExpoHost() {
	const hostUri =
		Constants.expoConfig?.hostUri ??
		Constants.expoGoConfig?.hostUri ??
		Constants.manifest2?.extra?.expoClient?.hostUri;

	if (!hostUri) {
		return null;
	}

	return hostUri.split(":")[0];
}

function rewriteLocalhost(apiUrl) {
	if (!localhostPattern.test(apiUrl)) {
		return apiUrl;
	}

	if (Platform.OS === "web") {
		return apiUrl;
	}

	const expoHost = getExpoHost();
	if (expoHost && expoHost !== "localhost" && expoHost !== "127.0.0.1") {
		return apiUrl.replace(/localhost|127\.0\.0\.1/i, expoHost);
	}

	if (Platform.OS === "android") {
		return apiUrl.replace(/localhost|127\.0\.0\.1/i, "10.0.2.2");
	}

	return apiUrl;
}

export const API_URL = rewriteLocalhost(configuredApiUrl);
