require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { authenticateToken } = require('./middleware/auth');
const authController = require('./controllers/authController');
const recipesController = require('./controllers/recipesController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // base64 images can be several MB
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login',    authController.login);
app.get('/api/auth/profile',   authenticateToken, authController.getProfile);

// ── Recipe routes ─────────────────────────────────────────────────────────────
app.post('/api/recipes/generate',       recipesController.generateRecipes);
app.post('/api/recipes/scan-fridge',    recipesController.scanFridge);       // ← Vision endpoint
app.post('/api/recipes/smart-suggestions', recipesController.smartSuggestions); // ← Healthy suggestions
app.get('/api/recipes/saved',           authenticateToken, recipesController.getSavedRecipes);
app.post('/api/recipes/save',           authenticateToken, recipesController.saveRecipe);
app.delete('/api/recipes/saved/:id',    authenticateToken, recipesController.deleteSavedRecipe);

// Fallback: serve the SPA for any unmatched GET
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🍳 AI Smart Recipe running → http://localhost:${PORT}\n`);
});
