import { serveWorkerTask } from '../../lib/workerHost';
import { runScreenshotTask } from './engine';
import type { ScreenshotTask, ScreenshotTaskResult } from './types';

serveWorkerTask<ScreenshotTask, ScreenshotTaskResult>(runScreenshotTask);
