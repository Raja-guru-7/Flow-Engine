const Execution = require('../models/Execution');
const Step = require('../models/Step');
const Workflow = require('../models/Workflow');
const { evaluateRules } = require('./ruleEngine');

async function runExecution(executionId) {
  const execution = await Execution.findOne({ id: executionId });
  if (!execution) throw new Error('Execution not found');

  const workflow = await Workflow.findOne({ id: execution.workflow_id });
  if (!workflow) throw new Error('Workflow not found');

  execution.status = 'in_progress';
  execution.started_at = new Date();
  await execution.save();

  let currentStepId = execution.current_step_id || workflow.start_step_id;
  const visitedSteps = new Set();
  const MAX_ITERATIONS = 50;
  let iterations = 0;

  while (currentStepId && iterations < MAX_ITERATIONS) {
    // Infinite loop check
    if (visitedSteps.has(currentStepId)) {
      execution.logs.push({
        error: 'Infinite loop detected',
        step_id: currentStepId,
        timestamp: new Date()
      });
      execution.status = 'failed';
      break;
    }

    visitedSteps.add(currentStepId);
    iterations++;

    const step = await Step.findOne({ id: currentStepId });
    if (!step) {
      execution.logs.push({
        error: `Step not found: ${currentStepId}`,
        timestamp: new Date()
      });
      execution.status = 'failed';
      break;
    }

    const stepStartTime = new Date();
    const { next_step_id, logs: ruleLogs } = await evaluateRules(
      currentStepId,
      execution.data
    );

    execution.logs.push({
      step_name: step.name,
      step_type: step.step_type,
      step_id: currentStepId,
      evaluated_rules: ruleLogs,
      selected_next_step: next_step_id,
      status: 'completed',
      started_at: stepStartTime,
      ended_at: new Date()
    });

    execution.current_step_id = next_step_id;
    currentStepId = next_step_id;
  }

  if (execution.status === 'in_progress') {
    execution.status = 'completed';
  }

  execution.ended_at = new Date();
  await execution.save();
  return execution;
}

module.exports = { runExecution };