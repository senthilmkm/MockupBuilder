import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Platform, Switch, Image, TextInput } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { FeedSimulator } from '@/components/FeedSimulator';

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<View>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const [activeMenu, setActiveMenu] = useState<'ratio' | 'frame' | 'gradient' | 'adjust' | 'annotate' | 'export'>('ratio');
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(true);
  const [activeRatioIndex, setActiveRatioIndex] = useState(0);
  const [sliderWidths, setSliderWidths] = useState<Record<string, number>>({});
  const [activeAdjustTab, setActiveAdjustTab] = useState<'canvas' | 'after' | 'before'>('canvas');
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

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
    showNotch,
    setShowNotch,
    setAnnotations,
    backgroundType = 'gradient',
    backgroundImageUri = null,
    setBackgroundType,
    setBackgroundImageUri,
    feedMode = 'None',
    hasBorderGlow = false,
    setFeedMode,
    setHasBorderGlow,
  } = useCanvasStore();

  const [localHexInput, setLocalHexInput] = useState(backgroundColor.startsWith('#') ? backgroundColor : '');

  React.useEffect(() => {
    if (backgroundColor.startsWith('#')) {
      setLocalHexInput(backgroundColor);
    }
  }, [backgroundColor]);

  const handleCanvasLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasWidth(width);
    setWrapperHeight(height);
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

  const handleBulkExport = async () => {
    if (!isPro) {
      haptics.error();
      Alert.alert(
        'Pro Subscription Required',
        'Bulk Export is a premium feature. Please upgrade to MockupBuilder Pro to save multiple layouts in one click.',
        [
          { text: 'Unlock Pro', onPress: () => router.push('/paywall') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    haptics.lightImpact();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const total = result.assets.length;

    if (Platform.OS !== 'web') {
      try {
        const MediaLibrary = require('expo-media-library');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          haptics.error();
          Alert.alert('Permission Denied', 'Please allow gallery permissions to save bulk mockups.');
          return;
        }
      } catch (err) {
        console.warn('Media Library request warning:', err);
      }
    }

    const originalUri = imageUri;
    const originalAnnotations = [...annotations];
    setIsBulkExporting(true);
    setBulkProgress({ current: 1, total });
    setAnnotations([]);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      for (let i = 0; i < total; i++) {
        const asset = result.assets[i];
        
        setImageUri(asset.uri);
        setBulkProgress({ current: i + 1, total });
        
        await sleep(800);
        
        const { captureRef } = require('react-native-view-shot');
        const localUri = await captureRef(canvasRef.current || canvasRef, {
          format: 'png',
          quality: 1.0,
        });

        if (Platform.OS !== 'web') {
          const MediaLibrary = require('expo-media-library');
          await MediaLibrary.Asset.create(localUri);
          
          const fileName = `Mockup_Bulk_${Date.now()}_${i + 1}.png`;
          addExportToHistory(fileName, frameType, aspectRatio, localUri);
        } else {
          // Web download trigger
          try {
            const link = window.document.createElement('a');
            link.href = localUri;
            link.download = `mockup_bulk_${Date.now()}_${i + 1}.png`;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
          } catch (webErr) {
            console.error('Web bulk download error:', webErr);
          }
        }
      }
      
      haptics.success();
      useAlertsStore.getState().addAlert(
        'Bulk Export Success',
        Platform.OS === 'web'
          ? `Successfully downloaded ${total} beautified mockups.`
          : `Successfully saved ${total} beautified mockups to your gallery.`,
        'Just now'
      );
      
      Alert.alert(
        'Bulk Export Complete',
        Platform.OS === 'web'
          ? `All ${total} screenshots were successfully converted and downloaded to your device.`
          : `All ${total} screenshots were successfully converted and saved to your Photos gallery.`,
        [{ text: 'Awesome' }]
      );
    } catch (err: any) {
      haptics.error();
      Alert.alert('Bulk Export Failed', err.message || 'An error occurred during bulk rendering.');
    } finally {
      setImageUri(originalUri);
      setAnnotations(originalAnnotations);
      setIsBulkExporting(false);
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

  const pickBackgroundImage = async () => {
    haptics.lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setBackgroundImageUri(result.assets[0].uri);
      setBackgroundType('image');
      haptics.success();
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

  // Helper mock for Slider slider (as Slider package may require installing)
  // Instead of imported slider which can be fragile, we render clean custom button controls
  // or a simple custom slider view that increment-adjusts values. This is extremely robust!
  const renderValueSlider = (
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (val: number) => void,
    displayFormatter?: (v: number) => string
  ) => {
    const sliderKey = label;
    const width = sliderWidths[sliderKey] || 0;
    const percent = Math.min(Math.max(0, ((value - min) / (max - min)) * 100), 100);

    const handleTouch = (evt: any) => {
      if (width === 0) return;
      const x = evt.nativeEvent.locationX;
      const percentage = Math.min(Math.max(0, x / width), 1);
      const newValue = min + percentage * (max - min);
      onChange(newValue);
    };

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={styles.sliderValue}>
            {displayFormatter ? displayFormatter(value) : value.toFixed(0)}
          </Text>
        </View>
        <View 
          style={styles.sliderTrackContainer}
          onLayout={(e) => {
            const layoutWidth = e.nativeEvent.layout.width;
            setSliderWidths((prev) => ({ ...prev, [sliderKey]: layoutWidth }));
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
        >
          <View style={styles.sliderTrackBg} pointerEvents="none">
            <View style={[styles.sliderTrackFill, { width: `${percent}%` }]} />
          </View>
          <View style={[styles.sliderHandle, { left: `${percent}%` }]} pointerEvents="none" />
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
          <View style={styles.framePanelContainer}>
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

            {frameType !== 'None' && (
              <View style={styles.toggleRowBorderGlow}>
                <Text style={styles.toggleLabelBorderGlow}>Border Contrast Glow</Text>
                <TouchableOpacity 
                  style={[styles.glowToggleBtn, hasBorderGlow && styles.glowToggleBtnActive]} 
                  onPress={() => {
                    haptics.mediumImpact();
                    setHasBorderGlow(!hasBorderGlow);
                  }}
                >
                  <Text style={[styles.glowToggleText, hasBorderGlow && { color: '#38BDF8' }]}>{hasBorderGlow ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'gradient':
        const solidColors = [
          '#000000',
          '#1E293B',
          '#334155',
          '#EF4444',
          '#3B82F6',
          '#10B981',
          '#F5F7FA',
          '#FFFFFF',
        ];

        return (
          <View style={styles.colorPanelContainer}>
            {/* Background Type Mode Selector Segmented Control */}
            <View style={styles.colorSegmentRow}>
              <TouchableOpacity
                style={[styles.colorSegmentBtn, backgroundType === 'gradient' && styles.colorSegmentBtnActive]}
                onPress={() => {
                  haptics.lightImpact();
                  setBackgroundType('gradient');
                  if (backgroundColor.startsWith('#')) {
                    setBackgroundColor('gradient-sunset');
                  }
                }}
              >
                <Text style={[styles.colorSegmentText, backgroundType === 'gradient' && styles.colorSegmentTextActive]}>Gradients</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.colorSegmentBtn, backgroundType === 'color' && styles.colorSegmentBtnActive]}
                onPress={() => {
                  haptics.lightImpact();
                  setBackgroundType('color');
                  if (!backgroundColor.startsWith('#')) {
                    setBackgroundColor('#1E293B');
                  }
                }}
              >
                <Text style={[styles.colorSegmentText, backgroundType === 'color' && styles.colorSegmentTextActive]}>Solids</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.colorSegmentBtn, backgroundType === 'image' && styles.colorSegmentBtnActive]}
                onPress={() => { haptics.lightImpact(); setBackgroundType('image'); }}
              >
                <Text style={[styles.colorSegmentText, backgroundType === 'image' && styles.colorSegmentTextActive]}>Backdrop</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-panel Content based on backgroundType selection */}
            {backgroundType === 'gradient' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradientScroll}>
                {GRADIENTS.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.gradientCircle,
                      backgroundColor === g.id && styles.gradientCircleActive
                    ]}
                    onPress={() => { haptics.lightImpact(); setBackgroundColor(g.id); }}
                  >
                    <LinearGradient
                      colors={g.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientCircleFill}
                    >
                      {backgroundColor === g.id && <View style={styles.gradientDotActive} />}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {backgroundType === 'color' && (
              <View style={styles.solidsPanel}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradientScroll}>
                  {solidColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.gradientCircle,
                        backgroundColor.toLowerCase() === color.toLowerCase() && styles.gradientCircleActive
                      ]}
                      onPress={() => { haptics.lightImpact(); setBackgroundColor(color); }}
                    >
                      <View style={[styles.gradientCircleFill, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
                        {backgroundColor.toLowerCase() === color.toLowerCase() && (
                          <View style={[styles.gradientDotActive, { backgroundColor: color === '#FFFFFF' ? '#000000' : '#FFFFFF' }]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.hexInputWrapper}>
                  <Text style={styles.hexInputPrefix}>HEX</Text>
                  <TextInput
                    style={styles.hexInput}
                    placeholder="#FFFFFF"
                    placeholderTextColor="#64748B"
                    value={localHexInput}
                    autoCapitalize="characters"
                    onChangeText={(text) => {
                      let hex = text.toUpperCase();
                      if (hex.length > 0 && !hex.startsWith('#')) {
                        hex = '#' + hex;
                      }
                      if (hex.length <= 7) {
                        setLocalHexInput(hex);
                        if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
                          setBackgroundColor(hex);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(localHexInput)) {
                        setLocalHexInput(backgroundColor.startsWith('#') ? backgroundColor : '#1E293B');
                      }
                    }}
                    onSubmitEditing={() => {
                      if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(localHexInput)) {
                        setLocalHexInput(backgroundColor.startsWith('#') ? backgroundColor : '#1E293B');
                      }
                    }}
                  />
                </View>
              </View>
            )}

            {backgroundType === 'image' && (
              <View style={styles.imageBackdropPanel}>
                {backgroundImageUri ? (
                  <View style={styles.backdropPreviewRow}>
                    <View style={styles.backdropThumbContainer}>
                      <Image source={{ uri: backgroundImageUri }} style={styles.backdropThumb} />
                      <Text style={styles.backdropThumbLabel} numberOfLines={1}>Custom Backdrop Active</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.backdropActionBtnDelete}
                      onPress={() => { haptics.lightImpact(); setBackgroundImageUri(null); }}
                    >
                      <Text style={styles.backdropActionBtnText}>Remove Backdrop</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.backdropUploadBtn} onPress={pickBackgroundImage}>
                    <Text style={styles.backdropUploadBtnText}>🖼️ Choose Backdrop Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );

      case 'adjust':
        const renderAdjustSelector = () => (
          <View style={styles.adjustTabRow}>
            <TouchableOpacity 
              style={[styles.adjustTabBtn, activeAdjustTab === 'canvas' && styles.adjustTabBtnActive]} 
              onPress={() => { haptics.lightImpact(); setActiveAdjustTab('canvas'); }}
            >
              <Text style={[styles.adjustTabBtnText, activeAdjustTab === 'canvas' && styles.adjustTabBtnTextActive]}>Canvas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.adjustTabBtn, activeAdjustTab === 'after' && styles.adjustTabBtnActive]} 
              onPress={() => { haptics.lightImpact(); setActiveAdjustTab('after'); }}
            >
              <Text style={[styles.adjustTabBtnText, activeAdjustTab === 'after' && styles.adjustTabBtnTextActive]}>
                {isSplitSliderEnabled ? 'After Image' : 'Image'}
              </Text>
            </TouchableOpacity>
            {isSplitSliderEnabled && (
              <TouchableOpacity 
                style={[styles.adjustTabBtn, activeAdjustTab === 'before' && styles.adjustTabBtnActive]} 
                onPress={() => { haptics.lightImpact(); setActiveAdjustTab('before'); }}
              >
                <Text style={[styles.adjustTabBtnText, activeAdjustTab === 'before' && styles.adjustTabBtnTextActive]}>Before Image</Text>
              </TouchableOpacity>
            )}
          </View>
        );

        return (
          <View style={styles.adjustWrapper}>
            {renderAdjustSelector()}
            <ScrollView style={styles.adjustScroll} contentContainerStyle={styles.adjustScrollContent} showsVerticalScrollIndicator={false}>
              {activeAdjustTab === 'canvas' && (
                <>
                  {renderValueSlider('Padding', padding, 5, 30, setPadding)}
                  {renderValueSlider('3D Tilt Rotation', rotation3D, -30, 30, setRotation3D, (v) => `${v.toFixed(0)}°`)}
                  {renderValueSlider('Drop Shadow', shadowIntensity, 0, 1, setShadowIntensity, (v) => `${(v * 100).toFixed(0)}%`)}
                  {frameType === 'iPhone16Pro' && (
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>Show Bezel Notch</Text>
                      <Switch
                        value={showNotch}
                        onValueChange={(val) => { haptics.lightImpact(); setShowNotch(val); }}
                        trackColor={{ false: '#334155', true: '#0284C7' }}
                        thumbColor={showNotch ? '#F8FAFC' : '#94A3B8'}
                      />
                    </View>
                  )}
                </>
              )}
              {activeAdjustTab === 'after' && (
                imageUri ? (
                  <>
                    {renderValueSlider('Screenshot Zoom', screenshotScale, 0.5, 2.5, setScreenshotScale, (v) => `${(v * 100).toFixed(0)}%`)}
                    {renderValueSlider('Offset X (Horizontal)', screenshotOffsetX, -150, 150, setScreenshotOffsetX, (v) => `${v.toFixed(0)}px`)}
                    {renderValueSlider('Offset Y (Vertical)', screenshotOffsetY, -150, 150, setScreenshotOffsetY, (v) => `${v.toFixed(0)}px`)}
                  </>
                ) : (
                  <View style={styles.disabledAdjustCard}>
                    <Text style={styles.disabledAdjustText}>
                      Import your screenshot to enable image adjustments (scale & offsets).
                    </Text>
                  </View>
                )
              )}
              {activeAdjustTab === 'before' && isSplitSliderEnabled && (
                beforeImageUri ? (
                  <>
                    {renderValueSlider('Before Zoom', beforeScreenshotScale, 0.5, 2.5, setBeforeScreenshotScale, (v) => `${(v * 100).toFixed(0)}%`)}
                    {renderValueSlider('Before Offset X', beforeScreenshotOffsetX, -150, 150, setBeforeScreenshotOffsetX, (v) => `${v.toFixed(0)}px`)}
                    {renderValueSlider('Before Offset Y', beforeScreenshotOffsetY, -150, 150, setBeforeScreenshotOffsetY, (v) => `${v.toFixed(0)}px`)}
                  </>
                ) : (
                  <View style={styles.disabledAdjustCard}>
                    <Text style={styles.disabledAdjustText}>
                      Import a "Before" screenshot to adjust comparison scaling and offsets.
                    </Text>
                  </View>
                )
              )}
            </ScrollView>
          </View>
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

            <View style={styles.exportRow}>
              <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#8B5CF6', flex: 1 }]} onPress={handleBulkExport}>
                <Text style={styles.exportBtnText}>📸 Bulk Export (Save Multiple)</Text>
              </TouchableOpacity>
            </View>

            {/* Watermark Toggle with Paywall check warning */}
            <View style={styles.watermarkRow}>
              <Text style={styles.watermarkLabel}>Enable Watermark (`made with MockupBuilder`)</Text>
              <TouchableOpacity 
                style={[styles.watermarkToggleBtn, (!isPro || isWatermarkEnabled) && styles.watermarkToggleBtnActive]} 
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

  const getAspectRatioValue = (): number => {
    switch (aspectRatio) {
      case '16:9': return 16 / 9;
      case '9:16': return 9 / 16;
      case '1:1': return 1;
      case '4:5': return 4 / 5;
      case '4:3': return 4 / 3;
      case '3:4': return 3 / 4;
      case 'AppStore': return 1290 / 2796;
      case 'iPadStore': return 3 / 4;
      default: return 1;
    }
  };

  const getWorkspaceDimensions = () => {
    const ratio = getAspectRatioValue();
    if (!canvasWidth || !wrapperHeight) {
      const defaultWidth = canvasWidth || 300;
      return { width: defaultWidth, height: defaultWidth / ratio };
    }
    
    // Max width and height with safety padding
    const maxW = canvasWidth - 24;
    const maxH = wrapperHeight - 24;
    
    let w = maxW;
    let h = maxW / ratio;
    
    if (h > maxH) {
      h = maxH;
      w = maxH * ratio;
    }
    
    return { width: w, height: h };
  };

  const handleUndo = () => {
    haptics.lightImpact();
    undo();
  };

  const handleRedo = () => {
    haptics.lightImpact();
    redo();
  };

  const { width: displayWidth, height: displayHeight } = getWorkspaceDimensions();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Editor Header Bar */}
      <View style={styles.editorHeader}>
        <Text style={styles.editorHeaderTitle}>MockupBuilder</Text>
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
        {displayWidth > 0 && displayHeight > 0 && (
          <FeedSimulator mode={feedMode}>
            <View 
              ref={canvasRef} 
              collapsable={false} 
              style={{ 
                width: displayWidth, 
                height: displayHeight, 
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CanvasView width={displayWidth} isWatermarkVisible={!isPro || isWatermarkEnabled} />
              <AnnotationLayer canvasWidth={displayWidth} canvasHeight={displayHeight} />
            </View>
          </FeedSimulator>
        )}

        {/* Sandbox Direct Actions Overlay (Visible only when no screenshot is imported) */}
        {!imageUri && (
          <View style={styles.sandboxOverlay}>
            <View style={styles.sandboxContainer}>
              <TouchableOpacity 
                style={styles.sandboxBtn}
                onPress={pickSingleScreenshot}
              >
                <Text style={styles.sandboxBtnText}>📷 Import Screenshot</Text>
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

      {/* Feed Simulator Control Bar */}
      {imageUri && (
        <View style={styles.feedModeToggleContainer}>
          <Text style={styles.feedModeToggleLabel}>Feed Simulator</Text>
          <View style={styles.feedModeToggleRow}>
            {(['None', 'Twitter', 'LinkedIn', 'ProductHunt'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.feedModeToggleBtn,
                  feedMode === mode && styles.feedModeToggleBtnActive
                ]}
                onPress={() => { haptics.lightImpact(); setFeedMode(mode); }}
              >
                <Text style={[
                  styles.feedModeToggleText,
                  feedMode === mode && styles.feedModeToggleTextActive
                ]}>
                  {mode === 'None' ? 'Clean Mock' : mode === 'ProductHunt' ? 'Product Hunt' : mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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

        {isBulkExporting && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingTitle}>Processing Bulk Mockups</Text>
              <Text style={styles.loadingProgress}>
                Saving {bulkProgress.current} of {bulkProgress.total}
              </Text>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.loadingSubtitle}>
                Please don't close the app or lock your screen.
              </Text>
            </View>
          </View>
        )}
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
    position: 'relative',
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
  // Editor Toolbars (Glassmorphic)
  editorControls: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
    marginTop: 10,
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
  framePanelContainer: {
    width: '100%',
    gap: 12,
  },
  toggleRowBorderGlow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleLabelBorderGlow: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
  },
  glowToggleBtn: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  glowToggleBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    borderWidth: 1,
  },
  glowToggleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  feedModeToggleContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  feedModeToggleLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  feedModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  feedModeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  feedModeToggleBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 0.5,
  },
  feedModeToggleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  feedModeToggleTextActive: {
    color: '#38BDF8',
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
  // Slider Upgrade Styles
  sliderContainer: {
    marginBottom: 14,
    width: '100%',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sliderValue: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sliderTrackContainer: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  sliderTrackBg: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  sliderHandle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#38BDF8',
    borderWidth: 1.5,
    marginLeft: -8, // center handle
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
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  gradientCircleActive: {
    borderColor: '#38BDF8',
  },
  gradientCircleFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  // Segmented adjusting tab rows
  adjustTabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adjustTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  adjustTabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: '#38BDF8',
  },
  adjustTabBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adjustTabBtnTextActive: {
    color: '#38BDF8',
  },
  adjustScroll: {
    maxHeight: 120,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingProgress: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  loadingSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
  },
  disabledAdjustCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAdjustText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  colorPanelContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  colorSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  colorSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  colorSegmentBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
    borderWidth: 0.5,
  },
  colorSegmentText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  colorSegmentTextActive: {
    color: '#F8FAFC',
  },
  solidsPanel: {
    width: '100%',
    gap: 12,
  },
  hexInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 40,
    marginTop: 4,
  },
  hexInputPrefix: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  hexInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  imageBackdropPanel: {
    width: '100%',
    paddingVertical: 4,
  },
  backdropUploadBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backdropUploadBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  backdropPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backdropThumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backdropThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  backdropThumbLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  backdropActionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backdropActionBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
});
