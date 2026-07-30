import type { ReactNode } from 'react';
import { Card } from './Card';

export interface ResultStat {
  /** Already formatted — "86% smaller", "12 pages". */
  readonly value: string;
  readonly label: string;
}

export interface ResultPanelProps {
  readonly headline: string;
  readonly stat?: ResultStat | undefined;
  readonly preview?: ReactNode | undefined;
  readonly actions: ReactNode;
}

export function ResultPanel({ headline, stat, preview, actions }: ResultPanelProps) {
  return (
    <Card className="result">
      <h2 className="result__headline">{headline}</h2>

      {stat ? (
        <p className="result__stat">
          <strong className="result__value">{stat.value}</strong>
          <span className="result__label">{stat.label}</span>
        </p>
      ) : null}

      {preview ? <div className="result__preview">{preview}</div> : null}

      <div className="result__actions">{actions}</div>
    </Card>
  );
}
