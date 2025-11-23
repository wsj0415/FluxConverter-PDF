import React from 'react';
import { ImageFormat, ConversionSettings } from '../types';
import { Sliders, Maximize, FileType } from 'lucide-react';

interface SettingsPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (newSettings: ConversionSettings) => void;
  disabled: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  disabled
}) => {
  const handleChange = (key: keyof ConversionSettings, value: string | number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white dark:bg-graphite rounded-lg border border-gray-200 dark:border-white/5 p-6 space-y-8 shadow-sm">
      
      {/* Format Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <FileType size={14} /> Output Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(ImageFormat).map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleChange('format', fmt)}
              disabled={disabled}
              className={`
                px-3 py-2.5 rounded text-xs font-medium transition-all duration-200 border
                ${settings.format === fmt 
                  ? 'bg-accent text-white border-accent shadow-sm' 
                  : 'bg-gray-50 dark:bg-slate border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}
              `}
            >
              {fmt.split('/')[1].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <Sliders size={14} /> Compression
          </label>
          <span className="text-xs font-mono bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-700 dark:text-gray-200">
            {Math.round(settings.quality * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={settings.quality}
          disabled={disabled}
          onChange={(e) => handleChange('quality', parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accent-hover"
        />
      </div>

      {/* Scale/Resolution */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <Maximize size={14} /> Resolution Density
          </label>
          <span className="text-xs font-mono bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-700 dark:text-gray-200">
            {settings.scale}x
          </span>
        </div>
        <div className="flex justify-between gap-2">
           {[1, 1.5, 2, 3].map((val) => (
             <button
                key={val}
                disabled={disabled}
                onClick={() => handleChange('scale', val)}
                className={`
                  flex-1 py-1.5 text-xs font-medium rounded transition-colors
                  ${settings.scale === val
                    ? 'text-accent font-bold border-b-2 border-accent bg-accent-subtle'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}
                `}
             >
               {val}x
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};