const express = require('express');
const cors = require('cors');
const path = require('path');

// Load project-level settings for local runs without an extra dependency.
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '..', '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const getJwtSecret = require('./utils/jwtSecret');
getJwtSecret();
const { seedDatabase } = require('./db/seed');
const authRoutes = require('./routes/auth').router;
const analysisRoutes = require('./routes/analysis');
const { router: adminRoutes } = require('./routes/admin');
const savedPatentsRoutes = require('./routes/savedPatents');

const app = express();
const PORT = Number(process.env.API_PORT || process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());
app.use(express.json({ limit: '3mb' }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/saved-patents', savedPatentsRoutes);

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', error: 'Request payload exceeds the permitted size.' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'INVALID_JSON', error: 'Request body must contain valid JSON.' });
  }
  console.error('Unhandled request error:', error);
  return res.status(500).json({ code: 'REQUEST_FAILED', error: 'Request could not be completed.' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Serve frontend built assets in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('PatentSense API server is online. Frontend assets not built yet; please start the client via npm run dev.');
    }
  });
});

// Auto-seed database and launch Express listener
async function startServer() {
  try {
    await seedDatabase();
    
    app.listen(PORT, HOST, () => {
      console.log(`===================================================`);
      console.log(` PatentSense API Server running on port ${PORT}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error("Critical error during server initialization:", error);
    app.listen(PORT, HOST, () => {
      console.log(`PatentSense Server running on port ${PORT} (Database Offline)`);
    });
  }
}

startServer();
