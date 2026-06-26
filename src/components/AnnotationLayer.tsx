import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  GestureResponderEvent,
  Platform,
  Image,
} from 'react-native';
import Svg, { Path, Line, Defs, Marker } from 'react-native-svg';
import { useCanvasStore, AnnotationElement } from '@/store/canvasStore';
import { haptics } from '@/services/haptics';

interface AnnotationLayerProps {
  canvasWidth: number;
  canvasHeight: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  canvasWidth,
  canvasHeight,
}) => {
  const {
    annotations,
    updateAnnotation,
    deleteAnnotation,
    imageUri,
    saveHistoryState,
    selectedAnnotationId: selectedId,
    setSelectedAnnotationId: setSelectedId,
    screenshotScale = 1.0,
    screenshotOffsetX = 0,
    screenshotOffsetY = 0,
    padding = 15,
    frameType = 'iPhone16Pro',
  } = useCanvasStore();

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [tempText, setTempText] = useState('');
  
  // Drag move state (position X/Y)
  const [dragStart, setDragStart] = useState<{
    pageX: number;
    pageY: number;
    elementX: number;
    elementY: number;
  } | null>(null);

  // Resize gesture state (scale)
  const [resizeStart, setResizeStart] = useState<{
    pageX: number;
    pageY: number;
    startScale: number;
  } | null>(null);

  const lastTapRef = React.useRef<{ id: string; time: number } | null>(null);

  // Rotate gesture state (rotation angle)
  const [rotateGestureStart, setRotateGestureStart] = useState<{
    pageX: number;
    startRotation: number;
  } | null>(null);

  const handleDragStart = (e: GestureResponderEvent, ann: AnnotationElement) => {
    saveHistoryState();
    
    // Double tap check using mutable ref to avoid React state closure delays
    const now = Date.now();
    const lastTap = lastTapRef.current;
    if (lastTap && lastTap.id === ann.id && now - lastTap.time < 300) {
      if (ann.type === 'Text') {
        startEditText(ann);
      }
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { id: ann.id, time: now };

    setDragStart({
      pageX: e.nativeEvent.pageX,
      pageY: e.nativeEvent.pageY,
      elementX: ann.x,
      elementY: ann.y,
    });
    setSelectedId(ann.id);
    haptics.lightImpact();
  };

  const handleDragMove = (e: GestureResponderEvent, id: string) => {
    if (!dragStart) return;
    const deltaX = e.nativeEvent.pageX - dragStart.pageX;
    const deltaY = e.nativeEvent.pageY - dragStart.pageY;

    const deltaXPercent = (deltaX / canvasWidth) * 100;
    const deltaYPercent = (deltaY / canvasHeight) * 100;

    const nextX = Math.max(0, Math.min(100, dragStart.elementX + deltaXPercent));
    const nextY = Math.max(0, Math.min(100, dragStart.elementY + deltaYPercent));

    updateAnnotation(id, { x: nextX, y: nextY });
  };

  const handleDragRelease = () => {
    setDragStart(null);
    haptics.selection();
  };

  const handleResizeStart = (e: GestureResponderEvent, ann: AnnotationElement) => {
    e.stopPropagation();
    saveHistoryState();
    setResizeStart({
      pageX: e.nativeEvent.pageX,
      pageY: e.nativeEvent.pageY,
      startScale: ann.scale || 1,
    });
    setSelectedId(ann.id);
    haptics.lightImpact();
  };

  const handleResizeMove = (e: GestureResponderEvent, id: string) => {
    if (!resizeStart) return;
    const deltaX = e.nativeEvent.pageX - resizeStart.pageX;
    const deltaY = e.nativeEvent.pageY - resizeStart.pageY;
    
    // Moving right/down increases scale, moving left/up decreases scale
    const deltaScale = (deltaX + deltaY) / 150;
    const nextScale = Math.max(0.4, Math.min(4.0, resizeStart.startScale + deltaScale));
    
    updateAnnotation(id, { scale: nextScale });
  };

  const handleResizeRelease = () => {
    setResizeStart(null);
    haptics.selection();
  };

  const handleRotateStart = (e: GestureResponderEvent, ann: AnnotationElement) => {
    e.stopPropagation();
    saveHistoryState();
    setRotateGestureStart({
      pageX: e.nativeEvent.pageX,
      startRotation: ann.rotation || 0,
    });
    setSelectedId(ann.id);
    haptics.lightImpact();
  };

  const handleRotateMove = (e: GestureResponderEvent, id: string) => {
    if (!rotateGestureStart) return;
    const deltaX = e.nativeEvent.pageX - rotateGestureStart.pageX;
    
    // Dragging right rotates clockwise, left rotates counter-clockwise
    const deltaRotation = deltaX * 1.5;
    const nextRotation = (rotateGestureStart.startRotation + deltaRotation) % 360;
    
    updateAnnotation(id, { rotation: nextRotation >= 0 ? nextRotation : 360 + nextRotation });
  };

  const handleRotateRelease = () => {
    setRotateGestureStart(null);
    haptics.selection();
  };

  const startEditText = (ann: AnnotationElement) => {
    setEditingTextId(ann.id);
    setTempText(ann.text || '');
  };

  const saveEditText = (id: string) => {
    updateAnnotation(id, { text: tempText }, true);
    setEditingTextId(null);
    haptics.success();
  };

  const getFontFamily = (family: string | undefined) => {
    switch (family) {
      case 'monospace':
        return Platform.OS === 'ios' ? 'Courier New' : 'monospace';
      case 'serif':
        return Platform.OS === 'ios' ? 'Times New Roman' : 'serif';
      case 'Outfit':
        return Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium';
      case 'System':
      default:
        return Platform.OS === 'ios' ? 'System' : 'sans-serif';
    }
  };

  const renderActionToolbar = (ann: AnnotationElement) => {
    const isEditing = editingTextId === ann.id;
    return (
      <View style={styles.actionButtons}>
        {ann.type === 'Text' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              haptics.lightImpact();
              const fonts = ['System', 'monospace', 'serif', 'Outfit'];
              const nextIdx = (fonts.indexOf(ann.fontFamily || 'System') + 1) % fonts.length;
              updateAnnotation(ann.id, { fontFamily: fonts[nextIdx] }, true);
            }}
          >
            <Text style={styles.actionText}>🔤 {ann.fontFamily === 'monospace' ? 'Mono' : ann.fontFamily === 'serif' ? 'Serif' : ann.fontFamily === 'Outfit' ? 'Outfit' : 'Sys'}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            haptics.lightImpact();
            const colors = ['#ffffff', '#FFCC00', '#38BDF8', '#EF4444', '#4CD964'];
            const nextIdx = (colors.indexOf(ann.color || '#ffffff') + 1) % colors.length;
            updateAnnotation(ann.id, { color: colors[nextIdx] }, true);
          }}
        >
          <Text style={styles.actionText}>🎨 Color</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            haptics.lightImpact();
            updateAnnotation(ann.id, { rotation: ((ann.rotation || 0) + 45) % 360 }, true);
          }}
        >
          <Text style={styles.actionText}>🔄 +45°</Text>
        </TouchableOpacity>

        {ann.type === 'Text' && !isEditing && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => startEditText(ann)}
          >
            <Text style={styles.actionText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => {
            haptics.mediumImpact();
            deleteAnnotation(ann.id);
          }}
        >
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }]} pointerEvents="box-none">
      {annotations.map((ann) => {
        const isSelected = selectedId === ann.id;
        const isEditing = editingTextId === ann.id;
        
        // Unified Scale & Rotation styles applied at container level
        const elementStyle = {
          position: 'absolute' as const,
          left: `${ann.x}%` as any,
          top: `${ann.y}%` as any,
          transform: [
            { translateX: -50 },
            { translateY: -50 },
            { scale: ann.scale || 1 },
            { rotate: `${ann.rotation !== undefined ? ann.rotation : (ann.arrowDirection || 0)}deg` },
          ],
          zIndex: isSelected ? 100 : 50,
        };

        // RENDER 1: Text Callout
        if (ann.type === 'Text') {
          return (
            <View key={ann.id} style={[elementStyle, styles.draggableContainer]}>
              <View style={[styles.boundingBox, isSelected && styles.boundingBoxActive]}>
                <View
                  onStartShouldSetResponder={() => !isEditing}
                  onResponderGrant={(e) => handleDragStart(e, ann)}
                  onResponderMove={(e) => handleDragMove(e, ann.id)}
                  onResponderRelease={handleDragRelease}
                  style={[
                    styles.textBadge,
                    { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
                  ]}
                >
                  {isEditing ? (
                    <TextInput
                      style={[styles.textInput, { fontFamily: getFontFamily(ann.fontFamily), color: ann.color }]}
                      value={tempText}
                      onChangeText={setTempText}
                      onBlur={() => saveEditText(ann.id)}
                      onSubmitEditing={() => saveEditText(ann.id)}
                      autoFocus
                    />
                  ) : (
                    <Text 
                      style={[styles.badgeText, { color: ann.color, fontFamily: getFontFamily(ann.fontFamily) }]}
                      onLongPress={() => startEditText(ann)}
                      onPress={() => {
                        const now = Date.now();
                        const lastTap = lastTapRef.current;
                        if (lastTap && lastTap.id === ann.id && now - lastTap.time < 300) {
                          startEditText(ann);
                          lastTapRef.current = null;
                        } else {
                          lastTapRef.current = { id: ann.id, time: now };
                        }
                      }}
                    >
                      {ann.text}
                    </Text>
                  )}
                </View>

                {/* Handles */}
                <View 
                  style={[
                    styles.rotateHandleContainer, 
                    { 
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }
                  ]}
                  onStartShouldSetResponder={() => isSelected}
                  onResponderGrant={(e) => handleRotateStart(e, ann)}
                  onResponderMove={(e) => handleRotateMove(e, ann.id)}
                  onResponderRelease={handleRotateRelease}
                >
                  <View style={styles.rotateHandleLine} />
                  <View style={styles.rotateHandleDot} />
                </View>

                <View 
                  style={[
                    styles.resizeHandle,
                    {
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }
                  ]}
                  onStartShouldSetResponder={() => isSelected}
                  onResponderGrant={(e) => handleResizeStart(e, ann)}
                  onResponderMove={(e) => handleResizeMove(e, ann.id)}
                  onResponderRelease={handleResizeRelease}
                >
                  <View style={styles.resizeHandleVisual} />
                </View>
              </View>

              {/* Toolbar */}
              {isSelected && renderActionToolbar(ann)}
            </View>
          );
        }

        // RENDER 2: SVG Arrow
        if (ann.type === 'Arrow') {
          return (
            <View key={ann.id} style={[elementStyle, styles.draggableContainer, { width: 100, height: 100 }]}>
              <View style={[styles.boundingBox, isSelected && styles.boundingBoxActive, { width: 90, height: 90 }]}>
                <View
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={(e) => handleDragStart(e, ann)}
                  onResponderMove={(e) => handleDragMove(e, ann.id)}
                  onResponderRelease={handleDragRelease}
                  style={styles.arrowTouchable}
                >
                  <Svg width="80" height="80" viewBox="0 0 80 80">
                    <Defs>
                      <Marker
                        id={`arrowhead-${ann.id}`}
                        markerWidth="6"
                        markerHeight="6"
                        refX="5"
                        refY="3"
                        orient="auto"
                      >
                        <Path d="M0,0 L0,6 L6,3 Z" fill={ann.color} />
                      </Marker>
                    </Defs>
                    <Line
                      x1="10"
                      y1="40"
                      x2="68"
                      y2="40"
                      stroke={ann.color}
                      strokeWidth="4"
                      markerEnd={`url(#arrowhead-${ann.id})`}
                    />
                  </Svg>
                </View>

                {/* Handles */}
                <View 
                  style={[
                    styles.rotateHandleContainer, 
                    { 
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }
                  ]}
                  onStartShouldSetResponder={() => isSelected}
                  onResponderGrant={(e) => handleRotateStart(e, ann)}
                  onResponderMove={(e) => handleRotateMove(e, ann.id)}
                  onResponderRelease={handleRotateRelease}
                >
                  <View style={styles.rotateHandleLine} />
                  <View style={styles.rotateHandleDot} />
                </View>

                <View 
                  style={[
                    styles.resizeHandle,
                    {
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }
                  ]}
                  onStartShouldSetResponder={() => isSelected}
                  onResponderGrant={(e) => handleResizeStart(e, ann)}
                  onResponderMove={(e) => handleResizeMove(e, ann.id)}
                  onResponderRelease={handleResizeRelease}
                >
                  <View style={styles.resizeHandleVisual} />
                </View>
              </View>

              {/* Toolbar */}
              {isSelected && renderActionToolbar(ann)}
            </View>
          );
        }

        // RENDER 3: Spotlight Lens (Magnifier)
        if (ann.type === 'Spotlight') {
          const lensRadius = 40; // 80px diameter
          const zoom = ann.zoomFactor || 1.5;

          const getBezelRatios = () => {
            switch (frameType) {
              case 'iPhone16Pro':
                return { w: 0.85, h: 0.92 };
              case 'MacbookPro':
              case 'SafariBrowser':
                return { w: 0.90, h: 0.80 };
              case 'None':
              default:
                return { w: 0.90, h: 0.90 };
            }
          };

          const paddingFactor = 1 - (padding * 2) / 100;
          const bezelRatio = getBezelRatios();
          
          const bgWidth = canvasWidth * paddingFactor * bezelRatio.w * zoom;
          const bgHeight = canvasHeight * paddingFactor * bezelRatio.h * zoom;

          const screenshotLeft = (canvasWidth * (1 - paddingFactor * bezelRatio.w)) / 2;
          const screenshotTop = (canvasHeight * (1 - paddingFactor * bezelRatio.h)) / 2;

          const offsetLeft = -((ann.x / 100) * canvasWidth - screenshotLeft) * zoom + lensRadius;
          const offsetTop = -((ann.y / 100) * canvasHeight - screenshotTop) * zoom + lensRadius;

          return (
            <View key={ann.id} style={[elementStyle, styles.draggableContainer, { width: 80, height: 80 }]}>
              <View style={[styles.boundingBox, isSelected && styles.boundingBoxActive, { width: 90, height: 90 }]}>
                <View
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={(e) => handleDragStart(e, ann)}
                  onResponderMove={(e) => handleDragMove(e, ann.id)}
                  onResponderRelease={handleDragRelease}
                  style={[styles.spotlightLens, { borderColor: ann.color || '#ffffff' }]}
                >
                  {imageUri ? (
                    <View style={styles.magnifiedViewport}>
                      <View style={[styles.magnifiedImageWrapper, { width: bgWidth, height: bgHeight, marginLeft: offsetLeft, marginTop: offsetTop }]}>
                        <Image
                          source={{ uri: imageUri }}
                          style={[
                            { width: '100%', height: '100%' },
                            {
                              transform: [
                                { scale: screenshotScale },
                                { translateX: screenshotOffsetX * zoom },
                                { translateY: screenshotOffsetY * zoom },
                              ],
                            },
                          ]}
                          resizeMode="cover"
                        />
                        <View style={styles.magnifierCircleOverlay} />
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.lensGridFallback, { borderColor: ann.color || '#ffffff' }]} />
                  )}
                </View>

                {/* Handles */}
                <View 
                  style={[
                    styles.rotateHandleContainer, 
                    { 
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }
                  ]}
                  onStartShouldSetResponder={() => isSelected}
                  onResponderGrant={(e) => handleRotateStart(e, ann)}
                  onResponderMove={(e) => handleRotateMove(e, ann.id)}
                  onResponderRelease={handleRotateRelease}
                >
                  <View style={styles.rotateHandleLine} />
                  <View style={styles.rotateHandleDot} />
                </View>

                <View 
                  style={[
                    styles.resizeHandle,
                    {
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }
                  ]}
                  onStartShouldSetResponder={() => isSelected}
                  onResponderGrant={(e) => handleResizeStart(e, ann)}
                  onResponderMove={(e) => handleResizeMove(e, ann.id)}
                  onResponderRelease={handleResizeRelease}
                >
                  <View style={styles.resizeHandleVisual} />
                </View>
              </View>

              {/* Toolbar */}
              {isSelected && renderActionToolbar(ann)}
            </View>
          );
        }

        return null;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  draggableContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundingBox: {
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 6,
  },
  boundingBoxActive: {
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
  },
  resizeHandle: {
    position: 'absolute',
    right: -22,
    bottom: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    cursor: 'se-resize' as any,
  },
  resizeHandleVisual: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  rotateHandleContainer: {
    position: 'absolute',
    top: -34,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    cursor: 'grab' as any,
  },
  rotateHandleLine: {
    width: 1.5,
    height: 12,
    backgroundColor: '#38BDF8',
  },
  rotateHandleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  textBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'move' as any,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 0,
    width: '100%',
  },
  actionButtons: {
    position: 'absolute',
    top: -56,
    flexDirection: 'row',
    gap: 6,
    zIndex: 400,
    backgroundColor: '#1E293B',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  actionBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // SVG Arrow Styles
  arrowTouchable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'move' as any,
  },
  // Spotlight / Magnifying Lens Styles
  spotlightLens: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'move' as any,
  },
  magnifiedViewport: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    overflow: 'hidden',
  },
  magnifiedImageWrapper: {
    position: 'absolute',
  },
  magnifierCircleOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lensGridFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
