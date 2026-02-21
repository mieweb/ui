import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
  hideOnMobile?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

// =============================================================================
// Site Logo Component
// =============================================================================

export interface SiteLogoProps {
  href?: string;
  logoSrc?: string;
  logoAlt?: string;
  textSrc?: string;
  name?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export function SiteLogo({
  href = '/',
  logoSrc,
  logoAlt = 'Logo',
  textSrc,
  name,
  variant = 'light',
  className,
}: SiteLogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      {logoSrc ? (
        <img src={logoSrc} alt={logoAlt} className="h-8 w-8 object-contain" />
      ) : (
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold',
            variant === 'light'
              ? 'bg-white/20 text-white'
              : 'bg-primary-600 text-white'
          )}
        >
          {name?.[0] || 'B'}
        </div>
      )}
      {textSrc ? (
        <img
          src={textSrc}
          alt={`${logoAlt} Text`}
          className={cn(
            'h-6 object-contain',
            variant === 'light' ? 'brightness-0 invert' : ''
          )}
        />
      ) : name ? (
        <span
          className={cn(
            'hidden text-xl font-semibold sm:block',
            variant === 'light' ? 'text-white' : 'text-gray-900 dark:text-white'
          )}
        >
          {name}
        </span>
      ) : null}
    </div>
  );

  return (
    <a href={href} className="flex-shrink-0">
      {content}
    </a>
  );
}

// =============================================================================
// Navigation Links Component
// =============================================================================

export interface NavLinksProps {
  links: NavLink[];
  variant?: 'light' | 'dark';
  className?: string;
}

export function NavLinks({
  links,
  variant = 'light',
  className,
}: NavLinksProps) {
  return (
    <nav className={cn('hidden items-center gap-1 md:flex', className)}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            variant === 'light'
              ? 'text-white/90 hover:bg-white/10 hover:text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
          )}
        >
          {link.label}
          {link.external && (
            <ExternalLinkIcon className="ml-1 inline-block h-3 w-3 opacity-50" />
          )}
        </a>
      ))}
    </nav>
  );
}

// =============================================================================
// Auth Buttons (Logged Out State)
// =============================================================================

export interface AuthButtonsProps {
  variant?: 'light' | 'dark';
  onLogin?: () => void;
  onSignUp?: () => void;
  loginHref?: string;
  signUpHref?: string;
  showSignUp?: boolean;
  className?: string;
}

export function AuthButtons({
  variant = 'light',
  onLogin,
  onSignUp,
  loginHref,
  signUpHref,
  showSignUp = true,
  className,
}: AuthButtonsProps) {
  const loginButton = (
    <button
      type="button"
      onClick={onLogin}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        variant === 'light'
          ? 'border border-white/30 text-white hover:bg-white/10'
          : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800'
      )}
    >
      Log In
    </button>
  );

  const signUpButton = showSignUp && (
    <button
      type="button"
      onClick={onSignUp}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        variant === 'light'
          ? 'text-primary-600 bg-white hover:bg-white/90'
          : 'bg-primary-600 hover:bg-primary-700 text-white'
      )}
    >
      Sign Up
    </button>
  );

  if (loginHref || signUpHref) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {loginHref ? (
          <a
            href={loginHref}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              variant === 'light'
                ? 'border border-white/30 text-white hover:bg-white/10'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800'
            )}
          >
            Log In
          </a>
        ) : (
          loginButton
        )}
        {showSignUp && signUpHref ? (
          <a
            href={signUpHref}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              variant === 'light'
                ? 'text-primary-600 bg-white hover:bg-white/90'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            )}
          >
            Sign Up
          </a>
        ) : (
          signUpButton
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {loginButton}
      {signUpButton}
    </div>
  );
}

// =============================================================================
// User Menu (Logged In State)
// =============================================================================

export interface UserMenuProps {
  user: UserProfile;
  variant?: 'light' | 'dark';
  onLogout?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  menuItems?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function UserMenu({
  user,
  variant = 'light',
  onLogout,
  onProfile,
  onSettings,
  menuItems = [],
  className,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  type MenuItem = {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };

  const defaultItems: MenuItem[] = [
    ...(onProfile
      ? [
          {
            label: 'Profile',
            onClick: onProfile,
            icon: <UserIcon className="h-4 w-4" />,
          },
        ]
      : []),
    ...(onSettings
      ? [
          {
            label: 'Settings',
            onClick: onSettings,
            icon: <SettingsIcon className="h-4 w-4" />,
          },
        ]
      : []),
    ...menuItems,
    ...(onLogout
      ? [
          {
            label: 'Log Out',
            onClick: onLogout,
            icon: <LogoutIcon className="h-4 w-4" />,
          },
        ]
      : []),
  ];

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-full p-1 transition-colors',
          variant === 'light'
            ? 'hover:bg-white/10'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
              variant === 'light'
                ? 'bg-white/20 text-white'
                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            )}
          >
            {initials}
          </div>
        )}
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 transition-transform',
            variant === 'light'
              ? 'text-white/70'
              : 'text-gray-500 dark:text-gray-400',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
          {/* User Info */}
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {user.name}
            </p>
            {user.email && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {defaultItems.map((item, index) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-left text-sm',
                    index === defaultItems.length - 1 && onLogout
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mobile Menu Button
// =============================================================================

export interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function MobileMenuButton({
  isOpen,
  onClick,
  variant = 'light',
  className,
}: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg p-2 transition-colors md:hidden',
        variant === 'light'
          ? 'text-white hover:bg-white/10'
          : 'text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800',
        className
      )}
      aria-expanded={isOpen}
      aria-label="Toggle menu"
    >
      {isOpen ? (
        <CloseIcon className="h-6 w-6" />
      ) : (
        <MenuIcon className="h-6 w-6" />
      )}
    </button>
  );
}

// =============================================================================
// Mobile Menu Panel
// =============================================================================

export interface MobileMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
  user?: UserProfile | null;
  onLogin?: () => void;
  onSignUp?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function MobileMenuPanel({
  isOpen,
  onClose,
  links,
  user,
  onLogin,
  onSignUp,
  onLogout,
  className,
}: MobileMenuPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full bg-white shadow-xl md:hidden dark:bg-gray-900',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={onClose}
            >
              {link.label}
              {link.external && (
                <ExternalLinkIcon className="h-4 w-4 opacity-50" />
              )}
            </a>
          ))}
        </nav>

        <div className="absolute right-0 bottom-0 left-0 border-t border-gray-200 p-4 dark:border-gray-700">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex h-10 w-10 items-center justify-center rounded-full font-medium">
                  {user.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  {user.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout?.();
                  onClose();
                }}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onLogin?.();
                  onClose();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  onSignUp?.();
                  onClose();
                }}
                className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Main SiteHeader Component
// =============================================================================

const headerVariants = cva(
  'fixed top-0 left-0 right-0 z-40 transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600',
        white:
          'bg-white shadow-sm dark:bg-gray-900 dark:border-b dark:border-gray-800',
        transparent: 'bg-transparent',
        glass: 'bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface SiteHeaderProps extends VariantProps<typeof headerVariants> {
  logo?: {
    src?: string;
    alt?: string;
    textSrc?: string;
    name?: string;
    href?: string;
  };
  links?: NavLink[];
  user?: UserProfile | null;
  onLogin?: () => void;
  onSignUp?: () => void;
  onLogout?: () => void;
  onProfile?: () => void;
  loginHref?: string;
  signUpHref?: string;
  showSignUp?: boolean;
  userMenuItems?: UserMenuProps['menuItems'];
  className?: string;
}

export function SiteHeader({
  logo = {},
  links = [],
  user,
  variant,
  onLogin,
  onSignUp,
  onLogout,
  onProfile,
  loginHref,
  signUpHref,
  showSignUp = true,
  userMenuItems,
  className,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const colorVariant =
    variant === 'primary' || variant === 'transparent' ? 'light' : 'dark';

  return (
    <>
      {/* Spacer for fixed header */}
      <div className="h-16" aria-hidden="true" />

      <header
        className={cn(
          headerVariants({ variant: variant ?? 'primary' }),
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <SiteLogo
              href={logo.href}
              logoSrc={logo.src}
              logoAlt={logo.alt}
              textSrc={logo.textSrc}
              name={logo.name}
              variant={colorVariant}
            />

            {/* Navigation Links (Desktop) */}
            <NavLinks links={links} variant={colorVariant} />

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Auth / User Menu (Desktop) */}
              <div className="hidden md:block">
                {user ? (
                  <UserMenu
                    user={user}
                    variant={colorVariant}
                    onLogout={onLogout}
                    onProfile={onProfile}
                    menuItems={userMenuItems}
                  />
                ) : (
                  <AuthButtons
                    variant={colorVariant}
                    onLogin={onLogin}
                    onSignUp={onSignUp}
                    loginHref={loginHref}
                    signUpHref={signUpHref}
                    showSignUp={showSignUp}
                  />
                )}
              </div>

              {/* Mobile Menu Button */}
              <MobileMenuButton
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant={colorVariant}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenuPanel
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={links}
        user={user}
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
      />
    </>
  );
}

// =============================================================================
// Compact Header Variant
// =============================================================================

export interface CompactHeaderProps {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function CompactHeader({
  title,
  backHref,
  onBack,
  rightContent,
  className,
}: CompactHeaderProps) {
  const backButton = backHref ? (
    <a
      href={backHref}
      className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </a>
  ) : onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
  ) : null;

  return (
    <>
      <div className="h-14" aria-hidden="true" />
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
          className
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {backButton}
            {title && (
              <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            )}
          </div>
          {rightContent}
        </div>
      </header>
    </>
  );
}

// =============================================================================
// Icons
// =============================================================================

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

export default SiteHeader;
