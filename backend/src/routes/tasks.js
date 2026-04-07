const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const { title, description, columnId } = req.body;
  if (!title || !columnId) return res.status(400).json({ error: 'title y columnId son obligatorios' });
  try {
    const countRes = await db.query('SELECT COUNT(*) FROM tasks WHERE column_id = $1', [columnId]);
    const order = parseInt(countRes.rows[0].count);
    const result = await db.query(
      'INSERT INTO tasks (title, description, column_id, "order") VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description || null, columnId, order]
    );
    const t = result.rows[0];
    res.status(201).json({ id: t.id, title: t.title, description: t.description, order: t.order, columnId: t.column_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE tasks SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description || null, req.params.id]
    );
    const t = result.rows[0];
    res.json({ id: t.id, title: t.title, description: t.description, order: t.order, columnId: t.column_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/move', auth, async (req, res) => {
  const { columnId, order } = req.body;
  try {
    const result = await db.query(
      'UPDATE tasks SET column_id = $1, "order" = $2 WHERE id = $3 RETURNING *',
      [columnId, order, req.params.id]
    );
    const t = result.rows[0];
    res.json({ id: t.id, title: t.title, description: t.description, order: t.order, columnId: t.column_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
