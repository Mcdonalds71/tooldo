import { TextAreaField } from '../../design-system/components/TextAreaField';
import type { DiffLine, DiffSummary } from './types';
import type { TextActions } from './useTextWorkbench';

export type DiffOutcome =
  | { readonly ok: true; readonly lines: readonly DiffLine[]; readonly summary: DiffSummary }
  | { readonly ok: false; readonly message: string };

export interface ComparePanelProps {
  readonly originalText: string;
  readonly changedText: string;
  readonly diffOutcome: DiffOutcome;
  readonly actions: TextActions;
}

export function ComparePanel({
  originalText,
  changedText,
  diffOutcome,
  actions,
}: ComparePanelProps) {
  const isEmpty = originalText.length === 0 && changedText.length === 0;

  return (
    <div className="text-tool__compare">
      <div className="text-tool__compare-inputs">
        <TextAreaField
          label="Original"
          value={originalText}
          onChange={actions.setOriginalText}
          placeholder="Paste the first version…"
          rows={10}
        />
        <TextAreaField
          label="Changed"
          value={changedText}
          onChange={actions.setChangedText}
          placeholder="Paste the second version…"
          rows={10}
        />
      </div>

      {isEmpty ? (
        <p className="text-tool__hint">Add text on both sides to see what changed.</p>
      ) : !diffOutcome.ok ? (
        <p className="text-tool__hint" role="alert">
          {diffOutcome.message}
        </p>
      ) : (
        <>
          <p className="text-tool__diff-summary">
            <span className="text-tool__diff-count text-tool__diff-count--added">
              +{diffOutcome.summary.added}
            </span>
            <span className="text-tool__diff-count text-tool__diff-count--removed">
              −{diffOutcome.summary.removed}
            </span>
          </p>
          <section className="text-tool__diff" aria-label="Line-by-line comparison">
            {diffOutcome.lines.map((line, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: recomputed wholly each time, no other identity
                key={`${index}-${line.type}`}
                className={`text-tool__diff-line text-tool__diff-line--${line.type}`}
              >
                <span className="text-tool__diff-marker" aria-hidden>
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ''}
                </span>
                <span className="text-tool__diff-text">{line.text || ' '}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
