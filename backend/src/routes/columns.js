const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /columns - crear columna
router.post('/', auth, async (req, res) => {
  const { name, boardId } = req.body;
  if (!name || !boardId) return res.status(400).json({ error: 'name y boardId son obligatorios' });

  try {
    const count = await prisma.column.count({ where: { boardId: parseInt(boardId) } });
    const column = await prisma.column.create({
      data: { name, boardId: parseInt(boardId), order: count },
      include: { tasks: true },
    });
    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /columns/:id - renombrar columna
router.patch('/:id', auth, async (req, res) => {
  const { name } = req.body;
  try {
    const column = await prisma.column.update({
      where: { id: parseInt(req.params.id) },
      data: { name },
    });
    res.json(column);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /columns/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.column.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
