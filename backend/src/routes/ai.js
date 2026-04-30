const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const auth = require('../middleware/auth');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5';

// Per-user rate limit: 10 breakdowns / hour. In-memory store.
// In production this should live in Redis. For an MVP it's fine.
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, resetAt: entry.resetAt };
  }
  entry.count += 1;
  rateLimits.set(userId, entry);
  return { ok: true };
}

// Tool definition: forces Claude to return structured output
const breakdownTool = {
  name: 'submit_task_breakdown',
  description: 'Submits a structured breakdown of a development task into actionable subtasks.',
  input_schema: {
    type: 'object',
    properties: {
      estimatedHours: {
        type: 'number',
        description: 'Total estimated time in hours to complete all subtasks. Be realistic, not optimistic.',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Suggested priority based on complexity and typical urgency for this type of work.',
      },
      subtasks: {
        type: 'array',
        items: { type: 'string' },
        minItems: 3,
        maxItems: 5,
        description: 'Between 3 and 5 concrete, actionable subtasks. Each should be a short imperative phrase, no longer than 80 characters.',
      },
    },
    required: ['estimatedHours', 'priority', 'subtasks'],
  },
};

const SYSTEM_PROMPT = `You are a senior software engineer helping a developer break down a vague task into concrete, actionable subtasks.

Rules:
- Always return between 3 and 5 subtasks. Never more, never less.
- Each subtask should be a short imperative phrase ("Add X", "Wire Y", "Refactor Z"), no longer than 80 characters.
- Subtasks should be technical and specific, not generic ("Plan the work" is bad, "Define the schema for users table" is good).
- Estimate hours conservatively. A small bug fix is 1-2h. A feature is 4-8h. A complex integration is 8-20h.
- Priority "high" is for blockers and bugs in production. "medium" is the default for features. "low" is for polish and optimizations.
- Always call the submit_task_breakdown tool. Never reply with plain text.`;

router.post('/tasks/:id/breakdown', auth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI features are not configured on this server.' });
  }

  const rate = checkRateLimit(req.user.id);
  if (!rate.ok) {
    const minutes = Math.ceil((rate.resetAt - Date.now()) / 60000);
    return res.status(429).json({
      error: `Rate limit reached. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    });
  }

  try {
    const taskRes = await db.query(
      `SELECT t.*, c.board_id
       FROM tasks t JOIN columns c ON t.column_id = c.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!taskRes.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskRes.rows[0];

    const boardRes = await db.query('SELECT owner_id FROM boards WHERE id = $1', [task.board_id]);
    if (!boardRes.rows.length) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const ownerId = boardRes.rows[0].owner_id;
    if (ownerId !== req.user.id) {
      const memberCheck = await db.query(
        'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
        [task.board_id, req.user.id]
      );
      if (!memberCheck.rows.length) {
        return res.status(403).json({ error: 'No access to this task.' });
      }
    }

    const userContent = [
      `Title: ${task.title}`,
      task.description ? `Description: ${task.description}` : 'Description: (none)',
    ].join('\n');

    const startedAt = Date.now();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [breakdownTool],
      tool_choice: { type: 'tool', name: 'submit_task_breakdown' },
      messages: [{ role: 'user', content: userContent }],
    });
    const durationMs = Date.now() - startedAt;

    const toolUse = message.content.find((block) => block.type === 'tool_use');
    if (!toolUse) {
      return res.status(502).json({ error: 'AI returned an invalid response. Try again.' });
    }
    const breakdown = toolUse.input;

    const usage = message.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    // Haiku approx pricing: $1 / MTok input, $5 / MTok output
    const costUsd = (inputTokens / 1_000_000) * 1 + (outputTokens / 1_000_000) * 5;
    console.log(
      `[ai] breakdown user=${req.user.id} task=${task.id} ` +
      `tokens=${inputTokens}+${outputTokens} cost=$${costUsd.toFixed(5)} ` +
      `duration=${durationMs}ms`
    );

    res.json({
      estimatedHours: breakdown.estimatedHours,
      priority: breakdown.priority,
      subtasks: breakdown.subtasks,
    });
  } catch (err) {
    console.error('[ai] breakdown error:', err.message);
    if (err.status === 401) {
      return res.status(500).json({ error: 'AI service is not authenticated.' });
    }
    if (err.status === 429) {
      return res.status(503).json({ error: 'AI service is rate limited. Try again later.' });
    }
    res.status(500).json({ error: err.message || 'Failed to generate breakdown.' });
  }
});

module.exports = router;
