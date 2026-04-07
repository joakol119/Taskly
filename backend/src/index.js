const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const columnRoutes = require('./routes/columns');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:3000', 'https://taskly-seven-wheat.vercel.app'], credentials: true }));app.use(express.json());

db.init().then(() => {
  app.use('/auth', authRoutes);
  app.use('/boards', boardRoutes);
  app.use('/columns', columnRoutes);
  app.use('/tasks', taskRoutes);
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
