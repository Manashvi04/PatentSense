const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedDatabase } = require('./db/seed');
const authRoutes = require('./routes/auth').router;
const analysisRoutes = require('./routes/analysis');
const { router: adminRoutes } = require('./routes/admin');
const savedPatentsRoutes = require('./routes/savedPatents');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/saved-patents', savedPatentsRoutes);

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
    
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` PatentSense API Server running on port ${PORT}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error("Critical error during server initialization:", error);
    app.listen(PORT, () => {
      console.log(`PatentSense Server running on port ${PORT} (Database Offline)`);
    });
  }
}

startServer();
