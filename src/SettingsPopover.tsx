import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';
import { Popover } from '@astryxdesign/core/Popover';
import { VStack } from '@astryxdesign/core/Stack';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Button } from '@astryxdesign/core/Button';
import { useStore } from './useStore';
import { Cog6ToothIcon, KeyIcon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const styles = stylex.create({
  popoverContent: {
    padding: 'var(--spacing-3)',
    minWidth: '240px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--spacing-2)',
  },
});

export function SettingsPopover() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const setApiKeyOpen = useStore((s) => s.setApiKeyOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Popover
      anchorRef={triggerRef as React.RefObject<HTMLElement>}
      placement="below"
      alignment="end"
      width={260}
      label="Settings"
      content={
        <div {...stylex.props(styles.popoverContent)}>
          <VStack gap={3}>
            <div {...stylex.props(styles.row)}>
              <Text type="label">Appearance</Text>
              <SegmentedControl
                label="Theme mode"
                value={settings.themeMode}
                onChange={(v) => updateSettings({ themeMode: v as 'light' | 'dark' })}
                size="sm"
              >
                <SegmentedControlItem
                  value="light"
                  label="Light"
                  isLabelHidden
                  icon={<SunIcon style={{ width: 14, height: 14 }} />}
                />
                <SegmentedControlItem
                  value="dark"
                  label="Dark"
                  isLabelHidden
                  icon={<MoonIcon style={{ width: 14, height: 14 }} />}
                />
              </SegmentedControl>
            </div>
            <Button
              label="API Key & Model"
              variant="ghost"
              size="sm"
              icon={<KeyIcon style={{ width: 14, height: 14 }} />}
              onClick={() => setApiKeyOpen(true)}
            />
          </VStack>
        </div>
      }
    >
      <button ref={triggerRef} aria-label="Settings" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
        <Cog6ToothIcon style={{ width: 18, height: 18 }} />
      </button>
    </Popover>
  );
}
