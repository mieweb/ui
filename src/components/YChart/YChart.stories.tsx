import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef } from 'react';

const SAMPLE_YAML = `---
options:
  nodeWidth: 250
  nodeHeight: 160
  childrenMargin: 60
  compactMarginBetween: 40
  compactMarginPair: 35
  neighbourMargin: 25
schema:
  name: string | required
  title: string | required
  department: string | optional
  email: string | required
  supervisor: string | optional
card:
  - div:
      style: "font-size:14px;font-weight:bold;color:#1a1a2e;margin-bottom:8px;"
      content: $name$
  - div:
      style: "font-size:11px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;"
      content: $title$
  - div:
      style: "font-size:12px;color:#64748b;"
      content: $email$
---

- name: Sarah Chen
  title: Chief Executive Officer
  department: Executive
  email: sarah.chen@company.com
  supervisor: Board of Directors

- name: Michael Rodriguez
  title: Chief Technology Officer
  department: Technology
  email: michael.rodriguez@company.com
  supervisor: Sarah Chen

- name: Emily Watson
  title: Chief Financial Officer
  department: Finance
  email: emily.watson@company.com
  supervisor: Sarah Chen

- name: David Kim
  title: Chief Marketing Officer
  department: Marketing
  email: david.kim@company.com
  supervisor: Sarah Chen

- name: Jennifer Martinez
  title: VP of Engineering
  department: Technology
  email: jennifer.martinez@company.com
  supervisor: Michael Rodriguez

- name: Robert Taylor
  title: VP of Product
  department: Technology
  email: robert.taylor@company.com
  supervisor: Michael Rodriguez
`;

interface YChartProps {
  yamlData: string;
  editorTheme: 'light' | 'dark';
  nodeWidth: number;
  nodeHeight: number;
  showEditor: boolean;
}

/**
 * YChart is an interactive organizational chart editor powered by D3.js
 * with a YAML-based data editor. It supports hierarchical org chart views,
 * node drag-to-swap, expand/collapse, search, and export capabilities.
 *
 * This Feature Module wraps `@mieweb/ychart` (`YChartEditor`) for use
 * within the MieWeb UI Storybook.
 */
function YChartWrapper({ yamlData, editorTheme, nodeWidth, nodeHeight, showEditor }: YChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import to avoid SSR issues and load ychart on demand
    import('@mieweb/ychart').then((mod) => {
      const YChartEditor = mod.default;

      // Clear previous instance
      containerRef.current!.innerHTML = '';
      editorRef.current?.destroy?.();

      const editor = new YChartEditor({
        nodeWidth,
        nodeHeight,
        editorTheme,
      });

      editor.initView(containerRef.current!, yamlData);

      if (!showEditor) {
        // Hide the editor sidebar if not requested
        const sidebar = containerRef.current!.querySelector('[class*="sidebar"]') as HTMLElement;
        if (sidebar) sidebar.style.display = 'none';
      }

      editorRef.current = editor;
    });

    return () => {
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, [yamlData, editorTheme, nodeWidth, nodeHeight, showEditor]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '80vh',
        minHeight: '600px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

const meta: Meta<typeof YChartWrapper> = {
  title: 'Product/Feature Modules/YChart',
  component: YChartWrapper,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Interactive organizational chart editor built with D3.js and YAML-based data management. ' +
          'Supports hierarchical org charts, node drag-to-swap, expand/collapse, search, and export. ' +
          'Provided by `@mieweb/ychart`.',
      },
    },
  },
  argTypes: {
    editorTheme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Theme for the YAML code editor sidebar',
    },
    nodeWidth: {
      control: { type: 'range', min: 150, max: 400, step: 10 },
      description: 'Width of each org chart node card',
    },
    nodeHeight: {
      control: { type: 'range', min: 80, max: 250, step: 10 },
      description: 'Height of each org chart node card',
    },
    showEditor: {
      control: 'boolean',
      description: 'Show the YAML editor sidebar',
    },
    yamlData: {
      control: 'text',
      description: 'YAML data with optional front matter for chart configuration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof YChartWrapper>;

export const Default: Story = {
  args: {
    yamlData: SAMPLE_YAML,
    editorTheme: 'dark',
    nodeWidth: 250,
    nodeHeight: 160,
    showEditor: true,
  },
};

export const LightTheme: Story = {
  args: {
    ...Default.args,
    editorTheme: 'light',
  },
};

export const ChartOnly: Story = {
  args: {
    ...Default.args,
    showEditor: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart visualization without the YAML editor sidebar.',
      },
    },
  },
};

export const CompactNodes: Story = {
  args: {
    ...Default.args,
    nodeWidth: 180,
    nodeHeight: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller node dimensions for denser chart layouts.',
      },
    },
  },
};
