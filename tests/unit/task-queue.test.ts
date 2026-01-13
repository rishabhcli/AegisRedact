/**
 * Tests for TaskQueue batch processing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskQueue } from '../../src/lib/queue/TaskQueue';
import { TaskStatus } from '../../src/lib/queue/types';
import type { ProcessingTask } from '../../src/lib/queue/types';

describe('TaskQueue', () => {
  let queue: TaskQueue;

  beforeEach(() => {
    queue = new TaskQueue({ autoStart: false });
  });

  describe('constructor', () => {
    it('should create queue with default config', () => {
      const defaultQueue = new TaskQueue();
      expect(defaultQueue.isEmpty()).toBe(true);
    });

    it('should accept custom config', () => {
      const customQueue = new TaskQueue({
        maxConcurrent: 3,
        autoStart: false,
      });
      expect(customQueue.isEmpty()).toBe(true);
    });
  });

  describe('enqueue', () => {
    it('should add task to queue', () => {
      const id = queue.enqueue(0, 'test.pdf');
      expect(id).toBeDefined();
      expect(queue.isEmpty()).toBe(false);
    });

    it('should return unique task IDs', () => {
      const id1 = queue.enqueue(0, 'file1.pdf');
      const id2 = queue.enqueue(1, 'file2.pdf');
      expect(id1).not.toBe(id2);
    });

    it('should create task with pending status', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);

      expect(task).toBeDefined();
      expect(task?.status).toBe(TaskStatus.PENDING);
      expect(task?.progress).toBe(0);
      expect(task?.fileIndex).toBe(0);
      expect(task?.fileName).toBe('test.pdf');
    });
  });

  describe('getTask', () => {
    it('should return task by ID', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);
      expect(task?.id).toBe(id);
    });

    it('should return undefined for non-existent ID', () => {
      const task = queue.getTask('non-existent-id');
      expect(task).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    it('should return empty array when queue is empty', () => {
      expect(queue.getAllTasks()).toHaveLength(0);
    });

    it('should return all tasks', () => {
      queue.enqueue(0, 'file1.pdf');
      queue.enqueue(1, 'file2.pdf');
      queue.enqueue(2, 'file3.pdf');

      expect(queue.getAllTasks()).toHaveLength(3);
    });
  });

  describe('getTasksByStatus', () => {
    it('should filter tasks by status', () => {
      queue.enqueue(0, 'file1.pdf');
      queue.enqueue(1, 'file2.pdf');

      const pending = queue.getTasksByStatus(TaskStatus.PENDING);
      expect(pending).toHaveLength(2);
    });

    it('should return empty array if no matching status', () => {
      queue.enqueue(0, 'file1.pdf');
      const processing = queue.getTasksByStatus(TaskStatus.PROCESSING);
      expect(processing).toHaveLength(0);
    });
  });

  describe('cancel', () => {
    it('should cancel pending task', () => {
      const id = queue.enqueue(0, 'test.pdf');
      queue.cancel(id);

      const task = queue.getTask(id);
      expect(task?.status).toBe(TaskStatus.CANCELLED);
    });

    it('should not cancel non-pending task', async () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);

      // Manually set to processing (simulating in-flight task)
      if (task) {
        task.status = TaskStatus.PROCESSING;
      }

      queue.cancel(id);
      expect(task?.status).toBe(TaskStatus.PROCESSING);
    });
  });

  describe('cancelAll', () => {
    it('should cancel all pending tasks', () => {
      queue.enqueue(0, 'file1.pdf');
      queue.enqueue(1, 'file2.pdf');
      queue.enqueue(2, 'file3.pdf');

      queue.cancelAll();

      const tasks = queue.getAllTasks();
      expect(tasks.every(t => t.status === TaskStatus.CANCELLED)).toBe(true);
    });
  });

  describe('pause and resume', () => {
    it('should pause queue processing', async () => {
      const mockProcessor = vi.fn().mockResolvedValue(new Blob());
      queue.setProcessor(mockProcessor);

      queue.enqueue(0, 'test.pdf');
      queue.pause();
      queue.resume();
      queue.pause();

      // Since we paused after resume, no processing should happen
      // (autoStart is false, so we need explicit resume)
    });
  });

  describe('retry', () => {
    it('should reset failed task to pending', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);

      // Manually set to failed
      if (task) {
        task.status = TaskStatus.FAILED;
        task.error = new Error('Test error');
        task.progress = 50;
      }

      queue.retry(id);

      expect(task?.status).toBe(TaskStatus.PENDING);
      expect(task?.error).toBeUndefined();
      expect(task?.progress).toBe(0);
    });

    it('should not retry non-failed task', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);

      queue.retry(id);

      // Task is pending, retry should not change it
      expect(task?.status).toBe(TaskStatus.PENDING);
    });
  });

  describe('getOverallProgress', () => {
    it('should return 0 for empty queue', () => {
      expect(queue.getOverallProgress()).toBe(0);
    });

    it('should calculate progress correctly', () => {
      const id1 = queue.enqueue(0, 'file1.pdf');
      const id2 = queue.enqueue(1, 'file2.pdf');

      const task1 = queue.getTask(id1);
      const task2 = queue.getTask(id2);

      // Simulate one complete, one at 50%
      if (task1) {
        task1.status = TaskStatus.SUCCESS;
        task1.progress = 100;
      }
      if (task2) {
        task2.status = TaskStatus.PROCESSING;
        task2.progress = 50;
      }

      // (100 + 50) / 2 = 75
      expect(queue.getOverallProgress()).toBe(75);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false after adding tasks', () => {
      queue.enqueue(0, 'test.pdf');
      expect(queue.isEmpty()).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('should return false for empty queue', () => {
      expect(queue.isComplete()).toBe(false);
    });

    it('should return false if any task is pending', () => {
      queue.enqueue(0, 'test.pdf');
      expect(queue.isComplete()).toBe(false);
    });

    it('should return true if all tasks are finished', () => {
      const id1 = queue.enqueue(0, 'file1.pdf');
      const id2 = queue.enqueue(1, 'file2.pdf');

      const task1 = queue.getTask(id1);
      const task2 = queue.getTask(id2);

      if (task1) task1.status = TaskStatus.SUCCESS;
      if (task2) task2.status = TaskStatus.FAILED;

      expect(queue.isComplete()).toBe(true);
    });

    it('should return true if all tasks are cancelled', () => {
      queue.enqueue(0, 'test.pdf');
      queue.cancelAll();
      expect(queue.isComplete()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all tasks', () => {
      queue.enqueue(0, 'file1.pdf');
      queue.enqueue(1, 'file2.pdf');

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
      expect(queue.getAllTasks()).toHaveLength(0);
    });
  });

  describe('updateProgress', () => {
    it('should update progress for processing task', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);
      if (task) task.status = TaskStatus.PROCESSING;

      queue.updateProgress(id, 50);

      expect(task?.progress).toBe(50);
    });

    it('should clamp progress to 0-100', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);
      if (task) task.status = TaskStatus.PROCESSING;

      queue.updateProgress(id, 150);
      expect(task?.progress).toBe(100);

      queue.updateProgress(id, -10);
      expect(task?.progress).toBe(0);
    });

    it('should not update non-processing task', () => {
      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);
      // Task is pending, not processing

      queue.updateProgress(id, 50);

      expect(task?.progress).toBe(0);
    });

    it('should call onTaskProgress callback', () => {
      const progressCallback = vi.fn();
      queue.onTaskProgress = progressCallback;

      const id = queue.enqueue(0, 'test.pdf');
      const task = queue.getTask(id);
      if (task) task.status = TaskStatus.PROCESSING;

      queue.updateProgress(id, 50);

      expect(progressCallback).toHaveBeenCalledWith(id, 50);
    });
  });

  describe('getStats', () => {
    it('should return zero stats for empty queue', () => {
      const stats = queue.getStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.success).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.cancelled).toBe(0);
    });

    it('should count tasks by status', () => {
      const id1 = queue.enqueue(0, 'file1.pdf');
      const id2 = queue.enqueue(1, 'file2.pdf');
      const id3 = queue.enqueue(2, 'file3.pdf');
      const id4 = queue.enqueue(3, 'file4.pdf');

      const task1 = queue.getTask(id1);
      const task2 = queue.getTask(id2);
      const task3 = queue.getTask(id3);
      // task4 stays pending

      if (task1) task1.status = TaskStatus.SUCCESS;
      if (task2) task2.status = TaskStatus.FAILED;
      if (task3) task3.status = TaskStatus.PROCESSING;

      const stats = queue.getStats();

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.success).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.cancelled).toBe(0);
    });
  });

  describe('processing', () => {
    it('should process tasks with processor', async () => {
      const mockBlob = new Blob(['test']);
      const mockProcessor = vi.fn().mockResolvedValue(mockBlob);
      const taskStartCallback = vi.fn();
      const taskCompleteCallback = vi.fn();

      queue.setProcessor(mockProcessor);
      queue.onTaskStart = taskStartCallback;
      queue.onTaskComplete = taskCompleteCallback;

      const id = queue.enqueue(0, 'test.pdf');
      queue.resume();

      // Wait for async processing
      await vi.waitFor(() => {
        const task = queue.getTask(id);
        return task?.status === TaskStatus.SUCCESS;
      }, { timeout: 1000 });

      expect(mockProcessor).toHaveBeenCalled();
      expect(taskStartCallback).toHaveBeenCalledWith(id);
      expect(taskCompleteCallback).toHaveBeenCalledWith(id, mockBlob);
    });

    it('should handle processor errors', async () => {
      const testError = new Error('Processing failed');
      const mockProcessor = vi.fn().mockRejectedValue(testError);
      const taskErrorCallback = vi.fn();

      queue.setProcessor(mockProcessor);
      queue.onTaskError = taskErrorCallback;

      const id = queue.enqueue(0, 'test.pdf');
      queue.resume();

      // Wait for async processing
      await vi.waitFor(() => {
        const task = queue.getTask(id);
        return task?.status === TaskStatus.FAILED;
      }, { timeout: 1000 });

      const task = queue.getTask(id);
      expect(task?.status).toBe(TaskStatus.FAILED);
      expect(task?.error).toBe(testError);
      expect(taskErrorCallback).toHaveBeenCalledWith(id, testError);
    });

    it('should call onQueueComplete when all tasks done', async () => {
      const mockBlob = new Blob(['test']);
      const mockProcessor = vi.fn().mockResolvedValue(mockBlob);
      const queueCompleteCallback = vi.fn();

      queue.setProcessor(mockProcessor);
      queue.onQueueComplete = queueCompleteCallback;

      queue.enqueue(0, 'test.pdf');
      queue.resume();

      // Wait for completion
      await vi.waitFor(() => queue.isComplete(), { timeout: 1000 });

      // Wait a bit more for the callback to be invoked
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(queueCompleteCallback).toHaveBeenCalled();
    });
  });
});
