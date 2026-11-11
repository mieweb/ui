/**
 * Shared MediaRecorder hook for Record audio / Record screen capture actions.
 * Extracted from the ChatComposer Action Ribbon POC (mieweb/ui#733).
 */
import * as React from 'react';
import { fileExtension, formatElapsed } from './captureCore';

export function useMediaRecording({
  kind,
  getStream,
  onFile,
}: {
  kind: 'audio' | 'video';
  getStream: () => Promise<MediaStream>;
  onFile: (file: File) => void;
}) {
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  // Bumped on unmount so a permission prompt that resolves later is discarded.
  const sessionRef = React.useRef(0);
  const pendingRef = React.useRef(false);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    if (startedAt == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);

  React.useEffect(
    () => () => {
      sessionRef.current += 1;
      if (recorderRef.current?.state === 'recording')
        recorderRef.current.stop();
    },
    []
  );

  const toggle = async () => {
    // The ref holds the recorder until its onstop finishes, so this also
    // blocks new starts while a stopped take is still being finalized.
    const current = recorderRef.current;
    if (current) {
      if (current.state === 'recording') current.stop();
      return;
    }
    // Ignore clicks while the permission / share prompt is still open.
    if (pendingRef.current) return;
    pendingRef.current = true;
    const session = sessionRef.current;
    let stream: MediaStream;
    try {
      stream = await getStream();
    } finally {
      pendingRef.current = false;
    }
    if (session !== sessionRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const stopTracks = () => stream.getTracks().forEach((t) => t.stop());
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stopTracks();
        if (recorderRef.current === recorder) recorderRef.current = null;
        if (session !== sessionRef.current) return;
        const type = recorder.mimeType || `${kind}/webm`;
        const prefix = kind === 'audio' ? 'audio' : 'screen-recording';
        onFile(
          new File(chunks, `${prefix}-${Date.now()}.${fileExtension(type)}`, {
            type,
          })
        );
        setStartedAt(null);
      };
      // The user can end a screen share from the browser's own UI.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorder.state === 'recording') recorder.stop();
      });
      recorder.start();
    } catch (error) {
      // Without a running recorder there is no Stop control, so release the
      // mic / screen share here before reporting the failure.
      stopTracks();
      throw error;
    }
    recorderRef.current = recorder;
    setStartedAt(Date.now());
    setNow(Date.now());
  };

  return {
    recording: startedAt != null,
    elapsed: startedAt != null ? formatElapsed(now - startedAt) : '',
    toggle,
  };
}
