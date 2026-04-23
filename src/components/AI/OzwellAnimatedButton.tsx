/**
 * OzwellAnimatedButton — Rive-powered animated chat launcher
 *
 * Renders the Ozwell mascot animation (.riv) as the floating chat button,
 * replacing the default static icon from ozwell-loader. Supports hover/click
 * state machine triggers and a gentle float animation.
 *
 * Requires `@rive-app/react-canvas` and the `ozwell2.8.riv` asset.
 */
import * as React from 'react';
import { useRive } from '@rive-app/react-canvas';

/** Default path to the Rive animation (served from Storybook public dir) */
const DEFAULT_RIV_SRC = '/ozwell/ozwell2.8.riv';

/** Style ID for the animated button CSS */
const ANIMATED_STYLES_ID = 'ozwell-animated-button-styles';

/** CSS for the animated Ozwell button */
const ANIMATED_CSS = `
  /* Hide the default ozwell-loader button when animated button is active */
  .ozwell-animated-active .ozwell-chat-button {
    display: none !important;
  }

  /* Animated Ozwell launcher */
  .ozwell-animated-button {
    position: fixed;
    bottom: 14px;
    right: 14px;
    width: 60px;
    height: 60px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ozwell-float 15s ease-in-out infinite;
  }

  .ozwell-animated-button:focus-visible {
    outline: 2px solid var(--mieweb-ring, #27aae1);
    outline-offset: 4px;
    border-radius: 50%;
  }

  @keyframes ozwell-float {
    0%   { transform: translateY(0) rotate(0deg); }
    10%  { transform: translateY(-5px) rotate(-2deg); }
    20%  { transform: translateY(3px) rotate(3deg); }
    30%  { transform: translateY(-2px) rotate(-1deg); }
    40%  { transform: translateY(4px) rotate(2deg); }
    50%  { transform: translateY(0) rotate(0deg); }
    60%  { transform: translateY(-4px) rotate(2deg); }
    70%  { transform: translateY(2px) rotate(-3deg); }
    80%  { transform: translateY(5px) rotate(1deg); }
    90%  { transform: translateY(-3px) rotate(-2deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
`;

export interface OzwellAnimatedButtonProps {
  /** Path to the .riv file. Defaults to /ozwell/ozwell2.8.riv */
  rivSrc?: string;
  /** Width of the Rive canvas in pixels. Default 60 */
  size?: number;
  /** Called when the button is clicked */
  onClick?: () => void;
}

export function OzwellAnimatedButton({
  rivSrc = DEFAULT_RIV_SRC,
  size = 60,
  onClick,
}: OzwellAnimatedButtonProps) {
  const { RiveComponent, rive } = useRive({
    src: rivSrc,
    stateMachines: ['State Machine 1'],
    autoplay: true,
  });

  // Inject CSS (once)
  React.useEffect(() => {
    if (document.getElementById(ANIMATED_STYLES_ID)) return;
    const style = document.createElement('style');
    style.id = ANIMATED_STYLES_ID;
    style.textContent = ANIMATED_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  // Add marker class to body so CSS can hide the default button
  React.useEffect(() => {
    document.body.classList.add('ozwell-animated-active');
    return () => {
      document.body.classList.remove('ozwell-animated-active');
    };
  }, []);

  const handleClick = React.useCallback(() => {
    // Fire click trigger in the Rive state machine
    if (rive) {
      const inputs = rive.stateMachineInputs('State Machine 1');
      const trigger = inputs?.find((i) => i.name === 'ClickTrigger');
      if (trigger) trigger.fire();
    }
    // Toggle the chat
    onClick?.();
  }, [rive, onClick]);

  const handleMouseEnter = React.useCallback(() => {
    if (rive) {
      const inputs = rive.stateMachineInputs('State Machine 1');
      const hover = inputs?.find((i) => i.name === 'HoverTrigger');
      if (hover) hover.value = true;
    }
  }, [rive]);

  const handleMouseLeave = React.useCallback(() => {
    if (rive) {
      const inputs = rive.stateMachineInputs('State Machine 1');
      const hover = inputs?.find((i) => i.name === 'HoverTrigger');
      if (hover) hover.value = false;
    }
  }, [rive]);

  return (
    <button
      type="button"
      className="ozwell-animated-button"
      aria-label="Open Ozwell chat"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <RiveComponent style={{ width: size, height: size }} />
    </button>
  );
}
