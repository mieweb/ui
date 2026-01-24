import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { LucideIcon } from 'lucide-react';

// Import all icons from our Icons module
import * as Icons from './index';

const meta: Meta = {
  title: 'Components/Icons',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// ============================================================================
// Icon Categories
// ============================================================================

interface IconInfo {
  name: string;
  component: LucideIcon;
}

const iconCategories: Record<string, IconInfo[]> = {
  'Navigation & UI': [
    { name: 'HomeIcon', component: Icons.HomeIcon },
    { name: 'MenuIcon', component: Icons.MenuIcon },
    { name: 'CloseIcon', component: Icons.CloseIcon },
    { name: 'ChevronDownIcon', component: Icons.ChevronDownIcon },
    { name: 'ChevronUpIcon', component: Icons.ChevronUpIcon },
    { name: 'ChevronLeftIcon', component: Icons.ChevronLeftIcon },
    { name: 'ChevronRightIcon', component: Icons.ChevronRightIcon },
    { name: 'ArrowLeftIcon', component: Icons.ArrowLeftIcon },
    { name: 'ArrowRightIcon', component: Icons.ArrowRightIcon },
    { name: 'ExternalLinkIcon', component: Icons.ExternalLinkIcon },
    { name: 'MoreHorizontalIcon', component: Icons.MoreHorizontalIcon },
    { name: 'MoreVerticalIcon', component: Icons.MoreVerticalIcon },
  ],
  'User & Account': [
    { name: 'UserIcon', component: Icons.UserIcon },
    { name: 'UsersIcon', component: Icons.UsersIcon },
    { name: 'UserPlusIcon', component: Icons.UserPlusIcon },
    { name: 'UserMinusIcon', component: Icons.UserMinusIcon },
    { name: 'UserCheckIcon', component: Icons.UserCheckIcon },
    { name: 'CircleUserIcon', component: Icons.CircleUserIcon },
    { name: 'LogInIcon', component: Icons.LogInIcon },
    { name: 'LogOutIcon', component: Icons.LogOutIcon },
  ],
  Actions: [
    { name: 'PlusIcon', component: Icons.PlusIcon },
    { name: 'MinusIcon', component: Icons.MinusIcon },
    { name: 'PencilIcon', component: Icons.PencilIcon },
    { name: 'TrashIcon', component: Icons.TrashIcon },
    { name: 'CopyIcon', component: Icons.CopyIcon },
    { name: 'CheckIcon', component: Icons.CheckIcon },
    { name: 'SearchIcon', component: Icons.SearchIcon },
    { name: 'FilterIcon', component: Icons.FilterIcon },
    { name: 'DownloadIcon', component: Icons.DownloadIcon },
    { name: 'UploadIcon', component: Icons.UploadIcon },
    { name: 'ShareIcon', component: Icons.ShareIcon },
    { name: 'SaveIcon', component: Icons.SaveIcon },
    { name: 'RefreshIcon', component: Icons.RefreshIcon },
  ],
  'Status & Feedback': [
    { name: 'AlertCircleIcon', component: Icons.AlertCircleIcon },
    { name: 'AlertTriangleIcon', component: Icons.AlertTriangleIcon },
    { name: 'CheckCircleIcon', component: Icons.CheckCircleIcon },
    { name: 'XCircleIcon', component: Icons.XCircleIcon },
    { name: 'InfoIcon', component: Icons.InfoIcon },
    { name: 'HelpCircleIcon', component: Icons.HelpCircleIcon },
    { name: 'LoaderIcon', component: Icons.LoaderIcon },
  ],
  Communication: [
    { name: 'BellIcon', component: Icons.BellIcon },
    { name: 'BellOffIcon', component: Icons.BellOffIcon },
    { name: 'MailIcon', component: Icons.MailIcon },
    { name: 'MessageIcon', component: Icons.MessageIcon },
    { name: 'PhoneIcon', component: Icons.PhoneIcon },
    { name: 'SendIcon', component: Icons.SendIcon },
  ],
  'Media & Files': [
    { name: 'FileIcon', component: Icons.FileIcon },
    { name: 'FileTextIcon', component: Icons.FileTextIcon },
    { name: 'FolderIcon', component: Icons.FolderIcon },
    { name: 'FolderOpenIcon', component: Icons.FolderOpenIcon },
    { name: 'ImageIcon', component: Icons.ImageIcon },
    { name: 'CameraIcon', component: Icons.CameraIcon },
    { name: 'PaperclipIcon', component: Icons.PaperclipIcon },
  ],
  'Data & Charts': [
    { name: 'ChartIcon', component: Icons.ChartIcon },
    { name: 'TrendingUpIcon', component: Icons.TrendingUpIcon },
    { name: 'TrendingDownIcon', component: Icons.TrendingDownIcon },
    { name: 'PieChartIcon', component: Icons.PieChartIcon },
    { name: 'ActivityIcon', component: Icons.ActivityIcon },
  ],
  'Settings & Tools': [
    { name: 'SettingsIcon', component: Icons.SettingsIcon },
    { name: 'SlidersIcon', component: Icons.SlidersIcon },
    { name: 'WrenchIcon', component: Icons.WrenchIcon },
    { name: 'CogIcon', component: Icons.CogIcon },
  ],
  'Time & Calendar': [
    { name: 'CalendarIcon', component: Icons.CalendarIcon },
    { name: 'ClockIcon', component: Icons.ClockIcon },
    { name: 'TimerIcon', component: Icons.TimerIcon },
    { name: 'HistoryIcon', component: Icons.HistoryIcon },
  ],
  'Layout & View': [
    { name: 'GridIcon', component: Icons.GridIcon },
    { name: 'ListIcon', component: Icons.ListIcon },
    { name: 'TableIcon', component: Icons.TableIcon },
    { name: 'ColumnsIcon', component: Icons.ColumnsIcon },
    { name: 'MaximizeIcon', component: Icons.MaximizeIcon },
    { name: 'MinimizeIcon', component: Icons.MinimizeIcon },
    { name: 'EyeIcon', component: Icons.EyeIcon },
    { name: 'EyeOffIcon', component: Icons.EyeOffIcon },
  ],
  Theme: [
    { name: 'SunIcon', component: Icons.SunIcon },
    { name: 'MoonIcon', component: Icons.MoonIcon },
    { name: 'MonitorIcon', component: Icons.MonitorIcon },
    { name: 'PaletteIcon', component: Icons.PaletteIcon },
  ],
  Security: [
    { name: 'ShieldIcon', component: Icons.ShieldIcon },
    { name: 'ShieldCheckIcon', component: Icons.ShieldCheckIcon },
    { name: 'ShieldPlusIcon', component: Icons.ShieldPlusIcon },
    { name: 'LockIcon', component: Icons.LockIcon },
    { name: 'UnlockIcon', component: Icons.UnlockIcon },
    { name: 'KeyIcon', component: Icons.KeyIcon },
  ],
  'Healthcare & Medical': [
    { name: 'HospitalIcon', component: Icons.HospitalIcon },
    { name: 'AmbulanceIcon', component: Icons.AmbulanceIcon },
    { name: 'StethoscopeIcon', component: Icons.StethoscopeIcon },
    { name: 'BriefcaseMedicalIcon', component: Icons.BriefcaseMedicalIcon },
    { name: 'HeartPulseIcon', component: Icons.HeartPulseIcon },
    { name: 'ActivityIcon', component: Icons.ActivityIcon },
    { name: 'PillIcon', component: Icons.PillIcon },
    { name: 'TabletsIcon', component: Icons.TabletsIcon },
    { name: 'SyringeIcon', component: Icons.SyringeIcon },
    { name: 'TestTubeIcon', component: Icons.TestTubeIcon },
    { name: 'TestTubesIcon', component: Icons.TestTubesIcon },
    { name: 'FlaskIcon', component: Icons.FlaskIcon },
    { name: 'FlaskRoundIcon', component: Icons.FlaskRoundIcon },
    { name: 'MicroscopeIcon', component: Icons.MicroscopeIcon },
    { name: 'DnaIcon', component: Icons.DnaIcon },
    { name: 'BrainIcon', component: Icons.BrainIcon },
    { name: 'BoneIcon', component: Icons.BoneIcon },
    { name: 'BandageIcon', component: Icons.BandageIcon },
    { name: 'ThermometerIcon', component: Icons.ThermometerIcon },
    { name: 'DropletIcon', component: Icons.DropletIcon },
    { name: 'DropletsIcon', component: Icons.DropletsIcon },
    { name: 'BedIcon', component: Icons.BedIcon },
    { name: 'BedDoubleIcon', component: Icons.BedDoubleIcon },
    { name: 'BabyIcon', component: Icons.BabyIcon },
    { name: 'AccessibilityIcon', component: Icons.AccessibilityIcon },
    { name: 'EarIcon', component: Icons.EarIcon },
    { name: 'GlassesIcon', component: Icons.GlassesIcon },
    { name: 'ScanIcon', component: Icons.ScanIcon },
    { name: 'ScanEyeIcon', component: Icons.ScanEyeIcon },
    { name: 'RadiationIcon', component: Icons.RadiationIcon },
    { name: 'BiohazardIcon', component: Icons.BiohazardIcon },
    { name: 'WeightIcon', component: Icons.WeightIcon },
    { name: 'ScaleIcon', component: Icons.ScaleIcon },
    { name: 'RulerIcon', component: Icons.RulerIcon },
    { name: 'ClipboardPlusIcon', component: Icons.ClipboardPlusIcon },
    { name: 'ClipboardCheckIcon', component: Icons.ClipboardCheckIcon },
    { name: 'FileHeartIcon', component: Icons.FileHeartIcon },
    { name: 'FilePlusIcon', component: Icons.FilePlusIcon },
    { name: 'FileCheckIcon', component: Icons.FileCheckIcon },
    { name: 'PatientIcon', component: Icons.PatientIcon },
    { name: 'UserRoundCheckIcon', component: Icons.UserRoundCheckIcon },
    { name: 'UserRoundPlusIcon', component: Icons.UserRoundPlusIcon },
    { name: 'CrossIcon', component: Icons.CrossIcon },
    { name: 'AllergyIcon', component: Icons.AllergyIcon },
    { name: 'CigaretteIcon', component: Icons.CigaretteIcon },
    { name: 'CigaretteOffIcon', component: Icons.CigaretteOffIcon },
    { name: 'BadgeCheckIcon', component: Icons.BadgeCheckIcon },
    { name: 'BadgeAlertIcon', component: Icons.BadgeAlertIcon },
  ],
  Misc: [
    { name: 'HeartIcon', component: Icons.HeartIcon },
    { name: 'StarIcon', component: Icons.StarIcon },
    { name: 'BookmarkIcon', component: Icons.BookmarkIcon },
    { name: 'FlagIcon', component: Icons.FlagIcon },
    { name: 'TagIcon', component: Icons.TagIcon },
    { name: 'HashIcon', component: Icons.HashIcon },
    { name: 'AtSignIcon', component: Icons.AtSignIcon },
    { name: 'LinkIcon', component: Icons.LinkIcon },
    { name: 'ClipboardIcon', component: Icons.ClipboardIcon },
    { name: 'ClipboardListIcon', component: Icons.ClipboardListIcon },
    { name: 'MapPinIcon', component: Icons.MapPinIcon },
    { name: 'GlobeIcon', component: Icons.GlobeIcon },
    { name: 'BuildingIcon', component: Icons.BuildingIcon },
    { name: 'BriefcaseIcon', component: Icons.BriefcaseIcon },
    { name: 'CreditCardIcon', component: Icons.CreditCardIcon },
    { name: 'DollarSignIcon', component: Icons.DollarSignIcon },
    { name: 'ZapIcon', component: Icons.ZapIcon },
    { name: 'SparklesIcon', component: Icons.SparklesIcon },
  ],
};

// ============================================================================
// Icon Card Component
// ============================================================================

interface IconCardProps {
  name: string;
  Icon: LucideIcon;
}

function IconCard({ name, Icon }: IconCardProps) {
  const [copied, setCopied] = React.useState(false);

  const copyImport = () => {
    navigator.clipboard.writeText(`import { ${name} } from '@mieweb/ui';`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copyImport}
      className="border-border bg-card hover:bg-muted/50 hover:border-primary-300 group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-all"
      title={`Click to copy import for ${name}`}
    >
      <Icon className="text-foreground group-hover:text-primary-500 h-6 w-6 transition-colors" />
      <span className="text-muted-foreground group-hover:text-foreground text-center text-xs break-all transition-colors">
        {copied ? '✓ Copied!' : name.replace('Icon', '')}
      </span>
    </button>
  );
}

// ============================================================================
// Icon Section Component
// ============================================================================

interface IconSectionProps {
  title: string;
  icons: IconInfo[];
}

function IconSection({ title, icons }: IconSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-foreground mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {icons.map((icon) => (
          <IconCard key={icon.name} name={icon.name} Icon={icon.component} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Icons Page
// ============================================================================

function IconsPage() {
  const [search, setSearch] = React.useState('');

  // Filter icons based on search
  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return iconCategories;

    const searchLower = search.toLowerCase();
    const result: Record<string, IconInfo[]> = {};

    for (const [category, icons] of Object.entries(iconCategories)) {
      const filtered = icons.filter((icon) =>
        icon.name.toLowerCase().includes(searchLower)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }

    return result;
  }, [search]);

  const totalIcons = Object.values(iconCategories).flat().length;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">Icons</h1>
          <p className="text-muted-foreground mb-4">
            {totalIcons} icons powered by{' '}
            <a
              href="https://lucide.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              Lucide React
            </a>
            . Click any icon to copy its import statement.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Icons.SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Icon Categories */}
        {Object.entries(filteredCategories).map(([category, icons]) => (
          <IconSection key={category} title={category} icons={icons} />
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-muted-foreground py-12 text-center">
            No icons found matching &ldquo;{search}&rdquo;
          </div>
        )}

        {/* Usage Example */}
        <div className="bg-card border-border mt-12 rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-xl font-bold">Usage</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-foreground mb-2 font-semibold">
                Import from @mieweb/ui:
              </h3>
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono">
                {`import { HomeIcon, UserIcon, SettingsIcon } from '@mieweb/ui';

function MyComponent() {
  return (
    <button>
      <HomeIcon className="h-5 w-5" />
      Home
    </button>
  );
}`}
              </pre>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">
                Or import directly from lucide-react:
              </h3>
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono">
                {`import { Accessibility, AlertOctagon } from 'lucide-react';

// Full icon set available at https://lucide.dev/icons`}
              </pre>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">
                Styling with Tailwind:
              </h3>
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono">
                {`<HomeIcon className="h-4 w-4" />           {/* 16px */}
<HomeIcon className="h-5 w-5" />           {/* 20px - default */}
<HomeIcon className="h-6 w-6" />           {/* 24px */}
<HomeIcon className="text-primary-500" />  {/* Brand color */}
<HomeIcon className="text-muted-foreground" /> {/* Muted */}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => <IconsPage />,
};
