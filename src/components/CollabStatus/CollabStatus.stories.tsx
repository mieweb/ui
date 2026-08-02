import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { CollabStatus } from './CollabStatus';
import { useYjsCollabStatus } from './useYjsCollabStatus';
import { LocalYjsRoom, sampleLog, type LocalYjsMember } from './storyData';

const meta: Meta<typeof CollabStatus> = {
  title: 'Components/Status Indicators/CollabStatus',
  component: CollabStatus,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Live-collaboration status chip for a header: connection dot, **Live** /
**Connecting…** label, who else is editing, and a click-to-open panel with the
room identity, the room's occupants and a rolling log of collaboration events.
Pass \`compact\` to shrink the trigger down to the dot alone.

The component itself is transport-agnostic — it renders the presence state you
hand it.

### Binding it to a Yjs server (the short version)

\`@mieweb/ui\` has **no Yjs dependency**: \`useYjsCollabStatus\` types the doc,
awareness and provider structurally, so a real \`Y.Doc\` / \`WebsocketProvider\`
satisfies it as-is. Wire it up in three lines:

\`\`\`tsx
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CollabStatus, useYjsCollabStatus } from '@mieweb/ui';

function CaseHeader({ caseId, userId }: { caseId: string; userId: string }) {
  const doc = React.useMemo(() => new Y.Doc(), []);
  const provider = React.useMemo(
    () => new WebsocketProvider(WS_BASE, \`case/\${caseId}\`, doc, {
      params: { userId },              // wcts authorizes the socket on this
    }),
    [doc, caseId, userId]
  );
  React.useEffect(() => () => { provider.destroy(); doc.destroy(); }, [provider, doc]);

  const status = useYjsCollabStatus({ doc, provider, user: { name: 'Ann' }, userId });
  return <CollabStatus {...status} />;
}
\`\`\`

The provider URL is \`\${WS_BASE}/\${room}\`, so a wcts hub listening on
\`/sync/:type/:id\` takes \`WS_BASE = 'ws://localhost:39000/sync'\` and room
\`case/4\`. \`useYjsCollabStatus\` also returns \`publishActivity(fields)\` —
call it whenever you write to the doc so other windows can attribute the edit —
and \`lastRemoteEdit\`, which is handy for a toast.

Pass \`doc: null\` / \`provider: null\` to keep the hook inert (e.g. an offline
or browser-only mode).

### Trying it against a real server

Any \`y-websocket\`-compatible server works:

\`\`\`bash
npx y-websocket --port 1234     # or: npm run dev in wcts (ws://localhost:39000/sync)
\`\`\`

then open the **Live Server Room** story, point it at the URL, and open the same
story in a second tab to watch presence and the log light up.
`,
      },
    },
  },
  argTypes: {
    connected: {
      description: 'True once the room completed its initial server sync.',
      control: 'boolean',
    },
    peers: { description: 'Other people in the room right now.' },
    log: { description: 'Recent collaboration events, newest first.' },
    room: { description: 'Room identity shown at the top of the panel.' },
    showLog: {
      description: 'Set false for a status-only chip with no debug panel.',
      control: 'boolean',
    },
    compact: {
      description:
        'Shrink the trigger to the bare dot; the status text moves into its accessible name.',
      control: 'boolean',
    },
    labels: { description: 'Overrides for any user-facing string (i18n).' },
  },
};

export default meta;
type Story = StoryObj<typeof CollabStatus>;

const room = {
  name: 'case/4',
  url: 'ws://localhost:39000/sync',
  clientId: 2154903845,
  userId: '8',
};

export const Connecting: Story = {
  args: { connected: false, room, log: [] },
};

export const Live: Story = {
  args: { connected: true, room, log: sampleLog },
};

export const WithPeers: Story = {
  args: {
    connected: true,
    room,
    log: sampleLog,
    peers: [{ name: 'Ann Nurse' }, { name: 'Bo Tech' }, { name: 'Bo Tech' }],
  },
};

export const StatusOnly: Story = {
  args: { connected: true, showLog: false, peers: [{ name: 'Ann Nurse' }] },
};

/** For headers with no room for a chip: the dot alone still opens the panel. */
export const Compact: Story = {
  args: {
    connected: true,
    compact: true,
    room,
    log: sampleLog,
    peers: [
      { name: 'Ann Nurse', color: '#2563eb' },
      { name: 'Bo Tech', color: '#db2777' },
    ],
  },
};

// =============================================================================
// Real Yjs room, in-memory transport
// =============================================================================

function RoomMember({
  member,
  name,
  onLeave,
}: {
  member: LocalYjsMember;
  name: string;
  onLeave?: () => void;
}) {
  const status = useYjsCollabStatus({
    doc: member.doc,
    provider: member.provider,
    user: { name },
    userId: name,
  });

  return (
    <div className="border-border flex items-center gap-3 rounded-lg border p-3">
      <span className="text-foreground w-24 text-sm font-medium">{name}</span>
      <CollabStatus {...status} />
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          className="border-border rounded-md border px-2 py-1 text-xs"
          onClick={() => {
            LocalYjsRoom.type(member, `${name} typed. `);
            status.publishActivity(['Case notes']);
          }}
        >
          Edit notes
        </button>
        {onLeave && (
          <button
            type="button"
            className="border-border rounded-md border px-2 py-1 text-xs"
            onClick={onLeave}
          >
            Leave
          </button>
        )}
      </div>
    </div>
  );
}

function SimulatedRoomDemo() {
  const roomRef = React.useRef<LocalYjsRoom | null>(null);
  if (!roomRef.current) roomRef.current = new LocalYjsRoom('case/4');

  const [self] = React.useState(() => roomRef.current!.join());
  const [guests, setGuests] = React.useState<
    { id: number; name: string; member: LocalYjsMember }[]
  >([]);
  const nextId = React.useRef(1);

  React.useEffect(() => () => self.leave(), [self]);

  return (
    <div className="space-y-3">
      <RoomMember member={self} name="You" />
      {guests.map((g) => (
        <RoomMember
          key={g.id}
          member={g.member}
          name={g.name}
          onLeave={() => {
            g.member.leave();
            setGuests((prev) => prev.filter((x) => x.id !== g.id));
          }}
        />
      ))}
      <button
        type="button"
        className="bg-primary-500 rounded-md px-3 py-1.5 text-sm text-white"
        onClick={() => {
          const id = nextId.current++;
          const name = ['Ann Nurse', 'Bo Tech', 'Cy Admin'][(id - 1) % 3];
          setGuests((prev) => [
            ...prev,
            { id, name, member: roomRef.current!.join() },
          ]);
        }}
      >
        Add a peer window
      </button>
      <p className="text-muted-foreground text-xs">
        Every row is a separate <code>Y.Doc</code> + <code>Awareness</code>,
        relayed in memory instead of over a WebSocket. Add a peer, click{' '}
        <em>Edit notes</em>, then open a chip to watch the log.
      </p>
    </div>
  );
}

export const SimulatedRoom: StoryObj = {
  name: 'Simulated Yjs room (no server)',
  render: () => <SimulatedRoomDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'A real Yjs room — real docs, real awareness, real update encoding — ' +
          'with an in-memory transport, so it runs with no server and in CI.',
      },
    },
  },
};

// =============================================================================
// Real Yjs server
// =============================================================================

function LiveServerDemo({
  serverUrl,
  roomName,
  userName,
}: {
  serverUrl: string;
  roomName: string;
  userName: string;
}) {
  const [session, setSession] = React.useState<{
    doc: import('yjs').Doc;
    provider: import('y-websocket').WebsocketProvider;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    // Loaded lazily so the story page still renders if y-websocket is absent.
    void (async () => {
      try {
        const [Y, { WebsocketProvider }] = await Promise.all([
          import('yjs'),
          import('y-websocket'),
        ]);
        if (disposed) return;
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(serverUrl, roomName, doc);
        setSession({ doc, provider });
        cleanup = () => {
          provider.destroy();
          doc.destroy();
        };
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      disposed = true;
      cleanup();
      setSession(null);
    };
  }, [serverUrl, roomName]);

  const status = useYjsCollabStatus({
    doc: session?.doc ?? null,
    provider: session?.provider ?? null,
    user: { name: userName },
    userId: userName,
  });

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="border-border flex items-center gap-3 rounded-lg border p-3">
        <CollabStatus {...status} />
        <button
          type="button"
          className="border-border ml-auto rounded-md border px-2 py-1 text-xs"
          onClick={() => {
            const notes = session?.doc.getText('notes');
            notes?.insert(notes.length, `${userName} typed. `);
            status.publishActivity(['Case notes']);
          }}
        >
          Edit notes
        </button>
      </div>
      <p className="text-muted-foreground text-xs">
        Start a server with <code>npx y-websocket --port 1234</code> (or run
        wcts and use <code>ws://localhost:39000/sync</code>), then open this
        story in a second tab with a different <code>userName</code>.
      </p>
    </div>
  );
}

export const LiveServerRoom: StoryObj<typeof LiveServerDemo> = {
  name: 'Live server room',
  args: {
    serverUrl: 'ws://localhost:1234',
    roomName: 'case/4',
    userName: 'Ann Nurse',
  },
  argTypes: {
    serverUrl: { control: 'text' },
    roomName: { control: 'text' },
    userName: { control: 'text' },
  },
  render: (args) => <LiveServerDemo {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Connects a real `y-websocket` provider to the URL below. Shows ' +
          '“Connecting…” until a server accepts the room.',
      },
    },
  },
};
