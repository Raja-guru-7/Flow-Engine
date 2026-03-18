const express = require('express');
const router = express.Router({ mergeParams: true });
const Rule = require('../models/Rule');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req, res) => {
  try {
    const rule = new Rule({ ...req.body, id: uuidv4(), step_id: req.params.step_id });
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const rules = await Rule.find({ step_id: req.params.step_id }).sort({ priority: 1 });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const rule = await Rule.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Rule.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
