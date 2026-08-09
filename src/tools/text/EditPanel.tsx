import { CopyIcon, DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '../../design-system/components/Button';
import { SelectField } from '../../design-system/components/SelectField';
import { Switch } from '../../design-system/components/Switch';
import { TextAreaField } from '../../design-system/components/TextAreaField';
import { CASE_OPTIONS, type CaseMode, type CleanupOptions, type TextStats } from './types';
import type { TextActions } from './useTextWorkbench';

export interface EditPanelProps {
  readonly editText: string;
  readonly cleanup: CleanupOptions;
  readonly caseMode: CaseMode;
  readonly outputText: string;
  readonly inputStats: TextStats;
  readonly outputStats: TextStats;
  readonly actions: TextActions;
}

export function EditPanel({
  editText,
  cleanup,
  caseMode,
  outputText,
  inputStats,
  outputStats,
  actions,
}: EditPanelProps) {
  return (
    <div className="text-tool__edit">
      <div className="text-tool__column">
        <TextAreaField
          label="Your text"
          value={editText}
          onChange={actions.setEditText}
          placeholder="Paste or type anything here…"
          rows={12}
        />
        <StatsBar stats={inputStats} />
      </div>

      <div className="text-tool__options">
        <p className="text-tool__options-title">Clean up</p>
        <Switch
          label="Trim each line"
          checked={cleanup.trimLines}
          onChange={(trimLines) => actions.updateCleanup({ trimLines })}
        />
        <Switch
          label="Collapse multiple spaces"
          checked={cleanup.collapseSpaces}
          onChange={(collapseSpaces) => actions.updateCleanup({ collapseSpaces })}
        />
        <Switch
          label="Collapse blank lines"
          checked={cleanup.collapseBlankLines}
          onChange={(collapseBlankLines) => actions.updateCleanup({ collapseBlankLines })}
        />
        <Switch
          label="Trim start and end"
          checked={cleanup.trimEdges}
          onChange={(trimEdges) => actions.updateCleanup({ trimEdges })}
        />

        <SelectField
          label="Change case"
          value={caseMode}
          onChange={actions.setCaseMode}
          options={CASE_OPTIONS}
          hint="Case conversions to camelCase, snake_case, or kebab-case read the whole text as one token and drop line breaks — that's what those conventions mean."
        />
      </div>

      <div className="text-tool__column">
        <TextAreaField label="Result" value={outputText} onChange={() => {}} readOnly rows={12} />
        <StatsBar stats={outputStats} />
        <div className="text-tool__actions">
          <Button
            variant="secondary"
            icon={CopyIcon}
            disabled={outputText.length === 0}
            onClick={() => void actions.copyOutput()}
          >
            Copy
          </Button>
          <Button
            variant="primary"
            icon={DownloadSimpleIcon}
            disabled={outputText.length === 0}
            onClick={actions.downloadOutput}
          >
            Download .txt
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ stats }: { readonly stats: TextStats }) {
  return (
    <dl className="text-tool__stats">
      <StatItem label="Characters" value={stats.characters} />
      <StatItem label="No spaces" value={stats.charactersNoSpaces} />
      <StatItem label="Words" value={stats.words} />
      <StatItem label="Lines" value={stats.lines} />
      <StatItem label="Sentences" value={stats.sentences} />
      <StatItem label="Reading" value={`${stats.readingMinutes} min`} />
    </dl>
  );
}

function StatItem({ label, value }: { readonly label: string; readonly value: number | string }) {
  return (
    <div className="text-tool__stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
