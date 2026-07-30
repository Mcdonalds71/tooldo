import { FileArrowDownIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Progress } from '../components/Progress';
import { ResultPanel } from '../components/ResultPanel';
import { Spinner } from '../components/Spinner';

export function SurfaceShowcase() {
  return (
    <div className="showcase-grid">
      <Card>
        <div className="showcase-pad">
          <p className="showcase-caption">card / brut</p>
          <p>Hero surfaces: chunky border, hard shadow, loud on purpose.</p>
        </div>
      </Card>

      <Card tone="calm">
        <div className="showcase-pad">
          <p className="showcase-caption">card / calm</p>
          <p>Option panels and tables, where a hard shadow would wear you out.</p>
          <Progress value={0.62} label="Compressing the queue" />
          <p className="showcase-caption">
            <Spinner /> spinner
          </p>
        </div>
      </Card>

      <ResultPanel
        headline="Three files, a lot lighter"
        stat={{ value: '86% smaller', label: '4.3 MB saved, same quality' }}
        actions={
          <>
            <Button variant="ink" icon={FileArrowDownIcon}>
              Download all
            </Button>
            <Button variant="ghost">Start over</Button>
          </>
        }
      />
    </div>
  );
}
