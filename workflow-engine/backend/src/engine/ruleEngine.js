const Rule = require('../models/Rule');

async function evaluateRules(stepId, inputData) {
  const rules = await Rule.find({ step_id: stepId }).sort({ priority: 1 });
  const evaluationLogs = [];

  const contains = function (field, value) {
    return String(field).includes(String(value));
  };
  const startsWith = function (field, prefix) {
    return String(field).startsWith(String(prefix));
  };
  const endsWith = function (field, suffix) {
    return String(field).endsWith(String(suffix));
  };

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];

    if (rule.condition === 'DEFAULT') {
      evaluationLogs.push({
        rule: rule.condition,
        result: true,
        next_step_id: rule.next_step_id
      });
      return {
        next_step_id: rule.next_step_id,
        logs: evaluationLogs
      };
    }

    try {
      var conditionCode = 'try { with(data) { return (' + rule.condition + '); } } catch(e) { return false; }';

      var fn = new Function('data', 'contains', 'startsWith', 'endsWith', conditionCode);

      var result = Boolean(fn(inputData, contains, startsWith, endsWith));

      evaluationLogs.push({
        rule: rule.condition,
        result: result,
        next_step_id: result ? rule.next_step_id : null
      });

      if (result) {
        return {
          next_step_id: rule.next_step_id,
          logs: evaluationLogs
        };
      }

    } catch (err) {
      evaluationLogs.push({
        rule: rule.condition,
        result: false,
        error: err.message
      });
    }
  }

  return {
    next_step_id: null,
    logs: evaluationLogs
  };
}

module.exports = { evaluateRules };