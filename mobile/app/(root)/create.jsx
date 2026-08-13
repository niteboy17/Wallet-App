import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
import { API_URL } from "../../constants/api";
import { styles } from "../../assets/styles/create.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

// Expense categories stay here so the picker only shows expense options when needed.
const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

// Income categories appear only after the user chooses Income, which keeps the picker focused.
const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary", icon: "briefcase" },
  { id: "freelance", name: "Freelance", icon: "laptop" },
  { id: "stocks", name: "Stocks", icon: "trending-up" },
  { id: "bonus", name: "Bonus", icon: "gift" },
  { id: "refunds", name: "Refunds", icon: "return-up-back" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

const CreateScreen = () => {
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const visibleCategories = isExpense === true ? EXPENSE_CATEGORIES : isExpense === false ? INCOME_CATEGORIES : [];

  const resetForm = useCallback(() => {
    setTitle("");
    setAmount("");
    setSelectedCategory("");
    setIsExpense(null);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetForm();

      return () => {
        resetForm();
      };
    }, [resetForm])
  );

  const handleCreate = async () => {
    // validations
    if (isExpense === null) return Alert.alert("Error", "Please select income or expense type");
    if (!title.trim()) return Alert.alert("Error", "Please enter a transaction title");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) return Alert.alert("Error", "Please select a category");

    setIsLoading(true);
    try {
      // Format the amount (negative for expenses, positive for income)
      const formattedAmount = isExpense
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          title,
          amount: formattedAmount,
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || "Failed to create transaction");
      }

      Alert.alert("Success", "Transaction created successfully");
      resetForm();
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create transaction");
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Transaction</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.typeSelector}>
          {/* EXPENSE SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, isExpense === true && styles.typeButtonActive]}
            onPress={() => {
              setIsExpense(true);
              setSelectedCategory("");
            }}
          >
            <Ionicons
              name="arrow-down-circle"
              size={22}
              color={isExpense === true ? COLORS.white : COLORS.expense}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, isExpense === true && styles.typeButtonTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>

          {/* INCOME SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, isExpense === false && styles.typeButtonActive]}
            onPress={() => {
              setIsExpense(false);
              setSelectedCategory("");
            }}
          >
            <Ionicons
              name="arrow-up-circle"
              size={22}
              color={isExpense === false ? COLORS.white : COLORS.income}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, isExpense === false && styles.typeButtonTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* AMOUNT CONTAINER */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>৳</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* INPUT CONTAINER */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="create-outline"
            size={22}
            color={COLORS.textLight}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Transaction Title"
            placeholderTextColor={COLORS.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category picker stays hidden until Income or Expense is selected. */}
        {isExpense !== null ? (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.text} /> Category
            </Text>

            <View style={styles.categoryGrid}>
              {visibleCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.name && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={selectedCategory === category.name ? COLORS.white : COLORS.text}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category.name && styles.categoryButtonTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};
export default CreateScreen;
