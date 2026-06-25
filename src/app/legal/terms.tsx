import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/services/haptics';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => { haptics.lightImpact(); router.back(); }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.date}>Last updated: June 24, 2026</Text>
      
      <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
      <Text style={styles.bodyText}>
        By downloading or using MockupBuilder, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not use the application.
      </Text>

      <Text style={styles.sectionTitle}>2. Subscriptions & Billing</Text>
      <Text style={styles.bodyText}>
        Some features (e.g. watermark removal, premium frames, document exports) require a paid subscription. Billing is processed securely via your Apple App Store account. Subscriptions auto-renew unless cancelled at least 24 hours prior to the end of the current period.
      </Text>

      <Text style={styles.sectionTitle}>3. Refunds & Cancellations</Text>
      <Text style={styles.bodyText}>
        You can manage and cancel your subscriptions in your App Store Account Settings. All refund requests are handled directly by Apple according to App Store policies.
      </Text>

      <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
      <Text style={styles.bodyText}>
        MockupBuilder is provided "as is" without warranty of any kind. In no event shall the developer be liable for any direct or indirect damages resulting from the use or inability to use this app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { paddingHorizontal: 24 },
  backBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginBottom: 24 },
  backText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  title: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  date: { color: '#64748B', fontSize: 12, marginBottom: 28 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  bodyText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
});
