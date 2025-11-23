import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { GoogleGenAI } from "@google/genai";
import { 
  Zap, 
  Download, 
  Trash2, 
  FileText, 
  Cpu, 
  Loader,
  Wand2,
  CheckSquare,
  Square,
  Sun,
  Moon
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

import { DropZone } from './components/DropZone';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewGallery } from './components/PreviewGallery';
import { loadPdfDocument, renderPageToImage } from './services/pdfService';
import { generateSmartFilename } from './services/geminiService';
import { 
  AppState, 
  PdfDocumentInfo, 
  ProcessedPage, 
  ConversionSettings
} from './types';
import { DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [pdfInfo, setPdfInfo] = useState<PdfDocumentInfo | null>(null);
  const [pages, setPages] = useState<ProcessedPage[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [isAiRenaming, setIsAiRenaming] = useState(false);
  const [smartName, setSmartName] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleFileAccepted = async (file: File) => {
    setAppState(AppState.ANALYZING);
    try {
      const doc = await loadPdfDocument(file);
      setPdfDoc(doc);
      setPdfInfo({
        name: file.name.replace('.pdf', ''),
        size: file.size,
        totalPages: doc.numPages,
        originalFile: file
      });
      setAppState(AppState.READY);
      setPages([]);
      setSelectedPages(new Set());
      setProgress(0);
      setSmartName('');
    } catch (error) {
      console.error("Failed to load PDF", error);
      setAppState(AppState.IDLE);
      alert("Failed to load PDF. Is it a valid file?");
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const completedPages = pages
      .filter(p => p.status === 'completed')
      .map(p => p.pageNumber);
    setSelectedPages(new Set(completedPages));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const startConversion = async () => {
    if (!pdfDoc || !pdfInfo) return;
    
    setAppState(AppState.CONVERTING);
    setPages([]);
    setSelectedPages(new Set());
    setProgress(0);
    abortControllerRef.current = new AbortController();

    const newPages: ProcessedPage[] = [];

    // Process sequentially to manage memory
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      if (abortControllerRef.current.signal.aborted) break;

      const pageResult = await renderPageToImage(
        pdfDoc,
        i,
        settings.scale,
        settings.format,
        settings.quality
      );

      newPages.push(pageResult);
      setPages((prev) => [...prev, pageResult]);
      
      // Auto-select successfully converted pages
      if (pageResult.status === 'completed') {
        setSelectedPages(prev => new Set(prev).add(pageResult.pageNumber));
      }

      setProgress(Math.round((i / pdfDoc.numPages) * 100));
    }

    setAppState(AppState.COMPLETED);
  };

  const retryPage = async (pageNumber: number) => {
    if (!pdfDoc) return;

    // Set page status to processing
    setPages((currentPages) => 
      currentPages.map((p) => 
        p.pageNumber === pageNumber 
          ? { ...p, status: 'processing', errorMessage: undefined } 
          : p
      )
    );

    try {
      const pageResult = await renderPageToImage(
        pdfDoc,
        pageNumber,
        settings.scale,
        settings.format,
        settings.quality
      );

      setPages((currentPages) => 
        currentPages.map((p) => 
          p.pageNumber === pageNumber ? pageResult : p
        )
      );

      if (pageResult.status === 'completed') {
        setSelectedPages(prev => new Set(prev).add(pageNumber));
      }
    } catch (error) {
      console.error("Retry failed at app level", error);
      setPages((currentPages) => 
        currentPages.map((p) => 
          p.pageNumber === pageNumber 
            ? { ...p, status: 'error', errorMessage: 'Retry failed unexpectedly' } 
            : p
        )
      );
    }
  };

  const handleDownload = async () => {
    if (pages.length === 0 || selectedPages.size === 0) return;

    const zip = new JSZip();
    const folderName = smartName || pdfInfo?.name || 'converted_images';
    const imgFolder = zip.folder(folderName);
    
    const ext = settings.format.split('/')[1];

    pages.forEach((page) => {
      if (page.status === 'completed' && selectedPages.has(page.pageNumber)) {
        const fileName = `page_${String(page.pageNumber).padStart(3, '0')}.${ext}`;
        if (imgFolder) imgFolder.file(fileName, page.blob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${folderName}.zip`);
  };

  const handleAiRename = async () => {
    if (!pages[0] || !pages[0].blob) {
      alert("Please convert the first page first, or start conversion.");
      return;
    }
    
    let activeKey = apiKey;
    if (!activeKey && typeof window !== 'undefined' && (window as any).aistudio) {
         try {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if(!hasKey) {
                 await (window as any).aistudio.openSelectKey();
             }
         } catch(e) {
             console.error(e);
         }
    }

    if (!activeKey) {
      if (!process.env.API_KEY) {
         console.warn("No API KEY found in environment.");
      }
      activeKey = process.env.API_KEY || '';
    }

    setIsAiRenaming(true);
    const newName = await generateSmartFilename(pages[0].blob, activeKey);
    if (newName) {
      setSmartName(newName);
    }
    setIsAiRenaming(false);
  };

  const reset = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setAppState(AppState.IDLE);
    setPdfInfo(null);
    setPdfDoc(null);
    setPages([]);
    setSelectedPages(new Set());
    setProgress(0);
    setSmartName('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-obsidian text-gray-900 dark:text-gray-200 selection:bg-amber-500/30 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-white/5 bg-white/70 dark:bg-charcoal/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Zap className="text-black fill-current" size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-wider text-gray-800 dark:text-gray-100">
            FLUX<span className="text-amber-500">CONVERTER</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-mono text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Cpu size={14} /> V1.0.5
            </span>
            <div className="h-4 w-[1px] bg-gray-300 dark:bg-white/10"></div>
            <span className={apiKey || process.env.API_KEY ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-gray-700"}>
              AI LINKED
            </span>
          </div>
          
          <div className="h-6 w-[1px] bg-gray-300 dark:bg-white/10"></div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Input */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Status Card */}
          {appState !== AppState.IDLE && pdfInfo && (
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-lg">
                  <FileText className="text-amber-500" size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate text-sm text-gray-800 dark:text-gray-200">{pdfInfo.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {pdfInfo.totalPages} PAGES • {(pdfInfo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-gray-400"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          {/* Upload Area (Only visible when IDLE or ANALYZING) */}
          {(appState === AppState.IDLE || appState === AppState.ANALYZING) && (
            <DropZone 
              onFileAccepted={handleFileAccepted} 
              isLoading={appState === AppState.ANALYZING} 
            />
          )}

          {/* Settings (Visible when Ready or Converting) */}
          {appState !== AppState.IDLE && (
            <SettingsPanel 
              settings={settings} 
              onSettingsChange={setSettings}
              disabled={appState === AppState.CONVERTING}
            />
          )}

          {/* Action Button */}
          {appState === AppState.READY && (
            <button
              onClick={startConversion}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Zap className="fill-black" /> INITIATE SEQUENCE
            </button>
          )}

           {/* Progress Indicator */}
           {appState === AppState.CONVERTING && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-amber-500">
                <span>PROCESSING...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-charcoal rounded-full overflow-hidden border border-gray-300 dark:border-white/5">
                <div 
                  className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download & AI Actions */}
          {appState === AppState.COMPLETED && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="glass-panel p-4 rounded-xl space-y-3">
                 <label className="text-xs font-mono text-gray-400 uppercase">Archive Name</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={smartName || pdfInfo?.name || ''}
                      onChange={(e) => setSmartName(e.target.value)}
                      className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 w-full focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    <button 
                      onClick={handleAiRename}
                      disabled={isAiRenaming || (!process.env.API_KEY && !apiKey)}
                      className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 p-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                      title="AI Smart Rename (Requires API Key)"
                    >
                      {isAiRenaming ? <Loader className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    </button>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownload}
                  disabled={selectedPages.size === 0}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download size={20} /> 
                  {selectedPages.size > 0 ? `DOWNLOAD ${selectedPages.size} PAGES` : 'SELECT PAGES TO DOWNLOAD'}
                </button>
                {selectedPages.size < pages.length && (
                   <p className="text-center text-xs font-mono text-amber-600 dark:text-amber-500/80">
                      {pages.length - selectedPages.size} pages excluded
                   </p>
                )}
              </div>
              
              <button
                onClick={reset}
                className="w-full py-3 bg-transparent border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 font-mono text-sm rounded-xl transition-all"
              >
                RESET SYSTEM
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Preview Grid */}
        <div className="lg:col-span-8 bg-gray-200/50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-col h-[600px] lg:h-auto min-h-[500px] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-4">
                <h2 className="text-sm font-mono text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  VISUAL OUTPUT MATRIX
                </h2>
                {appState === AppState.COMPLETED && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-500 bg-gray-300/50 dark:bg-white/5 px-2 py-1 rounded transition-colors">
                      SELECTED: <span className="text-amber-600 dark:text-amber-500">{selectedPages.size}</span> / {pages.length}
                    </span>
                    <div className="h-4 w-[1px] bg-gray-300 dark:bg-white/10"></div>
                    <button 
                      onClick={handleSelectAll}
                      className="flex items-center gap-1 text-[10px] font-mono text-gray-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase"
                      title="Select All"
                    >
                      <CheckSquare size={12} /> All
                    </button>
                    <button 
                      onClick={handleDeselectAll}
                      className="flex items-center gap-1 text-[10px] font-mono text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors uppercase"
                      title="Deselect All"
                    >
                      <Square size={12} /> None
                    </button>
                  </div>
                )}
             </div>
             <div className="text-xs font-mono text-gray-400 dark:text-gray-600 hidden md:block">
               RENDER_ENGINE: PDF.JS / CANVAS
             </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative rounded-xl bg-gray-100 dark:bg-graphite/30 border border-gray-200 dark:border-white/5 p-4 transition-colors duration-300">
             {appState === AppState.IDLE ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-gray-400 dark:text-gray-600 transition-colors">
                   <div className="w-16 h-16 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center opacity-20">
                      <div className="w-12 h-12 border border-gray-300 dark:border-gray-700 rounded bg-gray-200 dark:bg-gray-800"></div>
                   </div>
                   <p className="font-mono text-xs tracking-widest opacity-50">NO SIGNAL INPUT</p>
                </div>
             ) : (
                <PreviewGallery 
                  pages={pages} 
                  targetPageCount={pdfInfo?.totalPages || 0} 
                  onRetry={retryPage}
                  selectedPages={selectedPages}
                  onToggleSelection={togglePageSelection}
                />
             )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;