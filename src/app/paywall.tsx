import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/services/haptics';
import { useCanvasStore } from '@/store/canvasStore';
import pricing from '@/constants/pricing.json';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { isPro } = useCanvasStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activePlanId, setActivePlanId] = useState<'monthly' | 'annual' | 'lifetime' | null>(null);

  React.useEffect(() => {
    if (isPro) {
      if (Platform.OS === 'web') {
        setActivePlanId('annual');
        setSelectedPlan('annual');
        return;
      }

      const checkActivePlan = async () => {
        try {
          const Purchases = require('react-native-purchases').default;
          const customerInfo = await Purchases.getCustomerInfo();
          const proEntitlement = customerInfo.entitlements.active['pro_access'];
          if (proEntitlement) {
            const prodId = proEntitlement.productIdentifier.toLowerCase();
            let matchedPlan: 'monthly' | 'annual' | 'lifetime' | null = null;
            if (prodId.includes('monthly')) {
              matchedPlan = 'monthly';
            } else if (prodId.includes('annual') || prodId.includes('yearly')) {
              matchedPlan = 'annual';
            } else if (prodId.includes('lifetime') || prodId.includes('one_time')) {
              matchedPlan = 'lifetime';
            }

            if (matchedPlan) {
              setActivePlanId(matchedPlan);
              setSelectedPlan(matchedPlan);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch customer info:', err);
        }
      };

      checkActivePlan();
    }
  }, [isPro]);

  const handleManageSubscription = () => {
    haptics.lightImpact();
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';

    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Manage Subscription',
        'Please open your device settings (Settings -> Apple Account / Google Account -> Subscriptions) to manage your active plan.'
      );
    });
  };

  const handlePurchase = async () => {
    haptics.mediumImpact();
    setIsPurchasing(true);

    if (Platform.OS === 'web') {
      // Mock StoreKit/RevenueCat checkout completion fallback for web browser
      setTimeout(() => {
        setIsPurchasing(false);
        haptics.success();
        useCanvasStore.getState().setProStatus(true);
        setActivePlanId(selectedPlan);
        Alert.alert('Congratulations!', 'You are now a MockupBuilder Pro member!', [
          { text: 'Awesome', onPress: () => router.back() }
        ]);
      }, 1500);
      return;
    }

    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        // Map UI selection to corresponding package type
        let expectedType = 'monthly';
        if (selectedPlan === 'annual') {
          expectedType = 'annual';
        } else if (selectedPlan === 'lifetime') {
          expectedType = 'lifetime';
        }
        const packageToBuy = offerings.current.availablePackages.find(
          (pkg: any) => pkg.packageType.toLowerCase() === expectedType
        ) || offerings.current.availablePackages[0];

        const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
        const isProActive = customerInfo.entitlements.active['pro_access'] !== undefined;
        useCanvasStore.getState().setProStatus(isProActive);

        if (isProActive) {
          const proEntitlement = customerInfo.entitlements.active['pro_access'];
          if (proEntitlement) {
            const prodId = proEntitlement.productIdentifier.toLowerCase();
            let matchedPlan: 'monthly' | 'annual' | 'lifetime' | null = null;
            if (prodId.includes('monthly')) matchedPlan = 'monthly';
            else if (prodId.includes('annual') || prodId.includes('yearly')) matchedPlan = 'annual';
            else if (prodId.includes('lifetime') || prodId.includes('one_time')) matchedPlan = 'lifetime';
            if (matchedPlan) setActivePlanId(matchedPlan);
          }
          haptics.success();
          Alert.alert('Success!', 'Thank you for upgrading to MockupBuilder Pro!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Subscription Incomplete', 'Could not verify entitlement. Please contact support.');
        }
      } else {
        Alert.alert('Store Connection Error', 'No active subscription offerings found.');
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Checkout Failed', error.message || 'An error occurred during payment.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    haptics.lightImpact();
    setIsPurchasing(true);
    
    if (Platform.OS === 'web') {
      // Mock subscription restore verification fallback for web browser
      setTimeout(() => {
        setIsPurchasing(false);
        haptics.success();
        useCanvasStore.getState().setProStatus(true);
        setActivePlanId('annual');
        Alert.alert('Restored', 'Your Pro purchases have been successfully restored.');
      }, 1000);
      return;
    }

    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.restorePurchases();
      const isProActive = customerInfo.entitlements.active['pro_access'] !== undefined;
      useCanvasStore.getState().setProStatus(isProActive);

      if (isProActive) {
        const proEntitlement = customerInfo.entitlements.active['pro_access'];
        if (proEntitlement) {
          const prodId = proEntitlement.productIdentifier.toLowerCase();
          let matchedPlan: 'monthly' | 'annual' | 'lifetime' | null = null;
          if (prodId.includes('monthly')) matchedPlan = 'monthly';
          else if (prodId.includes('annual') || prodId.includes('yearly')) matchedPlan = 'annual';
          else if (prodId.includes('lifetime') || prodId.includes('one_time')) matchedPlan = 'lifetime';
          if (matchedPlan) setActivePlanId(matchedPlan);
        }
        haptics.success();
        Alert.alert('Restored', 'Your Pro subscription has been successfully restored!', [
          { text: 'Awesome', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We could not find any active Pro subscriptions to restore.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'An error occurred while restoring purchases.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
    >
      {/* Header Controls */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => { haptics.lightImpact(); router.back(); }}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={restoreTextStyle()}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Title */}
      <Text style={styles.title}>{pricing.paywall.title}</Text>
      <Text style={styles.subtitle}>{pricing.paywall.subtitle}</Text>

      {/* Feature Value Grid */}
      <View style={styles.featureGrid}>
        {pricing.benefits.map((benefit, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.bullet}>✓</Text>
            <View style={styles.featureTextWrapper}>
              <Text style={styles.featureTitle}>{benefit.title}</Text>
              <Text style={styles.featureDesc}>{benefit.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Plan Card Options */}
      <View style={styles.planContainer}>
        {pricing.plans
          .filter(plan => plan.enabled)
          .map((plan) => (
            <TouchableOpacity 
              key={plan.id}
              style={[
                styles.planCard, 
                selectedPlan === plan.id && styles.planCardActive,
                (isPro && plan.id === activePlanId) && styles.planCardActivePro
              ]} 
              onPress={() => { haptics.lightImpact(); setSelectedPlan(plan.id as any); }}
            >
              {isPro && plan.id === activePlanId ? (
                <View style={styles.badgeActivePlan}>
                  <Text style={styles.badgeActivePlanText}>🟢 ACTIVE PLAN</Text>
                </View>
              ) : plan.isPopular ? (
                <View style={styles.badgePopular}>
                  <Text style={styles.badgePopularText}>BEST VALUE</Text>
                </View>
              ) : null}
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planSaving}>{plan.saving}</Text>
            </TouchableOpacity>
          ))
        }
      </View>

      {/* CTA Button */}
      <TouchableOpacity 
        style={[
          styles.ctaButton, 
          isPurchasing && styles.ctaDisabled,
          isPro && styles.ctaActivePro
        ]} 
        onPress={isPro ? handleManageSubscription : handlePurchase}
        disabled={isPurchasing}
      >
        <Text style={styles.ctaButtonText}>
          {isPurchasing ? 'Processing...' : isPro ? 'Manage Active Subscription' : 'Unlock Pro Access'}
        </Text>
      </TouchableOpacity>

      {/* Paywall Disclosures Footer */}
      <Text style={styles.disclosure}>
        {pricing.paywall.billingDisclosure}
      </Text>

      {/* Legal Links */}
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.divider}>•</Text>
        <TouchableOpacity onPress={() => router.push('/legal/terms')}>
          <Text style={styles.legalText}>Terms of Use</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helpers for styles references
function restoreTextStyle() {
  return styles.restoreText;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  restoreBtn: {
    paddingVertical: 8,
  },
  restoreText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  // Feature List
  featureGrid: {
    gap: 18,
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  featureDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  // Pricing Options
  planContainer: {
    gap: 12,
    marginBottom: 36,
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 16,
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  planCardActivePro: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  badgePopular: {
    position: 'absolute',
    top: -9,
    right: 16,
    backgroundColor: '#0284C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgePopularText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeActivePlan: {
    position: 'absolute',
    top: -9,
    right: 16,
    backgroundColor: '#10B981',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeActivePlanText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  planName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planPrice: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planSaving: {
    color: '#64748B',
    fontSize: 11,
  },
  // Checkout Buttons
  ctaButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ctaDisabled: {
    backgroundColor: '#475569',
  },
  ctaActivePro: {
    backgroundColor: '#10B981',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclosure: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalText: {
    color: '#64748B',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  divider: {
    color: '#475569',
  },
});
