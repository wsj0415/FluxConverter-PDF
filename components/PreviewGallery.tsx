import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ThumbnailData } from '../types';
import { renderThumbnail } from '../services/pdfService';
import { CheckCircle2, Circle } from 'lucide-react';

// --- Internal Component: Lazy Page Card ---
interface LazyPageCardProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onToggle: (n: number) => void;
}

const LazyPageCard: React.FC<LazyPageCardProps> = ({ pdfDoc, pageNumber, isSelected, onToggle }) => {
  const [data, setData] = useState<ThumbnailData>({ 
    pageNumber, url: null, width: 0, height: 0, status: 'idle' 
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Only fetch if idle
    const loadThumbnail = async () => {
      setData(d => ({ ...d, status: 'loading' }));
      const result = await renderThumbnail(pdfDoc, pageNumber);
      setData(result);
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && data.status === 'idle') {
        loadThumbnail();
        observerRef.current?.disconnect(); // Once loaded, no need to observe
      }
    }, { rootMargin: '200px' }); // Preload 200px before appearing

    if (cardRef.current) {
      observerRef.current.observe(cardRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [pdfDoc, pageNumber, data.status]);

  return (
    <div 
      ref={cardRef}
      onClick={() => onToggle(pageNumber)}
      className={`
        relative aspect-[3/4] rounded bg-white dark:bg-slate border cursor-pointer group transition-all duration-200
        ${isSelected 
          ? 'border-accent ring-1 ring-accent shadow-md' 
          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}
      `}
    >
      {/* Status Overlay */}
      <div className={`
        absolute top-3 right-3 z-10 rounded-full bg-white dark:bg-charcoal transition-transform duration-200
        ${isSelected ? 'text-accent scale-100' : 'text-gray-300 dark:text-gray-600 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'}
      `}>
        {isSelected ? <CheckCircle2 size={22} fill="currentColor" className="text-white" /> : <Circle size={22} />}
      </div>

      {/* Image Content */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden p-3">
        {data.status === 'success' && data.url ? (
          <img 
            src={data.url} 
            alt={`Page ${pageNumber}`} 
            className="w-full h-full object-contain shadow-sm"
            loading="lazy"
          />
        ) : data.status === 'loading' ? (
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/10 border-t-accent rounded-full animate-spin" />
        ) : (
          <span className="text-xs text-gray-400 font-mono">{pageNumber}</span>
        )}
      </div>

      {/* Page Number Footer */}
      <div className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-center border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-[10px] font-mono text-gray-500">
        Page {pageNumber}
      </div>
    </div>
  );
};

// --- Main Gallery Component ---
interface PreviewGalleryProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  selectedPages: Set<number>;
  onToggleSelection: (pageNumber: number) => void;
}

export const PreviewGallery: React.FC<PreviewGalleryProps> = ({ 
  pdfDoc, 
  selectedPages, 
  onToggleSelection 
}) => {
  // Create an array of page numbers [1, 2, ..., N]
  const pageNumbers = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

  return (
    <div className="h-full w-full overflow-y-auto px-1 py-1 custom-scrollbar">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4">
        {pageNumbers.map((num) => (
          <LazyPageCard
            key={num}
            pdfDoc={pdfDoc}
            pageNumber={num}
            isSelected={selectedPages.has(num)}
            onToggle={onToggleSelection}
          />
        ))}
      </div>
    </div>
  );
};