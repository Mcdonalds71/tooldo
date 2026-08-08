import { serveWorkerTask } from '../../lib/workerHost';
import type { BackgroundUtilityResult, BackgroundUtilityTask } from './types';
import { runUtilityTask } from './utilityEngine';

serveWorkerTask<BackgroundUtilityTask, BackgroundUtilityResult>(runUtilityTask);
