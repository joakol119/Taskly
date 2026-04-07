const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /tasks - crear tarea
router.post('/', auth, async (req, res) => {
  const { title, description, columnId } = req.body;
  if (!title || !columnId) return res.status(400).json({ error: 'title y columnId son obligatorios' });

  try {
    const count = await prisma.task.count({ where: { columnId: parseInt(columnId) } });
    const task = await prisma.task.create({
      data: { title, description, columnId: parseInt(columnId), order: count },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /tasks/:id - editar tarea
router.patch('/:id', auth, async (req, res) => {
  const { title, description } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /tasks/:id/move - mover tarea a otra columna
router.patch('/:id/move', auth, async (req, res) => {
  const { columnId, order } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { columnId: parseInt(columnId), order: parseInt(order) },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
