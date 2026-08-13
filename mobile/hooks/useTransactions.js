// react custom hook file

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";
import { useAppDate } from "../context/AppDateContext";

// const API_URL = "https://wallet-api-cxqp.onrender.com/api";
// const API_URL = "http://localhost:5001/api";

export const useTransactions = (userId) => {
  const { appDate } = useAppDate();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const buildHeaders = useCallback(() => {
    const headers = {};

    if (appDate) {
      headers["x-app-date"] = appDate;
    }

    return headers;
  }, [appDate]);

  // useCallback is used for performance reasons, it will memoize the function
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/${userId}`, {
        headers: buildHeaders(),
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [buildHeaders, userId]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/summary/${userId}`, {
        headers: buildHeaders(),
      });
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [buildHeaders, userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // can be run in parallel
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete transaction");

      // Refresh data after deletion so the list and summary stay in sync.
      await loadData();
      Alert.alert("Success", "Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", error.message);
    }
  };

  return { transactions, summary, isLoading, loadData, deleteTransaction };
};
