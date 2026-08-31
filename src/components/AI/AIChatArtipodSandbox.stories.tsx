import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AIChat } from './index';
import type { AIMessage, MCPToolCall } from './types';

/**
 * AIChat driving a real artipod sandbox (just-bash over ZenFS, in this
 * browser tab) — the artipod-layer-plan Phase 2 acceptance story.
 *
 * Every prompt you type is executed as a bash command through
 * `@artipod/core/agent`'s tool surface (the same `bash` tool an LLM agent
 * calls), and the call renders as an MCPToolCall block with its live
 * status + result. No model is involved (plan Decision #8: scripted, not AI):
 * the "agent" here is `you → bash tool → sandbox`.
 */

type SandboxTools = Map<
  string,
  {
    execute: (
      args: Record<string, unknown>,
      signal?: AbortSignal,
    ) => Promise<{ success: boolean; content: string; error?: string }>;
  }
>;

interface SandboxHandle {
  tools: SandboxTools;
  cwd: () => string;
}

async function bootSandbox(): Promise<SandboxHandle> {
  const [{ configure, InMemory, fs: zfs, umount }, sandboxMod, agentMod] = await Promise.all([
    import('@zenfs/core'),
    import('@artipod/core/sandbox'),
    import('@artipod/core/agent'),
  ]);
  try {
    umount('/');
  } catch {
    // first mount in this tab
  }
  await configure({ mounts: { '/': InMemory } });
  try {
    await zfs.promises.mkdir('/repo');
  } catch {
    // already there (story remount)
  }
  await zfs.promises.writeFile(
    '/repo/README.md',
    '# artipod sandbox story\n\nA just-bash shell over an in-memory ZenFS store.\n',
  );
  const sandbox = sandboxMod.createSandbox({ zfs });
  const tools = agentMod.createSandboxTools(sandbox) as unknown as SandboxTools;
  return { tools, cwd: () => sandbox.getCwd() };
}

let bootPromise: Promise<SandboxHandle> | null = null;
const getSandbox = () => (bootPromise ??= bootSandbox());

function ArtipodSandboxChat() {
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const counter = React.useRef(0);

  const send = React.useCallback(async (text: string) => {
    const command = text.trim();
    if (!command) return;
    const id = `m${++counter.current}`;
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `${id}-user`,
        role: 'user',
        content: [{ type: 'text', text: command }],
        timestamp: new Date(),
        status: 'complete',
      },
    ]);

    const startedAt = new Date();
    const toolCall: MCPToolCall = {
      id: `${id}-call`,
      toolName: 'bash',
      description: 'Execute a bash command in the artipod sandbox',
      parameters: [{ name: 'command', type: 'string', value: command }],
      status: 'running',
      startedAt,
    };
    const assistantId = `${id}-assistant`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: [{ type: 'tool_use', toolCall }],
        timestamp: new Date(),
        status: 'streaming',
      },
    ]);

    const { tools } = await getSandbox();
    const bash = tools.get('bash');
    let stdout = '';
    let stderr = '';
    let exitCode = -1;
    try {
      const result = await bash!.execute({ command });
      const parsed = JSON.parse(result.content || '{}') as {
        stdout?: string;
        stderr?: string;
        exitCode?: number;
      };
      stdout = parsed.stdout ?? '';
      stderr = parsed.stderr ?? '';
      exitCode = parsed.exitCode ?? -1;
    } catch (e) {
      stderr = e instanceof Error ? e.message : String(e);
    }

    const completedAt = new Date();
    const finished: MCPToolCall = {
      ...toolCall,
      status: exitCode === 0 ? 'success' : 'error',
      completedAt,
      duration: completedAt.getTime() - startedAt.getTime(),
      result: {
        type: exitCode === 0 ? 'text' : 'error',
        data: { stdout, stderr, exitCode },
        summary: exitCode === 0 ? `exit 0 · ${stdout.length} bytes` : `exit ${exitCode}`,
      },
      error: exitCode === 0 ? undefined : stderr.trim() || `exit ${exitCode}`,
    };
    const outputBlock = (stdout || stderr).trimEnd();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              status: 'complete' as const,
              content: [
                { type: 'tool_use' as const, toolCall: finished },
                ...(outputBlock
                  ? [{ type: 'code' as const, text: outputBlock, language: 'console' }]
                  : [{ type: 'text' as const, text: '(no output)' }]),
              ],
            }
          : m,
      ),
    );
    setBusy(false);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <AIChat
        title="artipod sandbox — every prompt runs as bash"
        messages={messages}
        isGenerating={busy}
        onSendMessage={(t) => void send(t)}
        inputPlaceholder="Type a bash command… (ls /repo, echo hi > /repo/hi.txt, cat /repo/README.md)"
        suggestions={[
          { id: 's1', label: 'List /repo', prompt: 'ls -la /repo' },
          { id: 's2', label: 'Read the README', prompt: 'cat /repo/README.md' },
          {
            id: 's3',
            label: 'Write + pipeline',
            prompt: 'echo hello from the story > /repo/hi.txt && wc -c /repo/hi.txt',
          },
          { id: 's4', label: 'Try sudo (denied)', prompt: 'sudo rm -rf /' },
        ]}
        height="100vh"
      />
    </div>
  );
}

const meta: Meta<typeof AIChat> = {
  title: 'Product/Feature Modules/AI/AIChat Artipod Sandbox',
  component: AIChat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'AIChat wired to a **real artipod sandbox** (`@artipod/core`): just-bash executing over an',
          'in-memory ZenFS store, entirely in this browser tab. Each prompt is executed through the',
          "same `bash` tool an LLM agent calls (`createSandboxTools`), and renders as an `MCPToolCall`",
          'block with live status, parameters, duration and result — followed by the command output.',
          '',
          'No model is involved (artipod-layer-plan Decision #8): the scripted "agent" is simply',
          '`your prompt → bash tool → sandbox`, which is exactly the surface a tool-calling loop uses.',
          'Try the suggested prompts — including `sudo`, which the pod denies (EPERM) until the',
          'Phase 6.5 approval flow exists.',
        ].join('\n'),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AIChat>;

export const SandboxDrivenChat: Story = {
  render: () => <ArtipodSandboxChat />,
};
