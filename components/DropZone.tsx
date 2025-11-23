import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileAccepted, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Invalid format. Please upload a standard PDF document.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setError(null);
    onFileAccepted(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group rounded-lg border border-dashed transition-all duration-200 w-full min-h-[320px] flex flex-col items-center justify-center p-8
        ${isDragOver 
          ? 'border-accent bg-accent-subtle' 
          : 'border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-graphite hover:border-gray-400 dark:hover:border-white/20'}
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer z-50 h-full w-full"
        disabled={isLoading}
      />
      
      <div className="z-10 flex flex-col items-center space-y-6 text-center pointer-events-none">
        <div className={`
          p-5 rounded-full transition-all duration-300
          ${isDragOver ? 'bg-accent text-white shadow-lg' : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 shadow-sm border border-gray-100 dark:border-white/5'}
        `}>
          <UploadCloud size={32} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {isDragOver ? "Drop file to process" : "Select Document"}
          </h3>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Drag PDF here or click to browse.<br/>
            <span className="text-xs text-gray-400">Supported up to 50MB. Processed locally.</span>
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-xs font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded flex items-center gap-2">
            <FileType size={12} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};