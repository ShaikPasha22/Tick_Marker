import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { SwotItem } from '../models/SwotItem';

// GET /api/tasks
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tasks
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { title, description, dueDate, swotId, swotItemId } = req.body;

    const task = new Task({
      userId,
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      swotId,
      swotItemId,
      status: 'pending',
    });

    await task.save();

    // Link back to SWOT item if provided
    if (swotItemId) {
      await SwotItem.updateOne({ _id: swotItemId, userId }, { taskId: task._id });
    }

    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/tasks/:id
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { title, description, status, dueDate } = req.body;

    const task = await Task.findOne({ _id: req.params.id, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
    
    const statusChanged = status !== undefined && status !== task.status;
    if (status !== undefined) task.status = status;

    await task.save();

    // Sync status back to SWOT item if linked
    if (statusChanged && task.swotItemId) {
      const swotItemStatus = task.status === 'completed' ? 'completed' : 'in_progress';
      await SwotItem.updateOne({ _id: task.swotItemId, userId }, { status: swotItemStatus });
    }

    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const task = await Task.findOne({ _id: req.params.id, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Remove link from SWOT item if exists
    if (task.swotItemId) {
      await SwotItem.updateOne({ _id: task.swotItemId, userId }, { $unset: { taskId: 1 } });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tasks/link
export const linkSwotItemToTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { taskId, swotId, swotItemId } = req.body;

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const item = await SwotItem.findOne({ _id: swotItemId, swotId, userId });
    if (!item) {
      res.status(404).json({ message: 'SWOT Item not found' });
      return;
    }

    // Update references on both documents
    task.swotId = swotId;
    task.swotItemId = swotItemId;
    await task.save();

    item.taskId = taskId;
    // Sync status: if task is completed, SWOT item is completed. Otherwise keep SWOT item status.
    if (task.status === 'completed') {
      item.status = 'completed';
    }
    await item.save();

    res.json({ task, item });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
