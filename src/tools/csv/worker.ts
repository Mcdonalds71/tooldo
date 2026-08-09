import { serveWorkerTask } from '../../lib/workerHost';
import { runDataTask } from './engine';
import type { DataTask, DataTaskResult } from './types';

serveWorkerTask<DataTask, DataTaskResult>(runDataTask);
