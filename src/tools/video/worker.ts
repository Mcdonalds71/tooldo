import { serveWorkerTask } from '../../lib/workerHost';
import { runVideoTask } from './engine';
import type { VideoTask, VideoTaskResult } from './types';

serveWorkerTask<VideoTask, VideoTaskResult>(runVideoTask);
