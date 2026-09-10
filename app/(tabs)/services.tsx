import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";

const GIFTS = [
  { title: "Creator cheers", desc: "Send a little love to their account", amount: "₦500", icon: "heart" as const, color: "#FE2C55" },
  { title: "FYP boost gift", desc: "Help their next video travel further", amount: "₦1,000", icon: "rocket" as const, color: "#25F4EE" },
  { title: "Live moment", desc: "Celebrate a creator going LIVE", amount: "₦2,500", icon: "radio" as const, color: "#A98CFF" },
  { title: "Big launch gift", desc: "Back a song, brand, or big drop", amount: "₦5,000", icon: "sparkles" as const, color: "#FFB800" },
];

export default function ServicesScreen() {
  const router = useRouter();
  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>TOKFUEL GIFT CARDS</Text><Text style={styles.title}>Choose a gift</Text><Text style={styles.subtitle}>Every gift is delivered as creator-support credit to their TikTok account.</Text>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={19} color="#25F4EE" /><Text style={styles.noticeText}>No buying followers. Just gifting support to help creators keep creating.</Text></View>
    <Text style={styles.section}>Popular gifts</Text>
    {GIFTS.map((gift) => <Pressable key={gift.title} style={({ pressed }) => [styles.card, pressed && { opacity: .7 }]} onPress={() => router.push("/(tabs)/gift-checkout")}><View style={[styles.icon, { backgroundColor: `${gift.color}20` }]}><Ionicons name={gift.icon} size={22} color={gift.color} /></View><View style={styles.cardBody}><Text style={styles.cardTitle}>{gift.title}</Text><Text style={styles.cardDesc}>{gift.desc}</Text></View><View style={styles.amount}><Text style={styles.amountText}>{gift.amount}</Text><Ionicons name="chevron-forward" size={16} color="#6B7280" /></View></Pressable>)}
    <View style={styles.custom}><Ionicons name="gift-outline" size={21} color="#25F4EE" /><View style={{ flex: 1 }}><Text style={styles.customTitle}>Make it personal</Text><Text style={styles.customDesc}>Load any amount onto a TokFuel gift card.</Text></View><Ionicons name="arrow-forward" size={18} color="#25F4EE" /></View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 40 }, kicker: { color: "#25F4EE", fontWeight: "800", fontSize: 10, letterSpacing: 1.2 }, title: { color: "#F8FAFC", fontWeight: "800", fontSize: 35, marginTop: 10 }, subtitle: { color: "#9CA3AF", fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 }, notice: { flexDirection: "row", gap: 9, padding: 13, borderRadius: 14, backgroundColor: "#132326", marginBottom: 28 }, noticeText: { flex: 1, color: "#B7E9E7", fontSize: 12, lineHeight: 18 }, section: { color: "#F8FAFC", fontSize: 18, fontWeight: "800", marginBottom: 13 }, card: { flexDirection: "row", alignItems: "center", backgroundColor: "#15151C", borderColor: "#292935", borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 10 }, icon: { width: 43, height: 43, borderRadius: 14, justifyContent: "center", alignItems: "center" }, cardBody: { flex: 1, marginLeft: 12 }, cardTitle: { color: "#F8FAFC", fontWeight: "800", fontSize: 14 }, cardDesc: { color: "#858594", fontSize: 11, marginTop: 5 }, amount: { flexDirection: "row", alignItems: "center", gap: 4 }, amountText: { color: "#25F4EE", fontWeight: "800", fontSize: 13 }, custom: { flexDirection: "row", gap: 11, alignItems: "center", borderColor: "#2A4C50", borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 12 }, customTitle: { color: "#F8FAFC", fontWeight: "800", fontSize: 13 }, customDesc: { color: "#858594", fontSize: 11, marginTop: 4 },
});
