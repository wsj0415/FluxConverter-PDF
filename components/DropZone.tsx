import React, { useCallback, useState } from 'react';
import { Upload, FileType, AlertCircle } from 'lucide-react';

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
      setError('Invalid file type. Please upload a PDF.');
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
    // Reset value to allow selecting the same file again if needed
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden group rounded-2xl border-2 border-dashed transition-all duration-300 w-full min-h-[300px] flex flex-col items-center justify-center p-8
        ${isDragOver 
          ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.1)] scale-[1.01]' 
          : 'border-white/10 bg-charcoal/50 hover:border-white/20 hover:bg-charcoal'}
        ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer z-50 h-full w-full"
        disabled={isLoading}
      />
      
      {/* Background Grid Animation */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      
      <div className="z-20 flex flex-col items-center space-y-6 text-center pointer-events-none">
        <div className={`
          p-6 rounded-full bg-graphite border border-white/5 transition-transform duration-500
          ${isDragOver ? 'scale-110 border-amber-500/50' : ''}
        `}>
          <Upload 
            size={40} 
            className={`${isDragOver ? 'text-amber-500' : 'text-gray-500'} transition-colors duration-300`} 
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-200">
            {isDragOver ? "Drop Flux Capacitor Here" : "Upload PDF Document"}
          </h3>
          <p className="text-gray-500 text-sm max-w-xs font-mono">
            Drag & drop or click to browse. <br/>Supports PDF files up to 50MB.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 animate-pulse-fast">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};