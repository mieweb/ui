import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

// Import components
import { Alert } from '../Alert';
import { AudioPlayer } from '../AudioPlayer';
import { AudioRecorder } from '../AudioRecorder';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';
import { DateInput } from '../DateInput';
import {
  Dropdown,
  DropdownHeader,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../Dropdown';
import { Input } from '../Input';
import { Select } from '../Select';
import { Checkbox, CheckboxGroup } from '../Checkbox';
import { RadioGroup, Radio } from '../Radio';
import { Switch } from '../Switch';
import { Textarea } from '../Textarea';
import { Progress, CircularProgress } from '../Progress';
import { RecordButton, type TranscriptionState } from '../RecordButton';
import { Skeleton, SkeletonText, SkeletonCard } from '../Skeleton';
import { Spinner, SpinnerWithLabel } from '../Spinner';
import { Breadcrumb } from '../Breadcrumb';
import { Pagination, SimplePagination } from '../Pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../Table';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';
import { QuickAction, QuickActionGroup } from '../QuickAction';
import { PhoneInput } from '../PhoneInput';
import { ThemeProvider, useThemeContext } from '../ThemeProvider';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Examples/Dashboard',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  Home: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Users: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Settings: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
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
  ),
  Bell: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  Chart: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  Orders: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
  Profile: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Help: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Logout: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  Menu: () => (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  Close: () => (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  Sun: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Moon: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  ),
  Calendar: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  Shield: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  Palette: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  ),
  Microphone: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  ),
  Send: () => (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  ),
};

// ============================================================================
// Types
// ============================================================================

type Page =
  | 'dashboard'
  | 'users'
  | 'analytics'
  | 'orders'
  | 'profile'
  | 'settings'
  | 'voice-notes';

interface UserData {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockUser: UserData = {
  name: 'John Doe',
  email: 'john@example.com',
  avatarUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  role: 'Admin',
};

const mockNotifications = [
  { id: 1, title: 'New order received', time: '2 min ago', unread: true },
  { id: 2, title: 'User Jane signed up', time: '10 min ago', unread: true },
  { id: 3, title: 'Monthly report ready', time: '1 hour ago', unread: false },
];

const mockActivity = [
  { user: 'John Doe', action: 'updated profile', time: '2 minutes ago' },
  { user: 'Jane Smith', action: 'added new project', time: '1 hour ago' },
  { user: 'Bob Johnson', action: 'completed task', time: '3 hours ago' },
  { user: 'Alice Brown', action: 'left a comment', time: '5 hours ago' },
];

const mockOrders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    status: 'completed',
    amount: '$250.00',
    date: '2024-01-15',
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    status: 'pending',
    amount: '$150.00',
    date: '2024-01-14',
  },
  {
    id: 'ORD-003',
    customer: 'Bob Johnson',
    status: 'cancelled',
    amount: '$75.00',
    date: '2024-01-13',
  },
  {
    id: 'ORD-004',
    customer: 'Alice Brown',
    status: 'completed',
    amount: '$320.00',
    date: '2024-01-12',
  },
  {
    id: 'ORD-005',
    customer: 'Charlie Wilson',
    status: 'processing',
    amount: '$180.00',
    date: '2024-01-11',
  },
];

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Editor',
    status: 'active',
    avatar: null,
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Viewer',
    status: 'inactive',
    avatar: null,
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'active',
    avatar: null,
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'Editor',
    status: 'active',
    avatar: null,
  },
];

// ============================================================================
// User Menu Component
// ============================================================================

interface UserMenuProps {
  user: UserData;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

function UserMenu({ user, onProfile, onSettings, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dropdown
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      width={256}
      trigger={
        <button
          className="focus:ring-primary-500/40 flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-neutral-100 focus:ring-2 focus:outline-none dark:hover:bg-neutral-700"
          aria-label="User menu"
        >
          <Avatar src={user.avatarUrl} name={user.name} size="sm" ring />
          <span className="hidden text-sm font-medium text-neutral-700 md:block dark:text-neutral-300">
            {user.name}
          </span>
          <Icons.ChevronDown />
        </button>
      }
    >
      <DropdownHeader
        avatar={<Avatar src={user.avatarUrl} name={user.name} size="md" />}
        title={user.name}
        subtitle={user.email}
      />
      <DropdownContent>
        <DropdownItem
          icon={<Icons.Profile />}
          onClick={() => {
            onProfile();
            setIsOpen(false);
          }}
        >
          Profile
        </DropdownItem>
        <DropdownItem
          icon={<Icons.Settings />}
          onClick={() => {
            onSettings();
            setIsOpen(false);
          }}
        >
          Settings
        </DropdownItem>
        <DropdownItem icon={<Icons.Help />} onClick={() => setIsOpen(false)}>
          Help & Support
        </DropdownItem>
      </DropdownContent>
      <DropdownSeparator />
      <DropdownContent>
        <DropdownItem
          icon={<Icons.Logout />}
          onClick={() => {
            onLogout();
            setIsOpen(false);
          }}
          variant="danger"
        >
          Sign Out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

// ============================================================================
// Notifications Dropdown
// ============================================================================

function NotificationsDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  return (
    <Dropdown
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      width={320}
      trigger={
        <button
          className="focus:ring-primary-500/40 relative rounded-lg p-2 transition-colors hover:bg-neutral-100 focus:ring-2 focus:outline-none dark:hover:bg-neutral-700"
          aria-label="Notifications"
        >
          <Icons.Bell />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      }
    >
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
        <Text weight="semibold">Notifications</Text>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {mockNotifications.map((notification) => (
          <button
            key={notification.id}
            className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
          >
            <div
              className={`mt-1 h-2 w-2 rounded-full ${notification.unread ? 'bg-primary-500' : 'bg-transparent'}`}
            />
            <div className="min-w-0 flex-1">
              <Text
                size="sm"
                weight={notification.unread ? 'medium' : 'normal'}
              >
                {notification.title}
              </Text>
              <Text size="xs" variant="muted">
                {notification.time}
              </Text>
            </div>
          </button>
        ))}
      </div>
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
        <Button variant="ghost" size="sm" className="w-full">
          View all notifications
        </Button>
      </div>
    </Dropdown>
  );
}

// ============================================================================
// Theme Toggle Component
// ============================================================================

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext();

  return (
    <Tooltip
      content={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="focus:ring-primary-500/40 rounded-lg p-2 transition-colors hover:bg-neutral-100 focus:ring-2 focus:outline-none dark:hover:bg-neutral-700"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
      </button>
    </Tooltip>
  );
}

// ============================================================================
// Sidebar Component
// ============================================================================

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.Home /> },
    { id: 'users', label: 'Users', icon: <Icons.Users /> },
    { id: 'analytics', label: 'Analytics', icon: <Icons.Chart /> },
    { id: 'orders', label: 'Orders', icon: <Icons.Orders /> },
    { id: 'voice-notes', label: 'Voice Notes', icon: <Icons.Microphone /> },
  ];

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:border-r lg:border-neutral-200 lg:shadow-none dark:bg-neutral-800 dark:lg:border-neutral-700 ${isOpen ? 'translate-x-0' : '-translate-x-full'} `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
              M
            </div>
            <Text weight="bold" size="lg">
              MieWeb UI
            </Text>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-700"
            aria-label="Close sidebar"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                currentPage === item.id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
              } `}
            >
              {item.icon}
              <Text
                size="sm"
                weight={currentPage === item.id ? 'semibold' : 'medium'}
              >
                {item.label}
              </Text>
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
          <button
            onClick={() => handleNavigate('settings')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
              currentPage === 'settings'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
            } `}
          >
            <Icons.Settings />
            <Text
              size="sm"
              weight={currentPage === 'settings' ? 'semibold' : 'medium'}
            >
              Settings
            </Text>
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// Voice-Enabled Search Component
// ============================================================================

function VoiceSearch() {
  const [searchValue, setSearchValue] = React.useState('');
  const [transcriptionState, setTranscriptionState] =
    React.useState<TranscriptionState>('idle');

  const handleRecordingComplete = (_blob: Blob, _duration: number) => {
    // Simulate transcription
    setTranscriptionState('transcribing');
    setTimeout(() => {
      setTranscriptionState('streaming');
      // Simulate streaming text
      const mockSearch = 'find recent orders';
      let index = 0;
      const interval = setInterval(() => {
        if (index <= mockSearch.length) {
          setSearchValue(mockSearch.substring(0, index));
          index++;
        } else {
          clearInterval(interval);
          setTranscriptionState('complete');
          setTimeout(() => setTranscriptionState('idle'), 500);
        }
      }, 50);
    }, 800);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Search or speak..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-64 pr-10"
      />
      <div className="absolute top-1/2 right-2 -translate-y-1/2">
        <RecordButton
          size="sm"
          variant="default"
          transcriptionState={transcriptionState}
          showTranscriptionState={false}
          onRecordingComplete={handleRecordingComplete}
          maxDuration={10}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Header Component
// ============================================================================

interface HeaderProps {
  user: UserData;
  onMenuToggle: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

function Header({
  user,
  onMenuToggle,
  onProfile,
  onSettings,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-700"
          aria-label="Toggle menu"
        >
          <Icons.Menu />
        </button>

        {/* Voice-Enabled Search */}
        <div className="hidden md:block">
          <VoiceSearch />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsDropdown />
        <UserMenu
          user={user}
          onProfile={onProfile}
          onSettings={onSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

// ============================================================================
// Dashboard Page
// ============================================================================

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" size="2xl" weight="bold">
          Dashboard
        </Text>
        <Text variant="muted">
          Welcome back! Here&apos;s what&apos;s happening.
        </Text>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              $45,231.89
            </Text>
            <Badge variant="success" className="mt-2">
              +20.1% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              +2,350
            </Text>
            <Badge variant="success" className="mt-2">
              +180.1% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sales</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              +12,234
            </Text>
            <Badge variant="success" className="mt-2">
              +19% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Now</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="3xl" weight="bold">
              +573
            </Text>
            <Badge variant="warning" className="mt-2">
              +201 since last hour
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.slice(0, 4).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'success'
                            : order.status === 'pending'
                              ? 'warning'
                              : order.status === 'processing'
                                ? 'secondary'
                                : 'danger'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar name={item.user} size="sm" />
                <div className="min-w-0 flex-1">
                  <Text size="sm" weight="medium" truncate>
                    {item.user}
                  </Text>
                  <Text size="xs" variant="muted">
                    {item.action}
                  </Text>
                </div>
                <Text size="xs" variant="muted" className="shrink-0">
                  {item.time}
                </Text>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActionGroup>
            <QuickAction
              title="Add User"
              subtitle="Create new team member"
              icon={<Icons.Users />}
              color="blue"
            />
            <QuickAction
              title="New Order"
              subtitle="Create a new order"
              icon={<Icons.Orders />}
              color="green"
            />
            <QuickAction
              title="View Reports"
              subtitle="Analytics overview"
              icon={<Icons.Chart />}
              color="purple"
            />
          </QuickActionGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Users Page
// ============================================================================

function UsersPage() {
  const [currentPage, setCurrentPage] = React.useState(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text as="h1" size="2xl" weight="bold">
            Users
          </Text>
          <Text variant="muted">
            Manage your team members and their permissions.
          </Text>
        </div>
        <Button>
          <Icons.Users />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input placeholder="Search users..." className="sm:w-64" />
            <Select
              placeholder="Filter by role"
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' },
              ]}
              className="sm:w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <div>
                        <Text size="sm" weight="medium">
                          {user.name}
                        </Text>
                        <Text size="xs" variant="muted">
                          {user.email}
                        </Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'success' : 'danger'}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t border-neutral-200 dark:border-neutral-700">
          <Pagination
            page={currentPage}
            totalPages={5}
            onPageChange={setCurrentPage}
          />
        </CardFooter>
      </Card>
    </div>
  );
}

// ============================================================================
// Analytics Page
// ============================================================================

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" size="2xl" weight="bold">
          Analytics
        </Text>
        <Text variant="muted">
          Track your business performance and metrics.
        </Text>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Page Views', value: '234,567', change: '+12.3%' },
          { label: 'Unique Visitors', value: '45,678', change: '+8.1%' },
          { label: 'Bounce Rate', value: '42.3%', change: '-3.2%' },
          { label: 'Session Duration', value: '4m 32s', change: '+15.7%' },
        ].map((metric, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Text size="sm" variant="muted">
                {metric.label}
              </Text>
              <div className="mt-2 flex items-baseline gap-2">
                <Text size="2xl" weight="bold">
                  {metric.value}
                </Text>
                <Badge
                  variant={metric.change.startsWith('+') ? 'success' : 'danger'}
                  size="sm"
                >
                  {metric.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>Daily visitors over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end justify-around gap-2">
              {[65, 45, 80, 55, 70, 90, 75].map((height, i) => (
                <div
                  key={i}
                  className="bg-primary-500 hover:bg-primary-600 w-8 rounded-t transition-all"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-around text-xs text-neutral-500">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { source: 'Direct', percentage: 45 },
              { source: 'Organic Search', percentage: 30 },
              { source: 'Social Media', percentage: 15 },
              { source: 'Referral', percentage: 10 },
            ].map((item) => (
              <div key={item.source}>
                <div className="mb-1 flex justify-between">
                  <Text size="sm">{item.source}</Text>
                  <Text size="sm" weight="medium">
                    {item.percentage}%
                  </Text>
                </div>
                <Progress value={item.percentage} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Orders Page
// ============================================================================

function OrdersPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filter, setFilter] = React.useState('all');

  const filteredOrders =
    filter === 'all'
      ? mockOrders
      : mockOrders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text as="h1" size="2xl" weight="bold">
            Orders
          </Text>
          <Text variant="muted">Manage and track customer orders.</Text>
        </div>
        <Button>New Order</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'processing', 'completed', 'cancelled'].map(
                (status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                )
              )}
            </div>
            <Input placeholder="Search orders..." className="sm:w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'success'
                          : order.status === 'pending'
                            ? 'warning'
                            : order.status === 'processing'
                              ? 'secondary'
                              : 'danger'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{order.amount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t border-neutral-200 dark:border-neutral-700">
          <SimplePagination
            page={currentPage}
            totalPages={3}
            onPageChange={setCurrentPage}
          />
        </CardFooter>
      </Card>
    </div>
  );
}

// ============================================================================
// Profile Page
// ============================================================================

interface ProfilePageProps {
  user: UserData;
}

function ProfilePage({ user }: ProfilePageProps) {
  const [firstName, setFirstName] = React.useState(user.name.split(' ')[0]);
  const [lastName, setLastName] = React.useState(user.name.split(' ')[1] || '');
  const [email, setEmail] = React.useState(user.email);
  const [phone, setPhone] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [bioTranscriptionState, setBioTranscriptionState] =
    React.useState<TranscriptionState>('idle');

  const handleBioRecording = (_blob: Blob, _duration: number) => {
    setBioTranscriptionState('transcribing');
    setTimeout(() => {
      setBioTranscriptionState('streaming');
      const mockBio =
        'Passionate software developer with 10 years of experience building web applications.';
      let index = 0;
      const interval = setInterval(() => {
        if (index <= mockBio.length) {
          setBio(mockBio.substring(0, index));
          index++;
        } else {
          clearInterval(interval);
          setBioTranscriptionState('complete');
          setTimeout(() => setBioTranscriptionState('idle'), 500);
        }
      }, 30);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" size="2xl" weight="bold">
          Profile
        </Text>
        <Text variant="muted">
          Manage your personal information and preferences.
        </Text>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              size="xl"
              className="mx-auto"
            />
            <Text size="lg" weight="semibold" className="mt-4">
              {user.name}
            </Text>
            <Text variant="muted">{user.email}</Text>
            <Badge className="mt-2">{user.role}</Badge>
            <Button variant="outline" className="mt-4 w-full">
              Change Photo
            </Button>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PhoneInput
              label="Phone Number"
              value={phone}
              onChange={setPhone}
            />
            {/* Voice-enabled Bio Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Text as="label" size="sm" weight="medium">
                  Bio
                </Text>
                <div className="flex items-center gap-2">
                  <RecordButton
                    size="sm"
                    variant="filled"
                    transcriptionState={bioTranscriptionState}
                    showTranscriptionState
                    onRecordingComplete={handleBioRecording}
                    maxDuration={30}
                  />
                </div>
              </div>
              <Textarea
                placeholder="Tell us about yourself... or record a voice message!"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Voice Notes Page
// ============================================================================

// Sample audio URL for demo purposes
const SAMPLE_AUDIO_URL =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

interface VoiceNote {
  id: string;
  title: string;
  transcript: string;
  duration: number;
  createdAt: string;
  status: 'recording' | 'transcribing' | 'complete';
  audioUrl?: string;
}

function VoiceNotesPage() {
  const [notes, setNotes] = React.useState<VoiceNote[]>([
    {
      id: '1',
      title: 'Meeting Notes',
      transcript:
        'Discussed the Q4 roadmap and assigned tasks to the team. Need to follow up on budget approval.',
      duration: 45,
      createdAt: '2 hours ago',
      status: 'complete',
      audioUrl: SAMPLE_AUDIO_URL,
    },
    {
      id: '2',
      title: 'Project Ideas',
      transcript:
        'New feature idea: Add voice commands for navigation. Users could say "go to dashboard" or "show orders".',
      duration: 32,
      createdAt: 'Yesterday',
      status: 'complete',
      audioUrl: SAMPLE_AUDIO_URL,
    },
    {
      id: '3',
      title: 'Quick Reminder',
      transcript: 'Call the client at 3pm about the contract renewal.',
      duration: 8,
      createdAt: '2 days ago',
      status: 'complete',
      audioUrl: SAMPLE_AUDIO_URL,
    },
  ]);

  const [quickNote, setQuickNote] = React.useState('');
  const [quickNoteState, setQuickNoteState] =
    React.useState<TranscriptionState>('idle');

  const handleQuickNoteRecording = () => {
    setQuickNoteState('transcribing');
    setTimeout(() => {
      setQuickNoteState('streaming');
      const mockText =
        'Remember to update the documentation before the release';
      let index = 0;
      const interval = setInterval(() => {
        if (index <= mockText.length) {
          setQuickNote(mockText.substring(0, index));
          index++;
        } else {
          clearInterval(interval);
          setQuickNoteState('complete');
          setTimeout(() => setQuickNoteState('idle'), 500);
        }
      }, 40);
    }, 500);
  };

  const handleNewRecording = (_blob: Blob, duration: number) => {
    const newNote: VoiceNote = {
      id: Date.now().toString(),
      title: 'New Recording',
      transcript: '',
      duration: Math.round(duration),
      createdAt: 'Just now',
      status: 'transcribing',
    };
    setNotes([newNote, ...notes]);

    // Simulate transcription
    setTimeout(() => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === newNote.id
            ? {
                ...note,
                transcript:
                  'This is a simulated transcription of your voice note. In a real application, this would be processed by a speech-to-text API.',
                status: 'complete',
              }
            : note
        )
      );
    }, 2000);
  };

  const handleSaveQuickNote = () => {
    if (quickNote.trim()) {
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        title: 'Quick Note',
        transcript: quickNote,
        duration: 0,
        createdAt: 'Just now',
        status: 'complete',
      };
      setNotes([newNote, ...notes]);
      setQuickNote('');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text as="h1" size="2xl" weight="bold">
            Voice Notes
          </Text>
          <Text variant="muted">
            Record voice memos with automatic transcription.
          </Text>
        </div>
      </div>

      {/* Quick Voice Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Microphone />
            Quick Voice Input
          </CardTitle>
          <CardDescription>
            Click the mic button and speak your note, or type directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Textarea
                placeholder="Type or speak your note..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                rows={3}
                className="pr-12"
              />
              <div className="absolute right-3 bottom-3">
                <RecordButton
                  size="md"
                  variant="filled"
                  transcriptionState={quickNoteState}
                  showDuration
                  onRecordingComplete={handleQuickNoteRecording}
                  maxDuration={60}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSaveQuickNote} disabled={!quickNote.trim()}>
              <Icons.Send />
              Save Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Audio Recorder Card */}
      <Card>
        <CardHeader>
          <CardTitle>Record a Voice Note</CardTitle>
          <CardDescription>
            Use the full recorder for longer notes with waveform visualization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AudioRecorder
            showWaveform
            showTime
            maxDuration={300}
            onRecordingComplete={handleNewRecording}
          />
        </CardContent>
      </Card>

      {/* Voice Notes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Voice Notes</CardTitle>
              <CardDescription>{notes.length} notes recorded</CardDescription>
            </div>
            <div className="relative">
              <Input placeholder="Search notes..." className="w-48 pr-10" />
              <div className="absolute top-1/2 right-2 -translate-y-1/2">
                <RecordButton size="sm" variant="default" maxDuration={10} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
            >
              {/* Audio Player - inline variant for compact display */}
              {note.status === 'complete' && note.audioUrl ? (
                <AudioPlayer
                  src={note.audioUrl}
                  variant="inline"
                  size="sm"
                  showDuration
                />
              ) : (
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    note.status === 'transcribing'
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {note.status === 'transcribing' ? (
                    <Spinner size="sm" />
                  ) : (
                    <Icons.Microphone />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Text weight="medium">{note.title}</Text>
                    <div className="flex items-center gap-2">
                      <Text size="xs" variant="muted">
                        {note.createdAt}
                      </Text>
                      {note.duration > 0 && (
                        <>
                          <span className="text-neutral-300 dark:text-neutral-600">
                            •
                          </span>
                          <Text size="xs" variant="muted">
                            {formatDuration(note.duration)}
                          </Text>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      note.status === 'complete' ? 'success' : 'secondary'
                    }
                    size="sm"
                  >
                    {note.status === 'transcribing'
                      ? 'Transcribing...'
                      : 'Complete'}
                  </Badge>
                </div>
                <Text size="sm" variant="muted" className="mt-2 line-clamp-2">
                  {note.status === 'transcribing'
                    ? 'Processing your recording...'
                    : note.transcript}
                </Text>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Voice Commands Info */}
      <Alert variant="info">
        <div className="flex items-start gap-3">
          <Icons.Microphone />
          <div>
            <Text weight="medium">Voice Recording Tips</Text>
            <Text size="sm" variant="muted" className="mt-1">
              Speak clearly and at a normal pace. The RecordButton component
              handles microphone access automatically. Maximum recording time is
              5 minutes for full recordings.
            </Text>
          </div>
        </div>
      </Alert>
    </div>
  );
}

// ============================================================================
// Settings Page
// ============================================================================

type SettingsTab = 'notifications' | 'security' | 'appearance';

function SettingsPage() {
  const [activeTab, setActiveTab] =
    React.useState<SettingsTab>('notifications');
  const { resolvedTheme, setTheme } = useThemeContext();

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" size="2xl" weight="bold">
          Settings
        </Text>
        <Text variant="muted">
          Manage your account settings and preferences.
        </Text>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {[
                {
                  id: 'notifications' as const,
                  label: 'Notifications',
                  icon: <Icons.Bell />,
                },
                {
                  id: 'security' as const,
                  label: 'Security',
                  icon: <Icons.Shield />,
                },
                {
                  id: 'appearance' as const,
                  label: 'Appearance',
                  icon: <Icons.Palette />,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  } `}
                >
                  {item.icon}
                  <Text
                    size="sm"
                    weight={activeTab === item.id ? 'semibold' : 'medium'}
                  >
                    {item.label}
                  </Text>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card className="lg:col-span-3">
          {activeTab === 'notifications' && (
            <>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">Email Notifications</Text>
                    <Text size="sm" variant="muted">
                      Receive email updates about your account.
                    </Text>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">Push Notifications</Text>
                    <Text size="sm" variant="muted">
                      Receive push notifications on your devices.
                    </Text>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">SMS Notifications</Text>
                    <Text size="sm" variant="muted">
                      Receive text message alerts.
                    </Text>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Text weight="medium">Marketing Emails</Text>
                    <Text size="sm" variant="muted">
                      Receive emails about new features and offers.
                    </Text>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Text weight="medium">Change Password</Text>
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
                  <Text weight="medium" className="mb-4">
                    Two-Factor Authentication
                  </Text>
                  <CheckboxGroup>
                    <Checkbox value="sms" label="SMS verification" />
                    <Checkbox value="authenticator" label="Authenticator app" />
                    <Checkbox value="email" label="Email verification" />
                  </CheckboxGroup>
                </div>
              </CardContent>
              <CardFooter className="border-t border-neutral-200 dark:border-neutral-700">
                <Button>Update Security Settings</Button>
              </CardFooter>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Text weight="medium" className="mb-4">
                    Theme
                  </Text>
                  <RadioGroup
                    value={resolvedTheme}
                    onValueChange={(value) =>
                      setTheme(value as 'light' | 'dark')
                    }
                  >
                    <Radio value="light" label="Light" />
                    <Radio value="dark" label="Dark" />
                  </RadioGroup>
                </div>
                <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
                  <Text weight="medium" className="mb-4">
                    Preview
                  </Text>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      className={`w-full cursor-pointer rounded-lg border-2 p-4 ${resolvedTheme === 'light' ? 'border-primary-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="rounded bg-white p-3 shadow-sm">
                        <div className="mb-2 h-2 w-16 rounded bg-neutral-200" />
                        <div className="h-2 w-24 rounded bg-neutral-100" />
                      </div>
                      <Text size="sm" className="mt-2 text-center">
                        Light
                      </Text>
                    </button>
                    <button
                      type="button"
                      className={`w-full cursor-pointer rounded-lg border-2 p-4 ${resolvedTheme === 'dark' ? 'border-primary-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="rounded bg-neutral-800 p-3 shadow-sm">
                        <div className="mb-2 h-2 w-16 rounded bg-neutral-600" />
                        <div className="h-2 w-24 rounded bg-neutral-700" />
                      </div>
                      <Text size="sm" className="mt-2 text-center">
                        Dark
                      </Text>
                    </button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Main App Shell
// ============================================================================

function AppShell() {
  const [currentPage, setCurrentPage] = React.useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [loggedOut, setLoggedOut] = React.useState(false);

  const handleLogout = () => {
    setLoggedOut(true);
  };

  if (loggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary-500 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold text-white">
              M
            </div>
            <CardTitle>You&apos;ve been logged out</CardTitle>
            <CardDescription>Thanks for using MieWeb UI</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLoggedOut(false)}>
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBreadcrumbs = () => {
    const breadcrumbs: { label: string; href?: string }[] = [
      { label: 'Home', href: '#' },
    ];

    switch (currentPage) {
      case 'dashboard':
        breadcrumbs.push({ label: 'Dashboard' });
        break;
      case 'users':
        breadcrumbs.push({ label: 'Users' });
        break;
      case 'analytics':
        breadcrumbs.push({ label: 'Analytics' });
        break;
      case 'orders':
        breadcrumbs.push({ label: 'Orders' });
        break;
      case 'profile':
        breadcrumbs.push({ label: 'Profile' });
        break;
      case 'settings':
        breadcrumbs.push({ label: 'Settings' });
        break;
      case 'voice-notes':
        breadcrumbs.push({ label: 'Voice Notes' });
        break;
    }

    return breadcrumbs;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return <UsersPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'orders':
        return <OrdersPage />;
      case 'profile':
        return <ProfilePage user={mockUser} />;
      case 'settings':
        return <SettingsPage />;
      case 'voice-notes':
        return <VoiceNotesPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        <Header
          user={mockUser}
          onMenuToggle={() => setSidebarOpen(true)}
          onProfile={() => setCurrentPage('profile')}
          onSettings={() => setCurrentPage('settings')}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-4">
            <Breadcrumb items={getBreadcrumbs()} />
          </div>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// Dashboard Story (Full Application)
// ============================================================================

export const Dashboard: StoryObj = {
  render: () => (
    <ThemeProvider defaultTheme="light" storageKey="mieweb-dashboard-theme">
      <AppShell />
    </ThemeProvider>
  ),
};

// ============================================================================
// Dashboard Dark Story
// ============================================================================

export const DashboardDark: StoryObj = {
  render: () => (
    <ThemeProvider defaultTheme="dark" storageKey="mieweb-dashboard-dark-theme">
      <AppShell />
    </ThemeProvider>
  ),
};

// ============================================================================
// All Components Story
// ============================================================================

export const AllComponents: StoryObj = {
  render: () => (
    <div className="bg-background min-h-screen p-8">
      <Text as="h1" size="3xl" weight="bold" className="mb-8">
        Component Showcase
      </Text>

      {/* Alerts */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Alerts
        </Text>
        <div className="space-y-4">
          <Alert variant="info">This is an info alert.</Alert>
          <Alert variant="success">This is a success alert.</Alert>
          <Alert variant="warning">This is a warning alert.</Alert>
          <Alert variant="danger">This is a danger alert.</Alert>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Badges
        </Text>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Buttons
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Form Controls */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Form Controls
        </Text>
        <div className="grid max-w-md gap-4">
          <Input label="Text Input" placeholder="Enter text..." />
          <Input label="With Error" error="This field is required" />
          <Textarea label="Textarea" placeholder="Enter description..." />
          <DateInput label="Date Input" />
          <Select
            label="Select"
            placeholder="Choose an option"
            options={[
              { value: '1', label: 'Option 1' },
              { value: '2', label: 'Option 2' },
              { value: '3', label: 'Option 3' },
            ]}
          />
          <PhoneInput label="Phone" placeholder="(555) 123-4567" />
        </div>
      </section>

      {/* Checkboxes & Radio */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Checkboxes & Radio
        </Text>
        <div className="grid gap-6 md:grid-cols-2">
          <CheckboxGroup label="Interests">
            <Checkbox value="sports" label="Sports" />
            <Checkbox value="music" label="Music" />
            <Checkbox value="art" label="Art" />
          </CheckboxGroup>
          <RadioGroup label="Size" defaultValue="md">
            <Radio value="sm" label="Small" />
            <Radio value="md" label="Medium" />
            <Radio value="lg" label="Large" />
          </RadioGroup>
        </div>
      </section>

      {/* Progress */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Progress
        </Text>
        <div className="space-y-4">
          <Progress value={25} label="25%" />
          <Progress value={50} label="50%" />
          <Progress value={75} label="75%" />
          <div className="flex gap-4">
            <CircularProgress value={25} size="sm" />
            <CircularProgress value={50} size="md" />
            <CircularProgress value={75} size="lg" />
          </div>
        </div>
      </section>

      {/* Spinners */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Spinners
        </Text>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <SpinnerWithLabel label="Loading..." />
        </div>
      </section>

      {/* Skeleton */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Skeleton
        </Text>
        <div className="max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <SkeletonText lines={3} />
          <SkeletonCard />
        </div>
      </section>

      {/* Tooltips */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Tooltips
        </Text>
        <div className="flex gap-4">
          <Tooltip content="Top tooltip" placement="top">
            <Button variant="outline">Top</Button>
          </Tooltip>
          <Tooltip content="Right tooltip" placement="right">
            <Button variant="outline">Right</Button>
          </Tooltip>
          <Tooltip content="Bottom tooltip" placement="bottom">
            <Button variant="outline">Bottom</Button>
          </Tooltip>
          <Tooltip content="Left tooltip" placement="left">
            <Button variant="outline">Left</Button>
          </Tooltip>
        </div>
      </section>

      {/* Pagination */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Pagination
        </Text>
        <div className="space-y-4">
          <Pagination page={1} totalPages={10} onPageChange={() => {}} />
          <SimplePagination page={1} totalPages={10} onPageChange={() => {}} />
        </div>
      </section>
    </div>
  ),
};

// ============================================================================
// All Components Dark Story
// ============================================================================

export const AllComponentsDark: StoryObj = {
  render: () => (
    <div className="dark bg-background min-h-screen p-8">
      <Text as="h1" size="3xl" weight="bold" className="mb-2">
        Component Showcase (Dark Mode)
      </Text>
      <Text variant="muted" className="mb-8">
        All components automatically adapt to the dark theme. Use the theme
        toggle in the toolbar to switch themes.
      </Text>

      {/* Sample Components in Dark Mode */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Sample Components
        </Text>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dark Mode Card</CardTitle>
              <CardDescription>
                Cards and other components automatically adapt their colors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input label="Input" placeholder="Enter text..." />
              <Select
                label="Select"
                placeholder="Choose..."
                options={[{ value: '1', label: 'Option 1' }]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alerts in Dark Mode */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Alerts
        </Text>
        <div className="space-y-2">
          <Alert variant="info">Info alert in dark mode.</Alert>
          <Alert variant="success">Success alert in dark mode.</Alert>
          <Alert variant="warning">Warning alert in dark mode.</Alert>
          <Alert variant="danger">Danger alert in dark mode.</Alert>
        </div>
      </section>

      {/* Typography in Dark Mode */}
      <section className="mb-8">
        <Text as="h2" size="2xl" weight="bold" className="mb-4">
          Typography
        </Text>
        <div className="space-y-3">
          <Text>Default foreground text adapts to dark theme.</Text>
          <Text variant="muted">Muted text remains readable.</Text>
          <Text variant="primary">Primary text uses brand colors.</Text>
          <Text variant="success">Success text stays green.</Text>
          <Text variant="warning">Warning text stays amber.</Text>
          <Text variant="destructive">Destructive text stays red.</Text>
        </div>
      </section>
    </div>
  ),
};
