import {
  MagnifyingGlassIcon,
  WarningCircleIcon,
  WifiSlashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

/**
 * The three empties beyond the first load. No state, so the page renders these to
 * static HTML and ships no JavaScript for them.
 */
export function EmptyStateShowcase() {
  return (
    <div className="showcase-grid">
      <EmptyState
        variant="no-results"
        illustration={<MagnifyingGlassIcon size="2.5rem" weight="duotone" />}
        headline="Nothing matches that filter"
        subtext="Clear it and every tool comes back."
        primaryAction={
          <Button size="sm" variant="secondary">
            Clear filters
          </Button>
        }
      />

      <EmptyState
        variant="error"
        illustration={<WarningCircleIcon size="2.5rem" weight="duotone" />}
        headline="That file isn't a PDF"
        subtext="This tool reads PDFs. Pick another file and it'll pick up where you left off."
        primaryAction={
          <Button size="sm" variant="secondary">
            Choose another file
          </Button>
        }
      />

      <EmptyState
        variant="offline"
        illustration={<WifiSlashIcon size="2.5rem" weight="duotone" />}
        headline="The engine didn't load"
        subtext="It downloads once, then works offline forever. You're not connected right now."
        primaryAction={
          <Button size="sm" variant="secondary">
            Try again
          </Button>
        }
      />
    </div>
  );
}
