import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { motion } from 'motion/react';
import { Button } from '../../design-system/components/Button';
import { DropArt } from '../../design-system/components/DropArt';
import { Dropzone } from '../../design-system/components/Dropzone';
import { Spinner } from '../../design-system/components/Spinner';
import { ToastProvider } from '../../design-system/components/Toast';
import { fadeUp, instant, useReducedMotion } from '../../design-system/motion';
import { ScreenshotOptions } from './ScreenshotOptions';
import { MAX_SCREENSHOT_BYTES, SCREENSHOT_ACCEPT } from './types';
import { useScreenshotWorkbench } from './useScreenshotWorkbench';

export function ScreenshotTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { file, options, previewUrl, isRendering, actions } = useScreenshotWorkbench();
  const reduced = useReducedMotion();
  const stageKey = file ? 'ready' : 'empty';

  return (
    <motion.div
      key={stageKey}
      variants={reduced ? instant : fadeUp}
      initial="hidden"
      animate="visible"
    >
      {file ? (
        <div className="screenshot-tool">
          <div className="screenshot-tool__preview">
            {previewUrl ? (
              <img
                className="screenshot-tool__image"
                data-rendering={isRendering || undefined}
                src={previewUrl}
                alt="Styled preview of your screenshot"
              />
            ) : (
              <div className="screenshot-tool__loading">
                <Spinner />
              </div>
            )}
          </div>

          <div className="screenshot-tool__panel">
            <ScreenshotOptions value={options} onChange={actions.updateOptions} />

            <div className="screenshot-tool__actions">
              <Button variant="ghost" onClick={actions.reset}>
                Start over
              </Button>
              <Button
                variant="primary"
                icon={DownloadSimpleIcon}
                disabled={!previewUrl}
                onClick={actions.download}
              >
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Dropzone
          headline="Drop a screenshot to beautify it"
          hint="Add a background, padding, rounded corners, and a shadow — nothing leaves this tab."
          accept={SCREENSHOT_ACCEPT}
          maxBytes={MAX_SCREENSHOT_BYTES}
          maxFiles={1}
          multiple={false}
          illustration={<DropArt />}
          onFiles={actions.addFile}
          onReject={actions.reject}
          sample={{ label: 'No file handy? Try a sample', onTry: actions.trySample }}
        />
      )}
    </motion.div>
  );
}
