import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Button } from '../../design-system/components/Button';
import { DropArt } from '../../design-system/components/DropArt';
import { Dropzone } from '../../design-system/components/Dropzone';
import { EmptyState } from '../../design-system/components/EmptyState';
import { Spinner } from '../../design-system/components/Spinner';
import { ToastProvider } from '../../design-system/components/Toast';
import { fadeUp, instant, useReducedMotion } from '../../design-system/motion';
import { DataTable } from './DataTable';
import { CSV_JSON_ACCEPT, MAX_FILE_BYTES } from './types';
import { useDataWorkbench } from './useDataWorkbench';

export function DataTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { stage, sort, sortedRows, actions } = useDataWorkbench();
  const reduced = useReducedMotion();

  let body: ReactNode;

  if (stage.name === 'error') {
    body = (
      <EmptyState
        variant="error"
        illustration={<DropArt />}
        headline={stage.message}
        subtext="Nothing was sent anywhere — the file never left your device."
        primaryAction={
          <Button variant="primary" onClick={actions.reset}>
            Try again
          </Button>
        }
      />
    );
  } else if (stage.name === 'processing') {
    body = (
      <div className="data-tool__loading">
        <Spinner />
        <p>Reading your file…</p>
      </div>
    );
  } else if (stage.name === 'result') {
    body = (
      <div className="data-tool__result">
        <div className="data-tool__result-head">
          <p className="data-tool__stat">
            {stage.table.rows.length.toLocaleString()} rows · {stage.table.headers.length} columns
          </p>
          <div className="data-tool__result-actions">
            <Button variant="ghost" onClick={actions.reset}>
              Start over
            </Button>
            <Button
              variant="secondary"
              icon={DownloadSimpleIcon}
              onClick={() => actions.downloadAs('csv')}
            >
              Download CSV
            </Button>
            <Button
              variant="primary"
              icon={DownloadSimpleIcon}
              onClick={() => actions.downloadAs('json')}
            >
              Download JSON
            </Button>
          </div>
        </div>

        <DataTable
          table={stage.table}
          sortedRows={sortedRows}
          sort={sort}
          onSort={actions.toggleSort}
        />
      </div>
    );
  } else {
    body = (
      <Dropzone
        headline="Drop a CSV or JSON file to view it"
        hint="See it as a table, sort any column, and convert between CSV and JSON — nothing leaves this tab."
        accept={CSV_JSON_ACCEPT}
        maxBytes={MAX_FILE_BYTES}
        maxFiles={1}
        multiple={false}
        illustration={<DropArt />}
        onFiles={actions.addFiles}
        onReject={actions.reject}
        sample={{ label: 'No file handy? Try a sample', onTry: actions.trySample }}
      />
    );
  }

  return (
    <div className="data-tool">
      <motion.div
        key={stage.name}
        variants={reduced ? instant : fadeUp}
        initial="hidden"
        animate="visible"
      >
        {body}
      </motion.div>
    </div>
  );
}
