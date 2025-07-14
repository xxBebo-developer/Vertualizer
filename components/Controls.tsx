
import React, { useState } from 'react';
import type { VisualizerSettings, VisualizerStyle, VideoResolution } from '../types.ts';
import { generateColorPalette } from '../services/geminiService.ts';
import * as Icon from './IconComponents.tsx';
import { resolutions } from '../types.ts';


interface ControlsProps {
  settings: VisualizerSettings;
  onSettingsChange: <K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSettings: React.Dispatch<React.SetStateAction<VisualizerSettings>>;
  isProcessing: boolean;
  recordedVideoUrl: string | null;
}

const visualizerOptions: { id: VisualizerStyle; label: string, icon: React.ReactNode }[] = [
    { id: 'bars', label: 'Bars', icon: <svg viewBox="0 0 24 24" className="w-full h-full"><rect x="2" y="10" width="3" height="12" fill="currentColor"/><rect x="7" y="4" width="3" height="18" fill="currentColor"/><rect x="12" y="8" width="3" height="14" fill="currentColor"/><rect x="17" y="12" width="3" height="10" fill="currentColor"/></svg> },
    { id: 'wave', label: 'Wave', icon: <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M2 12C2 12 5 4 12 12C19 20 22 12 22 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg> },
    { id: 'circle', label: 'Circle', icon: <svg viewBox="0 0 24 24" className="w-full h-full"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/></svg> },
    { id: 'particles', label: 'Particles', icon: <svg viewBox="0 0 24 24" className="w-full h-full"><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="18" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="18" r="1" fill="currentColor"/><circle cx="17" cy="17" r="1.4" fill="currentColor"/></svg> },
    { id: 'dual_bars', label: 'Dual Bars', icon: <svg viewBox="0 0 24 24" className="w-full h-full"><rect x="2" y="8" width="3" height="8" fill="currentColor"/><rect x="7" y="4" width="3" height="16" fill="currentColor"/><rect x="12" y="6" width="3" height="12" fill="currentColor"/><rect x="17" y="10" width="3" height="4" fill="currentColor"/></svg> },
    { id: 'galaxy', label: 'Galaxy', icon: <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M12 2L13.2 6.4L18 7.3L14.6 10.8L15.4 15.8L12 13.4L8.6 15.8L9.4 10.8L6 7.3L10.8 6.4L12 2Z" fill="currentColor"/></svg> },
];

export const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  onSettingsChange, 
  onFileChange, 
  setSettings,
  isProcessing,
  recordedVideoUrl
}) => {
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePalette = async () => {
    if (!aiPrompt) {
      setError('Please enter a description for the palette.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const palette = await generateColorPalette(aiPrompt);
      setSettings(prev => ({
        ...prev,
        barColor: palette.primaryColor,
        backgroundColor: palette.backgroundColor,
      }));
    } catch (err) {
      console.error(err);
      setError('Failed to generate palette. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="audio-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 hover:border-brand-primary rounded-lg cursor-pointer transition-colors">
          <Icon.UploadIcon className="w-10 h-10 text-gray-500 mb-2" />
          <span className="text-lg font-semibold text-brand-text">Upload Audio</span>
          <span className="text-sm text-brand-text-muted">MP3, WAV, etc.</span>
          <input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={onFileChange} />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-brand-text border-b border-gray-700 pb-2">Export Video</h3>
        <div className="space-y-2">
            <label htmlFor="resolution-select" className="text-brand-text-muted">Video Resolution</label>
            <select
                id="resolution-select"
                value={settings.resolution}
                onChange={(e) => onSettingsChange('resolution', e.target.value as VideoResolution)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
            >
                {Object.entries(resolutions).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                ))}
            </select>
        </div>
        <p className="text-xs text-brand-text-muted text-center pt-2">
            Recording starts automatically when you play an audio file.
        </p>
        <a
          href={recordedVideoUrl || '#'}
          download="audio-visualizer.webm"
          aria-disabled={!recordedVideoUrl || isProcessing}
          onClick={(e) => {
            if (!recordedVideoUrl || isProcessing) {
              e.preventDefault();
            }
          }}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-md text-white font-semibold transition-colors ${
            !recordedVideoUrl || isProcessing
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-brand-secondary hover:bg-brand-secondary/80'
          }`}
        >
          {isProcessing ? (
            <>
              <Icon.LoaderIcon className="animate-spin w-5 h-5" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Icon.DownloadIcon className="w-5 h-5" />
              <span>Download Video</span>
            </>
          )}
        </a>
        {!recordedVideoUrl && !isProcessing && (
            <p className="text-xs text-brand-text-muted text-center">
              Play a song to generate a downloadable video.
            </p>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-brand-text border-b border-gray-700 pb-2">AI Palette Generator</h3>
         <p className="text-sm text-brand-text-muted">Describe a mood or theme (e.g., "ocean sunset", "cyberpunk city")</p>
        <div className="flex gap-2">
            <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'calm forest morning'"
                className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                disabled={isLoading}
            />
            <button
                onClick={handleGeneratePalette}
                className="flex items-center justify-center p-2 bg-brand-primary hover:bg-brand-primary/80 rounded-md text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {isLoading ? <Icon.LoaderIcon className="animate-spin" /> : <Icon.SparklesIcon />}
            </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-brand-text border-b border-gray-700 pb-2">Visualizer Style</h3>
        <div className="grid grid-cols-2 gap-4">
          {visualizerOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onSettingsChange('style', option.id)}
              className={`group aspect-video flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 border-2 ${
                settings.style === option.id ? 'bg-brand-primary/20 border-brand-primary' : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className={`w-12 h-12 mb-2 text-brand-text-muted transition-colors group-hover:text-brand-text ${settings.style === option.id ? 'text-brand-primary' : ''}`}>
                {option.icon}
              </div>
              <span className={`font-semibold transition-colors ${settings.style === option.id ? 'text-brand-primary' : 'text-brand-text-muted group-hover:text-brand-text'}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-brand-text border-b border-gray-700 pb-2">Customization</h3>
        <div className="flex items-center justify-between">
            <label htmlFor="barColor" className="text-brand-text-muted">Primary Color</label>
            <input
                id="barColor"
                type="color"
                value={settings.barColor}
                onChange={(e) => onSettingsChange('barColor', e.target.value)}
                className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
            />
        </div>
        <div className="flex items-center justify-between">
            <label htmlFor="backgroundColor" className="text-brand-text-muted">Background Color</label>
            <input
                id="backgroundColor"
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onSettingsChange('backgroundColor', e.target.value)}
                className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
            />
        </div>
      </div>
    </div>
  );
};
