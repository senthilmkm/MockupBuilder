import React from 'react';
import { View, StyleSheet, Image, Platform, DimensionValue, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGradientColors } from '@/constants/gradients';
import { useCanvasStore, FrameType, AspectRatioType } from '@/store/canvasStore';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';

interface CanvasViewProps {
  width: number;
  onLayout?: (event: any) => void;
  children?: React.ReactNode; // For layering annotations on top
  isWatermarkVisible?: boolean;
}

export const CanvasView: React.FC<CanvasViewProps> = ({ width, onLayout, children, isWatermarkVisible }) => {
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
    screenshotScale = 1.0,
    screenshotOffsetX = 0,
    screenshotOffsetY = 0,
    showNotch = true,
  } = useCanvasStore();

  // Determine height based on aspect ratio
  const getCanvasHeight = (): number => {
    switch (aspectRatio) {
      case '16:9':
        return (width * 9) / 16;
      case '9:16':
        return (width * 16) / 9;
      case '1:1':
        return width;
      case '4:5':
        return (width * 5) / 4;
      case '4:3':
        return (width * 3) / 4;
      case '3:4':
        return (width * 4) / 3;
      case 'AppStore':
        return width * 1.5; // Custom 2:3 or 6.5" mockup height ratio
      case 'iPadStore':
        return (width * 4) / 3; // 12.9" iPad aspect ratio
      default:
        return width;
    }
  };

  const canvasHeight = getCanvasHeight();
  const gradientColors = getGradientColors(backgroundColor);

  const renderScreenContent = () => {
    if (isSplitSliderEnabled) {
      return <BeforeAfterSlider />;
    }

    if (!imageUri) {
      // Clean offline dashboard mockup layout placeholder
      return (
        <View style={[styles.screenshotContainer, styles.mockUiContainer]}>
          <View style={styles.mockUiHeader}>
            <View style={styles.mockUiProfile} />
            <View style={styles.mockUiSearchLine} />
          </View>
          
          <View style={styles.mockUiCard}>
            <Text style={styles.mockUiCardLabel}>Sales Overview</Text>
            <Text style={styles.mockUiCardValue}>$12,480.00</Text>
            <Text style={styles.mockUiCardSubText}>📈 +18.4% this week</Text>
          </View>
          
          <View style={styles.mockUiChartBg}>
            <View style={[styles.mockUiChartBar, { height: 35 }]} />
            <View style={[styles.mockUiChartBar, { height: 60, backgroundColor: '#38BDF8' }]} />
            <View style={[styles.mockUiChartBar, { height: 28 }]} />
            <View style={[styles.mockUiChartBar, { height: 75, backgroundColor: '#38BDF8' }]} />
            <View style={[styles.mockUiChartBar, { height: 45 }]} />
          </View>

          <View style={styles.mockUiList}>
            <View style={styles.mockUiListItem}>
              <View style={styles.mockUiListCircle} />
              <View style={styles.mockUiListLine} />
            </View>
            <View style={styles.mockUiListItem}>
              <View style={styles.mockUiListCircle} />
              <View style={[styles.mockUiListLine, { width: '50%' }]} />
            </View>
          </View>
        </View>
      );
    }

    const activeUri = imageUri;
    return (
      <View style={styles.screenshotContainer}>
        <Image 
          source={{ uri: activeUri }} 
          style={[
            styles.screenshotImage,
            {
              transform: [
                { scale: screenshotScale },
                { translateX: screenshotOffsetX },
                { translateY: screenshotOffsetY },
              ],
            },
          ]} 
          resizeMode={frameType === 'MacbookPro' || frameType === 'SafariBrowser' ? 'contain' : 'cover'} 
        />
      </View>
    );
  };

  // Render Bezel Wrapper based on selected frame type
  const renderDeviceFrame = () => {

    const shadowStyle = {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: shadowIntensity,
          shadowRadius: 16,
        },
        android: {
          elevation: shadowIntensity * 20,
        },
        web: {
          boxShadow: `0px 12px 24px rgba(0,0,0, ${shadowIntensity})`,
        },
      }),
    };

    const rotationStyle = {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation3D}deg` },
      ],
    };

    switch (frameType) {
      case 'iPhone16Pro':
        return (
          <View style={[styles.phoneBezel, { borderColor: frameColor }, shadowStyle, rotationStyle]}>
            {/* Phone Screen Container */}
            <View style={styles.phoneScreen}>
              {renderScreenContent()}
              {isWatermarkVisible && (
                <View style={styles.screenshotWatermark}>
                  <Text style={styles.screenshotWatermarkText}>made with MockupBuilder</Text>
                </View>
              )}
            </View>
            {/* Dynamic Island */}
            {showNotch && <View style={styles.dynamicIsland} />}
            {/* Speaker Slit */}
            {showNotch && <View style={styles.speakerSlit} />}
          </View>
        );

      case 'SafariBrowser':
      case 'MacbookPro':
        return (
          <View style={[styles.browserWindow, shadowStyle, rotationStyle]}>
            {/* Browser Header Bar */}
            <View style={styles.browserHeader}>
              <View style={styles.windowControls}>
                <View style={[styles.controlDot, { backgroundColor: '#FF5F56' }]} />
                <View style={[styles.controlDot, { backgroundColor: '#FFBD2E' }]} />
                <View style={[styles.controlDot, { backgroundColor: '#27C93F' }]} />
              </View>
              {frameType === 'SafariBrowser' && (
                <View style={styles.searchBar}>
                  <View style={styles.searchIcon} />
                  <View style={styles.searchUrlPlaceholder} />
                </View>
              )}
            </View>
            {/* Screen Content */}
            <View style={styles.browserScreen}>
              {renderScreenContent()}
              {isWatermarkVisible && (
                <View style={styles.screenshotWatermark}>
                  <Text style={styles.screenshotWatermarkText}>made with MockupBuilder</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'None':
      default:
        return (
          <View style={[styles.flatCard, shadowStyle, rotationStyle]}>
            {renderScreenContent()}
            {isWatermarkVisible && (
              <View style={styles.screenshotWatermark}>
                <Text style={styles.screenshotWatermarkText}>made with MockupBuilder</Text>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.canvasShadowWrapper}>
      <View
        onLayout={onLayout}
        style={[
          styles.canvasContainer,
          {
            width: width,
            height: canvasHeight,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackdrop}
        >
          {/* Canvas Padding Layout Wrapper */}
          <View style={[styles.paddingWrapper, { padding: `${padding}%` as DimensionValue }]}>
            {renderDeviceFrame()}
          </View>
          
          {/* Render child overlays (like Draggable Text/Arrows/Spotlights) */}
          {children}
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  canvasShadowWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
      web: {
        filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))',
      },
    }),
  },
  canvasContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gradientBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paddingWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenshotContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  // iPhone 16 Pro Bezel
  phoneBezel: {
    width: '85%',
    height: '92%',
    borderWidth: 10,
    borderRadius: 40,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    borderRadius: 30,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 80,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  speakerSlit: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#222',
    zIndex: 10,
  },
  // Browser Bezel (Macbook / Safari Window)
  browserWindow: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  browserHeader: {
    height: 30,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  windowControls: {
    flexDirection: 'row',
    gap: 6,
  },
  controlDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  searchBar: {
    flex: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginLeft: 20,
    marginRight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  searchIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchUrlPlaceholder: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginLeft: 6,
  },
  browserScreen: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  // Flat Bezel-less Card
  flatCard: {
    width: '90%',
    height: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  // Empty State Bezel
  emptyScreenshot: {
    width: '60%',
    height: '70%',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyMockupIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Mock UI Styles
  mockUiContainer: {
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 12,
    height: '100%',
  },
  mockUiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  mockUiProfile: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  mockUiSearchLine: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mockUiCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mockUiCardLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mockUiCardValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mockUiCardSubText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '500',
  },
  mockUiChartBg: {
    height: 100,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mockUiChartBar: {
    width: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mockUiList: {
    gap: 8,
    marginTop: 4,
  },
  mockUiListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mockUiListCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mockUiListLine: {
    width: '70%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  screenshotWatermark: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 99,
  },
  screenshotWatermarkText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
