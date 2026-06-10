/**
 * React hook for audio recording using expo-audio.
 * Records raw audio to a file. The caller is responsible for processing the audio.
 */

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isReady: boolean;
  uri: string | undefined;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const hasSetupRef = useRef(false);

  useEffect(() => {
    if (hasSetupRef.current) return;
    hasSetupRef.current = true;
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          console.error(t("voice.permissionRequired"));
        }
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch {
        // ignore
      }
    })();
  }, [t]);

  const startRecording = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
  };

  return {
    isRecording: recorderState.isRecording ?? false,
    isReady: true,
    uri: recorder.uri ?? undefined,
    startRecording,
    stopRecording,
  };
}
