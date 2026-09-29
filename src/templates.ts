// @mieweb/ui/templates — landing-page sections and the LandingPage renderer.
// Nothing reachable from this entry uses client-only React APIs, so Server
// Components can import it directly (see src/templates/server-safe.test.ts).
export * from './components/LandingPage';
export * from './components/HeroSection';
export * from './components/CtaSection';
export * from './components/LeadFormSection';
export * from './components/PricingSection';
export * from './components/FeatureGridSection';
export * from './components/SplitContentSection';
export * from './components/VideoSection';
export * from './components/ProcessStepsSection';
export * from './components/ComparisonSection';
export * from './components/FaqSection';
export * from './components/ResourceCardsSection';
export * from './components/StatsSection';
export * from './components/LogoCloudSection';
export * from './components/TestimonialSection';
export {
  SectionShell,
  SectionHeading,
  type SectionShellProps,
  type SectionHeadingProps,
} from './templates/Section';
export {
  templateIcons,
  TemplateIcon,
  type TemplateIconName,
  type TemplateIconProps,
  type TemplateIconRegistry,
  type TemplateIconComponent,
} from './templates/icons';
export type {
  SectionAlign,
  SectionBaseProps,
  SectionTone,
  TemplateComponents,
  TemplateImage,
  TemplateImageProps,
  TemplateLink,
  TemplateLinkProps,
} from './templates/types';
