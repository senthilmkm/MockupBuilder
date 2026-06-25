import { useCanvasStore } from '../src/store/canvasStore';

describe('Zustand Canvas State Store', () => {
  beforeEach(() => {
    // Reset state before each test
    const { clearAll } = useCanvasStore.getState();
    clearAll();
    useCanvasStore.setState({
      undoStack: [],
      redoStack: [],
    });
  });

  test('should initialize with default states', () => {
    const state = useCanvasStore.getState();
    expect(state.imageUri).toBeNull();
    expect(state.beforeImageUri).toBeNull();
    expect(state.isSplitSliderEnabled).toBeFalsy();
    expect(state.aspectRatio).toBe('16:9');
    expect(state.frameType).toBe('iPhone16Pro');
    expect(state.padding).toBe(15);
    expect(state.annotations).toHaveLength(0);
  });

  test('should handle screenshot import state changes', () => {
    const { setImageUri, setBeforeImageUri, setIsSplitSliderEnabled } = useCanvasStore.getState();
    
    setImageUri('file://mock-screenshot.png');
    expect(useCanvasStore.getState().imageUri).toBe('file://mock-screenshot.png');

    setBeforeImageUri('file://mock-before.png');
    expect(useCanvasStore.getState().beforeImageUri).toBe('file://mock-before.png');

    setIsSplitSliderEnabled(true);
    expect(useCanvasStore.getState().isSplitSliderEnabled).toBeTruthy();
  });

  test('should modify canvas properties (padding, 3D tilt, shadow)', () => {
    const { setPadding, setRotation3D, setShadowIntensity } = useCanvasStore.getState();

    setPadding(25);
    expect(useCanvasStore.getState().padding).toBe(25);

    setRotation3D(15);
    expect(useCanvasStore.getState().rotation3D).toBe(15);

    setShadowIntensity(0.75);
    expect(useCanvasStore.getState().shadowIntensity).toBe(0.75);
  });

  test('should modify aspect ratio correctly including new presets', () => {
    const { setAspectRatio } = useCanvasStore.getState();

    setAspectRatio('9:16');
    expect(useCanvasStore.getState().aspectRatio).toBe('9:16');

    setAspectRatio('iPadStore');
    expect(useCanvasStore.getState().aspectRatio).toBe('iPadStore');
  });

  test('should add, update, and delete annotation elements', () => {
    const { addAnnotation, updateAnnotation, deleteAnnotation } = useCanvasStore.getState();

    // Add a text box
    addAnnotation('Text');
    let annotations = useCanvasStore.getState().annotations;
    expect(annotations).toHaveLength(1);
    expect(annotations[0].type).toBe('Text');
    expect(annotations[0].text).toBe('Double tap to edit');

    // Update text content and position
    const targetId = annotations[0].id;
    updateAnnotation(targetId, { text: 'New Shipped Feature!', x: 20, y: 30 });
    
    annotations = useCanvasStore.getState().annotations;
    expect(annotations[0].text).toBe('New Shipped Feature!');
    expect(annotations[0].x).toBe(20);
    expect(annotations[0].y).toBe(30);

    // Delete annotation
    deleteAnnotation(targetId);
    expect(useCanvasStore.getState().annotations).toHaveLength(0);
  });

  test('should handle annotation scale, rotation, and font family features', () => {
    const { addAnnotation, updateAnnotation } = useCanvasStore.getState();

    // Add Text Annotation
    addAnnotation('Text');
    let annotations = useCanvasStore.getState().annotations;
    expect(annotations).toHaveLength(1);
    expect(annotations[0].scale).toBe(1);
    expect(annotations[0].rotation).toBe(0);
    expect(annotations[0].fontFamily).toBe('System');

    // Update scale, rotation, and font family
    const targetId = annotations[0].id;
    updateAnnotation(targetId, { scale: 1.5, rotation: 90, fontFamily: 'monospace' });

    annotations = useCanvasStore.getState().annotations;
    expect(annotations[0].scale).toBe(1.5);
    expect(annotations[0].rotation).toBe(90);
    expect(annotations[0].fontFamily).toBe('monospace');
  });

  test('should clear canvas and reset all edits', () => {
    const { setImageUri, addAnnotation, clearAll } = useCanvasStore.getState();

    setImageUri('file://active.png');
    addAnnotation('Arrow');
    
    expect(useCanvasStore.getState().imageUri).toBe('file://active.png');
    expect(useCanvasStore.getState().annotations).toHaveLength(1);

    clearAll();

    const state = useCanvasStore.getState();
    expect(state.imageUri).toBeNull();
    expect(state.beforeImageUri).toBeNull();
    expect(state.annotations).toHaveLength(0);
    expect(state.padding).toBe(15);
  });

  test('should handle exports history additions, individual deletions, and bulk clearing', () => {
    const { addExportToHistory, deleteExportFromHistory, clearExportsHistory } = useCanvasStore.getState();

    // Add elements
    addExportToHistory('mockup1.png', 'iPhone16Pro', '16:9', 'file://path1.png');
    addExportToHistory('mockup2.png', 'MacbookPro', '1:1', 'file://path2.png');
    
    let history = useCanvasStore.getState().exportsHistory;
    expect(history).toHaveLength(2);
    expect(history[0].fileName).toBe('mockup2.png'); // Most recent first
    
    // Delete individual
    const targetId = history[0].id;
    deleteExportFromHistory(targetId);
    
    history = useCanvasStore.getState().exportsHistory;
    expect(history).toHaveLength(1);
    expect(history[0].fileName).toBe('mockup1.png');
    
    // Clear all
    clearExportsHistory();
    expect(useCanvasStore.getState().exportsHistory).toHaveLength(0);
  });

  test('should handle subscription status changes via isPro and setProStatus', () => {
    const state = useCanvasStore.getState();
    expect(state.isPro).toBeFalsy();

    const { setProStatus } = useCanvasStore.getState();
    setProStatus(true);
    expect(useCanvasStore.getState().isPro).toBeTruthy();

    setProStatus(false);
    expect(useCanvasStore.getState().isPro).toBeFalsy();
  });

  test('should handle showNotch status changes and undo/redo states', () => {
    const state = useCanvasStore.getState();
    expect(state.showNotch).toBeTruthy();

    const { setShowNotch, undo, redo } = useCanvasStore.getState();
    setShowNotch(false);
    expect(useCanvasStore.getState().showNotch).toBeFalsy();

    undo();
    expect(useCanvasStore.getState().showNotch).toBeTruthy();

    redo();
    expect(useCanvasStore.getState().showNotch).toBeFalsy();
  });

  test('should handle screenshot scale and offset variables', () => {
    const { 
      setScreenshotScale, 
      setScreenshotOffsetX, 
      setScreenshotOffsetY,
      setBeforeScreenshotScale,
      setBeforeScreenshotOffsetX,
      setBeforeScreenshotOffsetY,
    } = useCanvasStore.getState();
    
    expect(useCanvasStore.getState().screenshotScale).toBe(1.0);
    expect(useCanvasStore.getState().screenshotOffsetX).toBe(0);
    expect(useCanvasStore.getState().screenshotOffsetY).toBe(0);

    setScreenshotScale(1.5);
    expect(useCanvasStore.getState().screenshotScale).toBe(1.5);

    setScreenshotOffsetX(50);
    expect(useCanvasStore.getState().screenshotOffsetX).toBe(50);

    setScreenshotOffsetY(-30);
    expect(useCanvasStore.getState().screenshotOffsetY).toBe(-30);

    // Test Before Alignment Controls
    expect(useCanvasStore.getState().beforeScreenshotScale).toBe(1.0);
    expect(useCanvasStore.getState().beforeScreenshotOffsetX).toBe(0);
    expect(useCanvasStore.getState().beforeScreenshotOffsetY).toBe(0);

    setBeforeScreenshotScale(1.2);
    expect(useCanvasStore.getState().beforeScreenshotScale).toBe(1.2);

    setBeforeScreenshotOffsetX(-20);
    expect(useCanvasStore.getState().beforeScreenshotOffsetX).toBe(-20);

    setBeforeScreenshotOffsetY(40);
    expect(useCanvasStore.getState().beforeScreenshotOffsetY).toBe(40);
  });

  test('should handle undo and redo of before screenshot alignments', () => {
    const { setBeforeScreenshotScale, undo, redo } = useCanvasStore.getState();
    
    setBeforeScreenshotScale(1.0);
    useCanvasStore.setState({ undoStack: [], redoStack: [] });

    setBeforeScreenshotScale(1.8);
    expect(useCanvasStore.getState().beforeScreenshotScale).toBe(1.8);
    expect(useCanvasStore.getState().undoStack).toHaveLength(1);

    undo();
    expect(useCanvasStore.getState().beforeScreenshotScale).toBe(1.0);
    expect(useCanvasStore.getState().redoStack).toHaveLength(1);

    redo();
    expect(useCanvasStore.getState().beforeScreenshotScale).toBe(1.8);
  });

  test('should handle undo and redo stacks correctly for sequential edits', () => {
    const { setPadding, setAspectRatio, undo, redo } = useCanvasStore.getState();

    // Make sure we have a clean baseline
    setAspectRatio('16:9');
    useCanvasStore.setState({ undoStack: [], redoStack: [] });

    // Verify initial empty undo/redo stacks
    expect(useCanvasStore.getState().undoStack).toHaveLength(0);
    expect(useCanvasStore.getState().redoStack).toHaveLength(0);

    // Make first edit (Padding: 15 -> 20)
    setPadding(20);
    expect(useCanvasStore.getState().padding).toBe(20);
    expect(useCanvasStore.getState().undoStack).toHaveLength(1);
    expect(useCanvasStore.getState().undoStack[0].padding).toBe(15); // Saved previous state

    // Make second edit (Aspect Ratio: 16:9 -> 1:1)
    setAspectRatio('1:1');
    expect(useCanvasStore.getState().aspectRatio).toBe('1:1');
    expect(useCanvasStore.getState().undoStack).toHaveLength(2);
    expect(useCanvasStore.getState().undoStack[1].aspectRatio).toBe('16:9'); // Saved previous state

    // Perform first Undo (reverts Aspect Ratio to 16:9)
    undo();
    expect(useCanvasStore.getState().aspectRatio).toBe('16:9');
    expect(useCanvasStore.getState().padding).toBe(20);
    expect(useCanvasStore.getState().undoStack).toHaveLength(1);
    expect(useCanvasStore.getState().redoStack).toHaveLength(1);
    expect(useCanvasStore.getState().redoStack[0].aspectRatio).toBe('1:1'); // Redo stack captures the state we undid from

    // Perform second Undo (reverts Padding to 15)
    undo();
    expect(useCanvasStore.getState().padding).toBe(15);
    expect(useCanvasStore.getState().undoStack).toHaveLength(0);
    expect(useCanvasStore.getState().redoStack).toHaveLength(2);

    // Perform Redo (reapplies Padding to 20)
    redo();
    expect(useCanvasStore.getState().padding).toBe(20);
    expect(useCanvasStore.getState().undoStack).toHaveLength(1);
    expect(useCanvasStore.getState().redoStack).toHaveLength(1);

    // Perform another Redo (reapplies Aspect Ratio to 1:1)
    redo();
    expect(useCanvasStore.getState().aspectRatio).toBe('1:1');
    expect(useCanvasStore.getState().undoStack).toHaveLength(2);
    expect(useCanvasStore.getState().redoStack).toHaveLength(0);
  });
});
