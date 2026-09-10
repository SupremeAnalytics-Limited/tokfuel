import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [link, setLink] = useState("");
  const servicesQuery = trpc.smm.getServices.useQuery();
  const quickServices = (servicesQuery.data ?? []).slice(0, 4);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><View style={styles.brandMarkPink} /><View style={styles.brandMarkCyan} /></View>
              <Text style={styles.brand}>tokfuel</Text>
            </View>
            <Text style={styles.eyebrow}>SEND A LITTLE MORE LOVE</Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => router.push("/(tabs)/settings")}><Text style={styles.avatarText}>TF</Text></Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroKicker}>A GIFT FOR THEIR NEXT BIG MOMENT</Text>
          <Text style={styles.heroTitle}>Make their{`\n`}TikTok shine.</Text>
          <Text style={styles.heroBody}>Send gift-card credit to support a TikTok creator, celebrate a launch, or show love to your favourite account.</Text>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => router.push("/(tabs)/services")}>
            <Text style={styles.primaryButtonText}>Choose a creator gift</Text><Ionicons name="gift-outline" size={18} color="#0B0B0F" />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Gift categories</Text><Pressable onPress={() => router.push("/(tabs)/services")}><Text style={styles.viewAll}>See all</Text></Pressable></View>
        <View style={styles.quickGrid}>
          {servicesQuery.isLoading && <Text style={styles.liveState}>Loading live TikTok services…</Text>}
          {servicesQuery.isError && <Text style={styles.liveError}>Live Socially.ng services are unavailable right now.</Text>}
          {quickServices.map((service) => {
            return <Pressable key={service.giftId} style={({ pressed }) => [styles.serviceCard, pressed && styles.cardPressed]} onPress={() => router.push("/(tabs)/services")}>
              <View style={[styles.serviceIcon, { backgroundColor: "#25F4EE20" }]}><Ionicons name="gift-outline" size={22} color="#25F4EE" /></View>
              <Text style={styles.serviceLabel}>{service.title}</Text>
              <Text style={styles.servicePrice}>₦{service.customerRatePerThousand.toLocaleString("en-NG", { minimumFractionDigits: 2 })} / 1k</Text>
            </Pressable>
          })}
        </View>

        <View style={styles.linkCard}>
          <View style={styles.linkCardHeader}><View><Text style={styles.linkTitle}>Who are you gifting?</Text><Text style={styles.linkSubtitle}>Paste their TikTok profile or video link.</Text></View><Ionicons name="gift-outline" color="#25F4EE" size={23} /></View>
          <View style={styles.inputWrap}><Ionicons name="logo-tiktok" size={19} color="#6B7280" /><TextInput value={link} onChangeText={setLink} placeholder="Paste TikTok account link" placeholderTextColor="#6B7280" style={styles.input} autoCapitalize="none" /></View>
          <Pressable style={({ pressed }) => [styles.analyzeButton, pressed && styles.pressed]} onPress={() => router.push("/(tabs)/services")}><Text style={styles.analyzeText}>View gift options</Text><Ionicons name="arrow-forward" size={16} color="#25F4EE" /></Pressable>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent gifts</Text><Pressable onPress={() => router.push("/(tabs)/orders")}><Text style={styles.viewAll}>View all</Text></Pressable></View>
        <View style={styles.orderCard}><View style={[styles.orderIcon, { backgroundColor: "#25F4EE18" }]}><Ionicons name="cloud-download-outline" color="#25F4EE" size={21} /></View><View style={styles.orderInfo}><Text style={styles.orderTitle}>Live orders appear here</Text><Text style={styles.orderSubtitle}>After you send a service gift through Socially.ng.</Text></View></View>
        <View style={styles.trustRow}><Ionicons name="shield-checkmark-outline" size={16} color="#31D158" /><Text style={styles.trustText}>Transparent gift cards · Secure checkout · Delivery tracking</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 12, paddingBottom: 40, gap: 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: { width: 19, height: 22, position: "relative" },
  brandMarkPink: { position: "absolute", right: 0, top: 0, width: 8, height: 18, backgroundColor: "#FE2C55", transform: [{ skewY: "-20deg" }] },
  brandMarkCyan: { position: "absolute", left: 0, bottom: 0, width: 8, height: 18, backgroundColor: "#25F4EE", transform: [{ skewY: "-20deg" }] },
  brand: { fontSize: 27, fontWeight: "800", letterSpacing: -1.2, color: "#F8FAFC" },
  eyebrow: { fontSize: 9, fontWeight: "700", letterSpacing: 1.3, color: "#6B7280", marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1D1D26", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A35" },
  avatarText: { color: "#25F4EE", fontWeight: "800", fontSize: 13 },
  hero: { minHeight: 286, borderRadius: 24, padding: 24, backgroundColor: "#171722", overflow: "hidden", marginBottom: 27, borderWidth: 1, borderColor: "#262633" },
  heroGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#FE2C55", opacity: 0.12, right: -50, top: -55 },
  heroKicker: { color: "#25F4EE", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 15 },
  heroTitle: { color: "#F8FAFC", fontSize: 38, lineHeight: 40, fontWeight: "800", letterSpacing: -1.5 },
  heroBody: { color: "#A3A3B2", fontSize: 14, lineHeight: 21, marginTop: 14, maxWidth: 290 },
  primaryButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#25F4EE", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 13, marginTop: 20 },
  primaryButtonText: { color: "#0B0B0F", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13 },
  sectionTitle: { color: "#F8FAFC", fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  viewAll: { color: "#25F4EE", fontSize: 12, fontWeight: "700" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 27 },
  serviceCard: { width: "48.5%", backgroundColor: "#15151C", borderRadius: 17, padding: 15, borderWidth: 1, borderColor: "#272733" },
  cardPressed: { opacity: 0.7 },
  serviceIcon: { width: 39, height: 39, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  serviceLabel: { color: "#F8FAFC", fontSize: 14, fontWeight: "700" },
  servicePrice: { color: "#858594", fontSize: 11, marginTop: 5 },
  liveState: { color: "#9CA3AF", fontSize: 12, paddingVertical: 12 },
  liveError: { color: "#FFB6C5", fontSize: 12, paddingVertical: 12 },
  linkCard: { backgroundColor: "#15151C", borderRadius: 19, padding: 17, borderWidth: 1, borderColor: "#272733", marginBottom: 28 },
  linkCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 },
  linkTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "800" },
  linkSubtitle: { color: "#858594", fontSize: 11, marginTop: 5 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 12, backgroundColor: "#0D0D13", borderWidth: 1, borderColor: "#2A2A35", paddingHorizontal: 12, height: 45 },
  input: { flex: 1, color: "#F8FAFC", fontSize: 13 },
  analyzeButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 12, marginTop: 10, borderRadius: 11, borderWidth: 1, borderColor: "#2A4C50" },
  analyzeText: { color: "#25F4EE", fontSize: 12, fontWeight: "800" },
  orderCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#15151C", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#272733" },
  orderIcon: { width: 39, height: 39, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  orderInfo: { flex: 1 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTitle: { color: "#F8FAFC", fontSize: 13, fontWeight: "700" },
  orderStatus: { fontSize: 10, fontWeight: "800" },
  orderSubtitle: { color: "#858594", fontSize: 11, marginTop: 4, marginBottom: 9 },
  progressTrack: { height: 4, backgroundColor: "#2B2B35", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  trustRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 },
  trustText: { color: "#6B7280", fontSize: 10 },
});
