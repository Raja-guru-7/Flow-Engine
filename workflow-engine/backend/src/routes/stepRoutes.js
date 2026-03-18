const express = require('express');
const router = express.Router({ mergeParams: true });
const Step = require('../models/Step');
const Workflow = require('../models/Workflow');
const { v4: uuidv4 } = require('uuid');

// POST /workflows/:workflow_id/steps — Create step
router.post('/', async (req, res) => {
  try {
    const workflow_id = req.params.workflow_id;

    const workflow = await Workflow.findOne({ id: workflow_id });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const { name, type, step_type, order, metadata } = req.body;

    // ✅ Accept both "type" (from frontend) and "step_type" (direct)
    const resolvedType = step_type || type || 'task';

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Step name is required' });
    }
    if (order === undefined || order === null || order === '') {
      return res.status(400).json({ success: false, message: 'Step order is required' });
    }

    const step = new Step({
      id: uuidv4(),
      workflow_id: workflow_id,
      name: name.trim(),
      step_type: resolvedType,   // ✅ always use step_type field
      order: Number(order),
      metadata: metadata || {},
    });

    await step.save();

    // Auto-set start_step_id if not set
    if (!workflow.start_step_id) {
      workflow.start_step_id = step.id;
      await workflow.save();
    }

    res.status(201).json({ success: true, data: step });  // ✅ wrapped
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /workflows/:workflow_id/steps — Get all steps
router.get('/', async (req, res) => {
  try {
    const steps = await Step.find({ workflow_id: req.params.workflow_id }).sort({ order: 1 });
    res.json({ success: true, data: steps });  // ✅ wrapped
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /steps/:id — Update step
router.put('/:id', async (req, res) => {
  try {
    const { name, type, step_type, order, metadata } = req.body;
    const resolvedType = step_type || type;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (resolvedType) updateData.step_type = resolvedType;
    if (order !== undefined) updateData.order = Number(order);
    if (metadata !== undefined) updateData.metadata = metadata;

    const step = await Step.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });
    res.json({ success: true, data: step });  // ✅ wrapped
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /steps/:id — Delete step
router.delete('/:id', async (req, res) => {
  try {
    const step = await Step.findOneAndDelete({ id: req.params.id });
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });
    res.json({ success: true, message: 'Step deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;