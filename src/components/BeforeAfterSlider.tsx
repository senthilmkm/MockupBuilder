import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, GestureResponderEvent, Platform, DimensionValue } from 'react-native';
import { useCanvasStore } from '@/store/canvasStore';
import { haptics } from '@/services/haptics';

export const BeforeAfterSlider: React.FC = () => {
  const { 
    imageUri, 
    beforeImageUri, 
    sliderPosition, 
    setSliderPosition,
    screenshotScale = 1.0,
    screenshotOffsetX = 0,
    screenshotOffsetY = 0,
    beforeScreenshotScale = 1.0,
    beforeScreenshotOffsetX = 0,
    beforeScreenshotOffsetY = 0,
  } = useCanvasStore();
  const [parentDimensions, setParentDimensions] = useState({ width: 0, height: 0 });
  const dragStartRef = React.useRef<{ pageX: number; sliderPosition: number } | null>(null);

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setParentDimensions({ width, height });
  };

  if (!imageUri || !beforeImageUri) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Text style={styles.errorIcon}>🌓</Text>
        </View>
        <Text style={styles.errorTitle}>Split Comparison</Text>
        <Text style={styles.errorSubtitle}>
          Import both screenshots to enable the comparison slider.
        </Text>
        
        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={styles.statusBullet}>{beforeImageUri ? '🟢' : '⚪'}</Text>
            <Text style={styles.statusText}>Before: {beforeImageUri ? 'Loaded' : 'Empty'}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusBullet}>{imageUri ? '🟢' : '⚪'}</Text>
            <Text style={styles.statusText}>After: {imageUri ? 'Loaded' : 'Empty'}</Text>
          </View>
        </View>
      </View>
    );
  }

  const sliderLeft = `${sliderPosition}%`;
  const { width: pWidth, height: pHeight } = parentDimensions;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* 1. Base Image Layer (Before) */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: beforeImageUri }}
          style={[
            styles.fullImage,
            {
              transform: [
                { scale: beforeScreenshotScale },
                { translateX: beforeScreenshotOffsetX },
                { translateY: beforeScreenshotOffsetY },
              ],
            },
          ]}
          resizeMode="cover"
        />
      </View>
      <View style={styles.beforeLabelContainer}>
        <Text style={styles.label}>Before</Text>
      </View>

      {/* 2. Slider Overlay Clip Container (After) */}
      {pWidth > 0 && (
        <View style={[styles.overlayClip, { width: sliderLeft as DimensionValue }]}>
          {/* Inner image has the full parent dimensions to prevent squeezing */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUri }}
              style={[
                { width: pWidth, height: pHeight },
                {
                  transform: [
                    { scale: screenshotScale },
                    { translateX: screenshotOffsetX },
                    { translateY: screenshotOffsetY },
                  ],
                },
              ]}
              resizeMode="cover"
            />
          </View>
        </View>
      )}
      <View style={styles.afterLabelContainer}>
        <Text style={styles.label}>After</Text>
      </View>

      {/* 3. Draggable Divider Handle */}
      {pWidth > 0 && (
        <View
          style={[styles.dividerBar, { left: sliderLeft as DimensionValue }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e) => {
            const selectId = useCanvasStore.getState().selectedAnnotationId;
            if (selectId) {
              useCanvasStore.getState().setSelectedAnnotationId(null);
            }
            dragStartRef.current = {
              pageX: e.nativeEvent.pageX,
              sliderPosition: sliderPosition,
            };
            haptics.lightImpact();
          }}
          onResponderMove={(e) => {
            const dragStart = dragStartRef.current;
            if (!dragStart) return;
            const deltaX = e.nativeEvent.pageX - dragStart.pageX;
            const deltaPercent = (deltaX / pWidth) * 100;
            const nextPos = Math.max(0, Math.min(100, dragStart.sliderPosition + deltaPercent));
            setSliderPosition(nextPos);
            haptics.selection();
          }}
          onResponderRelease={() => {
            dragStartRef.current = null;
            haptics.selection();
          }}
          onResponderTerminate={() => {
            dragStartRef.current = null;
          }}
        >
          {/* Grab Handle UI */}
          <View style={styles.grabHandle}>
            <View style={styles.handleDot} />
            <View style={styles.handleDot} />
            <View style={styles.handleDot} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  overlayClip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRightWidth: 1.5,
    borderColor: '#ffffff',
  },
  dividerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    marginLeft: -30, // Center on the split line
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    cursor: Platform.OS === 'web' ? 'ew-resize' as any : undefined,
  },
  grabHandle: {
    width: 24,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderColor: '#007AFF',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.3)',
      },
    }),
  },
  handleDot: {
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: '#007AFF',
  },
  beforeLabelContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  afterLabelContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 74, 255, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  label: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  errorContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151515',
    padding: 24,
  },
  errorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorIcon: {
    fontSize: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  statusBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    maxWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    gap: 6,
  },
  statusBullet: {
    fontSize: 10,
  },
  statusText: {
    color: '#D1D5DB',
    fontSize: 11,
  },
});
