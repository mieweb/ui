import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../utils/fileSize';
import type { SuperChatFileAttachment } from './types';

/** A file's extension, upper case ("PDF"), or '' with none. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1
    ? name.slice(dot + 1).toUpperCase()
    : '';
}

/** Icon and tint by type, as a document reads at a glance. */
const FILE_KINDS: {
  match: string[];
  Icon: typeof File;
  tint: string;
}[] = [
  {
    match: ['PDF'],
    Icon: FileText,
    tint: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  {
    match: ['DOC', 'DOCX', 'ODT', 'RTF', 'TXT', 'MD', 'PAGES'],
    Icon: FileText,
    tint: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    match: ['XLS', 'XLSX', 'ODS', 'CSV', 'TSV', 'NUMBERS'],
    Icon: FileSpreadsheet,
    tint: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  },
  {
    match: ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'],
    Icon: FileArchive,
    tint: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    match: ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'HEIC', 'SVG'],
    Icon: FileImage,
    tint: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    match: ['MP4', 'MOV', 'WEBM', 'MKV', 'AVI'],
    Icon: FileVideo,
    tint: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    match: ['MP3', 'WAV', 'M4A', 'AAC', 'OGG', 'FLAC'],
    Icon: FileAudio,
    tint: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
];

const OTHER_FILE = {
  Icon: File,
  tint: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
};

/**
 * A message's documents, as one tile beside its bubble (WhatsApp, Slack,
 * Telegram): a row per file with its type's icon, its name, and its type and
 * size. A row opens the file in a new tab.
 */
export function MessageFiles({
  files,
  maxSize,
}: {
  files: SuperChatFileAttachment[];
  /** The tile's width, a CSS length (`mediaMaxSize`). */
  maxSize: string;
}) {
  return (
    <ul
      data-slot="superchat-message-files"
      style={{ width: maxSize }}
      className="max-w-full divide-y divide-neutral-200 bg-neutral-100 text-neutral-900 dark:divide-neutral-700 dark:bg-neutral-800 dark:text-white"
    >
      {files.map((file) => {
        const type = extensionOf(file.name);
        const { Icon, tint } =
          FILE_KINDS.find((kind) => kind.match.includes(type)) ?? OTHER_FILE;
        const details = [
          type,
          file.size !== undefined && formatFileSize(file.size),
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={file.id}>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              title={file.name}
              className="focus-visible:ring-ring flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-200/60 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-neutral-700/60"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  tint
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {file.name}
                </span>
                {details && (
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {details}
                  </span>
                )}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
