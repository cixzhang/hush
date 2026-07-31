import * as stylex from '@stylexjs/stylex';
import { useRef, useState, useEffect } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { IconButton } from '@astryxdesign/core/IconButton';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import {
  ChatLayout,
  ChatMessageList,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageMetadata,
  ChatComposer,
} from '@astryxdesign/core/Chat';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Text } from '@astryxdesign/core/Text';
import { useStore } from './useStore';
import { ApiKeyDialog } from './SettingsDialog';
import { SettingsPopover } from './SettingsPopover';
import { THEMES, type ThemeName } from './themes';
import { TOOL_META } from './tools';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const styles = stylex.create({
  topNavStart: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-1)',
  },
  chatWrap: {
    height: '100%',
    maxWidth: '768px',
    margin: '0 auto',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  chatLayout: {
    flex: 1,
    minHeight: 0,
  },
  composer: {
    width: '100%',
  },
  topNav: {
    maxWidth: '768px',
    margin: '0 auto',
  },
});

export default function App() {
  const themeMode = useStore((s) => s.settings.themeMode);
  const themeName = useStore((s) => s.settings.themeName) as ThemeName;
  const activeTheme = THEMES[themeName] ?? THEMES['midnight-oil'];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-name', themeName);
  }, [themeName]);

  return (
    <Theme theme={activeTheme} mode={themeMode}>
      <AppShell
        topNav={<TopBar />}
        sideNav={undefined}
        contentPadding={0}
        height="fill"
        variant="wash"
      >
        <ChatArea />
        <ApiKeyDialog />
      </AppShell>
    </Theme>
  );
}

function TopBar() {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const newSession = useStore((s) => s.newSession);
  const selectSession = useStore((s) => s.selectSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const sessionItems = sessions.map((s) => ({
    label: s.title || 'Untitled',
    onClick: () => selectSession(s.id),
    icon: <ChatBubbleLeftRightIcon style={{ width: 14, height: 14 }} />,
  }));

  return (
    <TopNav
      xstyle={styles.topNav}
      heading={
        <TopNavHeading
          heading="hush"
          logo={
            <ChatBubbleLeftRightIcon
              style={{ width: 20, height: 20, color: 'var(--color-accent)' }}
            />
          }
        />
      }
      startContent={
        <div {...stylex.props(styles.topNavStart)}>
          <IconButton
            label="New chat"
            icon={<PlusIcon style={{ width: 16, height: 16 }} />}
            variant="ghost"
            size="sm"
            tooltip="New chat"
            onClick={() => newSession()}
          />
          {sessions.length > 0 && (
            <DropdownMenu
              button={{
                label: activeSession?.title || 'Sessions',
                variant: 'ghost',
                size: 'sm',
                icon: <ChatBubbleLeftRightIcon style={{ width: 14, height: 14 }} />,
              }}
              items={
                sessionItems.length > 0
                  ? [
                      ...sessionItems,
                      { type: 'divider' as const },
                      {
                        label: 'Delete current session',
                        onClick: () => activeSessionId && deleteSession(activeSessionId),
                        icon: <TrashIcon style={{ width: 14, height: 14 }} />,
                      },
                    ]
                  : []
              }
              hasChevron
              menuWidth={260}
            />
          )}
        </div>
      }
      endContent={<SettingsPopover />}
    />
  );
}

function ChatArea() {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const isStreaming = useStore((s) => s.isStreaming);
  const sendMessage = useStore((s) => s.sendMessage);
  const stopStreaming = useStore((s) => s.stopStreaming);
  const settings = useStore((s) => s.settings);

  const [input, setInput] = useState('');
  const session = sessions.find((s) => s.id === activeSessionId);
  const messages = session?.messages ?? [];
  const scrollRef = useRef<HTMLElement>(null);

  const handleSubmit = (value: string) => {
    if (!value.trim() || isStreaming) return;
    if (!settings.apiKey) {
      // No API key — show a gentle error via the message stream
      setInput('');
      return;
    }
    setInput('');
    sendMessage(value);
  };

  if (!session || messages.length === 0) {
    return (
      <div {...stylex.props(styles.chatWrap)}>
        <ChatLayout
          xstyle={styles.chatLayout}
          emptyState={
            <EmptyState
              title={settings.apiKey ? 'Start a conversation' : 'Configure your API key'}
              description={
                settings.apiKey
                  ? 'Type a message below to begin chatting.'
                  : 'Click the settings icon in the top right to add your OpenRouter API key.'
              }
            />
          }
          composer={
            <ChatComposerMinimal
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isStreaming={isStreaming}
              onStop={stopStreaming}
              disabled={!settings.apiKey}
            />
          }
        >
          <ChatMessageList><span /></ChatMessageList>
        </ChatLayout>
      </div>
    );
  }

  return (
    <div {...stylex.props(styles.chatWrap)}>
      <ChatLayout
        xstyle={styles.chatLayout}
        scrollRef={scrollRef}
        emptyState={null}
        composer={
          <ChatComposerMinimal
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
            onStop={stopStreaming}
          />
        }
      >
        <ChatMessageList isStreaming={isStreaming}>
          {messages.filter(m => m.role !== 'tool').map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.role === 'system' ? 'system' : msg.role as 'user' | 'assistant' | 'system'}
            >
              <ChatMessageBubble
                variant={msg.role === 'assistant' ? 'ghost' : 'filled'}
                metadata={
                  <ChatMessageMetadata
                    timestamp={new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                }
              >
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="hush-tool-calls">
                    {msg.toolCalls.map((tc) => {
                      const meta = TOOL_META[tc.name];
                      return (
                        <details key={tc.id} className={`hush-tool-chip ${tc.status}`} open={tc.status === 'running' || tc.status === 'error'}>
                          <summary>
                            <span className="hush-tool-icon">{meta?.icon || '🔧'}</span>
                            <span className="hush-tool-label">{meta?.label || tc.name}</span>
                            <span className={`hush-tool-status hush-tool-status-${tc.status}`}>
                              {tc.status === 'running' ? '...' : tc.status === 'error' ? '⚠' : '✓'}
                            </span>
                          </summary>
                          {tc.result && (
                            <pre className="hush-tool-result">{tc.result.slice(0, 2000)}</pre>
                          )}
                          {tc.error && (
                            <pre className="hush-tool-result hush-tool-error">{tc.error}</pre>
                          )}
                        </details>
                      );
                    })}
                  </div>
                )}
                <Text type="body">{msg.content || '...'}</Text>
              </ChatMessageBubble>
            </ChatMessage>
          ))}
        </ChatMessageList>
      </ChatLayout>
    </div>
  );
}

function ChatComposerMinimal({
  value,
  onChange,
  onSubmit,
  isStreaming,
  onStop,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}) {
  return (
    <ChatComposer
      xstyle={styles.composer}
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      onStop={onStop}
      isStopShown={isStreaming}
      isDisabled={disabled}
      placeholder={disabled ? 'Set your API key in settings to start...' : 'Type a message...'}
    />
  );
}
