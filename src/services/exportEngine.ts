import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Paths } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { haptics } from '@/services/haptics';
import { AnnotationElement } from '@/store/canvasStore';

export interface ExportSpecData {
  projectName: string;
  aspectRatio: string;
  frameType: string;
  frameColor: string;
  padding: number;
  shadowIntensity: number;
  rotation3D: number;
  gradientId: string;
  annotations: AnnotationElement[];
  imageUri: string | null;
  beforeImageUri: string | null;
  isSplitEnabled: boolean;
}

class ExportEngineService {
  
  // 1. Export PNG to Gallery or Share
  async exportPNG(viewRef: any, shareImmediately: boolean = false): Promise<string | null> {
    try {
      haptics.lightImpact();
      
      // Capture the React Native View Ref
      const localUri = await captureRef(viewRef.current || viewRef, {
        format: 'png',
        quality: 1.0,
      });

      if (shareImmediately) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri);
          haptics.success();
          return localUri;
        } else {
          throw new Error('Sharing is not available on this platform');
        }
      }

      // Save to library on native devices
      if (Platform.OS !== 'web') {
        const MediaLibrary = require('expo-media-library');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please allow gallery permissions to save images.');
          return null;
        }

        await MediaLibrary.Asset.create(localUri);
        haptics.success();
        Alert.alert('Saved!', 'Beautified mockup saved to your Photos.');
      } else {
        // Web download fallback
        Alert.alert('Success', 'PNG generated successfully!');
      }

      return localUri;
    } catch (error: any) {
      haptics.error();
      Alert.alert('Export Failed', error.message || 'Could not compile PNG.');
      return null;
    }
  }

  // 2. Generate and Share Multi-Page PDF Pitch Deck
  async exportPDF(spec: ExportSpecData): Promise<string | null> {
    try {
      haptics.lightImpact();
      
      // Generate clean HTML template
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Design Presentation - ${spec.projectName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #121212;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #E4E8F0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 26px;
              font-weight: bold;
              margin: 0;
              color: #007AFF;
            }
            .subtitle {
              font-size: 14px;
              color: #60646C;
              margin-top: 5px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
            }
            .spec-card {
              background: #F5F7FA;
              border-radius: 8px;
              padding: 20px;
              border: 1px solid #E4E8F0;
            }
            .spec-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 12px;
              color: #1A1A1A;
            }
            .spec-item {
              font-size: 13px;
              margin-bottom: 6px;
              color: #4A4A4A;
            }
            .spec-label {
              font-weight: 600;
            }
            .image-container {
              text-align: center;
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .mockup-image {
              max-width: 80%;
              max-height: 500px;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
              border: 1px solid #ddd;
            }
            .annotations-list {
              margin-top: 30px;
            }
            .annotation-row {
              padding: 10px;
              border-bottom: 1px solid #E4E8F0;
              font-size: 13px;
            }
            .footer {
              margin-top: 80px;
              font-size: 11px;
              color: #B0B4BA;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${spec.projectName}</div>
            <div class="subtitle">MockupBuilder Design Deck Generated on ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="grid">
            <div class="spec-card">
              <div class="spec-title">Layout Specifications</div>
              <div class="spec-item"><span class="spec-label">Aspect Ratio:</span> ${spec.aspectRatio}</div>
              <div class="spec-item"><span class="spec-label">Device Bezel:</span> ${spec.frameType}</div>
              <div class="spec-item"><span class="spec-label">Bezel Color:</span> ${spec.frameColor}</div>
              <div class="spec-item"><span class="spec-label">Canvas Padding:</span> ${spec.padding}%</div>
              <div class="spec-item"><span class="spec-label">Rotation Angle:</span> ${spec.rotation3D}°</div>
              <div class="spec-item"><span class="spec-label">Background Gradient ID:</span> ${spec.gradientId}</div>
            </div>

            <div class="spec-card">
              <div class="spec-title">Changelog Elements</div>
              <div class="spec-item"><span class="spec-label">Split Slider Enabled:</span> ${spec.isSplitEnabled ? 'Yes' : 'No'}</div>
              <div class="spec-item"><span class="spec-label">Total Annotations:</span> ${spec.annotations.length}</div>
            </div>
          </div>

          ${spec.imageUri ? `
            <div class="image-container">
              <h2>Mockup Graphic Render</h2>
              <img src="${spec.imageUri}" class="mockup-image" />
            </div>
          ` : ''}

          ${spec.annotations.length > 0 ? `
            <div class="annotations-list">
              <h2>Overlay Logs & Annotations</h2>
              ${spec.annotations.map((ann, i) => `
                <div class="annotation-row">
                  <strong>[Element ${i + 1}]</strong> Type: ${ann.type} | Coordinates: (${ann.x.toFixed(1)}%, ${ann.y.toFixed(1)}%)
                  ${ann.text ? `<br/><em>Text: "${ann.text}"</em>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            Generated with MockupBuilder app. All Rights Reserved.
          </div>
        </body>
        </html>
      `;

      // Export using expo-print
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Share PDF file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        haptics.success();
        return uri;
      } else {
        throw new Error('Sharing is not available on this platform');
      }
    } catch (error: any) {
      haptics.error();
      Alert.alert('PDF Export Failed', error.message || 'Could not compile PDF.');
      return null;
    }
  }

  // 3. Compile and Share CSV Specification Log
  async exportCSV(spec: ExportSpecData): Promise<string | null> {
    try {
      haptics.lightImpact();

      // Compile CSV String
      const headers = 'Project Name,Timestamp,Element ID,Element Type,Coordinate X (%),Coordinate Y (%),Text Content,Color,Arrow Direction,Zoom Factor,Device Frame,Aspect Ratio\n';
      
      const timestamp = new Date().toISOString();
      const rows = spec.annotations.map(ann => {
        // Escape commas/quotes in text fields
        const escapedText = ann.text ? `"${ann.text.replace(/"/g, '""')}"` : '""';
        return `${spec.projectName},${timestamp},${ann.id},${ann.type},${ann.x.toFixed(2)},${ann.y.toFixed(2)},${escapedText},${ann.color || ''},${ann.arrowDirection || ''},${ann.zoomFactor || ''},${spec.frameType},${spec.aspectRatio}`;
      });

      // If no elements, add a summary row
      if (rows.length === 0) {
        rows.push(`${spec.projectName},${timestamp},N/A,SUMMARY_ONLY,0,0,"No elements",,,,${spec.frameType},${spec.aspectRatio}`);
      }

      const csvContent = headers + rows.join('\n');

      // Write file locally using expo-file-system
      const fileName = `${spec.projectName.replace(/\s+/g, '_')}_mockup_spec.csv`;
      const fileUri = Paths.document.uri + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share CSV File
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        haptics.success();
        return fileUri;
      } else {
        throw new Error('Sharing is not available on this platform');
      }
    } catch (error: any) {
      haptics.error();
      Alert.alert('CSV Export Failed', error.message || 'Could not compile CSV.');
      return null;
    }
  }

  // 4. Automatically Evict Cached Spec Files Older Than 7 Days
  async evictOldCachedFiles(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const docDir = Paths.document.uri;
      const cacheDir = FileSystem.cacheDirectory;
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const cleanFolder = async (folderUri: string) => {
        if (!folderUri) return;
        try {
          const files = await FileSystem.readDirectoryAsync(folderUri);
          for (const file of files) {
            // Target generated mockup logs and spec reports
            if (file.toLowerCase().includes('mockup') || file.endsWith('.csv') || file.endsWith('.pdf')) {
              const fileUri = folderUri + (folderUri.endsWith('/') ? '' : '/') + file;
              const info = await FileSystem.getInfoAsync(fileUri);
              if (info.exists && !info.isDirectory && info.modificationTime) {
                const age = now - (info.modificationTime * 1000);
                if (age > SEVEN_DAYS_MS) {
                  await FileSystem.deleteAsync(fileUri, { idempotent: true });
                  console.log(`Evicted old cache file: ${file}`);
                }
              }
            }
          }
        } catch (err) {
          console.warn(`Error reading folder ${folderUri}:`, err);
        }
      };

      await cleanFolder(docDir);
      if (cacheDir) {
        await cleanFolder(cacheDir);
      }
    } catch (error) {
      console.warn('Failed to evict old cache files:', error);
    }
  }
}

export const exportEngine = new ExportEngineService();
