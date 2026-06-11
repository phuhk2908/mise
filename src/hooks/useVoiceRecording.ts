/**
 * React hook for audio recording using expo-audio.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export type RecordingState =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "done"
  | "error";

export interface UseVoiceRecordingReturn {
  state: RecordingState;
  uri: string | null;
  duration: number;
  error: string | null;
  isSupported: boolean;
  hasPermission: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  reset: () => void;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [duration, setDuration] = useState(0);
  const [uri, setUri] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Configure audio mode and request permissions on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!mounted) return;
        setHasPermission(status.granted);
        if (!status.granted) {
          setError("Microphone permission is required to record audio.");
        }
      } catch {
        if (!mounted) return;
        setError("Failed to configure audio recording.");
        setIsSupported(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Track recording duration
  useEffect(() => {
    if (recorderState?.isRecording) {
      durationIntervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [recorderState?.isRecording]);

  const startRecording = useCallback(async () => {
    setError(null);
    setUri(null);
    setDuration(0);

    if (!hasPermission) {
      setError("Microphone permission is required to record audio.");
      setState("error");
      return;
    }

    try {
      setState("requesting");
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording.");
      setState("error");
    }
  }, [hasPermission, audioRecorder]);

  const stopRecording = useCallback(async () => {
    try {
      setState("processing");
      await audioRecorder.stop();
      const recordingUri = (audioRecorder as any).uri as string | undefined;
      if (recordingUri) {
        setUri(recordingUri);
        setState("done");
      } else {
        setError("Recording did not produce a file.");
        setState("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop recording.");
      setState("error");
    }
  }, [audioRecorder]);

  const reset = useCallback(() => {
    setState("idle");
    setUri(null);
    setDuration(0);
    setError(null);
  }, []);

  return {
    state,
    uri,
    duration,
    error,
    isSupported,
    hasPermission,
    startRecording,
    stopRecording,
    reset,
  };
}
