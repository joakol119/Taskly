const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

function serializeTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    order: t.order,
    columnId: t.column_id,
    done: t.done || false,
    labels: t.labels ? (typeof t.labels === 'string' ? JSON.parse(t.labels) : t.labels) : [],
    dueDate: t.due_date || null,
  };
}

router.post('/', auth, async (req, res) => {
  const { title, columnId } = req.body;
  if (!title || !columnId) return res.status(400).json({ error: 'title y columnId son obligatorios' });
  try {
    const posRes = await db.query(
      'SELECT COALESCE(MAX("order"), -1) + 1 AS next_pos FROM tasks WHERE column_id = $1',
      [columnId]
    );
    const order = posRes.rows[0].next_pos;
    const result = await db.query(
      'INSERT INTO tasks (title, column_id, "order") VALUES ($1, $2, $3) RETURNING *',
      [title, columnId, order]
    );
    res.status(201).json(serializeTask(result.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  const { title, description, labels, dueDate, done } = req.body;
  try {
    const fields = [];
    const values = [];
    let i = 1;
    if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description); }
    if (labels !== undefined) { fields.push(`labels = $${i++}`); values.push(JSON.stringify(labels)); }
    if (dueDate !== undefined) { fields.push(`due_date = $${i++}`); values.push(dueDate); }
    if (done !== undefined) { fields.push(`done = $${i++}`); values.push(done); }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    values.push(req.params.id);
    const result = await db.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(serializeTask(result.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/move', auth, async (req, res) => {
  const { columnId, order } = req.body;
  if (columnId === undefined || order === undefined) {
    return res.status(400).json({ error: 'columnId y order son obligatorios' });
  }
  try {
    const result = await db.query(
      'UPDATE tasks SET column_id = $1, "order" = $2 WHERE id = $3 RETURNING *',
      [columnId, order, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(serializeTask(result.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
