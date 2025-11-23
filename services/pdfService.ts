import * as pdfjsLib from 'pdfjs-dist';
import { WORKER_SRC } from '../constants';
import { ImageFormat, ThumbnailData } from '../types';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

export const loadPdfDocument = async (file: File): Promise<pdfjsLib.PDFDocumentProxy> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  return loadingTask.promise;
};

/**
 * Renders a small, low-quality thumbnail for preview purposes.
 * Designed for speed and low memory usage.
 */
export const renderThumbnail = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
): Promise<ThumbnailData> => {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    // Fixed scale for thumbnails to keep memory low (approx 300px width)
    const viewport = page.getViewport({ scale: 0.5 }); 

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) throw new Error('Canvas context not available');

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas, // Fix: PDF.js types now require passing the canvas element explicitly
    }).promise;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            pageNumber,
            url: URL.createObjectURL(blob),
            width: viewport.width,
            height: viewport.height,
            status: 'success'
          });
        } else {
          resolve({ pageNumber, url: null, width: 0, height: 0, status: 'error' });
        }
      }, 'image/jpeg', 0.5); // Low quality JPEG for thumbs
    });
  } catch (error) {
    console.error(`Thumb render error page ${pageNumber}`, error);
    return { pageNumber, url: null, width: 0, height: 0, status: 'error' };
  }
};

/**
 * Renders the final high-quality image for export.
 */
export const renderPageToImage = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  format: ImageFormat,
  quality: number
): Promise<{ blob: Blob | null, error?: string }> => {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: format !== ImageFormat.JPEG }); // Optimisation
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) throw new Error('Canvas context failure');

    // Handle white background for JPEGs (PDFs are transparent by default)
    if (format === ImageFormat.JPEG) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas, // Fix: PDF.js types now require passing the canvas element explicitly
    }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve({ blob }),
        format,
        quality
      );
    });
  } catch (error) {
    return { 
      blob: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};