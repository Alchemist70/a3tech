const express = require('express');
const mongoose = require('mongoose');
const usersRouter = require('../backend/routes/users').default || require('../backend/routes/users');

const BASE = '/api/users';

async function ensureDb() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alchemist-research');
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  try {
    await ensureDb();
    if (req.url && req.url.startsWith(BASE)) req.url = req.url.slice(BASE.length) || '/';
    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use((r, s, next) => {
      s.setHeader('Access-Control-Allow-Origin', '*');
      s.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
    app.use('/', usersRouter);
    return app(req, res);
  } catch (e) {
    console.error('Serverless wrapper error (users)', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
