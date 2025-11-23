import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  FileText, 
  Trash2, 
  CheckSquare, 
  Square, 
  Download, 
  Sun, 
  Moon,
  ArrowLeft,
  Loader2
} from 'lucide-react';

import { DropZone } from './components/DropZone';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewGallery } from './components/PreviewGallery';
import { loadPdfDocument, renderPageToImage } from './services/pdfService';
import { AppState, PdfDocumentInfo, ConversionSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [pdfInfo, setPdfInfo] = useState<PdfDocumentInfo | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  
  // Progress tracking for Final Export
  const [exportProgress, setExportProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Handlers
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleFileAccepted = async (file: File) => {
    setAppState(AppState.LOADING_PDF);
    try {
      const doc = await loadPdfDocument(file);
      setPdfDoc(doc);
      setPdfInfo({
        name: file.name.replace('.pdf', ''),
        size: file.size,
        totalPages: doc.numPages,
        originalFile: file
      });
      
      // Default: Select all pages initially? Or none? 
      // Professional tools usually default to "All" or let user decide. 
      // Let's start with NONE to encourage selection, OR ALL if < 10 pages.
      // Let's default to ALL for convenience.
      const allPages = new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1));
      setSelectedPages(allPages);
      
      setAppState(AppState.PREVIEW);
    } catch (error) {
      console.error(error);
      alert("Error parsing PDF. Please check if the file is valid.");
      setAppState(AppState.IDLE);
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) newSet.delete(pageNumber);
      else newSet.add(pageNumber);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!pdfDoc) return;
    const all = new Set(Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1));
    setSelectedPages(all);
  };

  const handleSelectNone = () => {
    setSelectedPages(new Set());
  };

  const startExport = async () => {
    if (!pdfDoc || !pdfInfo || selectedPages.size === 0) return;

    setAppState(AppState.EXPORTING);
    setExportProgress(0);

    const zip = new JSZip();
    const folderName = `${pdfInfo.name}_exported`;
    const imgFolder = zip.folder(folderName);
    const ext = settings.format.split('/')[1];
    
    // Sort pages to ensure order
    const pagesToExport = Array.from(selectedPages).sort((a, b) => a - b);
    let completed = 0;

    try {
      for (const pageNum of pagesToExport) {
        const { blob, error } = await renderPageToImage(
          pdfDoc,
          pageNum,
          settings.scale,
          settings.format,
          settings.quality
        );

        if (blob && imgFolder) {
          const fileName = `page_${String(pageNum).padStart(3, '0')}.${ext}`;
          imgFolder.file(fileName, blob);
        } else {
          console.warn(`Failed to export page ${pageNum}: ${error}`);
        }

        completed++;
        setExportProgress(Math.round((completed / pagesToExport.length) * 100));
      }

      // Generate Zip
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folderName}.zip`);
      setAppState(AppState.COMPLETED);

    } catch (err) {
      console.error(err);
      alert("Export failed.");
      setAppState(AppState.PREVIEW); // Return to preview on error
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setPdfInfo(null);
    setPdfDoc(null);
    setSelectedPages(new Set());
    setExportProgress(0);
  };

  // --- Renders ---

  return (
    <div className="h-screen w-full bg-paper dark:bg-charcoal text-ink dark:text-gray-100 flex flex-col overflow-hidden">
      
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-graphite z-20 shrink-0">
        <div className="flex items-center gap-4">
           {appState !== AppState.IDLE && (
             <button onClick={reset} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
               <ArrowLeft size={20} />
             </button>
           )}
           <h1 className="font-semibold tracking-tight text-lg">FluxConverter <span className="text-gray-400 font-light">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Settings) - Only visible when PDF Loaded */}
        {appState !== AppState.IDLE && pdfInfo && (
          <aside className="w-80 bg-gray-50 dark:bg-graphite/50 border-r border-gray-200 dark:border-white/5 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 z-10">
            
            {/* File Info */}
            <div className="bg-white dark:bg-graphite p-4 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
               <div className="flex items-start gap-3">
                 <div className="bg-gray-100 dark:bg-white/10 p-2 rounded">
                   <FileText size={20} className="text-gray-600 dark:text-gray-300"/>
                 </div>
                 <div className="overflow-hidden">
                   <p className="font-medium text-sm truncate" title={pdfInfo.name}>{pdfInfo.name}</p>
                   <p className="text-xs text-gray-500 mt-1">{pdfInfo.totalPages} pages • {(pdfInfo.size / 1024 / 1024).toFixed(2)} MB</p>
                 </div>
               </div>
               <button onClick={reset} className="mt-3 text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium">
                 <Trash2 size={12} /> REMOVE FILE
               </button>
            </div>

            <SettingsPanel 
              settings={settings}
              onSettingsChange={setSettings}
              disabled={appState === AppState.EXPORTING}
            />

            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-white/10">
               {appState === AppState.EXPORTING ? (
                 <div className="space-y-2">
                   <div className="flex justify-between text-xs font-medium">
                     <span>Exporting...</span>
                     <span>{exportProgress}%</span>
                   </div>
                   <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-accent transition-all duration-300" style={{ width: `${exportProgress}%`}} />
                   </div>
                 </div>
               ) : appState === AppState.COMPLETED ? (
                 <div className="space-y-3">
                    <div className="text-center text-green-500 text-sm font-medium mb-2">Export Successful</div>
                    <button 
                      onClick={() => setAppState(AppState.PREVIEW)}
                      className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      New Export
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={startExport}
                   disabled={selectedPages.size === 0}
                   className="w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-gray-300 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm shadow-soft transition-all flex items-center justify-center gap-2"
                 >
                   {selectedPages.size === 0 ? (
                     "Select Pages"
                   ) : (
                     <>
                       <Download size={16} /> Export {selectedPages.size} Images
                     </>
                   )}
                 </button>
               )}
            </div>
          </aside>
        )}

        {/* Center Canvas (Preview) */}
        <section className="flex-1 relative bg-paper dark:bg-charcoal flex flex-col">
          
          {appState === AppState.IDLE ? (
             <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                   <DropZone onFileAccepted={handleFileAccepted} isLoading={false} />
                </div>
             </div>
          ) : appState === AppState.LOADING_PDF ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
               <Loader2 className="animate-spin text-accent" size={40} />
               <p className="text-sm font-medium">Analyzing Document Structure...</p>
             </div>
          ) : (
            // PREVIEW MODE
            <>
              {/* Toolbar */}
              <div className="h-12 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 bg-white/50 dark:bg-graphite/30 backdrop-blur-sm shrink-0">
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selection:</span>
                   <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">
                     {selectedPages.size} / {pdfInfo?.totalPages}
                   </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleSelectAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors">
                      <CheckSquare size={14} /> Select All
                    </button>
                    <button onClick={handleSelectNone} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors">
                      <Square size={14} /> None
                    </button>
                 </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-hidden relative">
                 {pdfDoc && (
                   <PreviewGallery 
                      pdfDoc={pdfDoc}
                      selectedPages={selectedPages}
                      onToggleSelection={togglePageSelection}
                   />
                 )}
              </div>
            </>
          )}

        </section>
      </main>
    </div>
  );
};

export default App;