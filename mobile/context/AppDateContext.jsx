import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const APP_DATE_STORAGE_KEY = "wallet-app-date";

const AppDateContext = createContext({
  appDate: null,
  setAppDate: () => {},
  clearAppDate: () => {},
  isReady: false,
});

async function readStoredDate() {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(APP_DATE_STORAGE_KEY) : null;
  }

  return SecureStore.getItemAsync(APP_DATE_STORAGE_KEY);
}

async function writeStoredDate(value) {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      return;
    }

    if (value) {
      window.localStorage.setItem(APP_DATE_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(APP_DATE_STORAGE_KEY);
    }

    return;
  }

  if (value) {
    await SecureStore.setItemAsync(APP_DATE_STORAGE_KEY, value);
  } else {
    await SecureStore.deleteItemAsync(APP_DATE_STORAGE_KEY);
  }
}

export function AppDateProvider({ children }) {
  const [appDate, setAppDateState] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    readStoredDate()
      .then((value) => {
        if (isMounted) {
          setAppDateState(value || null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setAppDate = async (value) => {
    setAppDateState(value || null);
    await writeStoredDate(value || null);
  };

  const clearAppDate = async () => {
    setAppDateState(null);
    await writeStoredDate(null);
  };

  const contextValue = useMemo(
    () => ({
      appDate,
      setAppDate,
      clearAppDate,
      isReady,
    }),
    [appDate, isReady]
  );

  return <AppDateContext.Provider value={contextValue}>{children}</AppDateContext.Provider>;
}

export function useAppDate() {
  return useContext(AppDateContext);
}