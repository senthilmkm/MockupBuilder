import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useCanvasStore, FrameType, AspectRatioType } from '@/store/canvasStore';
import { useAlertsStore } from '@/store/alertsStore';
import { CanvasView } from '@/components/CanvasView';
import { AnnotationLayer } from '@/components/AnnotationLayer';
import { GRADIENTS } from '@/constants/gradients';
import { exportEngine } from '@/services/exportEngine';
import { haptics } from '@/services/haptics';
import { router } from 'expo-router';

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<View>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [activeMenu, setActiveMenu] = useState<'ratio' | 'frame' | 'gradient' | 'adjust' | 'annotate' | 'export'>('ratio');
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(true);
  const [activeRatioIndex, setActiveRatioIndex] = useState(0);

  const handleRatioScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const itemWidth = 108; // card width (100) + gap (8)
    const index = Math.round(scrollOffset / itemWidth);
    if (index >= 0 && index < 8) {
      setActiveRatioIndex(index);
    }
  };

  const {
    imageUri,
    beforeImageUri,
    isSplitSliderEnabled,
    aspectRatio,
    backgroundColor,
    frameType,
    frameColor,
    padding,
    shadowIntensity,
    rotation3D,
    annotations,
    isPro,
    undoStack,
    redoStack,
    screenshotScale,
    screenshotOffsetX,
    screenshotOffsetY,
    beforeScreenshotScale,
    beforeScreenshotOffsetX,
    beforeScreenshotOffsetY,
    setAspectRatio,
    setFrameType,
    setFrameColor,
    setBackgroundColor,
    setPadding,
    setShadowIntensity,
    setRotation3D,
    setScreenshotScale,
    setScreenshotOffsetX,
    setScreenshotOffsetY,
    setBeforeScreenshotScale,
    setBeforeScreenshotOffsetX,
    setBeforeScreenshotOffsetY,
    addAnnotation,
    clearAll,
    addExportToHistory,
    setImageUri,
    setBeforeImageUri,
    setIsSplitSliderEnabled,
    undo,
    redo,
  } = useCanvasStore();

  const handleCanvasLayout = (e: any) => {
    const { width } = e.nativeEvent.layout;
    setCanvasWidth(width);
  };

  const handleExportPNG = async (share: boolean) => {
    if (!imageUri) {
      haptics.error();
      Alert.alert('Screenshot Required', 'Please import your own screenshot before saving or sharing.');
      return;
    }

    // Paywall Gate check for Premium Bezels, Store Ratios, and Vector Tools
    const isPremiumFrame = frameType === 'MacbookPro' || frameType === 'SafariBrowser';
    const isPremiumRatio = aspectRatio === 'AppStore' || aspectRatio === 'iPadStore';
    const hasPremiumTools = annotations.some(ann => ann.type === 'Spotlight' || ann.type === 'Arrow');

    if (!isPro && (isPremiumFrame || isPremiumRatio || hasPremiumTools)) {
      haptics.error();
      let alertMsg = 'This export includes premium features. Please unlock MockupBuilder Pro to save or share.';
      if (isPremiumFrame) alertMsg = 'Removing watermarks and using premium frames (MacBook, Safari header) requires a Pro subscription.';
      else if (isPremiumRatio) alertMsg = 'App Store and iPad Store aspect ratios are Pro-only features.';
      else if (hasPremiumTools) alertMsg = 'Spotlight magnification lens and Arrow vector tools require a Pro subscription.';

      Alert.alert(
        'Premium Layout',
        alertMsg,
        [
          { text: 'Unlock Pro', onPress: () => router.push('/paywall') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    haptics.mediumImpact();
    
    // Trigger Capture PNG
    const localUri = await exportEngine.exportPNG(canvasRef, share);
    if (localUri) {
      const fileName = `Mockup_${Date.now()}.png`;
      addExportToHistory(fileName, frameType, aspectRatio, localUri);
      useAlertsStore.getState().addAlert('Mockup Saved', 'Saved PNG mockup to your gallery.', 'Just now');
    }
  };

  const handleExportPDF = async () => {
    if (!imageUri) {
      haptics.error();
      Alert.alert('Screenshot Required', 'Please import your own screenshot before exporting a PDF Deck.');
      return;
    }

    if (!isPro) {
      haptics.error();
      Alert.alert(
        'Premium Layout',
        'Exporting pitch documents and PDF Presentation Decks is a MockupBuilder Pro feature.',
        [
          { text: 'Unlock Pro', onPress: () => router.push('/paywall') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    const specData = {
      projectName: 'MockupBuilder_Project',
      aspectRatio,
      frameType,
      frameColor,
      padding,
      shadowIntensity,
      rotation3D,
      gradientId: backgroundColor,
      annotations,
      imageUri,
      beforeImageUri,
      isSplitEnabled: isSplitSliderEnabled,
    };

    const localUri = await exportEngine.exportPDF(specData);
    if (localUri) {
      const fileName = `Deck_${Date.now()}.pdf`;
      addExportToHistory(fileName, frameType, aspectRatio, localUri);
      useAlertsStore.getState().addAlert('PDF Deck Exported', 'Compiled and saved PDF presentation deck.', 'Just now');
    }
  };

  const handleExportCSV = async () => {
    if (!imageUri) {
      haptics.error();
      Alert.alert('Screenshot Required', 'Please import your own screenshot before exporting a CSV Spec.');
      return;
    }

    if (!isPro) {
      haptics.error();
      Alert.alert(
        'Premium Layout',
        'Generating CSV Design Specification Sheets requires a MockupBuilder Pro subscription.',
        [
          { text: 'Unlock Pro', onPress: () => router.push('/paywall') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    const specData = {
      projectName: 'MockupBuilder_Project',
      aspectRatio,
      frameType,
      frameColor,
      padding,
      shadowIntensity,
      rotation3D,
      gradientId: backgroundColor,
      annotations,
      imageUri,
      beforeImageUri,
      isSplitEnabled: isSplitSliderEnabled,
    };

    const localUri = await exportEngine.exportCSV(specData);
    if (localUri) {
      const fileName = `Spec_${Date.now()}.csv`;
      addExportToHistory(fileName, frameType, aspectRatio, localUri);
      useAlertsStore.getState().addAlert('CSV Spec Exported', 'Generated and saved CSV design specification.', 'Just now');
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
    }
  };

  const pickSplitScreenshots = async () => {
    haptics.lightImpact();
    
    // Pick Before Image
    Alert.alert('Step 1 of 2', 'Choose the "Before" (Old design) screenshot first.', [
      {
        text: 'Select Image',
        onPress: async () => {
          const beforeResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
          });

          if (!beforeResult.canceled && beforeResult.assets[0].uri) {
            const beforeUri = beforeResult.assets[0].uri;
            haptics.lightImpact();

            // Pick After Image
            Alert.alert('Step 2 of 2', 'Now select the "After" (New design) screenshot.', [
              {
                text: 'Select Image',
                onPress: async () => {
                  const afterResult = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 1,
                  });

                  if (!afterResult.canceled && afterResult.assets[0].uri) {
                    setBeforeImageUri(beforeUri);
                    setImageUri(afterResult.assets[0].uri);
                    setIsSplitSliderEnabled(true);
                    haptics.success();
                  }
                }
              }
            ]);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  // Helper mock for Slider slider (as Slider package may require installing)
  // Instead of imported slider which can be fragile, we render clean custom button controls
  // or a simple custom slider view that increment-adjusts values. This is extremely robust!
  const renderValueStepper = (label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void) => {
    return (
      <View style={styles.stepperContainer}>
        <Text style={styles.stepperLabel}>{label}: {value.toFixed(0)}</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity 
            style={styles.stepperBtn} 
            onPress={() => {
              haptics.lightImpact();
              onChange(Math.max(min, value - step));
            }}
          >
            <Text style={styles.stepperBtnText}>-</Text>
          </TouchableOpacity>
          <View style={styles.stepperValueTrack}>
            <View style={[styles.stepperValueFill, { width: `${((value - min) / (max - min)) * 100}%` }]} />
          </View>
          <TouchableOpacity 
            style={styles.stepperBtn}
            onPress={() => {
              haptics.lightImpact();
              onChange(Math.min(max, value + step));
            }}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActiveMenuContent = () => {
    switch (activeMenu) {
      case 'ratio':
        const ratios: { id: AspectRatioType; label: string }[] = [
          { id: '16:9', label: '16:9 X' },
          { id: '9:16', label: '9:16 Story' },
          { id: '1:1', label: '1:1 Post' },
          { id: '4:5', label: '4:5 Feed' },
          { id: '4:3', label: '4:3 Tablet' },
          { id: '3:4', label: '3:4 Tablet' },
          { id: 'AppStore', label: '6.5" Store' },
          { id: 'iPadStore', label: '12.9" Store' },
        ];
        return (
          <View style={styles.ratioCarouselContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.ratioScrollContent} 
              style={styles.ratioScroll}
              decelerationRate="fast"
              snapToInterval={108} // Width of menuOptionBtn (100) + gap (8)
              snapToAlignment="start"
              onScroll={handleRatioScroll}
              scrollEventThrottle={16}
            >
              {ratios.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.menuOptionBtn, aspectRatio === r.id && styles.menuOptionBtnActive]}
                  onPress={() => { haptics.lightImpact(); setAspectRatio(r.id); }}
                >
                  <Text 
                    style={[styles.menuOptionText, aspectRatio === r.id && styles.menuOptionTextActive]}
                    numberOfLines={1}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.carouselDots}>
              {ratios.map((_, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.carouselDot, 
                    activeRatioIndex === idx && styles.carouselDotActive
                  ]} 
                />
              ))}
            </View>
          </View>
        );

      case 'frame':
        const frames: { id: FrameType; label: string }[] = [
          { id: 'iPhone16Pro', label: 'iPhone 16 Pro' },
          { id: 'MacbookPro', label: 'MacBook Pro' },
          { id: 'SafariBrowser', label: 'Safari Header' },
          { id: 'None', label: 'None (Flat Card)' },
        ];
        return (
          <View style={styles.menuList}>
            {frames.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.menuOptionBtn, frameType === f.id && styles.menuOptionBtnActive]}
                onPress={() => { haptics.lightImpact(); setFrameType(f.id); }}
              >
                <Text style={[styles.menuOptionText, frameType === f.id && styles.menuOptionTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'gradient':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradientScroll}>
            {GRADIENTS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.gradientCircle,
                  backgroundColor === g.id && styles.gradientCircleActive,
                  { backgroundColor: g.colors[0] }
                ]}
                onPress={() => { haptics.lightImpact(); setBackgroundColor(g.id); }}
              >
                {backgroundColor === g.id && <View style={styles.gradientDotActive} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'adjust':
        return (
          <ScrollView contentContainerStyle={styles.adjustScrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.adjustSectionHeader}>Canvas & Tilt</Text>
            {renderValueStepper('Padding', padding, 5, 30, 2, setPadding)}
            {renderValueStepper('3D Tilt Rotation', rotation3D, -30, 30, 5, setRotation3D)}
            {renderValueStepper('Drop Shadow', shadowIntensity * 100, 0, 100, 10, (v) => setShadowIntensity(v / 100))}
            
            <Text style={[styles.adjustSectionHeader, { marginTop: 16 }]}>
              {isSplitSliderEnabled ? 'Bezel Image (After) Alignment' : 'Bezel Image Alignment'}
            </Text>
            {renderValueStepper('Screenshot Zoom', screenshotScale * 100, 50, 250, 10, (v) => setScreenshotScale(v / 100))}
            {renderValueStepper('Offset X (Horizontal)', screenshotOffsetX, -150, 150, 10, setScreenshotOffsetX)}
            {renderValueStepper('Offset Y (Vertical)', screenshotOffsetY, -150, 150, 10, setScreenshotOffsetY)}

            {isSplitSliderEnabled && (
              <>
                <Text style={[styles.adjustSectionHeader, { marginTop: 16 }]}>Bezel Image (Before) Alignment</Text>
                {renderValueStepper('Before Zoom', beforeScreenshotScale * 100, 50, 250, 10, (v) => setBeforeScreenshotScale(v / 100))}
                {renderValueStepper('Before Offset X', beforeScreenshotOffsetX, -150, 150, 10, setBeforeScreenshotOffsetX)}
                {renderValueStepper('Before Offset Y', beforeScreenshotOffsetY, -150, 150, 10, setBeforeScreenshotOffsetY)}
              </>
            )}
          </ScrollView>
        );

      case 'annotate':
        return (
          <View style={styles.menuList}>
            <TouchableOpacity
              style={styles.menuOptionBtn}
              onPress={() => { haptics.lightImpact(); addAnnotation('Text'); }}
            >
              <Text style={styles.menuOptionText}>+ Add Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOptionBtn}
              onPress={() => { haptics.lightImpact(); addAnnotation('Arrow'); }}
            >
              <Text style={styles.menuOptionText}>+ Add Arrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOptionBtn}
              onPress={() => { haptics.lightImpact(); addAnnotation('Spotlight'); }}
            >
              <Text style={styles.menuOptionText}>+ Add Spotlight</Text>
            </TouchableOpacity>
          </View>
        );

      case 'export':
        return (
          <View style={styles.exportList}>
            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => handleExportPNG(false)}>
                <Text style={styles.exportBtnText}>Save PNG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#0284C7' }]} onPress={() => handleExportPNG(true)}>
                <Text style={styles.exportBtnText}>Share PNG</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.exportRow}>
              <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#334155' }]} onPress={handleExportPDF}>
                <Text style={styles.exportBtnText}>Export PDF Deck</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#334155' }]} onPress={handleExportCSV}>
                <Text style={styles.exportBtnText}>Export CSV Spec</Text>
              </TouchableOpacity>
            </View>

            {/* Watermark Toggle with Paywall check warning */}
            <View style={styles.watermarkRow}>
              <Text style={styles.watermarkLabel}>Enable Watermark (`made with MockupBuilder`)</Text>
              <TouchableOpacity 
                style={[styles.watermarkToggleBtn, (!isPro || !isWatermarkEnabled) && styles.watermarkToggleBtnActive]} 
                onPress={() => {
                  haptics.mediumImpact();
                  if (isPro) {
                    setIsWatermarkEnabled(!isWatermarkEnabled);
                  } else {
                    // Trigger Premium Subscription Modal
                    Alert.alert(
                      'Premium Feature',
                      'Removing the watermark requires a MockupBuilder Pro subscription.',
                      [
                        { text: 'Unlock Pro', onPress: () => router.push('/paywall') },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }
                }}
              >
                <Text style={styles.watermarkToggleText}>{(!isPro || isWatermarkEnabled) ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getCanvasHeight = (): number => {
    switch (aspectRatio) {
      case '16:9':
        return (canvasWidth * 9) / 16;
      case '9:16':
        return (canvasWidth * 16) / 9;
      case '1:1':
        return canvasWidth;
      case '4:5':
        return (canvasWidth * 5) / 4;
      case '4:3':
        return (canvasWidth * 3) / 4;
      case '3:4':
        return (canvasWidth * 4) / 3;
      case 'AppStore':
        return canvasWidth * 1.5;
      case 'iPadStore':
        return (canvasWidth * 4) / 3;
      default:
        return canvasWidth;
    }
  };

  const handleUndo = () => {
    haptics.lightImpact();
    undo();
  };

  const handleRedo = () => {
    haptics.lightImpact();
    redo();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Editor Header Bar */}
      <View style={styles.editorHeader}>
        <Text style={styles.editorHeaderTitle}>Mockup Builder</Text>
        <View style={styles.historyControls}>
          <TouchableOpacity 
            style={[styles.historyBtn, undoStack.length === 0 && styles.historyBtnDisabled]} 
            onPress={handleUndo}
            disabled={undoStack.length === 0}
            activeOpacity={0.8}
          >
            <Text style={[styles.historyBtnText, undoStack.length === 0 && styles.historyBtnTextDisabled]}>↩️ Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.historyBtn, redoStack.length === 0 && styles.historyBtnDisabled]} 
            onPress={handleRedo}
            disabled={redoStack.length === 0}
            activeOpacity={0.8}
          >
            <Text style={[styles.historyBtnText, redoStack.length === 0 && styles.historyBtnTextDisabled]}>Redo ↪️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Canvas Workspace viewport */}
      <View style={styles.canvasWrapper} onLayout={handleCanvasLayout}>
        <View ref={canvasRef} collapsable={false} style={{ width: '100%', height: getCanvasHeight(), position: 'relative' }}>
          <CanvasView width={canvasWidth} />
          <AnnotationLayer canvasWidth={canvasWidth} canvasHeight={getCanvasHeight()} />
          
          {/* Watermark Overlay (Locked to right bottom - forced if not Pro) */}
          {(!isPro || isWatermarkEnabled) && (
            <View style={styles.canvasWatermark}>
               <Text style={styles.watermarkText}>made with MockupBuilder</Text>
            </View>
          )}

          {/* Sandbox Direct Actions Overlay (Visible only when no screenshot is imported) */}
          {!imageUri && (
            <View style={styles.sandboxOverlay}>
              <View style={styles.sandboxContainer}>
                <TouchableOpacity 
                  style={styles.sandboxBtn}
                  onPress={pickSingleScreenshot}
                >
                  <Text style={styles.sandboxBtnText}>📷 Replace Screenshot</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sandboxBtn, styles.sandboxSplitBtn]}
                  onPress={pickSplitScreenshots}
                >
                  <Text style={styles.sandboxBtnText}>↔️ Before & After</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sandboxHint}>
                Sandbox Mode: Try presets or overlays and tap above to insert your screen
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Editor Sub-Menu selection options */}
      <View style={styles.editorControls}>
          {/* Submenu Content container */}
          <View style={styles.subMenuContainer}>
            {renderActiveMenuContent()}
          </View>

          {/* Submenu Navigator bottom items */}
          <View style={styles.menuNavigator}>
            <TouchableOpacity 
              style={[styles.navBtn, activeMenu === 'ratio' && styles.navBtnActive]}
              onPress={() => { haptics.lightImpact(); setActiveMenu('ratio'); }}
            >
              <Text style={[styles.navText, activeMenu === 'ratio' && styles.navTextActive]}>Ratio</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, activeMenu === 'frame' && styles.navBtnActive]}
              onPress={() => { haptics.lightImpact(); setActiveMenu('frame'); }}
            >
              <Text style={[styles.navText, activeMenu === 'frame' && styles.navTextActive]}>Bezel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, activeMenu === 'gradient' && styles.navBtnActive]}
              onPress={() => { haptics.lightImpact(); setActiveMenu('gradient'); }}
            >
              <Text style={[styles.navText, activeMenu === 'gradient' && styles.navTextActive]}>Color</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, activeMenu === 'adjust' && styles.navBtnActive]}
              onPress={() => { haptics.lightImpact(); setActiveMenu('adjust'); }}
            >
              <Text style={[styles.navText, activeMenu === 'adjust' && styles.navTextActive]}>Tilt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, activeMenu === 'annotate' && styles.navBtnActive]}
              onPress={() => { haptics.lightImpact(); setActiveMenu('annotate'); }}
            >
              <Text style={[styles.navText, activeMenu === 'annotate' && styles.navTextActive]}>Write</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, activeMenu === 'export' && styles.navBtnActive]}
              onPress={() => { haptics.lightImpact(); setActiveMenu('export'); }}
            >
              <Text style={[styles.navText, activeMenu === 'export' && styles.navTextActive]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  canvasWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyImportBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyImportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  canvasWatermark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sandboxOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 12,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  sandboxContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  sandboxBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sandboxSplitBtn: {
    backgroundColor: '#334155',
  },
  sandboxBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sandboxHint: {
    color: '#64748B',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
  },
  // Editor Toolbars
  editorControls: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingBottom: 28,
  },
  subMenuContainer: {
    padding: 16,
    minHeight: 100,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  menuList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  ratioScroll: {
    flexDirection: 'row',
  },
  ratioScrollContent: {
    gap: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    width: 100,
    alignItems: 'center',
  },
  menuOptionBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  menuOptionText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  menuOptionTextActive: {
    color: '#38BDF8',
  },
  ratioCarouselContainer: {
    width: '100%',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
  // Value Adjust Stepper
  adjustWrapper: {
    gap: 12,
  },
  stepperContainer: {
    width: '100%',
  },
  stepperLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepperValueTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepperValueFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  // Gradient selection
  gradientScroll: {
    flexDirection: 'row',
  },
  gradientCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCircleActive: {
    borderColor: '#ffffff',
  },
  gradientDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  // Export list controls
  exportList: {
    gap: 8,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#475569',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  watermarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  watermarkLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  watermarkToggleBtn: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  watermarkToggleBtnActive: {
    backgroundColor: '#0284C7',
  },
  watermarkToggleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Submenu Navigator Bottom Menu
  menuNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  navText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navTextActive: {
    color: '#38BDF8',
  },
  // Editor Header
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  editorHeaderTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  historyControls: {
    flexDirection: 'row',
    gap: 8,
  },
  historyBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  historyBtnDisabled: {
    opacity: 0.4,
    borderColor: 'transparent',
  },
  historyBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  historyBtnTextDisabled: {
    color: '#64748B',
  },
  // Adjust panel scroll
  adjustScrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  adjustSectionHeader: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
});
