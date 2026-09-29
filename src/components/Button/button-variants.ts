import { cva } from 'class-variance-authority';

// Kept apart from Button.tsx so hook-free consumers (the Templates tier) can
// style anchors without importing the Button component module.
export const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'min-w-0 whitespace-nowrap',
    'font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-800 text-white',
          'hover:bg-primary-900',
          'active:bg-primary-950',
        ],
        secondary: [
          'bg-neutral-200 text-neutral-900',
          'hover:bg-neutral-300',
          'active:bg-neutral-400',
          'dark:bg-neutral-700 dark:text-neutral-100',
          'dark:hover:bg-neutral-600',
          'dark:active:bg-neutral-500',
        ],
        ghost: [
          'bg-transparent text-neutral-600',
          'hover:bg-neutral-100',
          'active:bg-neutral-200',
          'dark:text-neutral-400',
          'dark:hover:bg-neutral-800',
          'dark:active:bg-neutral-700',
        ],
        outline: [
          'border-2 border-primary-800 text-primary-800 bg-transparent',
          'hover:bg-primary-50 hover:text-primary-900',
          'active:bg-primary-100',
          'dark:border-primary-400 dark:text-primary-400',
          'dark:hover:bg-primary-950',
          'dark:active:bg-primary-900',
        ],
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'active:bg-red-800',
        ],
        link: [
          'text-primary-800 underline-offset-4',
          'hover:underline hover:text-primary-900',
          'active:text-primary-950',
          'dark:text-primary-400',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-lg',
        lg: 'h-12 px-6 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      /** Opt-in hover motion (see src/styles/effects.css). */
      effect: {
        none: '',
        sheen: 'mie-fx-sheen hover:-translate-y-0.5',
        orbit: 'mie-fx-orbit hover:-translate-y-0.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      effect: 'none',
    },
  }
);
