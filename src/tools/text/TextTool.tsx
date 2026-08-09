import { Button } from '../../design-system/components/Button';
import { Segmented } from '../../design-system/components/Segmented';
import { ToastProvider } from '../../design-system/components/Toast';
import { ComparePanel } from './ComparePanel';
import { EditPanel } from './EditPanel';
import type { TextMode } from './types';
import { useTextWorkbench } from './useTextWorkbench';

const MODE_OPTIONS: readonly { value: TextMode; label: string }[] = [
  { value: 'edit', label: 'Edit' },
  { value: 'compare', label: 'Compare' },
];

export function TextTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const {
    mode,
    editText,
    cleanup,
    caseMode,
    outputText,
    inputStats,
    outputStats,
    originalText,
    changedText,
    diffOutcome,
    actions,
  } = useTextWorkbench();

  return (
    <div className="text-tool">
      <div className="text-tool__toolbar">
        <Segmented label="Mode" value={mode} onChange={actions.setMode} options={MODE_OPTIONS} />
        <div className="text-tool__toolbar-actions">
          <Button variant="ghost" size="sm" onClick={actions.reset}>
            Clear all
          </Button>
          <Button variant="ghost" size="sm" onClick={actions.trySample}>
            Try a sample
          </Button>
        </div>
      </div>

      {mode === 'edit' ? (
        <EditPanel
          editText={editText}
          cleanup={cleanup}
          caseMode={caseMode}
          outputText={outputText}
          inputStats={inputStats}
          outputStats={outputStats}
          actions={actions}
        />
      ) : (
        <ComparePanel
          originalText={originalText}
          changedText={changedText}
          diffOutcome={diffOutcome}
          actions={actions}
        />
      )}
    </div>
  );
}
