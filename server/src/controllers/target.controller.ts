import { Request, Response } from 'express';
import { Target } from '../models/Target';
import { Task } from '../models/Task';

// GET /api/targets
export const getTargets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { isDumpItem, assignedType, weekStart, month, year, targetDate } = req.query;

    const query: any = { userId };

    if (isDumpItem !== undefined) {
      query.isDumpItem = isDumpItem === 'true';
    }
    if (assignedType !== undefined) {
      query.assignedType = assignedType;
    }
    if (weekStart !== undefined && weekStart !== '') {
      query.weekStart = weekStart;
    }
    if (month !== undefined && month !== '') {
      query.month = month;
    }
    if (year !== undefined && year !== '') {
      query.year = Number(year);
    }
    if (targetDate !== undefined && targetDate !== '') {
      query.targetDate = targetDate;
    }

    const targets = await Target.find(query)
      .populate('linkedTaskIds')
      .sort({ position: 1, createdAt: 1 });
      
    res.json(targets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/targets
export const createTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const {
      title,
      description,
      notes,
      category,
      priority,
      status,
      progress,
      progressMax,
      progressType,
      isDumpItem,
      assignedType,
      weekStart,
      month,
      year,
      targetDate,
    } = req.body;

    // Calculate position ranking
    const query: any = { userId, assignedType: assignedType || 'none' };
    if (assignedType === 'weekly' && weekStart) query.weekStart = weekStart;
    if (assignedType === 'monthly' && month) query.month = month;
    if (assignedType === 'yearly' && year) query.year = Number(year);
    const position = await Target.countDocuments(query);

    const target = new Target({
      userId,
      title,
      description: description || '',
      notes: notes || '',
      category,
      priority: priority || 'medium',
      status: status || 'not_started',
      progress: progress || 0,
      progressMax: progressMax || 100,
      progressType: progressType || 'percentage',
      isDumpItem: isDumpItem || false,
      assignedType: assignedType || 'none',
      weekStart,
      month,
      year: year ? Number(year) : undefined,
      targetDate,
      position,
      linkedTaskIds: [],
    });

    await target.save();
    res.status(201).json(target);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/targets/:id
export const updateTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const {
      title,
      description,
      notes,
      category,
      priority,
      status,
      progress,
      progressMax,
      progressType,
      isDumpItem,
      assignedType,
      weekStart,
      month,
      year,
      targetDate,
      position,
      linkedTaskIds,
    } = req.body;

    const target = await Target.findOne({ _id: req.params.id, userId });
    if (!target) {
      res.status(404).json({ message: 'Target not found' });
      return;
    }

    if (title !== undefined) target.title = title;
    if (description !== undefined) target.description = description;
    if (notes !== undefined) target.notes = notes;
    if (category !== undefined) target.category = category;
    if (priority !== undefined) target.priority = priority;
    if (status !== undefined) target.status = status;
    if (progress !== undefined) target.progress = Number(progress);
    if (progressMax !== undefined) target.progressMax = Number(progressMax);
    if (progressType !== undefined) target.progressType = progressType;
    if (isDumpItem !== undefined) target.isDumpItem = isDumpItem;
    if (assignedType !== undefined) target.assignedType = assignedType;
    if (weekStart !== undefined) target.weekStart = weekStart;
    if (month !== undefined) target.month = month;
    if (year !== undefined) target.year = year ? Number(year) : undefined;
    if (targetDate !== undefined) target.targetDate = targetDate;
    if (position !== undefined) target.position = position;
    if (linkedTaskIds !== undefined) target.linkedTaskIds = linkedTaskIds;

    await target.save();
    res.json(target);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/targets/:id
export const deleteTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const target = await Target.findOne({ _id: req.params.id, userId });
    if (!target) {
      res.status(404).json({ message: 'Target not found' });
      return;
    }

    await Target.deleteOne({ _id: req.params.id });
    res.json({ message: 'Target deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
