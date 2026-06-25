import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useCanvasStore } from '@/store/canvasStore';
import { useAlertsStore } from '@/store/alertsStore';
import { haptics } from '@/services/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle } from 'react-native-svg';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { 
    setImageUri, 
    setBeforeImageUri, 
    setIsSplitSliderEnabled,
    setAspectRatio,
    setFrameType,
    setBackgroundColor,
    exportsHistory,
    clearExportsHistory,
    deleteExportFromHistory,
    setBackgroundType,
    setBackgroundImageUri,
  } = useCanvasStore();

  const [activePresetIndex, setActivePresetIndex] = React.useState(0);
  const { alerts } = useAlertsStore();
  const visibleAlerts = alerts.filter((alert) => alert.enabled !== false);
  const hasUnreadAlerts = visibleAlerts.some((alert) => !alert.isRead);

  const handlePresetScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const itemWidth = 132; // card width (120) + marginRight (12)
    const index = Math.round(scrollOffset / itemWidth);
    if (index >= 0 && index < 7) {
      setActivePresetIndex(index);
    }
  };

  const pickSingleScreenshot = async () => {
    haptics.lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
      setIsSplitSliderEnabled(false);
      haptics.success();
      // Auto redirect to Editor tab
      router.push('/editor');
    }
  };

  const pickSplitScreenshots = async () => {
    haptics.lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 2,
      quality: 1,
    });

    if (!result.canceled) {
      if (result.assets.length >= 2) {
        setBeforeImageUri(result.assets[0].uri);
        setImageUri(result.assets[1].uri);
        setIsSplitSliderEnabled(true);
        haptics.success();
        router.push('/editor');
      } else {
        haptics.error();
        Alert.alert(
          'Selection Required',
          'Please select exactly 2 screenshots (Before and After) for the comparison slider.',
          [
            { text: 'Try Again', onPress: () => pickSplitScreenshots() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>MockupBuilder</Text>
        <TouchableOpacity 
          style={styles.bellButton}
          onPress={() => { haptics.lightImpact(); router.push('/alerts'); }}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {hasUnreadAlerts && <View style={styles.bellBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollBody}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Call to Action Grid */}
        <View style={styles.ctaGrid}>
          {/* Main Action card */}
          <TouchableOpacity onPress={pickSingleScreenshot} style={styles.cardContainer} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.importCardGradient}
            >
              <View style={styles.accentGlowBlue} />
              <View style={styles.iconCircleBlue}>
                <Text style={styles.importIcon}>📸</Text>
              </View>
              <Text style={styles.importTitle}>Beautify Screenshot</Text>
              <Text style={styles.importSubtitle}>Add device bezels, drop shadows, and gradients</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Before/After Split Card */}
          <TouchableOpacity onPress={pickSplitScreenshots} style={styles.cardContainer} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.importCardGradient, styles.splitCardBorder]}
            >
              <View style={styles.accentGlowPurple} />
              <View style={styles.iconCirclePurple}>
                <Text style={styles.importIcon}>↔️</Text>
              </View>
              <Text style={styles.importTitle}>Before & After Slider</Text>
              <Text style={styles.importSubtitle}>Create split crop slider comparison posts</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Templates Presets Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Layout Presets</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.presetScroll}
            decelerationRate="fast"
            snapToInterval={132} // Width of presetCard (120) + marginRight (12)
            snapToAlignment="start"
            onScroll={handlePresetScroll}
            scrollEventThrottle={16}
          >
            <TouchableOpacity 
              style={styles.presetCard} 
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('16:9');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('SafariBrowser');
                setBackgroundColor('gradient-sunset');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#FF4B2B" opacity={0.12} />
                  <Rect x={15} y={15} width={90} height={40} rx={4} stroke="#FF4B2B" strokeWidth={1.5} fill="none" />
                  <Circle cx={22} cy={20} r={2} fill="#FF4B2B" />
                  <Circle cx={27} cy={20} r={2} fill="#FF4B2B" />
                  <Circle cx={32} cy={20} r={2} fill="#FF4B2B" />
                  <Rect x={38} y={17} width={61} height={6} rx={2} fill="#FF4B2B" opacity={0.3} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>X Landscape</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('9:16');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('iPhone16Pro');
                setBackgroundColor('gradient-cyberpunk');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#F09819" opacity={0.12} />
                  <Rect x={48} y={10} width={24} height={50} rx={5} stroke="#F09819" strokeWidth={1.5} fill="none" />
                  <Rect x={55} y={14} width={10} height={3} rx={1.5} fill="#F09819" />
                  <Rect x={57} y={56} width={6} height={1.5} rx={0.75} fill="#F09819" opacity={0.5} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>Vertical Story</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('1:1');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('iPhone16Pro');
                setBackgroundColor('gradient-midnight');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#8E2DE2" opacity={0.12} />
                  <Rect x={40} y={15} width={40} height={40} rx={4} stroke="#8E2DE2" strokeWidth={1.5} fill="none" />
                  <Rect x={46} y={21} width={28} height={28} rx={2} fill="#8E2DE2" opacity={0.2} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>LinkedIn Square</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('4:5');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('iPhone16Pro');
                setBackgroundColor('gradient-emerald');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#11998E" opacity={0.12} />
                  <Rect x={43} y={12} width={34} height={46} rx={4} stroke="#11998E" strokeWidth={1.5} fill="none" />
                  <Rect x={48} y={17} width={24} height={22} rx={2} fill="#11998E" opacity={0.2} />
                  <Rect x={48} y={43} width={24} height={4} rx={1} fill="#11998E" opacity={0.3} />
                  <Rect x={48} y={50} width={16} height={3} rx={1} fill="#11998E" opacity={0.3} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>Portrait Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('AppStore');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('iPhone16Pro');
                setBackgroundColor('gradient-cyberpunk');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#F857A6" opacity={0.12} />
                  <Rect x={46} y={10} width={28} height={50} rx={4} stroke="#F857A6" strokeWidth={1.5} fill="none" />
                  <Rect x={50} y={15} width={20} height={35} rx={3} stroke="#F857A6" strokeWidth={1} fill="none" opacity={0.6} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>iPhone 6.7" Store</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('9:16');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('iPhone16Pro');
                setBackgroundColor('gradient-ocean');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#02AAB0" opacity={0.12} />
                  <Rect x={48} y={10} width={24} height={50} rx={4} stroke="#02AAB0" strokeWidth={1.5} fill="none" />
                  <Rect x={52} y={14} width={16} height={42} rx={2} stroke="#02AAB0" strokeWidth={1} fill="none" opacity={0.6} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>iPhone 5.5" Store</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => {
                haptics.mediumImpact();
                setAspectRatio('iPadStore');
                setImageUri(null);
                setBeforeImageUri(null);
                setIsSplitSliderEnabled(false);
                setFrameType('SafariBrowser');
                setBackgroundColor('gradient-ocean');
                setBackgroundType('gradient');
                setBackgroundImageUri(null);
                router.push('/editor');
              }}
            >
              <View style={styles.presetPreview}>
                <Svg width={120} height={70} viewBox="0 0 120 70">
                  <Rect width={120} height={70} rx={8} fill="#3A7BD5" opacity={0.12} />
                  <Rect x={38} y={12} width={44} height={46} rx={5} stroke="#3A7BD5" strokeWidth={1.5} fill="none" />
                  <Rect x={42} y={16} width={36} height={38} rx={2} stroke="#3A7BD5" strokeWidth={1} fill="none" opacity={0.6} />
                </Svg>
              </View>
              <Text style={styles.presetLabel}>iPad 12.9" Store</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.carouselDots}>
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <View 
                key={idx} 
                style={[
                  styles.carouselDot, 
                  activePresetIndex === idx && styles.carouselDotActive
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Project History Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Project Exports</Text>
            {exportsHistory.length > 0 && (
              <TouchableOpacity 
                style={styles.clearAllBtn}
                onPress={() => {
                  haptics.mediumImpact();
                  clearExportsHistory();
                }}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.historyContainer}>
            {exportsHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No exported designs yet</Text>
                <Text style={styles.emptyHistorySub}>Your mockups will appear here as you save them</Text>
              </View>
            ) : (
              exportsHistory.map((item) => (
                <View key={item.id} style={styles.historyRowContainer}>
                  <TouchableOpacity 
                    style={styles.historyItem}
                    onPress={() => {
                      haptics.mediumImpact();
                      setAspectRatio(item.aspectRatio as any);
                      setImageUri(item.imageUri);
                      setFrameType(item.frameType as any);
                      setBeforeImageUri(null);
                      setIsSplitSliderEnabled(false);
                      router.push('/editor');
                    }}
                  >
                    <Image source={{ uri: item.imageUri }} style={styles.historyThumb} resizeMode="cover" />
                    <View style={styles.historyText}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{item.fileName}</Text>
                      <Text style={styles.historyMeta}>
                        {item.frameType === 'None' ? 'Flat Card' : item.frameType} • {item.aspectRatio}
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deleteHistoryBtn}
                    onPress={() => {
                      haptics.mediumImpact();
                      deleteExportFromHistory(item.id);
                    }}
                  >
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bellButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollBody: {
    flex: 1,
  },
  ctaGrid: {
    padding: 16,
    gap: 12,
  },
  cardContainer: {
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  importCardGradient: {
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  splitCardBorder: {
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  accentGlowBlue: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0284C7',
  },
  accentGlowPurple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#8E2DE2',
  },
  iconCircleBlue: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  iconCirclePurple: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(142, 45, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.2)',
  },
  importIcon: {
    fontSize: 24,
  },
  importTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  importSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  // Layout presets
  presetScroll: {
    flexDirection: 'row',
  },
  presetCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  presetPreview: {
    width: 120,
    height: 70,
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  presetLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 3,
  },
  carouselDotActive: {
    width: 14,
    backgroundColor: '#38BDF8',
  },
  // History log
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  historyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  historyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  deleteHistoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    fontSize: 16,
  },
  historyThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historyText: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  historyTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  historyMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  historyTime: {
    color: '#64748B',
    fontSize: 11,
  },
  emptyHistory: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyHistorySub: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});
