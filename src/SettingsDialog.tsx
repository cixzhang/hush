import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useStore } from './useStore';

const styles = stylex.create({
  body: {
    padding: 'var(--spacing-4)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-2)',
    padding: 'var(--spacing-3) var(--spacing-4)',
    borderTop: '1px solid var(--color-border-subtle)',
  },
});

const POPULAR_MODELS = [
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-flash-2.0',
  'meta-llama/llama-4-scout',
  'x-ai/grok-4',
  'z-ai/glm-4.5',
];

export function SettingsDialog() {
  const isOpen = useStore((s) => s.isSettingsOpen);
  const settings = useStore((s) => s.settings);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const updateSettings = useStore((s) => s.updateSettings);

  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);

  const handleSave = () => {
    updateSettings({ apiKey: apiKey.trim(), model: model.trim() });
    setSettingsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // reset local state on close without saving
      setApiKey(settings.apiKey);
      setModel(settings.model);
    }
    setSettingsOpen(open);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange} purpose="form" width={480}>
      <DialogHeader title="Settings" subtitle="OpenRouter API key & model" onOpenChange={handleOpenChange} />
      <div {...stylex.props(styles.body)}>
        <VStack gap={4}>
          <VStack gap={1}>
            <Text type="label">API Key</Text>
            <TextInput
              label="OpenRouter API Key"
              isLabelHidden
              value={apiKey}
              onChange={(v) => setApiKey(v)}
              placeholder="sk-or-v1-..."
              type="password"
            />
            <Text type="supporting">
              Get your key at openrouter.ai/keys — stored locally in your browser only.
            </Text>
          </VStack>
          <VStack gap={1}>
            <Text type="label">Model</Text>
            <TextInput
              label="Model"
              isLabelHidden
              value={model}
              onChange={(v) => setModel(v)}
              placeholder="anthropic/claude-sonnet-4"
            />
            <Text type="supporting">
              Popular: {POPULAR_MODELS.slice(0, 4).join(', ')}
            </Text>
          </VStack>
        </VStack>
      </div>
      <div {...stylex.props(styles.footer)}>
        <Button label="Cancel" variant="ghost" onClick={() => handleOpenChange(false)} />
        <Button label="Save" variant="primary" onClick={handleSave} />
      </div>
    </Dialog>
  );
}
