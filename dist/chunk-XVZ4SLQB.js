import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

function MicIcon({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx("path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" }),
        /* @__PURE__ */ jsx("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
        /* @__PURE__ */ jsx("line", { x1: "12", x2: "12", y1: "19", y2: "22" })
      ]
    }
  );
}
function MicOffIcon({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx("line", { x1: "2", x2: "22", y1: "2", y2: "22" }),
        /* @__PURE__ */ jsx("path", { d: "M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" }),
        /* @__PURE__ */ jsx("path", { d: "M5 10v2a7 7 0 0 0 12 5" }),
        /* @__PURE__ */ jsx("path", { d: "M15 9.34V5a3 3 0 0 0-5.68-1.33" }),
        /* @__PURE__ */ jsx("path", { d: "M9 9v3a3 3 0 0 0 5.12 2.12" }),
        /* @__PURE__ */ jsx("line", { x1: "12", x2: "12", y1: "19", y2: "22" })
      ]
    }
  );
}
function StopIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" })
    }
  );
}
function CheckIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" })
    }
  );
}
function LoadingSpinner({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: cn("animate-spin", className),
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })
    }
  );
}
function PulseRings({ variant }) {
  const ringColor = variant === "minimal" ? "bg-red-500/30" : "bg-red-400/40";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        className: cn("absolute inset-0 animate-ping rounded-full", ringColor),
        style: { animationDuration: "1.5s" }
      }
    ),
    /* @__PURE__ */ jsx(
      "span",
      {
        className: cn("absolute inset-0 animate-ping rounded-full", ringColor),
        style: { animationDuration: "1.5s", animationDelay: "0.5s" }
      }
    )
  ] });
}
function WaveformBars({ size }) {
  const barHeight = size === "sm" ? "h-2" : size === "md" ? "h-3" : "h-4";
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5", children: [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "animate-waveform w-0.5 rounded-full bg-current",
        barHeight
      ),
      style: {
        animationDelay: `${i * 0.1}s`
      }
    },
    i
  )) });
}
var recordButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center rounded-full",
    "transition-all duration-200",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  ],
  {
    variants: {
      variant: {
        default: "",
        outline: "border-2",
        ghost: "",
        minimal: ""
      },
      size: {
        sm: "size-10",
        md: "size-12",
        lg: "size-14"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
var iconSizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6"
};
function getStateStyles(state, variant) {
  const styles = {
    default: {
      idle: "bg-primary/10 text-primary hover:bg-primary/20",
      recording: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      processing: "bg-primary/10 text-primary cursor-wait",
      disabled: "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
      error: "bg-destructive/10 text-destructive",
      success: "bg-success/10 text-success"
    },
    outline: {
      idle: "border-primary/50 text-primary bg-transparent hover:bg-primary/10 hover:border-primary",
      recording: "border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:border-red-500",
      processing: "border-primary/50 text-primary bg-transparent cursor-wait",
      disabled: "border-muted text-muted-foreground bg-transparent cursor-not-allowed opacity-50",
      error: "border-destructive/50 text-destructive bg-transparent",
      success: "border-success/50 text-success bg-transparent"
    },
    ghost: {
      idle: "text-primary hover:bg-primary/10",
      recording: "text-red-500 hover:bg-red-500/10",
      processing: "text-primary bg-primary/5 cursor-wait",
      disabled: "text-muted-foreground cursor-not-allowed opacity-50",
      error: "text-destructive",
      success: "text-success"
    },
    minimal: {
      idle: "text-primary hover:text-primary/80",
      recording: "text-red-500 hover:text-red-500/80",
      processing: "text-primary cursor-wait",
      disabled: "text-muted-foreground/40 cursor-not-allowed",
      error: "text-destructive",
      success: "text-success"
    }
  };
  return styles[variant][state];
}
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
var RecordButton = React.forwardRef(
  ({
    className,
    variant = "default",
    size = "md",
    state: controlledState,
    showWaveform = false,
    showPulse = true,
    disabled,
    showDuration = false,
    idleIcon,
    recordingIcon,
    transcriptionState,
    showTranscriptionState = false,
    onRecordingComplete,
    onRecordingStart,
    onRecordingError,
    maxDuration = 0,
    mimeType = "audio/webm",
    onClick,
    ...props
  }, ref) => {
    const [internalState, setInternalState] = React.useState("idle");
    const [duration, setDuration] = React.useState(0);
    const mediaRecorderRef = React.useRef(null);
    const streamRef = React.useRef(null);
    const chunksRef = React.useRef([]);
    const timerRef = React.useRef(void 0);
    const startTimeRef = React.useRef(0);
    const timeoutsRef = React.useRef([]);
    const addTimeout = (callback, delay) => {
      const id = setTimeout(() => {
        callback();
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      }, delay);
      timeoutsRef.current.push(id);
      return id;
    };
    const clearAllTimeouts = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
    const isControlled = controlledState !== void 0;
    const currentState = isControlled ? controlledState : internalState;
    const effectiveState = disabled ? "disabled" : transcriptionState === "error" ? "error" : transcriptionState === "transcribing" || transcriptionState === "streaming" ? "processing" : transcriptionState === "complete" ? "success" : currentState;
    React.useEffect(() => {
      if (typeof window === "undefined") return;
      if (disabled && (controlledState && controlledState !== "disabled" || transcriptionState)) {
        console.warn(
          "[RecordButton]: `disabled` prop takes precedence over both `state` and `transcriptionState`. When `disabled` is true, the button will always appear disabled."
        );
      }
      if (controlledState !== void 0 && transcriptionState !== void 0) {
        const mappedTranscriptionState = transcriptionState === "error" ? "error" : transcriptionState === "transcribing" || transcriptionState === "streaming" ? "processing" : transcriptionState === "complete" ? "success" : void 0;
        if (mappedTranscriptionState !== void 0 && mappedTranscriptionState !== controlledState) {
          console.warn(
            `[RecordButton]: \`transcriptionState\` takes precedence over \`state\`. Received state="${controlledState}" and transcriptionState="${transcriptionState}". This may lead to unexpected visual states.`
          );
        }
      }
    }, [disabled, controlledState, transcriptionState]);
    const iconSize = iconSizes[size];
    const isRecording = effectiveState === "recording";
    const isDisabled = effectiveState === "disabled" || effectiveState === "processing";
    React.useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        clearAllTimeouts();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, []);
    const stopRecording = React.useCallback(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }, []);
    const startRecording = React.useCallback(async () => {
      if (disabled || effectiveState === "recording" || effectiveState === "processing")
        return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        streamRef.current = stream;
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
        mediaRecorderRef.current.onstop = () => {
          if (!isControlled) {
            setInternalState("processing");
          }
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const finalDuration = duration;
          addTimeout(() => {
            onRecordingComplete?.(blob, finalDuration);
            if (!isControlled) {
              setInternalState("success");
              addTimeout(() => {
                setInternalState("idle");
              }, 1500);
            }
            setDuration(0);
          }, 200);
        };
        mediaRecorderRef.current.start(100);
        startTimeRef.current = Date.now();
        if (!isControlled) {
          setInternalState("recording");
        }
        onRecordingStart?.();
        timerRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1e3;
          setDuration(elapsed);
          if (maxDuration > 0 && elapsed >= maxDuration) {
            stopRecording();
          }
        }, 100);
      } catch (error) {
        onRecordingError?.(error);
        if (!isControlled) {
          setInternalState("error");
          addTimeout(() => {
            setInternalState("idle");
          }, 2e3);
        }
      }
    }, [
      disabled,
      effectiveState,
      isControlled,
      mimeType,
      maxDuration,
      duration,
      onRecordingComplete,
      onRecordingStart,
      onRecordingError,
      stopRecording
    ]);
    const handleClick = React.useCallback(
      (e) => {
        onClick?.(e);
        if (!isControlled) {
          if (effectiveState === "recording") {
            stopRecording();
          } else if (effectiveState === "idle") {
            startRecording();
          }
        }
      },
      [onClick, isControlled, effectiveState, startRecording, stopRecording]
    );
    const renderIcon = () => {
      switch (effectiveState) {
        case "recording":
          if (showWaveform) {
            return /* @__PURE__ */ jsx(WaveformBars, { size });
          }
          return recordingIcon || /* @__PURE__ */ jsx(StopIcon, { className: iconSize });
        case "processing":
          return /* @__PURE__ */ jsx(LoadingSpinner, { className: iconSize });
        case "disabled":
        case "error":
          return /* @__PURE__ */ jsx(MicOffIcon, { className: iconSize });
        case "success":
          return /* @__PURE__ */ jsx(CheckIcon, { className: iconSize });
        default:
          return idleIcon || /* @__PURE__ */ jsx(MicIcon, { className: iconSize });
      }
    };
    const getAriaLabel = () => {
      switch (effectiveState) {
        case "recording":
          return "Stop recording";
        case "processing":
          return "Processing recording";
        case "disabled":
          return "Recording unavailable";
        case "error":
          return "Recording failed";
        case "success":
          return "Recording complete";
        default:
          return "Start recording";
      }
    };
    const getTranscriptionLabel = () => {
      if (transcriptionState === "streaming") return "Listening...";
      if (transcriptionState === "transcribing") return "Transcribing...";
      return null;
    };
    return /* @__PURE__ */ jsxs("div", { className: "relative inline-flex items-center gap-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          ref,
          type: "button",
          disabled: isDisabled,
          onClick: handleClick,
          ...props,
          className: cn(
            recordButtonVariants({ variant, size }),
            getStateStyles(effectiveState, variant),
            className
          ),
          "aria-label": getAriaLabel(),
          "aria-pressed": effectiveState === "recording" ? true : void 0,
          "aria-busy": effectiveState === "processing" ? true : void 0,
          children: [
            effectiveState === "recording" && showPulse && /* @__PURE__ */ jsx(PulseRings, { variant }),
            /* @__PURE__ */ jsx("span", { className: "relative z-10", children: renderIcon() })
          ]
        }
      ),
      showDuration && isRecording && /* @__PURE__ */ jsx("span", { className: "text-destructive font-mono text-xs tabular-nums", children: formatDuration(duration) }),
      showTranscriptionState && getTranscriptionLabel() && /* @__PURE__ */ jsx("span", { className: "text-primary text-xs font-medium", children: getTranscriptionLabel() })
    ] });
  }
);
RecordButton.displayName = "RecordButton";

export { RecordButton, formatDuration, recordButtonVariants };
//# sourceMappingURL=chunk-XVZ4SLQB.js.map
//# sourceMappingURL=chunk-XVZ4SLQB.js.map