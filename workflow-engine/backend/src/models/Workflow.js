const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workflowSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true, trim: true },
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  input_schema: { type: mongoose.Schema.Types.Mixed, default: {} },
  start_step_id: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);