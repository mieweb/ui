import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export type AuthMode =
  | 'login'
  | 'signup'
  | 'forgotPassword'
  | 'resetPassword'
  | 'verify';

export interface SocialProvider {
  id: string;
  name: string;
  icon?: React.ReactNode;
  color?: string;
}

export const DEFAULT_SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: 'google', name: 'Google', color: '#4285F4' },
  { id: 'microsoft', name: 'Microsoft', color: '#00A4EF' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0077B5' },
  { id: 'apple', name: 'Apple', color: '#000000' },
];

// =============================================================================
// AuthDialog Component
// =============================================================================

export interface AuthDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Current auth mode */
  mode?: AuthMode;
  /** Callback when mode changes */
  onModeChange?: (mode: AuthMode) => void;
  /** Login handler */
  onLogin?: (email: string, password: string) => Promise<void>;
  /** Signup handler */
  onSignup?: (data: SignupData) => Promise<void>;
  /** Social login handler */
  onSocialLogin?: (providerId: string) => Promise<void>;
  /** Forgot password handler */
  onForgotPassword?: (email: string) => Promise<void>;
  /** Reset password handler */
  onResetPassword?: (
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  /** Available social providers */
  socialProviders?: SocialProvider[];
  /** App name for branding */
  appName?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Terms URL */
  termsUrl?: string;
  /** Privacy URL */
  privacyUrl?: string;
  /** Whether email verification is required */
  requireEmailVerification?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * A comprehensive authentication dialog with login, signup, and password reset flows.
 *
 * @example
 * ```tsx
 * <AuthDialog
 *   isOpen={showAuth}
 *   onClose={() => setShowAuth(false)}
 *   onLogin={async (email, password) => { ... }}
 *   onSignup={async (data) => { ... }}
 *   onSocialLogin={async (provider) => { ... }}
 * />
 * ```
 */
export function AuthDialog({
  isOpen,
  onClose,
  mode: controlledMode,
  onModeChange,
  onLogin,
  onSignup,
  onSocialLogin,
  onForgotPassword,
  onResetPassword,
  socialProviders = DEFAULT_SOCIAL_PROVIDERS,
  appName = 'BlueHive',
  logoUrl,
  termsUrl = '/terms',
  privacyUrl = '/privacy',
  requireEmailVerification = false,
  className,
}: AuthDialogProps) {
  const [internalMode, setInternalMode] = React.useState<AuthMode>('login');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const mode = controlledMode ?? internalMode;
  const setMode = (newMode: AuthMode) => {
    setError(null);
    setSuccess(null);
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSocialLogin = async (providerId: string) => {
    if (!onSocialLogin) return;
    setIsLoading(true);
    setError(null);
    try {
      await onSocialLogin(providerId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className={cn(
          'relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800',
          'animate-in slide-in-from-bottom-4 duration-300',
          className
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="mx-auto mb-4 h-10" />
          ) : (
            <div className="bg-primary-800 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
              <span className="text-xl font-bold text-white">
                {appName.charAt(0)}
              </span>
            </div>
          )}
          <h2
            id="auth-dialog-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            {mode === 'login' && `Sign in to ${appName}`}
            {mode === 'signup' && `Create your account`}
            {mode === 'forgotPassword' && 'Reset your password'}
            {mode === 'resetPassword' && 'Set new password'}
            {mode === 'verify' && 'Verify your email'}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Error/Success messages */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <LoginForm
              onSubmit={async (email, password) => {
                if (!onLogin) return;
                setIsLoading(true);
                setError(null);
                try {
                  await onLogin(email, password);
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Login failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
              onForgotPassword={() => setMode('forgotPassword')}
            />
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <SignupForm
              onSubmit={async (data) => {
                if (!onSignup) return;
                setIsLoading(true);
                setError(null);
                try {
                  await onSignup(data);
                  if (requireEmailVerification) {
                    setMode('verify');
                    setSuccess('Check your email for a verification link.');
                  } else {
                    onClose();
                  }
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : 'Signup failed'
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
              termsUrl={termsUrl}
              privacyUrl={privacyUrl}
            />
          )}

          {/* Forgot Password Form */}
          {mode === 'forgotPassword' && (
            <ForgotPasswordForm
              onSubmit={async (email) => {
                if (!onForgotPassword) return;
                setIsLoading(true);
                setError(null);
                try {
                  await onForgotPassword(email);
                  setSuccess('Check your email for reset instructions.');
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : 'Request failed'
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
              onBack={() => setMode('login')}
            />
          )}

          {/* Reset Password Form */}
          {mode === 'resetPassword' && (
            <ResetPasswordForm
              onSubmit={async (password, confirmPassword) => {
                if (!onResetPassword) return;
                setIsLoading(true);
                setError(null);
                try {
                  await onResetPassword(password, confirmPassword);
                  setSuccess('Password reset successfully!');
                  setTimeout(() => setMode('login'), 2000);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Reset failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {/* Verification Message */}
          {mode === 'verify' && (
            <div className="py-4 text-center">
              <MailIcon className="text-primary-800 mx-auto mb-4 h-12 w-12" />
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                We&apos;ve sent a verification email to your inbox. Please click
                the link to verify your account.
              </p>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary-800 hover:text-primary-900 text-sm font-medium"
              >
                Return to login
              </button>
            </div>
          )}

          {/* Social Login */}
          {(mode === 'login' || mode === 'signup') &&
            socialProviders.length > 0 && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500 dark:bg-gray-800">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {socialProviders.map((provider) => (
                    <SocialButton
                      key={provider.id}
                      provider={provider}
                      onClick={() => handleSocialLogin(provider.id)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </>
            )}

          {/* Mode Toggle */}
          {(mode === 'login' || mode === 'signup') && (
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary-800 hover:text-primary-900 font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary-800 hover:text-primary-900 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

export interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptedTerms: boolean;
}

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  onForgotPassword: () => void;
}

function LoginForm({ onSubmit, isLoading, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Remember me
          </span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-primary-800 hover:text-primary-900 text-sm"
        >
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-primary-800 hover:bg-primary-900 w-full rounded-lg py-2.5 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Spinner className="mx-auto h-5 w-5" /> : 'Sign in'}
      </button>
    </form>
  );
}

interface SignupFormProps {
  onSubmit: (data: SignupData) => Promise<void>;
  isLoading: boolean;
  termsUrl: string;
  privacyUrl: string;
}

function SignupForm({
  onSubmit,
  isLoading,
  termsUrl,
  privacyUrl,
}: SignupFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    onSubmit({ email, password, acceptedTerms });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="signup-email"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label
          htmlFor="signup-confirm"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password
        </label>
        <input
          id="signup-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className={cn(
            'focus:ring-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white',
            confirmPassword && !passwordsMatch
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
          placeholder="••••••••"
        />
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>
      <label className="flex items-start">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
          className="text-primary-600 focus:ring-primary-500 mt-0.5 rounded border-gray-300"
        />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          I agree to the{' '}
          <a
            href={termsUrl}
            className="text-primary-800 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href={privacyUrl}
            className="text-primary-800 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </span>
      </label>
      <button
        type="submit"
        disabled={isLoading || !passwordsMatch || !acceptedTerms}
        className="bg-primary-800 hover:bg-primary-900 w-full rounded-lg py-2.5 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Spinner className="mx-auto h-5 w-5" /> : 'Create account'}
      </button>
    </form>
  );
}

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
}

function ForgotPasswordForm({
  onSubmit,
  isLoading,
  onBack,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>
      <div>
        <label
          htmlFor="forgot-email"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-primary-800 hover:bg-primary-900 w-full rounded-lg py-2.5 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <Spinner className="mx-auto h-5 w-5" />
        ) : (
          'Send reset link'
        )}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← Back to login
      </button>
    </form>
  );
}

interface ResetPasswordFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
  isLoading: boolean;
}

function ResetPasswordForm({ onSubmit, isLoading }: ResetPasswordFormProps) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    onSubmit(password, confirmPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="reset-password"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label
          htmlFor="reset-confirm"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password
        </label>
        <input
          id="reset-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className={cn(
            'focus:ring-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white',
            confirmPassword && !passwordsMatch
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
          placeholder="••••••••"
        />
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || !passwordsMatch}
        className="bg-primary-800 hover:bg-primary-900 w-full rounded-lg py-2.5 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <Spinner className="mx-auto h-5 w-5" />
        ) : (
          'Set new password'
        )}
      </button>
    </form>
  );
}

interface SocialButtonProps {
  provider: SocialProvider;
  onClick: () => void;
  disabled?: boolean;
}

function SocialButton({ provider, onClick, disabled }: SocialButtonProps) {
  const icons: Record<string, React.ReactNode> = {
    google: <GoogleIcon className="h-5 w-5" />,
    microsoft: <MicrosoftIcon className="h-5 w-5" />,
    linkedin: <LinkedInIcon className="h-5 w-5" />,
    apple: <AppleIcon className="h-5 w-5" />,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
    >
      {provider.icon || icons[provider.id] || null}
      <span className="text-sm font-medium">{provider.name}</span>
    </button>
  );
}

// =============================================================================
// Icons
// =============================================================================

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M13 1h10v10H13z" />
      <path fill="#7FBA00" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0077B5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
