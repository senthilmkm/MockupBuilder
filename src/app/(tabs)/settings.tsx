import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Switch, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/services/haptics';
import { useCanvasStore } from '@/store/canvasStore';
import pricing from '@/constants/pricing.json';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { clearAll, isPro } = useCanvasStore();
  
  // Settings States
  const [hapticEnabled, setHapticEnabled] = useState(haptics.getHapticsEnabled());
  const [pushEnabled, setPushEnabled] = useState(true);
  const [saveLocation, setSaveLocation] = useState<'photos' | 'filesystem'>('photos');

  const toggleHaptics = (val: boolean) => {
    haptics.lightImpact();
    setHapticEnabled(val);
    haptics.setHapticsEnabled(val);
  };

  const handleClearCache = () => {
    haptics.mediumImpact();
    Alert.alert(
      'Reset Canvas?',
      'This will clear the current editing screenshot and delete all annotations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            clearAll();
            haptics.success();
            Alert.alert('Reset Complete', 'Editor workspace cleared.');
          }
        }
      ]
    );
  };

  const showSupportInfo = () => {
    haptics.lightImpact();
    const email = 'senthil930@gmail.com';
    const url = `mailto:${email}?subject=MockupBuilder%20Support`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'Support Contact',
            `For issues or feature requests, contact us at:\n\n${email}`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.warn('Failed to open email client:', err);
        Alert.alert(
          'Support Contact',
          `For issues or feature requests, contact us at:\n\n${email}`,
          [{ text: 'OK' }]
        );
      });
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={styles.title}>Settings</Text>
      
      {/* 1. Subscription Status */}
      {pricing.appBanner.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Subscription</Text>
          <TouchableOpacity 
            style={[styles.premiumCard, isPro && styles.premiumCardActiveStatus]}
            onPress={() => { 
              haptics.mediumImpact(); 
              if (isPro) {
                Alert.alert(
                  'Subscription Active', 
                  'Your MockupBuilder Pro subscription is active. Thank you for your support!',
                  [
                    { 
                      text: 'Manage Subscription', 
                      onPress: () => {
                        haptics.lightImpact();
                        Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {
                          Alert.alert('Error', 'Could not open subscription management. Please open Settings app -> Apple Account -> Subscriptions.');
                        });
                      }
                    },
                    { text: 'OK', style: 'cancel' }
                  ]
                );
              } else {
                router.push('/paywall'); 
              }
            }}
          >
            <View style={styles.premiumTextWrapper}>
              <Text style={[styles.premiumTitle, isPro && styles.premiumTitleActive]}>
                {isPro ? 'MockupBuilder Pro Active' : pricing.appBanner.title}
              </Text>
              <Text style={styles.premiumSubtitle}>
                {isPro ? 'You have unlimited access to all premium features.' : pricing.appBanner.subtitle}
              </Text>
            </View>
            <Text style={[styles.premiumBadge, isPro && styles.premiumBadgeActive]}>
              {isPro ? 'Active' : pricing.appBanner.badge}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences</Text>
        
        {/* Haptics Switch */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Haptic Feedback</Text>
          <Switch 
            value={hapticEnabled} 
            onValueChange={toggleHaptics}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={hapticEnabled ? '#F8FAFC' : '#94A3B8'}
          />
        </View>

        {/* Notifications Switch */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>System Alerts / Tips</Text>
          <Switch 
            value={pushEnabled} 
            onValueChange={(val) => { haptics.lightImpact(); setPushEnabled(val); }}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={pushEnabled ? '#F8FAFC' : '#94A3B8'}
          />
        </View>

        {/* Export Save Preference */}
        <View style={styles.rowGroup}>
          <Text style={styles.rowLabel}>Default Export Save</Text>
          <View style={styles.segmentContainer}>
            <TouchableOpacity 
              style={[styles.segmentBtn, saveLocation === 'photos' && styles.segmentBtnActive]}
              onPress={() => { haptics.lightImpact(); setSaveLocation('photos'); }}
            >
              <Text style={[styles.segmentText, saveLocation === 'photos' && styles.segmentTextActive]}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, saveLocation === 'filesystem' && styles.segmentBtnActive]}
              onPress={() => { haptics.lightImpact(); setSaveLocation('filesystem'); }}
            >
              <Text style={[styles.segmentText, saveLocation === 'filesystem' && styles.segmentTextActive]}>Files</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Cache & Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Storage & Workspace</Text>
        <TouchableOpacity style={styles.rowButton} onPress={handleClearCache}>
          <Text style={[styles.rowButtonLabel, { color: '#EF4444' }]}>Clear Project Canvas</Text>
        </TouchableOpacity>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Exported PDFs and CSV spec sheets are automatically cleared from the device cache after 7 days.
          </Text>
        </View>
      </View>

      {/* 4. Legal & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Legal & Support</Text>
        
        {/* Help & FAQs */}
        <TouchableOpacity style={styles.rowButton} onPress={() => { haptics.lightImpact(); router.push('/help'); }}>
          <Text style={styles.rowButtonLabel}>Help & FAQs</Text>
        </TouchableOpacity>

        {/* Support Mail */}
        <TouchableOpacity style={styles.rowButton} onPress={showSupportInfo}>
          <Text style={styles.rowButtonLabel}>Contact Email Support</Text>
        </TouchableOpacity>

        {/* Terms */}
        <TouchableOpacity style={styles.rowButton} onPress={() => { haptics.lightImpact(); router.push('/legal/terms'); }}>
          <Text style={styles.rowButtonLabel}>Terms of Service</Text>
        </TouchableOpacity>

        {/* Privacy */}
        <TouchableOpacity style={styles.rowButton} onPress={() => { haptics.lightImpact(); router.push('/legal/privacy'); }}>
          <Text style={styles.rowButtonLabel}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Version Tag */}
      <Text style={styles.versionTag}>
        MockupBuilder v1.0.0 (Expo SDK 56)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  // Premium Card
  premiumCard: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: '#0284C7',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumTextWrapper: {
    flex: 1,
  },
  premiumTitle: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  premiumSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  premiumBadge: {
    backgroundColor: '#0284C7',
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  premiumCardActiveStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10B981',
  },
  premiumTitleActive: {
    color: '#34D399',
  },
  premiumBadgeActive: {
    backgroundColor: '#10B981',
  },
  // Settings Item Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2.5,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#1E293B',
  },
  segmentText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#38BDF8',
  },
  rowButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowButtonLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
    borderColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  versionTag: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
});
