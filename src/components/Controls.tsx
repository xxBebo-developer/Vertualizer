import React, { useState } from 'react';
import type { VisualizerSettings, VisualizerStyle, VideoResolution } from '../types';
import { generateColorPalette } from '../services/geminiService';
import * as Icon from './IconComponents';
import { resolutions } from '../types';


interface ControlsProps {
  settings: VisualizerSettings;
  onSettingsChange: <K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSettings: React.Dispatch<React.SetStateAction<VisualizerSettings>>;
  isProcessing: boolean;
  recordedVideoUrl: string | null;
}

const visualizerOptions: { id: VisualizerStyle; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'bars', label: 'Bars', icon: Icon.BarsIcon },
  { id: 'wave', label: 'Wave', icon: Icon.WaveIcon },
  { id: 'circle', label: 'Circle', icon: Icon.CircleIcon },
  { id: 'grid', label: 'Grid', icon: Icon.GridIcon },
  { id: 'particles', label: 'Particles', icon: Icon.SparklesIcon },
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
                onChange={(e) => onSettingsChange('resolution', e.currentTarget.value as VideoResolution)}
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
                onChange={(e) => setAiPrompt(e.currentTarget.value)}
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
          {visualizerOptions.map(option => {
            const IconComponent = option.icon;
            return (
                <button
                key={option.id}
                onClick={() => onSettingsChange('style', option.id)}
                className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface ${
                    settings.style === option.id 
                    ? 'bg-brand-primary text-white shadow-lg ring-2 ring-brand-primary/50' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                >
                <IconComponent className="w-8 h-8" />
                <span className="font-semibold text-sm">{option.label}</span>
                </button>
            )
          })}
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
                onChange={(e) => onSettingsChange('barColor', e.currentTarget.value)}
                className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
            />
        </div>
        <div className="flex items-center justify-between">
            <label htmlFor="backgroundColor" className="text-brand-text-muted">Background Color</label>
            <input
                id="backgroundColor"
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onSettingsChange('backgroundColor', e.currentTarget.value)}
                className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
            />
        </div>
      </div>
    </div>
  );
};