import * as React from 'react';
import { cn } from '../../utils/cn';
import { SectionShell, mutedTextClass } from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';

interface VideoBase {
  /** Accessible name of the player, e.g. "Product tour (3 min)". */
  title: string;
}

export type VideoSource =
  | (VideoBase & {
      /** Embeds `youtube-nocookie.com`, which sets no cookies until playback. Captions come from YouTube. */
      youtubeId: string;
    })
  | (VideoBase & {
      /** A self-hosted file, played with the native `<video>` element. */
      src: string;
      /** Still frame shown before playback. */
      poster?: string;
      /** WebVTT captions — required, because prerecorded speech needs captions (WCAG 1.2.2). */
      captions: { src: string; srcLang: string; label: string };
    });

export interface VideoSectionProps extends SectionBaseProps {
  video: VideoSource;
  /** Caption under the player. */
  caption?: string;
}

export const VideoSection = React.forwardRef<HTMLElement, VideoSectionProps>(
  ({ video, caption, tone = 'default', align = 'center', ...rest }, ref) => (
    <SectionShell
      ref={ref}
      data-slot="video-section"
      tone={tone}
      align={align}
      {...rest}
    >
      <figure className="mx-auto mt-12 max-w-5xl">
        <div className="aspect-video overflow-hidden rounded-2xl bg-neutral-900 shadow-xl">
          {'youtubeId' in video ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}`}
              title={video.title}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full border-0"
            />
          ) : (
            <video
              src={video.src}
              poster={video.poster}
              title={video.title}
              aria-label={video.title}
              controls
              preload="none"
              className="size-full object-cover"
            >
              <track
                kind="captions"
                src={video.captions.src}
                srcLang={video.captions.srcLang}
                label={video.captions.label}
                default
              />
            </video>
          )}
        </div>
        {caption && (
          <figcaption
            className={cn(
              'mt-3 text-sm',
              mutedTextClass(tone),
              align === 'center' && 'text-center'
            )}
          >
            {caption}
          </figcaption>
        )}
      </figure>
    </SectionShell>
  )
);
VideoSection.displayName = 'VideoSection';
