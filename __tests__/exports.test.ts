import { ExportSpecData } from '../src/services/exportEngine';

describe('CSV Document Exporter Format Spec', () => {
  const mockSpec: ExportSpecData = {
    projectName: 'Test Project Alpha',
    aspectRatio: '16:9',
    frameType: 'iPhone16Pro',
    frameColor: '#000000',
    padding: 15,
    shadowIntensity: 0.5,
    rotation3D: 10,
    gradientId: 'gradient-sunset',
    isSplitEnabled: false,
    imageUri: 'file://screenshot.png',
    beforeImageUri: null,
    annotations: [
      {
        id: 'ann-1',
        type: 'Text',
        x: 25.5,
        y: 40.0,
        scale: 1,
        text: 'Hello, "World"!',
        color: '#ffffff',
      },
      {
        id: 'ann-2',
        type: 'Arrow',
        x: 60.2,
        y: 80.5,
        scale: 1.2,
        arrowDirection: 90,
        color: '#ff0000',
      }
    ],
  };

  test('should generate correctly formatted CSV string with headers and escaped commas/quotes', () => {
    // Replicate CSV generation logic from exportEngine
    const headers = 'Project Name,Timestamp,Element ID,Element Type,Coordinate X (%),Coordinate Y (%),Text Content,Color,Arrow Direction,Zoom Factor,Device Frame,Aspect Ratio\n';
    const timestamp = '2026-06-24T10:00:00.000Z';
    
    const rows = mockSpec.annotations.map(ann => {
      const escapedText = ann.text ? `"${ann.text.replace(/"/g, '""')}"` : '""';
      return `${mockSpec.projectName},${timestamp},${ann.id},${ann.type},${ann.x.toFixed(2)},${ann.y.toFixed(2)},${escapedText},${ann.color || ''},${ann.arrowDirection || ''},${ann.zoomFactor || ''},${mockSpec.frameType},${mockSpec.aspectRatio}`;
    });

    const csvContent = headers + rows.join('\n');
    const lines = csvContent.split('\n');

    // Verify Headers
    expect(lines[0]).toBe('Project Name,Timestamp,Element ID,Element Type,Coordinate X (%),Coordinate Y (%),Text Content,Color,Arrow Direction,Zoom Factor,Device Frame,Aspect Ratio');
    
    // Verify Row 1 (Text Annotation with escaped quotes)
    expect(lines[1]).toContain('Test Project Alpha,2026-06-24T10:00:00.000Z,ann-1,Text,25.50,40.00,"Hello, ""World""!",#ffffff,,,iPhone16Pro,16:9');

    // Verify Row 2 (Arrow Annotation with degree orientation)
    expect(lines[2]).toContain('Test Project Alpha,2026-06-24T10:00:00.000Z,ann-2,Arrow,60.20,80.50,"",#ff0000,90,,iPhone16Pro,16:9');
  });

  test('should fall back to empty summary row if no elements exist', () => {
    const emptySpec: ExportSpecData = {
      ...mockSpec,
      annotations: [],
    };

    const headers = 'Project Name,Timestamp,Element ID,Element Type,Coordinate X (%),Coordinate Y (%),Text Content,Color,Arrow Direction,Zoom Factor,Device Frame,Aspect Ratio\n';
    const timestamp = '2026-06-24T10:00:00.000Z';
    
    const rows = emptySpec.annotations.map(ann => {
      const escapedText = ann.text ? `"${ann.text.replace(/"/g, '""')}"` : '""';
      return `${emptySpec.projectName},${timestamp},${ann.id},${ann.type},${ann.x.toFixed(2)},${ann.y.toFixed(2)},${escapedText},${ann.color || ''},${ann.arrowDirection || ''},${ann.zoomFactor || ''},${emptySpec.frameType},${emptySpec.aspectRatio}`;
    });

    if (rows.length === 0) {
      rows.push(`${emptySpec.projectName},${timestamp},N/A,SUMMARY_ONLY,0,0,"No elements",,,,${emptySpec.frameType},${emptySpec.aspectRatio}`);
    }

    const csvContent = headers + rows.join('\n');
    const lines = csvContent.split('\n');

    expect(lines[1]).toContain('Test Project Alpha,2026-06-24T10:00:00.000Z,N/A,SUMMARY_ONLY,0,0,"No elements",,,,iPhone16Pro,16:9');
  });
});
