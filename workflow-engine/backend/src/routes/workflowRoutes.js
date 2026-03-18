const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');
const { v4: uuidv4 } = require('uuid');
const { runExecution } = require('../engine/executionEngine');

// POST /workflows — Create workflow
router.post('/', async (req, res) => {
  try {
    const workflow = new Workflow({ ...req.body, id: uuidv4() });
    await workflow.save();
    res.status(201).json({ success: true, data: workflow });  // ✅ wrapped
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /workflows — List workflows
router.get('/', async (req, res) => {
  try {
    const { search, is_active, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    const workflows = await Workflow.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Workflow.countDocuments(filter);
    res.json({ success: true, data: { workflows, total, page: Number(page) } }); // ✅ wrapped
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /workflows/:id — Get single workflow
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ id: req.params.id });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });
    const steps = await Step.find({ workflow_id: req.params.id }).sort({ order: 1 });
    const stepsWithRules = await Promise.all(
      steps.map(async (step) => {
        const rules = await Rule.find({ step_id: step.id }).sort({ priority: 1 });
        return { ...step.toObject(), rules };
      })
    );
    res.json({ success: true, data: { ...workflow.toObject(), steps: stepsWithRules } }); // ✅ wrapped
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /workflows/:id — Update workflow
router.put('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ id: req.params.id });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });
    Object.assign(workflow, req.body);
    workflow.version += 1;
    await workflow.save();
    res.json({ success: true, data: workflow }); // ✅ wrapped
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /workflows/:id — Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    await Workflow.findOneAndDelete({ id: req.params.id });
    await Step.deleteMany({ workflow_id: req.params.id });
    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /workflows/:workflow_id/execute — Execute workflow
router.post('/:workflow_id/execute', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ id: req.params.workflow_id });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });
    if (!workflow.is_active) return res.status(400).json({ success: false, message: 'Workflow is not active' });

    const { triggered_by, ...inputData } = req.body;

    const execution = new Execution({
      id: uuidv4(),
      workflow_id: workflow.id,
      workflow_version: workflow.version,
      data: inputData,
      triggered_by: triggered_by || 'manual',
    });
    await execution.save();

    const result = await runExecution(execution.id);
    res.status(201).json({ success: true, data: result });  // ✅ wrapped
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;