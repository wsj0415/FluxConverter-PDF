import React from 'react';
import { ImageFormat, ConversionSettings } from '../types';
import { Settings, Sliders, Type, Maximize } from 'lucide-react';

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
    <div className="glass-panel p-6 rounded-xl space-y-6 border-l-4 border-amber-500 transition-all duration-300">
      <div className="flex items-center gap-2 text-amber-500 mb-4">
        <Settings size={20} />
        <h3 className="font-bold uppercase tracking-wider text-sm">Output Configuration</h3>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-gray-400 text-xs uppercase font-mono">
          <Type size={14} /> Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(ImageFormat).map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleChange('format', fmt)}
              disabled={disabled}
              className={`
                px-3 py-2 rounded text-sm font-mono transition-all duration-200 border
                ${settings.format === fmt 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                  : 'bg-gray-100 dark:bg-charcoal border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-gray-300'}
              `}
            >
              {fmt.split('/')[1].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-mono text-gray-400">
          <label className="flex items-center gap-2 uppercase">
            <Sliders size={14} /> Quality
          </label>
          <span className="text-amber-500 font-bold">{Math.round(settings.quality * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={settings.quality}
          disabled={disabled}
          onChange={(e) => handleChange('quality', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-charcoal rounded-lg appearance-none cursor-pointer accent-amber-500 border border-gray-300 dark:border-white/10"
        />
      </div>

      {/* Scale/Resolution */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-mono text-gray-400">
          <label className="flex items-center gap-2 uppercase">
            <Maximize size={14} /> Density (DPI)
          </label>
          <span className="text-amber-500 font-bold">{settings.scale}x</span>
        </div>
        <div className="flex justify-between gap-2">
           {[1, 1.5, 2, 3].map((val) => (
             <button
                key={val}
                disabled={disabled}
                onClick={() => handleChange('scale', val)}
                className={`
                  flex-1 py-1 text-xs font-mono border rounded transition-all
                  ${settings.scale === val
                    ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-500/10'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 bg-transparent'}
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