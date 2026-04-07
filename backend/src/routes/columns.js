const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const { name, boardId } = req.body;
  if (!name || !boardId) return res.status(400).json({ error: 'name y boardId son obligatorios' });
  try {
    const countRes = await db.query('SELECT COUNT(*) FROM columns WHERE board_id = $1', [boardId]);
    const order = parseInt(countRes.rows[0].count);
    const result = await db.query(
      'INSERT INTO columns (name, board_id, "order") VALUES ($1, $2, $3) RETURNING *',
      [name, boardId, order]
    );
    const col = result.rows[0];
    res.status(201).json({ id: col.id, name: col.name, order: col.order, boardId: col.board_id, tasks: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  const { name } = req.body;
  try {
    const result = await db.query('UPDATE columns SET name = $1 WHERE id = $2 RETURNING *', [name, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM columns WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
