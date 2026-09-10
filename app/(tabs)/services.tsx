import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

function iconForGift(category: string): { name: any; color: string } {
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
  const giftsQuery = trpc.smm.getServices.useQuery();
  const gifts = giftsQuery.data ?? [];

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>TOKFUEL GIFTS</Text><Text style={styles.title}>Pick a way to show love</Text><Text style={styles.subtitle}>Choose a predefined creator gift. Add 500 or 1,000 units at a time and send it to a TikTok account or video.</Text>
    {giftsQuery.isLoading && <View style={styles.state}><Text style={styles.stateText}>Loading gifts…</Text></View>}
    {giftsQuery.isError && <View style={styles.error}><Ionicons name="cloud-offline-outline" size={21} color="#FF4D6D" /><View style={{ flex: 1 }}><Text style={styles.errorText}>Gifts are temporarily unavailable. Please try again shortly.</Text><Pressable onPress={() => giftsQuery.refetch()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View></View>}
    {!giftsQuery.isLoading && !giftsQuery.isError && gifts.length === 0 && <View style={styles.state}><Text style={styles.stateText}>No gifts are available right now.</Text></View>}
    <View style={styles.grid}>{gifts.map((gift) => { const icon = iconForGift(gift.category); return <Pressable key={gift.giftId} style={({ pressed }) => [styles.card, pressed && { opacity: .7 }]} onPress={() => router.push({ pathname: "/(tabs)/gift-checkout", params: { giftId: gift.giftId } })}><View style={[styles.icon, { backgroundColor: `${icon.color}20` }]}><Ionicons name={icon.name} size={23} color={icon.color} /></View><Text style={styles.cardTitle} numberOfLines={2}>{gift.title}</Text><Text style={styles.cardDescription} numberOfLines={2}>{gift.description}</Text><View style={styles.cardFooter}><Text style={styles.price}>₦{gift.customerRatePerThousand.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text><Text style={styles.unit}>/ 1,000</Text></View><Text style={styles.range}>From {gift.minQuantity.toLocaleString()} · +500 steps</Text><View style={styles.giftButton}><Text style={styles.giftButtonText}>Gift now</Text><Ionicons name="arrow-forward" size={14} color="#25F4EE" /></View></Pressable>; })}</View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 40 }, kicker: { color: "#25F4EE", fontWeight: "800", fontSize: 10, letterSpacing: 1.2 }, title: { color: "#F8FAFC", fontWeight: "800", fontSize: 31, marginTop: 10 }, subtitle: { color: "#9CA3AF", fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 22 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, card: { width: "48.5%", minHeight: 232, backgroundColor: "#15151C", borderColor: "#292935", borderWidth: 1, borderRadius: 18, padding: 14 }, icon: { width: 43, height: 43, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 14 }, cardTitle: { color: "#F8FAFC", fontWeight: "800", fontSize: 13, lineHeight: 17 }, cardDescription: { color: "#858594", fontSize: 10, lineHeight: 15, marginTop: 6, minHeight: 30 }, cardFooter: { flexDirection: "row", alignItems: "baseline", marginTop: 13 }, price: { color: "#25F4EE", fontSize: 17, fontWeight: "800" }, unit: { color: "#6F707D", fontSize: 9, marginLeft: 3 }, range: { color: "#6F707D", fontSize: 9, marginTop: 5 }, giftButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderColor: "#2A4C50", borderWidth: 1, borderRadius: 9, paddingVertical: 8, marginTop: 12 }, giftButtonText: { color: "#25F4EE", fontSize: 11, fontWeight: "800" }, state: { padding: 20, borderRadius: 16, backgroundColor: "#15151C", borderWidth: 1, borderColor: "#292935" }, stateText: { color: "#9CA3AF", fontSize: 13, textAlign: "center" }, error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 15, borderRadius: 16, backgroundColor: "#2A1720", borderWidth: 1, borderColor: "#5D2738" }, errorText: { color: "#FFB6C5", fontSize: 12, lineHeight: 18 }, retry: { alignSelf: "flex-start", marginTop: 9, borderWidth: 1, borderColor: "#FF4D6D", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }, retryText: { color: "#FFB6C5", fontWeight: "800", fontSize: 10 },
});
