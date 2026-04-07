const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /boards - listar tableros del usuario
router.get('/', auth, async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /boards - crear tablero
router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const board = await prisma.board.create({
      data: { name, ownerId: req.user.id },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /boards/:id - detalle de un tablero con columnas y tareas
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        columns: {
          orderBy: { order: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!board) return res.status(404).json({ error: 'Tablero no encontrado' });

    const isMember = board.ownerId === req.user.id || board.members.some((m) => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'No tenés acceso a este tablero' });

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /boards/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await prisma.board.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!board) return res.status(404).json({ error: 'Tablero no encontrado' });
    if (board.ownerId !== req.user.id) return res.status(403).json({ error: 'Solo el dueño puede eliminar el tablero' });

    await prisma.board.delete({ where: { id: board.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
