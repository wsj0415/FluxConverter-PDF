import React from 'react';
import { ProcessedPage } from '../types';
import { AlertOctagon, RefreshCw, Loader2, Check } from 'lucide-react';

interface PreviewGalleryProps {
  pages: ProcessedPage[];
  targetPageCount: number;
  onRetry: (pageNumber: number) => void;
  selectedPages: Set<number>;
  onToggleSelection: (pageNumber: number) => void;
}

export const PreviewGallery: React.FC<PreviewGalleryProps> = ({ 
  pages, 
  targetPageCount, 
  onRetry,
  selectedPages,
  onToggleSelection
}) => {
  // Create an array of placeholders for pages not yet processed
  const skeletons = Array.from({ length: Math.max(0, targetPageCount - pages.length) });

  return (
    <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
        {pages.map((page) => {
          const isSelected = selectedPages.has(page.pageNumber);
          const isInteractive = page.status === 'completed';

          return (
            <div 
              key={page.pageNumber} 
              onClick={() => isInteractive && onToggleSelection(page.pageNumber)}
              className={`
                group relative aspect-[3/4] rounded-lg bg-white dark:bg-charcoal border overflow-hidden transition-all duration-200 select-none shadow-sm
                ${isInteractive ? 'cursor-pointer' : ''}
                ${page.status === 'error' ? 'border-red-500/30' : 
                  isSelected ? 'border-amber-500 ring-1 ring-amber-500/50 shadow-md' : 'border-gray-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-white/30 opacity-90 dark:opacity-60 hover:opacity-100'}
              `}
            >
              {page.status === 'processing' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-black/20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                  <span className="text-xs font-mono text-amber-500">PROCESSING</span>
                </div>
              ) : page.status === 'error' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 p-3 text-center">
                  <AlertOctagon className="text-red-500 mb-2 w-8 h-8" />
                  <span className="text-[10px] text-red-400 font-mono mb-3 leading-tight break-words w-full px-1">
                    {page.errorMessage || 'RENDER_FAIL'}
                  </span>
                  <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry(page.pageNumber);
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-500/20 transition-all hover:scale-105 flex items-center gap-1.5 font-bold"
                  >
                      <RefreshCw size={12} /> RETRY
                  </button>
                </div>
              ) : (
                <>
                  <img 
                    src={page.previewUrl} 
                    alt={`Page ${page.pageNumber}`} 
                    className="w-full h-full object-contain p-2 bg-white dark:bg-transparent"
                  />
                  
                  {/* Selection Indicator */}
                  <div className={`
                    absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg
                    ${isSelected ? 'bg-amber-500 text-black scale-100' : 'bg-gray-200 dark:bg-black/50 border border-white/20 text-transparent scale-90 group-hover:scale-100'}
                  `}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                </>
              )}

              <div className={`absolute bottom-0 inset-x-0 backdrop-blur-sm p-2 text-center border-t transition-colors ${
                isSelected ? 'bg-amber-500/10 border-amber-500/20' : 
                page.status === 'error' ? 'bg-red-100 dark:bg-red-950/50 border-red-500/20' : 'bg-white/90 dark:bg-black/60 border-gray-100 dark:border-white/5'
              }`}>
                <span className={`text-xs font-mono ${
                  page.status === 'error' ? 'text-red-500 dark:text-red-400' : 
                  isSelected ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-500'
                }`}>
                  PAGE {page.pageNumber}
                </span>
              </div>
            </div>
          );
        })}

        {skeletons.map((_, i) => (
          <div 
            key={`skel-${i}`} 
            className="aspect-[3/4] rounded-lg bg-gray-100 dark:bg-charcoal/50 border border-gray-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 dark:via-white/5 to-transparent animate-scan opacity-50 dark:opacity-20" />
             <span className="font-mono text-xs text-gray-400 dark:text-gray-700">Waiting...</span>
          </div>
        ))}
      </div>
    </div>
  );
};