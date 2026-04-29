const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

const BOARD_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        b.*,
        u.name as owner_name,
        u.email as owner_email,
        (SELECT COUNT(*)::int FROM columns WHERE board_id = b.id) as column_count,
        (SELECT COUNT(*)::int FROM tasks t JOIN columns c ON t.column_id = c.id WHERE c.board_id = b.id) as task_count,
        (SELECT COUNT(*)::int FROM tasks t JOIN columns c ON t.column_id = c.id WHERE c.board_id = b.id AND t.done = true) as done_count,
        (SELECT COUNT(*)::int FROM board_members WHERE board_id = b.id) as member_count
      FROM boards b
      JOIN users u ON u.id = b.owner_id
      WHERE b.owner_id = $1 OR EXISTS (
        SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = $1
      )
      ORDER BY b.position ASC, b.created_at DESC
    `, [req.user.id]);
    const boards = result.rows.map(b => ({
      id: b.id,
      name: b.name,
      createdAt: b.created_at,
      position: b.position,
      color: b.color,
      columnCount: b.column_count,
      taskCount: b.task_count,
      doneCount: b.done_count,
      memberCount: b.member_count,
      owner: { id: b.owner_id, name: b.owner_name, email: b.owner_email }
    }));
    res.json(boards);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const posRes = await db.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM boards WHERE owner_id = $1',
      [req.user.id]
    );
    const position = posRes.rows[0].next_pos;
    const color = BOARD_COLORS[position % BOARD_COLORS.length];
    const result = await db.query(
      'INSERT INTO boards (name, owner_id, position, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, req.user.id, position, color]
    );
    const b = result.rows[0];
    res.status(201).json({
      id: b.id, name: b.name, createdAt: b.created_at,
      position: b.position, color: b.color,
      columnCount: 0, taskCount: 0, doneCount: 0, memberCount: 0,
      owner: { id: req.user.id, name: req.user.name, email: req.user.email }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/reorder', auth, async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds debe ser un array' });
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.query(
        'UPDATE boards SET position = $1 WHERE id = $2 AND owner_id = $3',
        [i, orderedIds[i], req.user.id]
      );
    }
    res.json({ success: true });
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

    const isOwner = b.owner_id === req.user.id;
    if (!isOwner) {
      const memberCheck = await db.query('SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2', [b.id, req.user.id]);
      if (!memberCheck.rows.length) return res.status(403).json({ error: 'No tenes acceso a este tablero' });
    }

    const membersRes = await db.query(`
      SELECT u.id, u.name, u.email FROM board_members bm
      JOIN users u ON u.id = bm.user_id WHERE bm.board_id = $1
    `, [b.id]);

    const columnsRes = await db.query('SELECT * FROM columns WHERE board_id = $1 ORDER BY "order"', [b.id]);
    const columns = await Promise.all(columnsRes.rows.map(async col => {
      const tasksRes = await db.query('SELECT * FROM tasks WHERE column_id = $1 ORDER BY "order"', [col.id]);
      return {
        id: col.id, name: col.name, order: col.order, boardId: col.board_id,
        tasks: tasksRes.rows.map(t => ({
          id: t.id, title: t.title, description: t.description,
          order: t.order, columnId: t.column_id,
          done: t.done || false,
          labels: t.labels ? (typeof t.labels === 'string' ? JSON.parse(t.labels) : t.labels) : [],
          dueDate: t.due_date || null,
        }))
      };
    }));

    res.json({
      id: b.id, name: b.name, ownerId: b.owner_id, color: b.color,
      owner: { id: b.owner_id, name: b.owner_name, email: b.owner_email },
      members: membersRes.rows.map(u => ({ user: u })),
      columns
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  const { name, color } = req.body;
  if (!name && color === undefined) return res.status(400).json({ error: 'Nada que actualizar' });
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueno puede editar el tablero' });

    let result;
    if (name && color !== undefined) {
      result = await db.query('UPDATE boards SET name = $1, color = $2 WHERE id = $3 RETURNING *', [name, color, req.params.id]);
    } else if (name) {
      result = await db.query('UPDATE boards SET name = $1 WHERE id = $2 RETURNING *', [name, req.params.id]);
    } else {
      result = await db.query('UPDATE boards SET color = $1 WHERE id = $2 RETURNING *', [color, req.params.id]);
    }
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/members', auth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es obligatorio' });
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueno puede invitar' });

    const userRes = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'No existe un usuario con ese email' });
    const invitee = userRes.rows[0];
    if (invitee.id === req.user.id) return res.status(400).json({ error: 'No podes invitarte a vos mismo' });

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
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueno puede eliminar miembros' });
    await db.query('DELETE FROM board_members WHERE user_id = $1 AND board_id = $2', [req.params.userId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (boardRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueno puede eliminar el tablero' });
    await db.query('DELETE FROM boards WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const boardRes = await db.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (!boardRes.rows.length) return res.status(404).json({ error: 'Tablero no encontrado' });
    const orig = boardRes.rows[0];

    const posRes = await db.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM boards WHERE owner_id = $1',
      [req.user.id]
    );
    const position = posRes.rows[0].next_pos;
    const color = orig.color || BOARD_COLORS[position % BOARD_COLORS.length];

    const newBoard = await db.query(
      'INSERT INTO boards (name, owner_id, position, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [orig.name + ' (copy)', req.user.id, position, color]
    );
    const nb = newBoard.rows[0];
    const colsRes = await db.query('SELECT * FROM columns WHERE board_id = $1 ORDER BY "order"', [orig.id]);
    for (const col of colsRes.rows) {
      const newCol = await db.query(
        'INSERT INTO columns (name, board_id, "order") VALUES ($1, $2, $3) RETURNING *',
        [col.name, nb.id, col.order]
      );
      const tasksRes = await db.query('SELECT * FROM tasks WHERE column_id = $1 ORDER BY "order"', [col.id]);
      for (const task of tasksRes.rows) {
        await db.query(
          'INSERT INTO tasks (title, description, column_id, "order") VALUES ($1, $2, $3, $4)',
          [task.title, task.description, newCol.rows[0].id, task.order]
        );
      }
    }
    res.status(201).json({
      id: nb.id, name: nb.name, createdAt: nb.created_at,
      position: nb.position, color: nb.color,
      columnCount: colsRes.rows.length, taskCount: 0, doneCount: 0, memberCount: 0,
      owner: { id: req.user.id, name: req.user.name, email: req.user.email }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
