/**
 * React hook for speech-to-text recording using expo-speech-recognition.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export type RecordingState =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "done"
  | "error";

export interface UseVoiceRecordingReturn {
  state: RecordingState;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  hasPermission: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const interimRef = useRef("");

  // Check support and permission on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
        if (!mounted) return;
        setIsSupported(available);
        if (!available) {
          setError("Speech recognition is not available on this device.");
          return;
        }

        const perms = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (!mounted) return;
        setHasPermission(perms.granted);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Event listeners
  useSpeechRecognitionEvent("start", () => {
    setState("recording");
    setError(null);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const results = event.results;
    if (results.length > 0) {
      const top = results[0];
      if (event.isFinal) {
        setTranscript((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : "";
          return prev + separator + top.transcript;
        });
        interimRef.current = "";
      } else {
        interimRef.current = top.transcript;
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "aborted") {
      // User manually cancelled — not an error
      return;
    }
    setError(event.message);
    setState("error");
  });

  useSpeechRecognitionEvent("end", () => {
    setState((current) => {
      if (current === "recording" || current === "processing") {
        return "done";
      }
      return current;
    });
  });

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    interimRef.current = "";

    // Ensure permissions
    if (!hasPermission) {
      setState("requesting");
      try {
        const perms =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setHasPermission(perms.granted);
        if (!perms.granted) {
          setError(
            "Microphone and speech recognition permissions are required to record voice."
          );
          setState("error");
          return;
        }
      } catch {
        setError("Failed to request microphone permission.");
        setState("error");
        return;
      }
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
      });
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording.");
      setState("error");
    }
  }, [hasPermission]);

  const stopRecording = useCallback(() => {
    try {
      setState("processing");
      ExpoSpeechRecognitionModule.stop();
    } catch {
      setState("done");
    }
  }, []);

  const reset = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // ignore
    }
    setState("idle");
    setTranscript("");
    setError(null);
    interimRef.current = "";
  }, []);

  return {
    state,
    transcript: transcript + (interimRef.current ? " " + interimRef.current : ""),
    error,
    isSupported,
    hasPermission,
    startRecording,
    stopRecording,
    reset,
  };
}
