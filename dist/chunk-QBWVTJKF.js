import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

var audioPlayerVariants = cva("", {
  variants: {
    variant: {
      inline: "inline-flex items-center gap-2",
      compact: [
        "flex items-center gap-3 p-3",
        "rounded-lg border border-border",
        "bg-card text-card-foreground"
      ],
      waveform: [
        "flex flex-col gap-3 p-4",
        "rounded-xl border border-border",
        "bg-card text-card-foreground"
      ]
    },
    size: {
      sm: "",
      md: "",
      lg: ""
    }
  },
  compoundVariants: [
    { variant: "compact", size: "sm", class: "p-2 gap-2" },
    { variant: "compact", size: "lg", class: "p-4 gap-4" },
    { variant: "waveform", size: "sm", class: "p-3 gap-2" },
    { variant: "waveform", size: "lg", class: "p-5 gap-4" }
  ],
  defaultVariants: {
    variant: "compact",
    size: "md"
  }
});
var playButtonVariants = cva(
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
        inline: [
          "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100",
          "dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800"
        ],
        compact: [
          "bg-primary-600 text-white",
          "hover:bg-primary-700",
          "active:bg-primary-800"
        ],
        waveform: [
          "bg-primary-600 text-white",
          "hover:bg-primary-700",
          "active:bg-primary-800"
        ]
      },
      size: {
        sm: "h-7 w-7",
        md: "h-9 w-9",
        lg: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "compact",
      size: "md"
    }
  }
);
function formatTime(seconds) {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
function PlayIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className,
      fill: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("path", { d: "M8 5v14l11-7z" })
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
      children: /* @__PURE__ */ jsx("path", { d: "M6 19h4V5H6v14zm8-14v14h4V5h-4z" })
    }
  );
}
function SpinnerIcon({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: cn("animate-spin", className),
      fill: "none",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
function ProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled
}) {
  const progressRef = React.useRef(null);
  const progress = duration > 0 ? currentTime / duration * 100 : 0;
  const handleClick = (e) => {
    if (disabled || !progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: progressRef,
      role: "slider",
      "aria-label": "Audio progress",
      "aria-valuemin": 0,
      "aria-valuemax": duration,
      "aria-valuenow": currentTime,
      "aria-valuetext": `${formatTime(currentTime)} of ${formatTime(duration)}`,
      tabIndex: disabled ? -1 : 0,
      className: cn(
        "relative h-1.5 flex-1 cursor-pointer rounded-full bg-neutral-200 dark:bg-neutral-700",
        disabled && "cursor-not-allowed opacity-50"
      ),
      onClick: handleClick,
      onKeyDown: (e) => {
        if (disabled) return;
        const step = duration * 0.05;
        if (e.key === "ArrowRight") {
          onSeek(Math.min(currentTime + step, duration));
        } else if (e.key === "ArrowLeft") {
          onSeek(Math.max(currentTime - step, 0));
        }
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "bg-primary-600 absolute inset-y-0 left-0 rounded-full transition-all",
            style: { width: `${progress}%` }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "bg-primary-600 absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-sm transition-all",
            style: { left: `calc(${progress}% - 6px)` }
          }
        )
      ]
    }
  );
}
function Waveform({
  src,
  isPlaying,
  playbackRate = 1,
  onReady,
  onTimeUpdate,
  onFinish,
  onSeek,
  waveColor,
  progressColor,
  height = 64
}) {
  const containerRef = React.useRef(null);
  const wavesurferRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!containerRef.current) return;
    const initWaveSurfer = async () => {
      try {
        const WaveSurfer = (await import('wavesurfer.js')).default;
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
        wavesurferRef.current = WaveSurfer.create({
          container: containerRef.current,
          waveColor: waveColor || "#d1d5db",
          progressColor: progressColor || "var(--color-primary-600, #2563eb)",
          cursorColor: "transparent",
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          height,
          normalize: true,
          interact: true
        });
        wavesurferRef.current.on("ready", () => {
          setIsLoaded(true);
          onReady(wavesurferRef.current.getDuration());
        });
        wavesurferRef.current.on("audioprocess", () => {
          onTimeUpdate(wavesurferRef.current.getCurrentTime());
        });
        wavesurferRef.current.on("seeking", () => {
          onTimeUpdate(wavesurferRef.current.getCurrentTime());
        });
        wavesurferRef.current.on("interaction", () => {
          onSeek(wavesurferRef.current.getCurrentTime());
        });
        wavesurferRef.current.on("finish", () => {
          onFinish();
        });
        wavesurferRef.current.load(src);
      } catch (error) {
        console.error("Failed to load WaveSurfer:", error);
      }
    };
    initWaveSurfer();
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [src]);
  React.useEffect(() => {
    if (!wavesurferRef.current || !isLoaded) return;
    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isLoaded]);
  React.useEffect(() => {
    if (!wavesurferRef.current || !isLoaded) return;
    wavesurferRef.current.setPlaybackRate(playbackRate);
  }, [playbackRate, isLoaded]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: cn(
        "w-full rounded-lg bg-neutral-100 dark:bg-neutral-800",
        !isLoaded && "animate-pulse"
      ),
      style: { height }
    }
  );
}
function AudioPlayer({
  src,
  title,
  variant = "compact",
  size = "md",
  onStateChange,
  onEnded,
  onError,
  onTimeUpdate,
  showTime = true,
  showDuration = true,
  waveColor,
  progressColor,
  waveformHeight = 64,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  showPlaybackRate = false,
  /** Whether to preload audio (set to false for lists with many items) */
  preload = false,
  /** Fallback duration in seconds to display before audio is loaded */
  fallbackDuration
}) {
  const [state, setState] = React.useState("idle");
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [audioInitialized, setAudioInitialized] = React.useState(false);
  const audioRef = React.useRef(null);
  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const updateState = React.useCallback(
    (newState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );
  const initAudio = React.useCallback(() => {
    if (variant === "waveform" || audioInitialized) return null;
    const audio = new globalThis.Audio(src);
    audioRef.current = audio;
    setAudioInitialized(true);
    audio.addEventListener("loadstart", () => updateState("loading"));
    audio.addEventListener("canplay", () => {
      updateState("idle");
    });
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration);
    });
    audio.addEventListener("ended", () => {
      updateState("idle");
      setCurrentTime(0);
      onEnded?.();
    });
    audio.addEventListener("error", () => {
      updateState("error");
      onError?.(new Error("Failed to load audio"));
    });
    return audio;
  }, [
    src,
    variant,
    audioInitialized,
    updateState,
    onTimeUpdate,
    onEnded,
    onError
  ]);
  React.useEffect(() => {
    if (preload && !audioInitialized && variant !== "waveform") {
      initAudio();
    }
  }, [preload, audioInitialized, variant, initAudio]);
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  const handlePlay = React.useCallback(() => {
    if (disabled) return;
    if (variant === "waveform") {
      if (isLoading) return;
      updateState(isPlaying ? "paused" : "playing");
      return;
    }
    if (!audioInitialized && !isLoading) {
      const audio = initAudio();
      if (audio) {
        updateState("loading");
        audio.addEventListener(
          "canplay",
          () => {
            audio.play().catch((error) => {
              updateState("error");
              onError?.(error);
            });
            updateState("playing");
          },
          { once: true }
        );
      }
      return;
    }
    if (isLoading) return;
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      updateState("paused");
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          updateState("error");
          onError?.(error);
        });
        updateState("playing");
      }
    }
  }, [
    disabled,
    variant,
    audioInitialized,
    isLoading,
    isPlaying,
    initAudio,
    updateState,
    onError
  ]);
  const handleSeek = React.useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);
  const handleWaveformReady = React.useCallback((dur) => {
    setDuration(dur);
    setState("idle");
  }, []);
  const handleWaveformTimeUpdate = React.useCallback(
    (time) => {
      setCurrentTime(time);
      onTimeUpdate?.(time, duration);
    },
    [duration, onTimeUpdate]
  );
  const handleWaveformFinish = React.useCallback(() => {
    updateState("idle");
    setCurrentTime(0);
    onEnded?.();
  }, [updateState, onEnded]);
  const handleWaveformSeek = React.useCallback((time) => {
    setCurrentTime(time);
  }, []);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (title) return `${isPlaying ? "Pause" : "Play"} ${title}`;
    return isPlaying ? "Pause audio" : "Play audio";
  };
  const renderPlayButton = () => /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: handlePlay,
      disabled: disabled || isLoading,
      className: cn(playButtonVariants({ variant, size })),
      "aria-label": getAriaLabel(),
      "aria-pressed": isPlaying,
      children: isLoading ? /* @__PURE__ */ jsx(SpinnerIcon, { className: iconSize }) : isPlaying ? /* @__PURE__ */ jsx(PauseIcon, { className: iconSize }) : /* @__PURE__ */ jsx(PlayIcon, { className: iconSize })
    }
  );
  const renderTime = () => {
    if (!showTime) return null;
    return /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400", children: [
      formatTime(currentTime),
      " / ",
      formatTime(duration)
    ] });
  };
  const renderPlaybackRateControl = () => {
    if (!showPlaybackRate) return null;
    return /* @__PURE__ */ jsx(
      "select",
      {
        value: playbackRate,
        onChange: (e) => setPlaybackRate(Number(e.target.value)),
        className: "rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-xs dark:border-neutral-700",
        "aria-label": "Playback speed",
        children: playbackRates.map((rate) => /* @__PURE__ */ jsxs("option", { value: rate, children: [
          rate,
          "x"
        ] }, rate))
      }
    );
  };
  if (variant === "inline") {
    const displayDuration = duration > 0 ? duration : fallbackDuration ?? 0;
    return /* @__PURE__ */ jsxs("div", { className: cn(audioPlayerVariants({ variant, size }), className), children: [
      renderPlayButton(),
      title && /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: title }),
      showDuration && displayDuration > 0 && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400", children: isPlaying ? formatTime(currentTime) : formatTime(displayDuration) })
    ] });
  }
  if (variant === "compact") {
    return /* @__PURE__ */ jsxs("div", { className: cn(audioPlayerVariants({ variant, size }), className), children: [
      renderPlayButton(),
      /* @__PURE__ */ jsx(
        ProgressBar,
        {
          currentTime,
          duration,
          onSeek: handleSeek,
          disabled
        }
      ),
      renderTime(),
      renderPlaybackRateControl()
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn(audioPlayerVariants({ variant, size }), className), children: [
    title && /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: title }),
    /* @__PURE__ */ jsx(
      Waveform,
      {
        src,
        isPlaying,
        playbackRate,
        onReady: handleWaveformReady,
        onTimeUpdate: handleWaveformTimeUpdate,
        onFinish: handleWaveformFinish,
        onSeek: handleWaveformSeek,
        waveColor,
        progressColor,
        height: waveformHeight
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      renderPlayButton(),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center justify-between", children: [
        renderTime(),
        renderPlaybackRateControl()
      ] })
    ] })
  ] });
}
AudioPlayer.displayName = "AudioPlayer";

export { AudioPlayer, ProgressBar, audioPlayerVariants, formatTime, playButtonVariants };
//# sourceMappingURL=chunk-QBWVTJKF.js.map
//# sourceMappingURL=chunk-QBWVTJKF.js.map