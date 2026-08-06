import { serveWorkerTask } from '../../lib/workerHost';
import { runImagesTask } from './engine';
import type { ImagesTask, ImagesTaskResult } from './types';

serveWorkerTask<ImagesTask, ImagesTaskResult>(runImagesTask);
