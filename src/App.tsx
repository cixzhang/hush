import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
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
  emptyWrap: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatWrap: {
    height: '100%',
    maxWidth: '768px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  composer: {
    maxWidth: '768px',
    margin: '0 auto',
  },
  topNav: {
    maxWidth: '768px',
    margin: '0 auto',
  },
});

export default function App() {
  const themeMode = useStore((s) => s.settings.themeMode);
  return (
    <Theme theme={neutralTheme} mode={themeMode}>
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
      <>
        <div {...stylex.props(styles.emptyWrap)}>
          <EmptyState
            title={settings.apiKey ? 'Start a conversation' : 'Configure your API key'}
            description={
              settings.apiKey
                ? 'Type a message below to begin chatting.'
                : 'Click the settings icon in the top right to add your OpenRouter API key.'
            }
          />
        </div>
        <div {...stylex.props(styles.chatWrap)}>
          <ChatLayout
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
      </>
    );
  }

  return (
    <div {...stylex.props(styles.chatWrap)}>
      <ChatLayout
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
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.role === 'system' ? 'system' : msg.role}
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
    }
  };

  return (
    <ComposerShell
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      isStreaming={isStreaming}
      onStop={onStop}
      disabled={disabled}
      handleKeyDown={handleKeyDown}
    />
  );
}

function ComposerShell({
  value,
  onChange,
  onSubmit,
  isStreaming,
  onStop,
  disabled,
  handleKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
  handleKeyDown: (e: React.KeyboardEvent) => void;
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
      onKeyDown={handleKeyDown}
    />
  );
}
