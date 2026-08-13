import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { BalanceCard } from "../../components/BalanceCard";
import PageLoader from "../../components/PageLoader";
import { useTransactions } from "../../hooks/useTransactions";
import { useAppDate } from "../../context/AppDateContext";
import { styles } from "../../assets/styles/automation.styles";
import { COLORS } from "../../constants/colors";
import { API_URL } from "../../constants/api";

const DEFAULT_BUTTONS = [
  { id: "salary", title: "Salary", category: "Income", sign: 1, amount: 0, icon: "briefcase-outline", helperText: "Monthly income" },
  // Bank profit stores a percentage, not a taka amount.
  { id: "bank_profit", title: "Bank Profit", category: "Income", sign: 1, amount: 0, icon: "trending-up-outline", helperText: "Auto % of balance" },
  { id: "rent", title: "Rent", category: "Bills", sign: -1, amount: 0, icon: "home-outline", helperText: "Monthly expense" },
  { id: "electricity", title: "Electricity Bill", category: "Bills", sign: -1, amount: 0, icon: "flash-outline", helperText: "Monthly expense" },
  { id: "groceries", title: "Groceries", category: "Food & Drinks", sign: -1, amount: 0, icon: "basket-outline", helperText: "Monthly expense" },
  { id: "internet", title: "Internet", category: "Bills", sign: -1, amount: 0, icon: "wifi-outline", helperText: "Monthly expense" },
  { id: "freelance", title: "Freelance", category: "Income", sign: 1, amount: 0, icon: "cash-outline", helperText: "Optional income" },
];

function getPresetStorageKey(userId) {
  return `wallet-automation-presets-${userId}`;
}

async function readStoredButtons(userId) {
  const storageKey = getPresetStorageKey(userId);

  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      return null;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  }

  const storedValue = await SecureStore.getItemAsync(storageKey);
  return storedValue ? JSON.parse(storedValue) : null;
}

async function writeStoredButtons(userId, buttons) {
  const storageKey = getPresetStorageKey(userId);
  const serializedButtons = JSON.stringify(buttons);

  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, serializedButtons);
    return;
  }

  await SecureStore.setItemAsync(storageKey, serializedButtons);
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AutomationPage() {
  const { user } = useUser();
  const { summary, isLoading, loadData } = useTransactions(user?.id);
  const { appDate, setAppDate, clearAppDate, isReady } = useAppDate();
  const [buttons, setButtons] = useState(DEFAULT_BUTTONS);
  const [isButtonsReady, setIsButtonsReady] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateDraft, setDateDraft] = useState(formatDateForInput(new Date()));
  const [automationStatus, setAutomationStatus] = useState("Waiting for date change");
  const lastAutomationKeyRef = useRef("");

  const currentButtons = useMemo(() => buttons, [buttons]);

  useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      setButtons(DEFAULT_BUTTONS);
      setIsButtonsReady(true);
      return () => {
        isMounted = false;
      };
    }

    setIsButtonsReady(false);

    readStoredButtons(user.id)
      .then((storedButtons) => {
        if (isMounted) {
          // Restore the user's last saved automation setup before running the month check.
          setButtons(storedButtons || DEFAULT_BUTTONS);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsButtonsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isButtonsReady) {
      return;
    }

    writeStoredButtons(user.id, buttons).catch((error) => {
      console.error("Error saving automation presets:", error);
    });
  }, [buttons, isButtonsReady, user?.id]);

  const resolvedDateLabel = appDate || "Live date";
  const automationMonthKey = useMemo(() => {
    const date = appDate ? new Date(appDate) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [appDate]);

  const headersForAppDate = useCallback(() => {
    const headers = { "Content-Type": "application/json" };

    if (appDate) {
      headers["x-app-date"] = appDate;
    }

    return headers;
  }, [appDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const triggerMonthlyAutomation = useCallback(async () => {
    if (!user?.id || !isReady || !isButtonsReady) {
      return;
    }

    const automationKey = `${user.id}:${automationMonthKey}:${buttons
      .map((button) => `${button.id}:${button.amount ?? "auto"}`)
      .join("|")}`;

    if (lastAutomationKeyRef.current === automationKey) {
      return;
    }

    lastAutomationKeyRef.current = automationKey;
    setAutomationStatus("Applying monthly automation...");

    try {
      const response = await fetch(`${API_URL}/transactions/automation/${user.id}`, {
        method: "POST",
        headers: headersForAppDate(),
        body: JSON.stringify({
          presets: buttons,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to run automation");
      }

      const result = await response.json();
      const createdCount = result.createdTransactions?.length ?? 0;
      setAutomationStatus(
        createdCount > 0
          ? `Applied for ${result.monthKey}: ${createdCount} new entries`
          : `No new entries for ${result.monthKey}`
      );
      await loadData();
    } catch (error) {
      setAutomationStatus(error.message || "Automation failed");
    }
  }, [automationMonthKey, buttons, headersForAppDate, isButtonsReady, isReady, loadData, user?.id]);

  useEffect(() => {
    triggerMonthlyAutomation();
  }, [triggerMonthlyAutomation]);

  const openAmountEditor = (button) => {
    setActiveButton(button);
    const resolvedAmount = button.amount ?? 0;
    setDraftAmount(String(resolvedAmount));
  };

  const closeAmountEditor = () => {
    setActiveButton(null);
    setDraftAmount("");
  };

  const saveAmount = () => {
    const parsedAmount = Number(draftAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      Alert.alert("Invalid value", "Enter a valid number greater than or equal to zero.");
      return;
    }

    if (activeButton?.id === "bank_profit" && parsedAmount > 100) {
      Alert.alert("Invalid percentage", "Use a percentage between 0 and 100.");
      return;
    }

    setButtons((currentButtonsState) =>
      currentButtonsState.map((button) => {
        if (button.id !== activeButton.id) {
          return button;
        }

        return { ...button, amount: parsedAmount };
      })
    );

    closeAmountEditor();
  };

  const openDateModal = () => {
    setDateDraft(appDate || formatDateForInput(new Date()));
    setDateModalVisible(true);
  };

  const saveDate = async () => {
    const parsedDate = new Date(dateDraft);

    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert("Invalid date", "Use a valid date like 2026-07-01.");
      return;
    }

    await setAppDate(dateDraft);
    setDateModalVisible(false);
    await loadData();
    lastAutomationKeyRef.current = "";
  };

  const useLiveDate = async () => {
    await clearAppDate();
    setDateModalVisible(false);
    await loadData();
    lastAutomationKeyRef.current = "";
  };

  if (!isReady || !isButtonsReady || (isLoading && summary.balance === 0 && summary.income === 0 && summary.expenses === 0)) {
    return <PageLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageEyebrow}>Automation</Text>
          <Text style={styles.pageTitle}>Presets and tests</Text>
          <Text style={styles.pageSubtitle}>
            Use these buttons to create preset income and expense entries, or move the app date to
            test month-based automation.
          </Text>
        </View>

        <View style={styles.datePanel}>
          <View style={styles.datePanelLeft}>
            <Text style={styles.datePanelLabel}>App date</Text>
            <Text style={styles.datePanelValue}>{resolvedDateLabel}</Text>
            <Text style={styles.datePanelHint}>
              Change this to simulate a new month for the bank profit rollover.
            </Text>
          </View>

          <View style={styles.datePanelActions}>
            <TouchableOpacity style={styles.dateButton} onPress={openDateModal}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
              <Text style={styles.dateButtonText}>Configure</Text>
            </TouchableOpacity>
            {appDate ? (
              <TouchableOpacity style={styles.dateGhostButton} onPress={useLiveDate}>
                <Text style={styles.dateGhostButtonText}>Use live</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <BalanceCard summary={summary} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Automation cards</Text>
          <Text style={styles.sectionHint}>These cards are configuration only. New month automation runs on its own.</Text>
        </View>

        <View style={styles.statusPill}>
          <Ionicons name="sync-outline" size={16} color={COLORS.primary} />
          <Text style={styles.statusText}>{automationStatus}</Text>
        </View>

        <View style={styles.buttonGrid}>
          {currentButtons.map((button) => {
            const amount = button.amount;
            const accent = button.sign > 0 ? COLORS.income : COLORS.expense;
            const buttonAmount = Number(amount || 0);
            const displayAmount = button.id === "bank_profit" ? `${buttonAmount.toFixed(2)}%` : `৳${buttonAmount.toFixed(2)}`;

            return (
              <TouchableOpacity
                key={button.id}
                style={styles.automationCard}
                activeOpacity={0.88}
                onPress={() => openAmountEditor(button)}
              >
                <View style={[styles.automationIcon, { backgroundColor: `${accent}18` }]}>
                  <Ionicons name={button.icon} size={21} color={accent} />
                </View>

                <View style={styles.automationContent}>
                  <Text style={styles.automationTitle}>{button.title}</Text>
                  <Text style={styles.automationSubtitle}>{button.helperText || button.category}</Text>
                </View>

                <View style={styles.automationActions}>
                  <Text style={[styles.automationAmount, { color: accent }]}>
                    {button.id === "bank_profit" ? displayAmount : `${button.sign > 0 ? "+" : "-"}৳${buttonAmount.toFixed(2)}`}
                  </Text>
                  <TouchableOpacity style={styles.moreButton} onPress={() => openAmountEditor(button)} hitSlop={10}>
                    <Ionicons name="ellipsis-vertical" size={18} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Salary and other income entries increase the balance. Expenses subtract from it. Bank
            profit is inserted automatically when a new month is detected and the previous balance
            is above zero.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={!!activeButton} transparent animationType="fade" onRequestClose={closeAmountEditor}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit amount</Text>
            <Text style={styles.modalSubtitle}>
              {activeButton?.id === "bank_profit"
                ? "Bank profit uses a percentage of the previous balance each month."
                : `Update the configured amount for ${activeButton?.title}.`}
            </Text>

            <View style={styles.modalInputWrap}>
              <Text style={styles.currencyPrefix}>{activeButton?.id === "bank_profit" ? "%" : "৳"}</Text>
              <TextInput
                value={draftAmount}
                onChangeText={setDraftAmount}
                keyboardType="numeric"
                placeholder={activeButton?.id === "bank_profit" ? "20" : "0.00"}
                placeholderTextColor={COLORS.textLight}
                style={styles.modalInput}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={closeAmountEditor}>
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryAction} onPress={saveAmount}>
                <Text style={styles.primaryActionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure app date</Text>
            <Text style={styles.modalSubtitle}>Use YYYY-MM-DD to simulate a new day or month.</Text>

            <View style={styles.modalInputWrap}>
              <Text style={styles.currencyPrefix}>📅</Text>
              <TextInput
                value={dateDraft}
                onChangeText={setDateDraft}
                placeholder="2026-07-01"
                placeholderTextColor={COLORS.textLight}
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={useLiveDate}>
                <Text style={styles.secondaryActionText}>Live date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryAction} onPress={saveDate}>
                <Text style={styles.primaryActionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
