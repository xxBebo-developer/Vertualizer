
export type VisualizerStyle = 'bars' | 'wave' | 'circle' | 'particles' | 'dual_bars' | 'galaxy';
export type VideoResolution = '720p' | '1080p' | '1440p' | '2160p';

export const resolutions: Record<VideoResolution, { width: number; height: number; label: string }> = {
  '720p': { width: 1280, height: 720, label: 'HD (720p)' },
  '1080p': { width: 1920, height: 1080, label: 'Full HD (1080p)' },
  '1440p': { width: 2560, height: 1440, label: 'QHD (1440p)' },
  '2160p': { width: 3840, height: 2160, label: '4K (2160p)' },
};

export interface VisualizerSettings {
  style: VisualizerStyle;
  barColor: string;
  backgroundColor: string;
  lineWidth: number;
  particleSpeed: number;
  resolution: VideoResolution;
}

export interface ColorPalette {
    backgroundColor: string;
    primaryColor: string;
}