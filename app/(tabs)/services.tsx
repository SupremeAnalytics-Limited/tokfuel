import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

function iconForCategory(category: string): { name: any; color: string } {
  const value = category.toLowerCase();
  if (value.includes("follower")) return { name: "people-outline", color: "#FE2C55" };
  if (value.includes("like")) return { name: "heart-outline", color: "#FF7393" };
  if (value.includes("view")) return { name: "play-outline", color: "#25F4EE" };
  if (value.includes("share")) return { name: "share-social-outline", color: "#A98CFF" };
  if (value.includes("comment")) return { name: "chatbubble-ellipses-outline", color: "#FFB800" };
  return { name: "gift-outline", color: "#25F4EE" };
}

export default function ServicesScreen() {
  const router = useRouter();
  const servicesQuery = trpc.smm.getServices.useQuery();
  const services = servicesQuery.data ?? [];

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>LIVE SOCIALLY.NG CATALOG</Text><Text style={styles.title}>Choose a service gift</Text><Text style={styles.subtitle}>These are live TikTok services supplied by Socially.ng. TokFuel adds an 80% markup to the wholesale rate before checkout.</Text>
    <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={19} color="#25F4EE" /><Text style={styles.noticeText}>Live data only. If Socially.ng is unavailable, TokFuel shows no fabricated services or prices.</Text></View>
    {servicesQuery.isLoading && <View style={styles.state}><Text style={styles.stateText}>Loading live Socially.ng TikTok services…</Text></View>}
    {servicesQuery.isError && <View style={styles.error}><Ionicons name="cloud-offline-outline" size={21} color="#FF4D6D" /><Text style={styles.errorText}>Live services are temporarily unavailable. Please try again shortly.</Text></View>}
    {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 && <View style={styles.state}><Text style={styles.stateText}>Socially.ng returned no TikTok services for this account.</Text></View>}
    {services.map((service) => { const icon = iconForCategory(service.category); const customerRate = Number((service.rate * 1.8).toFixed(2)); return <Pressable key={String(service.service)} style={({ pressed }) => [styles.card, pressed && { opacity: .7 }]} onPress={() => router.push({ pathname: "/(tabs)/gift-checkout", params: { serviceId: String(service.service) } })}><View style={[styles.icon, { backgroundColor: `${icon.color}20` }]}><Ionicons name={icon.name} size={22} color={icon.color} /></View><View style={styles.cardBody}><Text style={styles.cardTitle}>{service.category}</Text><Text style={styles.cardDesc} numberOfLines={2}>{service.name.replace(/\r?\n/g, " · ")}</Text><Text style={styles.meta}>Min {service.min.toLocaleString()} · Max {service.max.toLocaleString()} · {service.average_time ?? "Timing varies"}</Text></View><View style={styles.amount}><Text style={styles.amountText}>₦{customerRate.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text><Text style={styles.per}>/1k</Text><Ionicons name="chevron-forward" size={16} color="#6B7280" /></View></Pressable>; })}
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 40 }, kicker: { color: "#25F4EE", fontWeight: "800", fontSize: 10, letterSpacing: 1.2 }, title: { color: "#F8FAFC", fontWeight: "800", fontSize: 32, marginTop: 10 }, subtitle: { color: "#9CA3AF", fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 }, notice: { flexDirection: "row", gap: 9, padding: 13, borderRadius: 14, backgroundColor: "#132326", marginBottom: 20 }, noticeText: { flex: 1, color: "#B7E9E7", fontSize: 12, lineHeight: 18 }, state: { padding: 20, borderRadius: 16, backgroundColor: "#15151C", borderWidth: 1, borderColor: "#292935" }, stateText: { color: "#9CA3AF", fontSize: 13, textAlign: "center" }, error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 15, borderRadius: 16, backgroundColor: "#2A1720", borderWidth: 1, borderColor: "#5D2738" }, errorText: { flex: 1, color: "#FFB6C5", fontSize: 12, lineHeight: 18 }, card: { flexDirection: "row", alignItems: "center", backgroundColor: "#15151C", borderColor: "#292935", borderWidth: 1, borderRadius: 17, padding: 13, marginBottom: 10 }, icon: { width: 43, height: 43, borderRadius: 14, justifyContent: "center", alignItems: "center" }, cardBody: { flex: 1, marginLeft: 11, paddingRight: 8 }, cardTitle: { color: "#F8FAFC", fontWeight: "800", fontSize: 12 }, cardDesc: { color: "#B0B0BC", fontSize: 10, lineHeight: 15, marginTop: 4 }, meta: { color: "#6F707D", fontSize: 9, marginTop: 5 }, amount: { alignItems: "flex-end", gap: 2 }, amountText: { color: "#25F4EE", fontWeight: "800", fontSize: 12 }, per: { color: "#6F707D", fontSize: 9 },
});
