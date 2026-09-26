import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  TemplateAnchor,
  mutedTextClass,
} from '../../templates/Section';
import type {
  SectionBaseProps,
  TemplateComponents,
} from '../../templates/types';

export interface LogoItem {
  name: string;
  /** Logo image; without it the name renders as a wordmark. */
  src?: string;
  href?: string;
}

export interface LogoCloudSectionProps extends SectionBaseProps {
  logos: LogoItem[];
  /** `marquee` loops the row horizontally; it holds still under reduced motion. */
  variant?: 'grid' | 'marquee';
  speed?: 'slow' | 'normal' | 'fast';
}

const duration = { slow: '60s', normal: '40s', fast: '25s' } as const;

function Logo({
  logo,
  tone,
  hidden,
  components,
}: {
  logo: LogoItem;
  tone: LogoCloudSectionProps['tone'];
  hidden?: boolean;
  components?: TemplateComponents;
}) {
  // Plain <img>: logos have no intrinsic size to hand an image optimizer.
  const mark = logo.src ? (
    <img
      src={logo.src}
      alt={hidden ? '' : logo.name}
      loading="lazy"
      decoding="async"
      className={cn(
        'h-8 w-auto max-w-[9rem] object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0',
        // Logos are drawn white on dark surfaces so dark wordmarks stay visible.
        tone === 'brand'
          ? 'brightness-0 invert'
          : 'dark:brightness-0 dark:invert'
      )}
    />
  ) : (
    <span
      className={cn(
        'text-lg font-semibold whitespace-nowrap',
        mutedTextClass(tone ?? 'default')
      )}
    >
      {logo.name}
    </span>
  );
  return logo.href ? (
    <TemplateAnchor
      href={logo.href}
      components={components}
      tabIndex={hidden ? -1 : undefined}
      className="focus-visible:ring-ring inline-flex rounded focus-visible:ring-2 focus-visible:outline-none"
    >
      {mark}
    </TemplateAnchor>
  ) : (
    mark
  );
}

export const LogoCloudSection = React.forwardRef<
  HTMLElement,
  LogoCloudSectionProps
>(
  (
    {
      logos,
      variant = 'grid',
      speed = 'normal',
      tone = 'default',
      align = 'center',
      components,
      ...rest
    },
    ref
  ) => (
    <SectionShell
      ref={ref}
      data-slot="logo-cloud-section"
      tone={tone}
      align={align}
      spacing="compact"
      {...rest}
    >
      {variant === 'marquee' ? (
        <div
          className="mie-marquee-host mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]"
          style={
            { '--mie-marquee-duration': duration[speed] } as React.CSSProperties
          }
        >
          <ul className="mie-marquee flex w-max items-center">
            {logos.map((logo) => (
              <li key={logo.name} className="shrink-0 pe-12">
                <Logo logo={logo} tone={tone} components={components} />
              </li>
            ))}
            {/* Second copy completes the loop; hidden from assistive tech. */}
            {logos.map((logo) => (
              <li
                key={`${logo.name}-copy`}
                data-duplicate=""
                aria-hidden="true"
                className="shrink-0 pe-12"
              >
                <Logo logo={logo} tone={tone} components={components} hidden />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((logo) => (
            <li key={logo.name}>
              <Logo logo={logo} tone={tone} components={components} />
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  )
);
LogoCloudSection.displayName = 'LogoCloudSection';
