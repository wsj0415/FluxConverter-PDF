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

export interface ProcessedPage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface PdfDocumentInfo {
  name: string;
  size: number;
  totalPages: number;
  originalFile: File;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  CONVERTING = 'CONVERTING',
  COMPLETED = 'COMPLETED'
}