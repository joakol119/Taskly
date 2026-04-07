const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, u.name as owner_name, u.email as owner_email
      FROM boards b
      JOIN users u ON u.id = b.owner_id
      WHERE b.owner_id = $1 OR EXISTS (
        SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = $1
      )
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    const boards = result.rows.map(b => ({
      id: b.id, name: b.name, createdAt: b.created_at,
      owner: { id: b.owner_id, name: b.owner_name, email: b.owner_email }
    }));
    res.json(boards);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const result = await db.query(
      'INSERT INTO boards (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, req.user.id]
    );
    const b = result.rows[0];
    res.status(201).json({ id: b.id, name: b.name, createdAt: b.created_at, owner: { id: req.user.id, name: req.user.name, email: req.user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const boardRes = await db.query(`
      SELECT b.*, u.name as owner_name, u.email as owner_email
      FROM boards b JOIN users u ON u.id = b.owner_id
      WHERE b.id = $1
    `, [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    const b = boardRes.rows[0];

    const isMember = b.owner_id === req.user.id;
    if (!isMember) {
      const memberCheck = await db.query('SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2', [b.id, req.user.id]);
      if (!memberCheck.rows.length) return res.status(403).json({ error: 'No tenés acceso a este tablero' });
    }

    const membersRes = await db.query(`
      SELECT u.id, u.name, u.email FROM board_members bm
      JOIN users u ON u.id = bm.user_id WHERE bm.board_id = $1
    `, [b.id]);

    const columnsRes = await db.query('SELECT * FROM columns WHERE board_id = $1 ORDER BY "order"', [b.id]);
    const columns = await Promise.all(columnsRes.rows.map(async col => {
      const tasksRes = await db.query('SELECT * FROM tasks WHERE column_id = $1 ORDER BY "order"', [col.id]);
      return { id: col.id, name: col.name, order: col.order, boardId: col.board_id, tasks: tasksRes.rows.map(t => ({ id: t.id, title: t.title, description: t.description, order: t.order, columnId: t.column_id })) };
    }));

    res.json({
      id: b.id, name: b.name, ownerId: b.owner_id,
      owner: { id: b.owner_id, name: b.owner_name, email: b.owner_email },
      members: membersRes.rows.map(u => ({ user: u })),
      columns
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/members', auth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es obligatorio' });
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueño puede invitar' });

    const userRes = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'No existe un usuario con ese email' });
    const invitee = userRes.rows[0];
    if (invitee.id === req.user.id) return res.status(400).json({ error: 'No podés invitarte a vos mismo' });

    const existing = await db.query('SELECT 1 FROM board_members WHERE user_id = $1 AND board_id = $2', [invitee.id, req.params.id]);
    if (existing.rows.length) return res.status(400).json({ error: 'El usuario ya es miembro' });

    await db.query('INSERT INTO board_members (user_id, board_id) VALUES ($1, $2)', [invitee.id, req.params.id]);
    res.status(201).json({ success: true, user: invitee });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueño puede eliminar miembros' });
    await db.query('DELETE FROM board_members WHERE user_id = $1 AND board_id = $2', [req.params.userId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueño puede eliminar el tablero' });
    await db.query('DELETE FROM boards WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
