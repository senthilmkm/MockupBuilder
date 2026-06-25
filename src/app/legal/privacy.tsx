import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/services/haptics';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => { haptics.lightImpact(); router.back(); }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Last updated: June 24, 2026</Text>
      
      <Text style={styles.sectionTitle}>1. No Data Collection</Text>
      <Text style={styles.bodyText}>
        MockupBuilder is a fully client-side application. We do not host or operate backend servers, and we do not collect, upload, or transmit any of your imported screenshots, design templates, or personal coordinates to any third-party services.
      </Text>

      <Text style={styles.sectionTitle}>2. Photo Library Access</Text>
      <Text style={styles.bodyText}>
        MockupBuilder requests access to your Photo Library purely to let you pick screenshot files for editing and save generated mockups. This interaction is handled entirely locally on your device. We never transfer your media files off-device.
      </Text>

      <Text style={styles.sectionTitle}>3. In-App Purchases (StoreKit)</Text>
      <Text style={styles.bodyText}>
        Subscriptions and payments are securely managed via Apple StoreKit and RevenueCat. Payment details are never shared with or processed by MockupBuilder.
      </Text>
      
      <Text style={styles.sectionTitle}>4. Contact Us</Text>
      <Text style={styles.bodyText}>
        If you have any questions, feel free to contact us at senthil930@gmail.com
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
