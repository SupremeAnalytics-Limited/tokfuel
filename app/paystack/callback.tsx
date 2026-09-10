import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function PaystackCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const reference = String(params.reference ?? params.trxref ?? "");
  const verify = trpc.payments.verify.useMutation();

  useEffect(() => {
    if (!reference) return;
    verify.mutate({ reference }, {
      onSuccess: () => router.replace("/(tabs)/orders"),
      onError: () => router.replace("/(tabs)/orders"),
    });
  }, [reference]);

  return <View style={styles.screen}><ActivityIndicator size="large" color="#25F4EE" /><Text style={styles.title}>Returning to TokFuel</Text><Text style={styles.body}>Confirming your payment and gift status…</Text></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B0B0F", padding: 28 }, title: { color: "#F8FAFC", fontSize: 20, fontWeight: "800", marginTop: 16 }, body: { color: "#9CA3AF", fontSize: 13, marginTop: 8, textAlign: "center" } });
