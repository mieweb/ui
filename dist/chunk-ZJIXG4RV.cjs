'use strict';

var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var classVarianceAuthority = require('class-variance-authority');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

var recordButtonVariants = classVarianceAuthority.cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-full transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50"
  ],
  {
    variants: {
      variant: {
        default: [
          "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100",
          "dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800"
        ],
        filled: [
          "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          "dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        ],
        primary: [
          "bg-primary-600 text-white hover:bg-primary-700",
          "dark:bg-primary-500 dark:hover:bg-primary-600"
        ]
      },
      size: {
        sm: "h-7 w-7",
        md: "h-9 w-9",
        lg: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
var recordingIndicatorVariants = classVarianceAuthority.cva(
  [
    "absolute -top-1 -right-1",
    "flex items-center justify-center",
    "rounded-full bg-red-500 text-white",
    "animate-pulse"
  ],
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
function MicrophoneIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      className,
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 2,
      stroke: "currentColor",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      className,
      fill: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" })
    }
  );
}
function SpinnerIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      className: chunkOR5DRJCW_cjs.cn("animate-spin", className),
      fill: "none",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "circle",
          {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          }
        )
      ]
    }
  );
}
function RecordButton({
  onRecordingComplete,
  onRecordingStart,
  onError,
  maxDuration = 0,
  mimeType = "audio/webm",
  disabled = false,
  variant,
  size,
  className,
  "aria-label": ariaLabel,
  showDuration = false,
  idleIcon,
  recordingIcon,
  transcriptionState,
  showTranscriptionState = false
}) {
  const [state, setState] = React__namespace.useState("idle");
  const [duration, setDuration] = React__namespace.useState(0);
  const mediaRecorderRef = React__namespace.useRef(null);
  const streamRef = React__namespace.useRef(null);
  const chunksRef = React__namespace.useRef([]);
  const timerRef = React__namespace.useRef(void 0);
  const startTimeRef = React__namespace.useRef(0);
  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const isTranscribing = transcriptionState === "transcribing" || transcriptionState === "streaming";
  React__namespace.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);
  const startRecording = React__namespace.useCallback(async () => {
    if (disabled || isRecording || isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        setState("processing");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const finalDuration = duration;
        setTimeout(() => {
          onRecordingComplete?.(blob, finalDuration);
          setState("idle");
          setDuration(0);
        }, 200);
      };
      mediaRecorderRef.current.start(100);
      startTimeRef.current = Date.now();
      setState("recording");
      onRecordingStart?.();
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1e3;
        setDuration(elapsed);
        if (maxDuration > 0 && elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (error) {
      onError?.(error);
      setState("idle");
    }
  }, [
    disabled,
    isRecording,
    isProcessing,
    mimeType,
    maxDuration,
    duration,
    onRecordingComplete,
    onRecordingStart,
    onError,
    stopRecording
  ]);
  const stopRecording = React__namespace.useCallback(() => {
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
  const handleClick = React__namespace.useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const getIcon = () => {
    if (isProcessing || isTranscribing) {
      return /* @__PURE__ */ jsxRuntime.jsx(SpinnerIcon, { className: iconSize });
    }
    if (isRecording) {
      return recordingIcon || /* @__PURE__ */ jsxRuntime.jsx(StopIcon, { className: iconSize });
    }
    return idleIcon || /* @__PURE__ */ jsxRuntime.jsx(MicrophoneIcon, { className: iconSize });
  };
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (isTranscribing) return "Transcribing audio";
    if (isProcessing) return "Processing recording";
    if (isRecording) return "Stop recording";
    return "Start recording";
  };
  const getTranscriptionLabel = () => {
    if (transcriptionState === "streaming") return "Listening...";
    if (transcriptionState === "transcribing") return "Transcribing...";
    return null;
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative inline-flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        type: "button",
        onClick: handleClick,
        disabled: disabled || isProcessing || isTranscribing,
        className: chunkOR5DRJCW_cjs.cn(
          recordButtonVariants({ variant, size }),
          isRecording && "text-red-600 dark:text-red-400",
          isTranscribing && "text-primary-600 dark:text-primary-400",
          className
        ),
        "aria-label": getAriaLabel(),
        "aria-pressed": isRecording,
        children: [
          getIcon(),
          isRecording && !isTranscribing && /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              className: chunkOR5DRJCW_cjs.cn(recordingIndicatorVariants({ size })),
              "aria-hidden": "true"
            }
          )
        ]
      }
    ),
    showDuration && isRecording && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "font-mono text-xs text-red-600 tabular-nums dark:text-red-400", children: formatDuration(duration) }),
    showTranscriptionState && getTranscriptionLabel() && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-primary-600 dark:text-primary-400 text-xs font-medium", children: getTranscriptionLabel() })
  ] });
}
RecordButton.displayName = "RecordButton";

exports.RecordButton = RecordButton;
exports.formatDuration = formatDuration;
exports.recordButtonVariants = recordButtonVariants;
exports.recordingIndicatorVariants = recordingIndicatorVariants;
//# sourceMappingURL=chunk-ZJIXG4RV.cjs.map
//# sourceMappingURL=chunk-ZJIXG4RV.cjs.map