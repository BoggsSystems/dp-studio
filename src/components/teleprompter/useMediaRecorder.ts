import { useState, useRef, useEffect, useCallback } from 'react';

export type RecordingState = 'INACTIVE' | 'COUNTDOWN' | 'RECORDING' | 'STOPPED';

interface UseMediaRecorderProps {
  onStartScroll?: () => void;
  onStopScroll?: () => void;
}

export function useMediaRecorder({ onStartScroll, onStopScroll }: UseMediaRecorderProps = {}) {
  const [recordingState, setRecordingState] = useState<RecordingState>('INACTIVE');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(true);
  const [previewOpacity, setPreviewOpacity] = useState<number>(0.25); // Subtle 25% preview behind text
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Request WakeLock to prevent screen from sleeping during recording
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // Ignore wakeLock errors on unsupported browsers
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // Initialize or get the user's camera + microphone stream
  const getCameraStream = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current && streamRef.current.active) {
      return streamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      setCameraActive(true);
      setHasPermission(true);
      setErrorMessage(null);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      return stream;
    } catch (err: any) {
      console.error('Camera/Mic access error:', err);
      setHasPermission(false);
      setErrorMessage(err.message || 'Camera permission denied');
      return null;
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Sync videoPreviewRef if stream is already active
  useEffect(() => {
    if (videoPreviewRef.current && streamRef.current && streamRef.current.active) {
      videoPreviewRef.current.srcObject = streamRef.current;
      videoPreviewRef.current.play().catch(() => {});
    }
  });

  // Start 3-2-1 countdown then initiate recording
  const startRecordingFlow = useCallback(async () => {
    const stream = await getCameraStream();
    if (!stream) return;

    setRecordingState('COUNTDOWN');
    setCountdown(3);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          startActualRecording(stream);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [getCameraStream]);

  // Actual MediaRecorder start
  const startActualRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    setRecordingDurationSec(0);

    // Pick optimal supported MIME format
    const mimeType = [
      'video/mp4;codecs=avc1,mp4a',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find((type) => MediaRecorder.isTypeSupported(type)) || '';

    try {
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(recordedBlob);
        setRecordedBlobUrl(url);
        setRecordedBlob(recordedBlob);
        setRecordingState('STOPPED');
        releaseWakeLock();
      };

      recorder.start(1000); // 1-second chunks for resilient saving
      mediaRecorderRef.current = recorder;
      setRecordingState('RECORDING');
      requestWakeLock();

      // Start elapsed timer
      durationTimerRef.current = window.setInterval(() => {
        setRecordingDurationSec((prev) => prev + 1);
      }, 1000);

      // Trigger prompter scroller
      onStartScroll?.();
    } catch (err: any) {
      console.error('MediaRecorder start failed:', err);
      setErrorMessage(err.message || 'Failed to start recording');
      setRecordingState('INACTIVE');
    }
  };

  // Stop Recording
  const stopRecording = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    onStopScroll?.();
  }, [onStopScroll]);

  // Download recorded video file
  const downloadRecording = useCallback(() => {
    if (!recordedBlobUrl) return;
    const isMp4 = mediaRecorderRef.current?.mimeType?.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `shoppable_take_${timestamp}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [recordedBlobUrl]);

  // Dismiss video review
  const dismissReview = useCallback(() => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setRecordedBlob(null);
    setRecordingState('INACTIVE');
    setRecordingDurationSec(0);
  }, [recordedBlobUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      releaseWakeLock();
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl);
      }
    };
  }, [stopCameraStream, recordedBlobUrl]);

  return {
    recordingState,
    countdown,
    recordingDurationSec,
    recordedBlobUrl,
    recordedBlob,
    cameraActive,
    showCameraPreview,
    previewOpacity,
    hasPermission,
    errorMessage,
    videoPreviewRef,
    startRecordingFlow,
    stopRecording,
    dismissReview,
    downloadRecording,
    setShowCameraPreview,
    setPreviewOpacity,
    getCameraStream,
    stopCameraStream,
  };
}
