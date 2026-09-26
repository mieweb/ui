import type * as React from 'react';
import {
  Activity,
  Award,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  ChartColumn,
  ChartLine,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Cloud,
  Database,
  DollarSign,
  Factory,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Handshake,
  HardHat,
  Headset,
  HeartPulse,
  Hospital,
  Layers,
  Leaf,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Microscope,
  Phone,
  Plane,
  Plug,
  Rocket,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Syringe,
  Target,
  Timer,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';

export type TemplateIconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

/** Extra icon tokens a site maps to its own components; merged over the built-ins. */
export type TemplateIconRegistry = Record<string, TemplateIconComponent>;

/**
 * Built-in icon tokens. Page data names an icon by token (`"shield-check"`)
 * rather than holding a component, so it stays JSON-serializable.
 */
export const templateIcons = {
  activity: Activity,
  award: Award,
  'badge-check': BadgeCheck,
  bell: Bell,
  briefcase: Briefcase,
  building: Building2,
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  'chart-column': ChartColumn,
  'chart-line': ChartLine,
  'circle-check': CircleCheck,
  'clipboard-check': ClipboardCheck,
  clock: Clock,
  cloud: Cloud,
  database: Database,
  'dollar-sign': DollarSign,
  factory: Factory,
  'file-text': FileText,
  flask: FlaskConical,
  globe: Globe,
  'graduation-cap': GraduationCap,
  handshake: Handshake,
  'hard-hat': HardHat,
  headset: Headset,
  'heart-pulse': HeartPulse,
  hospital: Hospital,
  layers: Layers,
  leaf: Leaf,
  lightbulb: Lightbulb,
  lock: Lock,
  mail: Mail,
  'map-pin': MapPin,
  'message-square': MessageSquare,
  microscope: Microscope,
  phone: Phone,
  plane: Plane,
  plug: Plug,
  rocket: Rocket,
  scale: Scale,
  search: Search,
  settings: Settings,
  shield: Shield,
  'shield-check': ShieldCheck,
  smartphone: Smartphone,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  syringe: Syringe,
  target: Target,
  timer: Timer,
  'trending-up': TrendingUp,
  truck: Truck,
  'user-check': UserCheck,
  users: Users,
  workflow: Workflow,
  wrench: Wrench,
  zap: Zap,
} satisfies TemplateIconRegistry;

export type TemplateIconName = keyof typeof templateIcons;

export interface TemplateIconProps {
  /** A built-in token, a token from `icons`, or a lettermark of up to four characters. */
  name: string;
  icons?: TemplateIconRegistry;
  className?: string;
}

export function TemplateIcon({ name, icons, className }: TemplateIconProps) {
  const Icon: TemplateIconComponent | undefined =
    icons?.[name] ?? (templateIcons as TemplateIconRegistry)[name];
  if (Icon)
    return (
      <Icon
        aria-hidden="true"
        strokeWidth={1.75}
        className={cn('size-5', className)}
      />
    );
  if (name.length <= 4)
    return (
      <span
        aria-hidden="true"
        className={cn('text-xs font-bold tracking-wide', className)}
      >
        {name}
      </span>
    );
  return null;
}
