import { Request, Response } from 'express';
import { SwotAnalysis } from '../models/SwotAnalysis';
import { SwotItem } from '../models/SwotItem';
import { Task } from '../models/Task';
import { calculateItemPriority } from '../services/priorityEngine';

// GET /api/swot
export const getSwotAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const analyses = await SwotAnalysis.find({ userId }).sort({ updatedAt: -1 });
    res.json(analyses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/swot/:id
export const getSwotAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const analysis = await SwotAnalysis.findOne({ _id: req.params.id, userId });
    if (!analysis) {
      res.status(404).json({ message: 'SWOT Analysis not found' });
      return;
    }
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/swot
export const createSwotAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, description, category, startDate, targetDate } = req.body;
    
    const analysis = new SwotAnalysis({
      userId,
      name,
      description: description || '',
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status: 'active'
    });

    await analysis.save();
    res.status(201).json(analysis);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/swot/:id
export const updateSwotAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, description, category, startDate, targetDate, status } = req.body;

    const analysis = await SwotAnalysis.findOne({ _id: req.params.id, userId });
    if (!analysis) {
      res.status(404).json({ message: 'SWOT Analysis not found' });
      return;
    }

    if (name !== undefined) analysis.name = name;
    if (description !== undefined) analysis.description = description;
    if (category !== undefined) analysis.category = category;
    if (startDate !== undefined) analysis.startDate = startDate ? new Date(startDate) : undefined;
    if (targetDate !== undefined) analysis.targetDate = targetDate ? new Date(targetDate) : undefined;
    if (status !== undefined) analysis.status = status;

    await analysis.save();
    res.json(analysis);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/swot/:id
export const deleteSwotAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const swotId = req.params.id;

    const analysis = await SwotAnalysis.findOne({ _id: swotId, userId });
    if (!analysis) {
      res.status(404).json({ message: 'SWOT Analysis not found' });
      return;
    }

    const itemsCount = await SwotItem.countDocuments({ swotId });
    const tasksCount = await Task.countDocuments({ swotId });

    if (itemsCount > 0 || tasksCount > 0) {
      if (req.query.confirmDelete !== 'true') {
        res.status(400).json({
          warning: true,
          message: `This SWOT Analysis contains ${itemsCount} items and is linked to ${tasksCount} tasks. Deleting it will permanently delete all its items and unlink any tasks. Do you want to proceed?`
        });
        return;
      }
    }

    // Delete SWOT items
    await SwotItem.deleteMany({ swotId });

    // Unlink tasks
    await Task.updateMany({ swotId }, { $unset: { swotId: 1, swotItemId: 1 } });

    // Delete the analysis
    await SwotAnalysis.deleteOne({ _id: swotId });

    res.json({ message: 'SWOT Analysis deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/swot/:id/duplicate
export const duplicateSwotAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const swotId = req.params.id;

    const original = await SwotAnalysis.findOne({ _id: swotId, userId });
    if (!original) {
      res.status(404).json({ message: 'SWOT Analysis not found' });
      return;
    }

    // Create copy
    const copy = new SwotAnalysis({
      userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      startDate: original.startDate,
      targetDate: original.targetDate,
      status: 'active'
    });
    await copy.save();

    // Fetch original items
    const originalItems = await SwotItem.find({ swotId });
    const copiedItems = originalItems.map((item) => {
      return new SwotItem({
        userId,
        swotId: copy._id,
        title: item.title,
        description: item.description,
        notes: item.notes,
        quadrant: item.quadrant,
        impact: item.impact,
        urgency: item.urgency,
        severity: item.severity,
        priority: item.priority,
        priorityScore: item.priorityScore,
        prioritySource: item.prioritySource,
        status: item.status,
        deadline: item.deadline,
        position: item.position,
        history: [] // start fresh history
      });
    });

    if (copiedItems.length > 0) {
      await SwotItem.insertMany(copiedItems);
    }

    res.status(201).json(copy);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/swot/:id/items
export const getSwotItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const swotId = req.params.id;

    const analysis = await SwotAnalysis.findOne({ _id: swotId, userId });
    if (!analysis) {
      res.status(404).json({ message: 'SWOT Analysis not found' });
      return;
    }

    const items = await SwotItem.find({ swotId }).sort({ position: 1, createdAt: 1 });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/swot/:id/items
export const createSwotItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const swotId = req.params.id;
    const { title, description, notes, category, deadline, impact, urgency, severity, quadrant } = req.body;

    const analysis = await SwotAnalysis.findOne({ _id: swotId, userId });
    if (!analysis) {
      res.status(404).json({ message: 'SWOT Analysis not found' });
      return;
    }

    const targetQuadrant = quadrant || 'unclassified';
    const targetImpact = impact || 'medium';
    const targetUrgency = urgency || 'medium';
    const targetSeverity = severity || 'medium';

    // Calculate priority engine details
    const priorityDetails = calculateItemPriority(targetQuadrant, targetImpact, targetUrgency, targetSeverity);

    // Get count for position ranking
    const position = await SwotItem.countDocuments({ swotId, quadrant: targetQuadrant });

    const item = new SwotItem({
      userId,
      swotId,
      title,
      description: description || '',
      notes: notes || '',
      quadrant: targetQuadrant,
      impact: targetImpact,
      urgency: targetUrgency,
      severity: priorityDetails.severity,
      priority: priorityDetails.priority,
      priorityScore: priorityDetails.priorityScore,
      prioritySource: 'calculated',
      status: 'not_started',
      deadline: deadline ? new Date(deadline) : undefined,
      position,
      history: []
    });

    await item.save();
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/swot/:id/items/:itemId
export const updateSwotItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id: swotId, itemId } = req.params;
    const {
      title,
      description,
      notes,
      quadrant,
      impact,
      urgency,
      severity,
      priority,
      prioritySource,
      status,
      deadline,
      position,
      taskId
    } = req.body;

    const item = await SwotItem.findOne({ _id: itemId, swotId, userId });
    if (!item) {
      res.status(404).json({ message: 'SWOT Item not found' });
      return;
    }

    const previousQuadrant = item.quadrant;
    const previousPriority = item.priority;

    // Apply basic updates
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (notes !== undefined) item.notes = notes;
    if (status !== undefined) item.status = status;
    if (deadline !== undefined) item.deadline = deadline ? new Date(deadline) : undefined;
    if (position !== undefined) item.position = position;
    if (taskId !== undefined) item.taskId = taskId;

    // Handle quadrant and priority updates
    const quadrantChanged = quadrant !== undefined && quadrant !== item.quadrant;
    if (quadrant !== undefined) item.quadrant = quadrant;
    if (impact !== undefined) item.impact = impact;
    if (urgency !== undefined) item.urgency = urgency;
    if (severity !== undefined) item.severity = severity;
    if (prioritySource !== undefined) item.prioritySource = prioritySource;

    // Calculate priority details
    const targetSource = prioritySource || item.prioritySource;
    if (targetSource === 'calculated') {
      const priorityDetails = calculateItemPriority(item.quadrant, item.impact, item.urgency, item.severity);
      item.priority = priorityDetails.priority;
      item.severity = priorityDetails.severity;
      item.priorityScore = priorityDetails.priorityScore;
    } else {
      if (priority !== undefined) item.priority = priority;
      // Re-evaluate score manually or based on inputs
      const priorityDetails = calculateItemPriority(item.quadrant, item.impact, item.urgency, item.severity);
      item.priorityScore = priorityDetails.priorityScore;
    }

    // Add Audit Log history entry
    if (previousQuadrant !== item.quadrant || previousPriority !== item.priority) {
      item.history.push({
        previousQuadrant,
        newQuadrant: item.quadrant,
        previousPriority,
        newPriority: item.priority,
        changedAt: new Date()
      });
    }

    await item.save();
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/swot/:id/items/:itemId
export const deleteSwotItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id: swotId, itemId } = req.params;

    const item = await SwotItem.findOne({ _id: itemId, swotId, userId });
    if (!item) {
      res.status(404).json({ message: 'SWOT Item not found' });
      return;
    }

    if (item.taskId) {
      if (req.query.confirmDelete !== 'true') {
        res.status(400).json({
          warning: true,
          message: 'This SWOT item is linked to an existing task. Deleting the SWOT item will remove the SWOT relationship but will not automatically delete the task. Do you want to proceed?'
        });
        return;
      }

      // Remove SWOT references on task
      await Task.updateOne({ _id: item.taskId }, { $unset: { swotId: 1, swotItemId: 1 } });
    }

    await SwotItem.deleteOne({ _id: itemId });
    res.json({ message: 'SWOT Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
