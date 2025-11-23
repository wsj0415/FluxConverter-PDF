export enum ImageFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp'
}

export interface ConversionSettings {
  format: ImageFormat;
  quality: number; // 0.1 to 1.0
  scale: number; // 1 to 3
}

export interface ThumbnailData {
  pageNumber: number;
  url: string | null;
  width: number;
  height: number;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export interface ProcessedExport {
  pageNumber: number;
  blob: Blob;
}

export interface PdfDocumentInfo {
  name: string;
  size: number;
  totalPages: number;
  originalFile: File;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING_PDF = 'LOADING_PDF',
  PREVIEW = 'PREVIEW',     // User selects pages here
  EXPORTING = 'EXPORTING', // Batch conversion happening
  COMPLETED = 'COMPLETED'  // Download ready
}