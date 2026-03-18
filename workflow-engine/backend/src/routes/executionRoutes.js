const express = require('express');
const router = express.Router();
const Execution = require('../models/Execution');
const { runExecution } = require('../engine/executionEngine');

// GET all executions
router.get('/', async (req, res) => {
  try {
    const executions = await Execution.find().sort({ createdAt: -1 });
    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single execution
router.get('/:id', async (req, res) => {
  try {
    const execution = await Execution.findOne({ id: req.params.id });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CANCEL execution
router.post('/:id/cancel', async (req, res) => {
  try {
    const execution = await Execution.findOne({ id: req.params.id });
    if (!execution) return res.status(404).json({ error: 'Not found' });
    if (execution.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed execution' });
    }
    execution.status = 'cancelled';
    execution.ended_at = new Date();
    await execution.save();
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RETRY execution
router.post('/:id/retry', async (req, res) => {
  try {
    const execution = await Execution.findOne({ id: req.params.id });
    if (!execution) return res.status(404).json({ error: 'Not found' });
    execution.status = 'pending';
    execution.retries += 1;
    execution.ended_at = null;
    execution.logs = [];
    await execution.save();
    const result = await runExecution(execution.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;