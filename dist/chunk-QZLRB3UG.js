import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

var audioRecorderVariants = cva(
  [
    "relative flex flex-col gap-3",
    "rounded-xl border border-border",
    "bg-card text-card-foreground",
    "transition-all duration-200"
  ],
  {
    variants: {
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-5"
      },
      variant: {
        default: "",
        minimal: "border-none bg-transparent shadow-none",
        elevated: "shadow-lg border-0"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);
var waveformContainerVariants = cva(
  [
    "relative w-full overflow-hidden rounded-lg",
    "bg-neutral-100 dark:bg-neutral-800",
    "transition-all duration-200"
  ],
  {
    variants: {
      state: {
        idle: "opacity-50",
        listening: "opacity-75",
        recording: "",
        paused: "opacity-90",
        stopped: "",
        playback: ""
      }
    },
    defaultVariants: {
      state: "idle"
    }
  }
);
var controlButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-full transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-600 text-white",
          "hover:bg-primary-700",
          "active:bg-primary-800"
        ],
        secondary: [
          "bg-neutral-200 text-neutral-700",
          "hover:bg-neutral-300",
          "dark:bg-neutral-700 dark:text-neutral-200",
          "dark:hover:bg-neutral-600"
        ],
        danger: [
          "bg-red-600 text-white",
          "hover:bg-red-700",
          "active:bg-red-800"
        ],
        ghost: [
          "bg-transparent text-neutral-600",
          "hover:bg-neutral-100",
          "dark:text-neutral-400 dark:hover:bg-neutral-800"
        ]
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
function MicrophoneIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 2,
      stroke: "currentColor",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
        }
      )
    }
  );
}
function StopIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      fill: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" })
    }
  );
}
function PlayIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      fill: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("path", { d: "M8 5.14v14l11-7-11-7z" })
    }
  );
}
function PauseIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      fill: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("path", { d: "M6 4h4v16H6V4zm8 0h4v16h-4V4z" })
    }
  );
}
function TrashIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 2,
      stroke: "currentColor",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        }
      )
    }
  );
}
function RecordingIndicator({
  isRecording,
  isPaused
}) {
  if (!isRecording && !isPaused) return null;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "h-3 w-3 rounded-full",
          isRecording && !isPaused ? "animate-pulse bg-red-500" : "bg-yellow-500"
        ),
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-600 dark:text-neutral-400", children: isPaused ? "Paused" : "Recording" })
  ] });
}
function TimeDisplay({
  currentTime,
  duration,
  maxDuration,
  showMax
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 font-mono text-sm text-neutral-600 dark:text-neutral-400", children: [
    /* @__PURE__ */ jsx("span", { children: formatTime(currentTime) }),
    /* @__PURE__ */ jsx("span", { children: "/" }),
    /* @__PURE__ */ jsx("span", { children: formatTime(showMax && maxDuration ? maxDuration : duration) })
  ] });
}
function LiveVisualizer({
  analyser,
  isActive,
  height,
  barColor
}) {
  const canvasRef = React.useRef(null);
  const animationRef = React.useRef(void 0);
  React.useEffect(() => {
    if (!analyser || !canvasRef.current || !isActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      if (!isActive) return;
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bufferLength * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 255 * canvas.height;
        ctx.fillStyle = barColor || getComputedStyle(document.documentElement).getPropertyValue(
          "--color-primary-500"
        ) || "#3b82f6";
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, barColor]);
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref: canvasRef,
      width: 600,
      height,
      className: "w-full",
      style: { height }
    }
  );
}
function AudioRecorder({
  state: controlledState,
  onStateChange,
  onRecordingComplete,
  onRecordingStart,
  onError,
  maxDuration = 0,
  mimeType = "audio/webm",
  waveColor,
  progressColor,
  cursorColor,
  waveformHeight = 80,
  showTime = true,
  showWaveform = true,
  size,
  variant,
  className,
  "aria-label": ariaLabel = "Audio recorder",
  audioUrl,
  disabled = false,
  renderControls
}) {
  const [internalState, setInternalState] = React.useState("idle");
  const state = controlledState ?? internalState;
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [audioObjectUrl, setAudioObjectUrl] = React.useState(
    null
  );
  const [pendingBlob, setPendingBlob] = React.useState(null);
  const waveformRef = React.useRef(null);
  const wavesurferRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const timerRef = React.useRef(void 0);
  const startTimeRef = React.useRef(0);
  const handleStopRef = React.useRef(() => {
  });
  const updateState = React.useCallback(
    (newState) => {
      if (!controlledState) {
        setInternalState(newState);
      }
      onStateChange?.(newState);
    },
    [controlledState, onStateChange]
  );
  const initWaveSurfer = React.useCallback(async () => {
    if (!waveformRef.current || !showWaveform) return;
    const WaveSurferModule = await import('wavesurfer.js');
    const WaveSurfer = WaveSurferModule.default;
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
    const computedStyle = getComputedStyle(document.documentElement);
    const defaultWaveColor = computedStyle.getPropertyValue("--color-primary-400").trim() || "#60a5fa";
    const defaultProgressColor = computedStyle.getPropertyValue("--color-primary-600").trim() || "#2563eb";
    const defaultCursorColor = computedStyle.getPropertyValue("--color-primary-800").trim() || "#1e40af";
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: waveColor || defaultWaveColor,
      progressColor: progressColor || defaultProgressColor,
      cursorColor: cursorColor || defaultCursorColor,
      cursorWidth: 2,
      height: waveformHeight,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      hideScrollbar: true
    });
    const ws = wavesurferRef.current;
    ws.on("timeupdate", (time) => {
      setCurrentTime(time);
    });
    ws.on("ready", () => {
      if (wavesurferRef.current) {
        setDuration(wavesurferRef.current.getDuration());
      }
    });
    ws.on("finish", () => {
      updateState("stopped");
    });
  }, [
    showWaveform,
    waveColor,
    progressColor,
    cursorColor,
    waveformHeight,
    updateState
  ]);
  React.useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      wavesurferRef.current.load(audioUrl);
      updateState("stopped");
    }
  }, [audioUrl, updateState]);
  React.useEffect(() => {
    if (pendingBlob && waveformRef.current && state === "stopped") {
      const loadBlob = async () => {
        if (!wavesurferRef.current) {
          await initWaveSurfer();
        }
        if (wavesurferRef.current && pendingBlob) {
          wavesurferRef.current.loadBlob(pendingBlob);
          setPendingBlob(null);
        }
      };
      const timer = setTimeout(loadBlob, 50);
      return () => clearTimeout(timer);
    }
  }, [pendingBlob, state, initWaveSurfer]);
  React.useEffect(() => {
    initWaveSurfer();
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioObjectUrl) {
        URL.revokeObjectURL(audioObjectUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initWaveSurfer, audioObjectUrl]);
  const handleRecord = React.useCallback(async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      const options = { mimeType };
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mediaRecorderRef.current = new MediaRecorder(stream);
      } else {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      }
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        if (audioObjectUrl) {
          URL.revokeObjectURL(audioObjectUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioObjectUrl(url);
        setPendingBlob(blob);
        onRecordingComplete?.(blob, duration);
        updateState("stopped");
      };
      mediaRecorderRef.current.start(100);
      startTimeRef.current = Date.now();
      updateState("recording");
      onRecordingStart?.();
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1e3;
        setCurrentTime(elapsed);
        setDuration(elapsed);
        if (maxDuration > 0 && elapsed >= maxDuration) {
          handleStopRef.current();
        }
      }, 100);
    } catch (error) {
      onError?.(error);
      updateState("idle");
    }
  }, [
    disabled,
    mimeType,
    maxDuration,
    audioObjectUrl,
    duration,
    onRecordingComplete,
    onRecordingStart,
    onError,
    updateState
  ]);
  const handlePause = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      updateState("paused");
    } else if (wavesurferRef.current && (state === "playback" || state === "stopped")) {
      wavesurferRef.current.pause();
      updateState("paused");
    }
  }, [state, updateState]);
  const handleResume = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      const pausedTime = currentTime;
      startTimeRef.current = Date.now() - pausedTime * 1e3;
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1e3;
        setCurrentTime(elapsed);
        setDuration(elapsed);
        if (maxDuration > 0 && elapsed >= maxDuration) {
          handleStopRef.current();
        }
      }, 100);
      updateState("recording");
    } else if (wavesurferRef.current && state === "paused") {
      wavesurferRef.current.play();
      updateState("playback");
    }
  }, [currentTime, maxDuration, state, updateState]);
  const handleStop = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);
  handleStopRef.current = handleStop;
  const handlePlay = React.useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play();
      updateState("playback");
    }
  }, [updateState]);
  const handleSeek = React.useCallback((time) => {
    if (wavesurferRef.current) {
      const progress = time / wavesurferRef.current.getDuration();
      wavesurferRef.current.seekTo(progress);
      setCurrentTime(time);
    }
  }, []);
  const handleDelete = React.useCallback(() => {
    setAudioBlob(null);
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
      setAudioObjectUrl(null);
    }
    setCurrentTime(0);
    setDuration(0);
    updateState("idle");
  }, [audioObjectUrl, updateState]);
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isPlaying = state === "playback";
  const hasRecording = audioBlob !== null || audioUrl !== void 0;
  const controlRenderProps = {
    state,
    currentTime,
    duration,
    isRecording,
    isPaused,
    isPlaying,
    onRecord: handleRecord,
    onPause: handlePause,
    onResume: handleResume,
    onStop: handleStop,
    onPlay: handlePlay,
    onSeek: handleSeek,
    formatTime
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(audioRecorderVariants({ size, variant }), className),
      role: "group",
      "aria-label": ariaLabel,
      children: [
        showWaveform && /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(waveformContainerVariants({ state })),
            style: { height: waveformHeight },
            children: (state === "recording" || state === "listening") && !hasRecording ? /* @__PURE__ */ jsx(
              LiveVisualizer,
              {
                analyser: analyserRef.current,
                isActive: isRecording,
                height: waveformHeight,
                barColor: waveColor
              }
            ) : /* @__PURE__ */ jsx("div", { ref: waveformRef, className: "w-full" })
          }
        ),
        showTime && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(RecordingIndicator, { isRecording, isPaused }),
          /* @__PURE__ */ jsx(
            TimeDisplay,
            {
              currentTime,
              duration,
              maxDuration,
              showMax: isRecording || isPaused
            }
          )
        ] }),
        renderControls ? renderControls(controlRenderProps) : /* @__PURE__ */ jsx(
          DefaultControls,
          {
            ...controlRenderProps,
            disabled,
            hasRecording,
            onDelete: handleDelete
          }
        )
      ]
    }
  );
}
AudioRecorder.displayName = "AudioRecorder";
function DefaultControls({
  state,
  isRecording,
  isPaused,
  isPlaying,
  hasRecording,
  disabled,
  onRecord,
  onPause,
  onResume,
  onStop,
  onPlay,
  onDelete
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3", children: [
    hasRecording && !isRecording && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: onDelete,
        disabled,
        className: cn(
          controlButtonVariants({ variant: "ghost", size: "md" })
        ),
        "aria-label": "Delete recording",
        children: /* @__PURE__ */ jsx(TrashIcon, { className: "h-5 w-5" })
      }
    ),
    state === "idle" && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: onRecord,
        disabled,
        className: cn(
          controlButtonVariants({ variant: "danger", size: "lg" })
        ),
        "aria-label": "Start recording",
        children: /* @__PURE__ */ jsx(MicrophoneIcon, { className: "h-6 w-6" })
      }
    ),
    isRecording && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onPause,
          disabled,
          className: cn(
            controlButtonVariants({ variant: "secondary", size: "md" })
          ),
          "aria-label": "Pause recording",
          children: /* @__PURE__ */ jsx(PauseIcon, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onStop,
          disabled,
          className: cn(
            controlButtonVariants({ variant: "danger", size: "lg" })
          ),
          "aria-label": "Stop recording",
          children: /* @__PURE__ */ jsx(StopIcon, { className: "h-6 w-6" })
        }
      )
    ] }),
    isPaused && !hasRecording && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onResume,
          disabled,
          className: cn(
            controlButtonVariants({ variant: "danger", size: "lg" })
          ),
          "aria-label": "Resume recording",
          children: /* @__PURE__ */ jsx(MicrophoneIcon, { className: "h-6 w-6" })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onStop,
          disabled,
          className: cn(
            controlButtonVariants({ variant: "secondary", size: "md" })
          ),
          "aria-label": "Stop recording",
          children: /* @__PURE__ */ jsx(StopIcon, { className: "h-5 w-5" })
        }
      )
    ] }),
    (state === "stopped" || isPaused && hasRecording) && hasRecording && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: isPlaying || isPaused ? onPause : onPlay,
        disabled,
        className: cn(
          controlButtonVariants({ variant: "primary", size: "lg" })
        ),
        "aria-label": isPaused ? "Resume playback" : isPlaying ? "Pause playback" : "Play recording",
        children: isPaused || !isPlaying ? /* @__PURE__ */ jsx(PlayIcon, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(PauseIcon, { className: "h-6 w-6" })
      }
    ),
    isPlaying && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: onPause,
        disabled,
        className: cn(
          controlButtonVariants({ variant: "primary", size: "lg" })
        ),
        "aria-label": "Pause playback",
        children: /* @__PURE__ */ jsx(PauseIcon, { className: "h-6 w-6" })
      }
    )
  ] });
}

export { AudioRecorder, audioRecorderVariants, controlButtonVariants, formatTime, waveformContainerVariants };
//# sourceMappingURL=chunk-QZLRB3UG.js.map
//# sourceMappingURL=chunk-QZLRB3UG.js.map