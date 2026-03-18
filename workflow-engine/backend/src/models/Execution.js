const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const executionSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  workflow_id: { type: String, required: true },
  workflow_version: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  logs: [{ type: mongoose.Schema.Types.Mixed }],
  current_step_id: { type: String, default: null },
  retries: { type: Number, default: 0 },
  triggered_by: { type: String, default: 'manual' },
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Execution', executionSchema);