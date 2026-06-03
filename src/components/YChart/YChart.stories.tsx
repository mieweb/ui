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
  /** Toolbar position */
  toolbarPosition?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | 'topcenter' | 'bottomcenter';
}

interface YChartEditorInstance {
  initView(container: HTMLElement, yamlData: string): void;
  destroy?: () => void;
}

type YChartEditorConstructor = new (options: Omit<YChartProps, 'yamlData' | 'width' | 'height'>) => YChartEditorInstance;

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
function YChartWrapper({ yamlData = DEFAULT_YAML, width = '100%', height = '600px', ...options }: YChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<YChartEditorInstance | null>(null);

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

    async function mount() {
      // Dynamic import to avoid bundling issues in storybook
      const mod = await import('../../../packages/ychart/src/ychartEditor') as { default: YChartEditorConstructor };
      if (cancelled || !containerRef.current) return;

      const YChartEditor = mod.default;
      const editor = new YChartEditor({
        nodeWidth: options.nodeWidth,
        nodeHeight: options.nodeHeight,
        collapsible: options.collapsible ?? true,
        editorTheme: options.editorTheme ?? 'dark',
        toolbarPosition: options.toolbarPosition ?? 'bottomleft',
      });

      editor.initView(containerRef.current, yamlData);
      editorRef.current = editor;

      if ('ResizeObserver' in window) {
        resizeObserver = new window.ResizeObserver(scheduleRendererHeightSync);
        resizeObserver.observe(containerRef.current);
        const editorPanel = containerRef.current.querySelector<HTMLElement>('.ychart-editor-panel');
        if (editorPanel) {
          resizeObserver.observe(editorPanel);
        }
      }

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        syncRendererHeight();
      });
    }

    mount();

    return () => {
      cancelled = true;
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
      }
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      editorRef.current = null;
    };
  }, [yamlData, options.nodeWidth, options.nodeHeight, options.collapsible, options.editorTheme, options.toolbarPosition]);

  return (
    <>
      <style>{storyLayoutStyles}</style>
      <div ref={containerRef} data-ychart-story-root style={{ width, height, position: 'relative' }} />
    </>
  );
}

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof YChartWrapper> = {
  title: 'Product/Feature Modules/YChart',
  component: YChartWrapper,
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
    editorTheme: { control: 'select', options: ['dark', 'light'] },
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
    editorTheme: 'dark',
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
    editorTheme: 'light',
  },
};

export const ToolbarTopRight: Story = {
  args: {
    ...Default.args,
    toolbarPosition: 'topright',
  },
};
