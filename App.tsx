
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Controls } from './components/Controls.tsx';
import { Header } from './components/Header.tsx';
import { Visualizer } from './components/Visualizer.tsx';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer.ts';
import type { VisualizerSettings } from './types.ts';
import * as Icon from './components/IconComponents.tsx';
import { resolutions } from './types.ts';

const App: React.FC = () => {
  const [settings, setSettings] = useState<VisualizerSettings>({
    style: 'bars',
    barColor: '#E040FB',
    backgroundColor: '#0D0D1A',
    lineWidth: 2,
    particleSpeed: 1,
    resolution: '1080p', // Default resolution
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioNode, setAudioNode] = useState<HTMLAudioElement | null>(null);
  const { frequencyData } = useAudioAnalyzer(audioNode, isPlaying);
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const audioCallbackRef = useCallback((node: HTMLAudioElement | null) => {
    if (node) {
      setAudioNode(node);
    }
  }, []);

  useEffect(() => {
    const currentAudioUrl = audioUrl;
    const currentRecordedVideoUrl = recordedVideoUrl;
    return () => {
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      if (currentRecordedVideoUrl) URL.revokeObjectURL(currentRecordedVideoUrl);
    };
  }, [audioUrl, recordedVideoUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (audioNode) audioNode.pause();
        if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
        
        const newUrl = URL.createObjectURL(file);
        setAudioUrl(newUrl);

        setIsPlaying(false);
        setIsRecording(false);
        setIsProcessing(false);
        setRecordedVideoUrl(null);
        recordedChunksRef.current = [];
    }
  };

  const togglePlayPause = useCallback(() => {
    if (!audioNode) return;
    // Direct check on the node's state to prevent race conditions
    if (audioNode.paused) {
      audioNode.play().catch(console.error);
    } else {
      audioNode.pause();
    }
  }, [audioNode]);

  const handleSettingsChange = useCallback(<K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStartRecording = useCallback(() => {
    const canvas = offscreenCanvasRef.current; // Record from the offscreen canvas
    if (!canvas || !audioNode || isRecording) {
        return;
    }

    try {
        const videoStream = canvas.captureStream(30);
        const audioStream = (audioNode as any).captureStream ? (audioNode as any).captureStream() : (audioNode as any).mozCaptureStream();
        if (!audioStream) throw new Error("Audio stream capture is not supported by your browser.");

        const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
        const options = { mimeType: 'video/webm; codecs=vp9,opus' };
        mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            setIsProcessing(true);
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedVideoUrl(url);
            recordedChunksRef.current = [];
            setIsProcessing(false);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);

    } catch (error) {
        console.error("Error starting recording:", error);
        alert(`Could not start recording: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [audioNode, isRecording, recordedVideoUrl]);

  const handleStopRecording = useCallback(() => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  }, [isRecording]);


  return (
    <div className="min-h-screen flex flex-col text-brand-text font-sans">
      <Header />
      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
        <aside className="w-full lg:min-w-[20rem] lg:max-w-[24rem] flex-shrink-0 bg-brand-surface rounded-lg shadow-2xl p-6">
          <Controls
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onFileChange={handleFileChange}
            setSettings={setSettings}
            isProcessing={isProcessing}
            recordedVideoUrl={recordedVideoUrl}
          />
        </aside>
        <div className="flex-grow bg-brand-surface rounded-lg shadow-2xl relative overflow-hidden min-h-[400px] lg:min-h-0">
          {frequencyData ? (
             <Visualizer 
                ref={canvasRef} 
                offscreenCanvasRef={offscreenCanvasRef}
                frequencyData={frequencyData} 
                settings={settings} 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-brand-text-muted p-4">
                <h2 className="text-2xl font-bold mb-2">Welcome to AI Audio Visualizer</h2>
                <p>Upload an audio file to begin.</p>
            </div>
          )}
          {audioUrl && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg z-10">
                <button
                    onClick={togglePlayPause}
                    className="p-2 bg-brand-primary/80 hover:bg-brand-primary rounded-full text-white transition-all duration-200"
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                    {isPlaying ? <Icon.PauseIcon /> : <Icon.PlayIcon />}
                </button>
                <audio
                    ref={audioCallbackRef}
                    onPlay={() => {
                        setIsPlaying(true);
                        handleStartRecording();
                    }}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      if(isRecording) handleStopRecording();
                    }}
                    src={audioUrl}
                    className="w-full"
                    controls={false}
                    crossOrigin="anonymous"
                />
            </div>
          )}
           {/* Hidden canvas for high-resolution recording */}
          <canvas ref={offscreenCanvasRef} className="hidden" />
        </div>
      </main>
    </div>
  );
};

export default App;