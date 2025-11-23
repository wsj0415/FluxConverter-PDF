import * as pdfjsLib from 'pdfjs-dist';
import { WORKER_SRC } from '../constants';
import { ProcessedPage, ImageFormat } from '../types';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

export const loadPdfDocument = async (file: File): Promise<pdfjsLib.PDFDocumentProxy> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  return loadingTask.promise;
};

export const renderPageToImage = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  format: ImageFormat,
  quality: number
): Promise<ProcessedPage> => {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) throw new Error('Canvas context not available');

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            resolve({
              pageNumber,
              blob,
              width: viewport.width,
              height: viewport.height,
              previewUrl,
              status: 'completed',
            });
          } else {
            reject(new Error('Blob creation failed'));
          }
        },
        format,
        quality
      );
    });
  } catch (error) {
    console.error(`Error rendering page ${pageNumber}`, error);
    return {
      pageNumber,
      blob: new Blob(),
      width: 0,
      height: 0,
      previewUrl: '',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown rendering error',
    };
  }
};