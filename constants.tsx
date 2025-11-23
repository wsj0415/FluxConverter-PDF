import React from 'react';

// Using direct SVG paths for a robust icon set without external dependencies if needed, 
// but using Lucide React is cleaner in the components.
// We will define functional constants here.

export const MAX_FILE_SIZE_MB = 50;
export const SUPPORTED_MIME_TYPES = ['application/pdf'];

export const DEFAULT_SETTINGS = {
  format: 'image/jpeg',
  quality: 0.8,
  scale: 1.5,
};

// Use the ESM worker version (.mjs) which is compatible with dynamic imports used by PDF.js v5+
export const WORKER_SRC = 'https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.mjs';