import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Platform, LayoutAnimation, UIManager } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '@/services/haptics';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GuideItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradientColors: [string, string];
}

interface FaqItem {
  question: string;
  answer: string;
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'guide' | 'faqs'>('guide');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const guideItems: GuideItem[] = [
    {
      id: 'step1',
      icon: '📸',
      title: 'Import Screenshot',
      description: 'Tap the canvas placeholder in the main editor to pick a mobile or web screenshot directly from your photo library.',
      gradientColors: ['#38BDF8', '#0284C7'],
    },
    {
      id: 'step2',
      icon: '📱',
      title: 'Choose Device Bezels',
      description: 'Select mock frames like MacBook Pro, Safari Browser, or iPhone 16. Match ratios to popular presets (e.g. 16:9, 1:1, or App Store).',
      gradientColors: ['#A78BFA', '#7C3AED'],
    },
    {
      id: 'step3',
      icon: '✏️',
      title: 'Drag & Scale Annotations',
      description: 'Add text banners, zoom lenses, or arrows. Single-tap to highlight. Drag corner handles to scale, top handles to rotate, or double-tap to rewrite.',
      gradientColors: ['#F43F5E', '#BE123C'],
    },
    {
      id: 'step4',
      icon: '👑',
      title: 'Export Pro Assets',
      description: 'Export as high-res images, compile clean PDF presentation decks, or generate annotated CSV logs. Pro status removes all watermarks.',
      gradientColors: ['#F59E0B', '#D97706'],
    },
  ];

  const faqItems: FaqItem[] = [
    {
      question: 'Where do my saved mockups go?',
      answer: 'By default, MockupBuilder saves screenshots to your local Photos app. You can easily switch this to save directly to your device\'s Files app by modifying the "Default Export Save" preference in the Settings screen.',
    },
    {
      question: 'Why is the watermark showing on exports?',
      answer: 'Watermark removal is a Pro feature. Once you upgrade to MockupBuilder Pro using the subscription banner in settings, all watermarks are automatically removed and high-fidelity layouts are unlocked.',
    },
    {
      question: 'What are PDF Decks & CSV Spec sheets?',
      answer: 'PDF Decks compile all modified and styled screenshots into a professional document perfect for client pitches or sharing. CSV Spec sheets generate comma-separated logs containing annotation texts, coordinates, and timestamp manifests for developer QA reviews.',
    },
    {
      question: 'Can I edit annotations after scaling them?',
      answer: 'Absolutely. Select any annotation by tapping it once, which highlights its selection bounding box. You can then drag to reposition, resize/rotate, and double-tap text elements (or tap "Edit Text" on the canvas toolbar) to change contents.',
    },
    {
      question: 'Does the application require an internet connection?',
      answer: 'No, MockupBuilder runs entirely on-device and respects your privacy. Local projects and settings are stored offline. Network access is only required to verify or restore active Pro subscriptions.',
    },
  ];

  const handleTabSwitch = (tab: 'guide' | 'faqs') => {
    haptics.lightImpact();
    setActiveTab(tab);
  };

  const toggleFaq = (index: number) => {
    haptics.lightImpact();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => { haptics.lightImpact(); router.back(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Guide</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Segmented Control */}
      <View style={styles.tabContainer}>
        <View style={styles.segmentedBg}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'guide' && styles.tabButtonActive]}
            onPress={() => handleTabSwitch('guide')}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, activeTab === 'guide' && styles.tabTextActive]}>Quick Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'faqs' && styles.tabButtonActive]}
            onPress={() => handleTabSwitch('faqs')}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, activeTab === 'faqs' && styles.tabTextActive]}>FAQs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollList} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'guide' ? (
          <View style={styles.guideContainer}>
            <Text style={styles.sectionSubtitle}>Learn the basics of MockupBuilder</Text>
            {guideItems.map((item, index) => (
              <View key={item.id} style={styles.guideCard}>
                <LinearGradient
                  colors={item.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <Text style={styles.guideIcon}>{item.icon}</Text>
                </LinearGradient>
                <View style={styles.guideContent}>
                  <Text style={styles.guideStepNumber}>STEP {index + 1}</Text>
                  <Text style={styles.guideTitle}>{item.title}</Text>
                  <Text style={styles.guideDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.faqContainer}>
            <Text style={styles.sectionSubtitle}>Answers to common questions</Text>
            {faqItems.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <View key={index} style={[styles.faqCard, isOpen && styles.faqCardOpen]}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => toggleFaq(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Text style={[styles.faqArrow, isOpen && styles.faqArrowOpen]}>
                      {isOpen ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60, // approximate visual balance with close button
  },
  // Tab Switcher
  tabContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  segmentedBg: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#38BDF8',
  },
  // Scroll list container
  scrollList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 20,
    marginTop: 10,
  },
  // Quick Guide styling
  guideContainer: {
    gap: 16,
  },
  guideCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideIcon: {
    fontSize: 20,
  },
  guideContent: {
    flex: 1,
  },
  guideStepNumber: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  guideTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guideDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  // FAQ styling
  faqContainer: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  faqCardOpen: {
    borderColor: '#0284C7',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqQuestion: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  faqArrow: {
    color: '#64748B',
    fontSize: 10,
  },
  faqArrowOpen: {
    color: '#38BDF8',
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  faqAnswer: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
});
