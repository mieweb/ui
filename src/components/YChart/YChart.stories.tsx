import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// --- Inline React wrapper for the vanilla YChartEditor class ---

interface YChartProps {
  /** YAML data to render */
  yamlData?: string;
  /** Chart width */
  width?: string;
  /** Chart height */
  height?: string;
  /** Node width */
  nodeWidth?: number;
  /** Node height */
  nodeHeight?: number;
  /** Enable collapsible nodes */
  collapsible?: boolean;
  /** Editor theme */
  editorTheme?: 'dark' | 'light';
  /** Storybook color mode */
  storyTheme?: 'dark' | 'light';
  /** Toolbar position */
  toolbarPosition?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | 'topcenter' | 'bottomcenter';
}

interface YChartEditorInstance {
  initView(container: HTMLElement, yamlData: string): void;
  destroy?: () => void;
}

type YChartEditorConstructor = new (options: Omit<YChartProps, 'yamlData' | 'width' | 'height' | 'storyTheme'>) => YChartEditorInstance;

const storyLayoutStyles = `
  html,
  body,
  #storybook-root {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  [data-ychart-story-root] {
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  [data-ychart-story-root][data-yc-theme="light"] {
    --yc-color-chart-bg: #f8fafc;
    --yc-color-card-bg: #ffffff;
    --yc-color-card-text: #172033;
    --yc-color-card-muted: #526071;
    --yc-color-card-border: #536dfe;
    --yc-color-bg-primary: #ffffff;
    --yc-color-bg-card: #ffffff;
    --yc-color-bg-secondary: #f1f5f9;
    --yc-color-bg-tertiary: #f8fafc;
    --yc-color-editor-bg: #f8fafc;
    --yc-color-editor-border: #d7deea;
    --yc-color-editor-text: #172033;
    --yc-color-gray-50: #f8fafc;
    --yc-color-gray-100: #f1f5f9;
    --yc-color-gray-200: #e8edf5;
    --yc-color-gray-300: #d7deea;
    --yc-color-gray-400: #c6cfdd;
    --yc-color-gray-500: #a8b3c4;
    --yc-color-gray-600: #718096;
    --yc-color-gray-700: #526071;
    --yc-color-gray-800: #172033;
    --yc-color-icon: #465467;
    --yc-color-overlay-bg: rgba(255, 255, 255, 0.96);
    --yc-color-pattern: rgba(83, 109, 254, 0.22);
    --yc-color-text-inverse: var(--yc-color-card-bg);
    --yc-color-text-primary: var(--yc-color-card-text);
    --yc-color-text-secondary: var(--yc-color-card-muted);
    --yc-color-text-tertiary: #718096;
    --yc-color-text-light: #475569;
    --yc-gradient-background: linear-gradient(to bottom, #f8fafc 0%, #edf2f7 100%);
  }

  [data-ychart-story-root][data-yc-theme="dark"] {
    --yc-color-chart-bg: #0f172a;
    --yc-color-card-bg: #172033;
    --yc-color-card-text: #f8fafc;
    --yc-color-card-muted: #cbd5e1;
    --yc-color-card-border: #8ea0ff;
    --yc-color-bg-primary: #111827;
    --yc-color-bg-card: #172033;
    --yc-color-bg-secondary: #1f2937;
    --yc-color-bg-tertiary: #0f172a;
    --yc-color-editor-bg: #0b1020;
    --yc-color-editor-border: #303a4f;
    --yc-color-editor-text: #e5e7eb;
    --yc-color-gray-50: #0f172a;
    --yc-color-gray-100: #111827;
    --yc-color-gray-200: #1f2937;
    --yc-color-gray-300: #303a4f;
    --yc-color-gray-400: #475569;
    --yc-color-gray-500: #64748b;
    --yc-color-gray-600: #94a3b8;
    --yc-color-gray-700: #cbd5e1;
    --yc-color-gray-800: #f8fafc;
    --yc-color-icon: #e5e7eb;
    --yc-color-overlay-bg: rgba(17, 24, 39, 0.96);
    --yc-color-pattern: rgba(142, 160, 255, 0.28);
    --yc-color-text-inverse: var(--yc-color-card-bg);
    --yc-color-text-primary: var(--yc-color-card-text);
    --yc-color-text-secondary: var(--yc-color-card-muted);
    --yc-color-text-tertiary: #94a3b8;
    --yc-gradient-background: linear-gradient(to bottom, #0f172a 0%, #111827 100%);
  }

  [data-ychart-story-root] .ychart-chart,
  [data-ychart-story-root] .ychart-chart > svg {
    background: var(--yc-color-chart-bg) !important;
  }

  [data-ychart-story-root] .node-foreign-object-div > div,
  [data-ychart-story-root] .node-foreign-object-div > div > div:first-child {
    background: var(--yc-color-card-bg) !important;
    border-color: var(--yc-color-card-border) !important;
    color: var(--yc-color-card-text) !important;
  }

  [data-ychart-story-root] .node-foreign-object-div [style*="color:#64748b"],
  [data-ychart-story-root] .node-foreign-object-div [style*="color: #64748b"] {
    color: var(--yc-color-card-muted) !important;
  }

  [data-ychart-story-root][data-yc-theme="light"] .node-foreign-object-div [style*="color:#6366f1"],
  [data-ychart-story-root][data-yc-theme="light"] .node-foreign-object-div [style*="color: #6366f1"] {
    color: #4f46e5 !important;
  }

  [data-ychart-story-root][data-yc-theme="dark"] .node-foreign-object-div [style*="color:#6366f1"],
  [data-ychart-story-root][data-yc-theme="dark"] .node-foreign-object-div [style*="color: #6366f1"] {
    color: #c7d2fe !important;
  }

  [data-ychart-story-root][data-yc-theme="light"] .cm-editor {
    background: #ffffff !important;
    color: #172033 !important;
  }

  [data-ychart-story-root][data-yc-theme="light"] .cm-gutters {
    background: #f8fafc !important;
    color: #64748b !important;
    border-right-color: #d7deea !important;
  }

  [data-ychart-story-root][data-yc-theme="dark"] .cm-editor {
    background: #0b1020 !important;
    color: #e5e7eb !important;
  }

  [data-ychart-story-root] > .ychart-container,
  [data-ychart-story-root] .ychart-chart-wrapper,
  [data-ychart-story-root] .ychart-chart,
  [data-ychart-story-root] .ychart-editor-panel,
  [data-ychart-story-root] .ychart-editor,
  [data-ychart-story-root] .cm-editor,
  [data-ychart-story-root] .cm-scroller {
    min-height: 0 !important;
    max-height: 100% !important;
  }

  [data-ychart-story-root] > .ychart-container,
  [data-ychart-story-root] .ychart-chart-wrapper,
  [data-ychart-story-root] .ychart-chart,
  [data-ychart-story-root] .ychart-editor-panel {
    height: 100% !important;
    align-self: stretch !important;
  }

  [data-ychart-story-root] .ychart-chart-wrapper,
  [data-ychart-story-root] .ychart-chart {
    flex: 1 1 auto !important;
    block-size: 100% !important;
    min-block-size: 100% !important;
    max-height: none !important;
  }

  [data-ychart-story-root] .ychart-chart svg {
    width: 100% !important;
    height: 100% !important;
    min-height: 100% !important;
    max-height: none !important;
    aspect-ratio: auto !important;
    display: block;
  }

  [data-ychart-story-root] .ychart-editor,
  [data-ychart-story-root] .cm-editor,
  [data-ychart-story-root] .cm-scroller {
    flex: 1 1 auto !important;
  }
`;

const DEFAULT_YAML = `---
options:
  nodeWidth: 200
  nodeHeight: 100
  childrenMargin: 60
schema:
  name: string | required
  title: string | required
  department: string | optional
  supervisor: string | optional
card:
  - div:
      style: font-size:1.1rem;font-weight:bold;margin-bottom:4px;
      content: $name$
  - div:
      style: font-size:0.8rem;color:#6366f1;text-transform:uppercase;margin-bottom:8px;
      content: $title$
  - div:
      style: font-size:0.8rem;color:#64748b;
      content: $department$
---
- name: Sarah Johnson
  title: CEO
  department: Executive

- name: Michael Chen
  title: VP Engineering
  department: Engineering
  supervisor: Sarah Johnson

- name: Emily Davis
  title: VP Marketing
  department: Marketing
  supervisor: Sarah Johnson

- name: James Wilson
  title: Senior Developer
  department: Engineering
  supervisor: Michael Chen

- name: Lisa Park
  title: Product Designer
  department: Engineering
  supervisor: Michael Chen
`;

/**
 * React wrapper around the vanilla YChartEditor class.
 * Loads the module dynamically and mounts into a container div.
 */
function YChartWrapper({ yamlData = DEFAULT_YAML, width = '100%', height = '600px', storyTheme = 'light', ...options }: YChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<YChartEditorInstance | null>(null);
  const effectiveEditorTheme = options.editorTheme ?? storyTheme;

  React.useEffect(() => {
    let cancelled = false;
    let resizeObserver: InstanceType<typeof window.ResizeObserver> | null = null;
    let resizeFrame = 0;

    const syncRendererHeight = () => {
      const container = containerRef.current;
      if (!container) return;

      const editorPanel = container.querySelector<HTMLElement>('.ychart-editor-panel');
      const editorPanelRect = editorPanel?.getBoundingClientRect();
      const targetHeight = editorPanelRect && editorPanelRect.width > 0
        ? editorPanelRect.height
        : container.getBoundingClientRect().height;
      if (!targetHeight) return;

      const chartElements = [
        container.querySelector<HTMLElement>('.ychart-chart-wrapper'),
        container.querySelector<HTMLElement>('.ychart-chart'),
        container.querySelector<SVGSVGElement>('.ychart-chart > svg'),
      ];

      chartElements.forEach((element) => {
        if (!element) return;
        element.style.setProperty('height', `${targetHeight}px`, 'important');
        element.style.setProperty('min-height', `${targetHeight}px`, 'important');
        element.style.setProperty('max-height', `${targetHeight}px`, 'important');
        element.style.setProperty('block-size', `${targetHeight}px`, 'important');
        element.style.setProperty('min-block-size', `${targetHeight}px`, 'important');
        element.style.setProperty('max-block-size', `${targetHeight}px`, 'important');

        if (element instanceof SVGSVGElement) {
          element.setAttribute('height', String(targetHeight));
        }
      });
    };

    const scheduleRendererHeightSync = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(syncRendererHeight);
    };

    const normalizeGeneratedAccessibility = () => {
      const container = containerRef.current;
      if (!container) return;

      container.querySelectorAll('button svg, [role="button"] svg').forEach((svg) => {
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
      });

      container.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        const label = button.getAttribute('aria-label')
          || button.getAttribute('data-tooltip')
          || button.getAttribute('title')
          || button.textContent?.trim();

        if (label && !button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', label);
        }
      });

      container.querySelectorAll<HTMLElement>('[role="button"]').forEach((buttonLike) => {
        const label = buttonLike.getAttribute('aria-label')
          || buttonLike.getAttribute('title')
          || buttonLike.textContent?.trim();

        if (label && !buttonLike.getAttribute('aria-label')) {
          buttonLike.setAttribute('aria-label', label);
        }
      });

      container.querySelectorAll<HTMLElement>('.ychart-tooltip').forEach((tooltip) => {
        tooltip.setAttribute('aria-hidden', 'true');
      });

      const collapseButton = container.querySelector<HTMLButtonElement>('[data-id^="ychart-collapse-editor"]');
      if (collapseButton) {
        collapseButton.setAttribute('aria-label', collapseButton.textContent?.includes('▶') ? 'Show YAML editor' : 'Hide YAML editor');
      }

      const codeMirrorContent = container.querySelector<HTMLElement>('.cm-content');
      codeMirrorContent?.setAttribute('aria-label', 'YAML source editor');

      const codeMirrorScroller = container.querySelector<HTMLElement>('.cm-scroller');
      codeMirrorScroller?.setAttribute('tabindex', '0');
      codeMirrorScroller?.setAttribute('aria-label', 'Scrollable YAML editor');
    };

    const scheduleAccessibilityNormalization = () => {
      requestAnimationFrame(normalizeGeneratedAccessibility);
    };

    async function mount() {
      // Dynamic import to avoid bundling issues in storybook
      const mod = await import('../../../packages/ychart/src/ychartEditor') as { default: YChartEditorConstructor };
      if (cancelled || !containerRef.current) return;

      const mountContainer = containerRef.current;

      const YChartEditor = mod.default;
      const editor = new YChartEditor({
        nodeWidth: options.nodeWidth,
        nodeHeight: options.nodeHeight,
        collapsible: options.collapsible ?? true,
        editorTheme: effectiveEditorTheme,
        toolbarPosition: options.toolbarPosition ?? 'bottomleft',
      });

      editor.initView(mountContainer, yamlData);
      editorRef.current = editor;

      if ('ResizeObserver' in window) {
        resizeObserver = new window.ResizeObserver(scheduleRendererHeightSync);
        resizeObserver.observe(mountContainer);
        const editorPanel = mountContainer.querySelector<HTMLElement>('.ychart-editor-panel');
        if (editorPanel) {
          resizeObserver.observe(editorPanel);
        }
      }

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        syncRendererHeight();
        normalizeGeneratedAccessibility();
      });

      mountContainer.addEventListener('click', scheduleAccessibilityNormalization);
    }

    const mountContainer = containerRef.current;

    mount();

    return () => {
      cancelled = true;
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
      }
      mountContainer?.removeEventListener('click', scheduleAccessibilityNormalization);
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      editorRef.current = null;
    };
  }, [yamlData, options.nodeWidth, options.nodeHeight, options.collapsible, effectiveEditorTheme, options.toolbarPosition]);

  return (
    <>
      <style>{storyLayoutStyles}</style>
      <div ref={containerRef} data-ychart-story-root data-yc-theme={storyTheme} style={{ width, height, position: 'relative' }} />
    </>
  );
}

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof YChartWrapper> = {
  title: 'Product/Feature Modules/YChart',
  component: YChartWrapper,
  render: (args, context) => (
    <YChartWrapper
      {...args}
      storyTheme={context.globals.theme === 'dark' ? 'dark' : 'light'}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'YChart is a flexible organizational chart editor with YAML-based data management. It renders interactive hierarchical charts using D3.',
      },
    },
  },
  argTypes: {
    yamlData: { control: 'text', description: 'YAML data defining the org chart' },
    width: { control: 'text' },
    height: { control: 'text' },
    nodeWidth: { control: { type: 'number', min: 100, max: 400 } },
    nodeHeight: { control: { type: 'number', min: 60, max: 300 } },
    collapsible: { control: 'boolean' },
    editorTheme: { control: 'select', options: ['dark', 'light'], description: 'Optional override. Defaults to the Storybook theme toolbar.' },
    storyTheme: { table: { disable: true } },
    toolbarPosition: {
      control: 'select',
      options: ['topleft', 'topright', 'bottomleft', 'bottomright', 'topcenter', 'bottomcenter'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof YChartWrapper>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    yamlData: DEFAULT_YAML,
    width: '100%',
    height: 'calc(100vh - 2rem)',
    collapsible: true,
    toolbarPosition: 'bottomleft',
  },
};

export const CompactNodes: Story = {
  args: {
    ...Default.args,
    nodeWidth: 180,
    nodeHeight: 90,
  },
};

export const LightTheme: Story = {
  args: {
    ...Default.args,
  },
  globals: {
    theme: 'light',
  },
};

export const DarkTheme: Story = {
  args: {
    ...Default.args,
  },
  globals: {
    theme: 'dark',
  },
};

export const ToolbarTopRight: Story = {
  args: {
    ...Default.args,
    toolbarPosition: 'topright',
  },
};
