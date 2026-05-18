import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './database';
import contactsRouter from './routes/contacts';
import conversationsRouter from './routes/conversations';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/contacts', contactsRouter);
app.use('/api/conversations', conversationsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

initializeDatabase();
console.log('✅ Database initialized');

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});