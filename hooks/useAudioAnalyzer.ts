import { useState, useEffect, useRef } from 'react';

export const useAudioAnalyzer = (
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean
) => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameId = useRef<number>(0);

  useEffect(() => {
    if (!audioElement) {
        // No element, so nothing to do, and cancel any pending animation
        cancelAnimationFrame(animationFrameId.current);
        return;
    }

    // Initialize AudioContext and AnalyserNode. This part only runs once.
    if (!audioContextRef.current) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;

        const source = context.createMediaElementSource(audioElement);
        sourceRef.current = source;
        
        source.connect(analyser);
        analyser.connect(context.destination);

        setFrequencyData(new Uint8Array(analyser.frequencyBinCount));
      } catch (error) {
        console.error("Error setting up AudioContext:", error);
      }
    }

    const analyze = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setFrequencyData(dataArray);
      }
      animationFrameId.current = requestAnimationFrame(analyze);
    };

    if (isPlaying) {
      // Resume AudioContext if it was suspended (required by some browsers)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(analyze);
    } else {
      cancelAnimationFrame(animationFrameId.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [audioElement, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioContextRef.current?.close().catch(console.error);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return { frequencyData };
};
