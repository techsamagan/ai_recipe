const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'recipe.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cached system prompt — stays stable across every request so ephemeral cache hits on the second call
const SYSTEM_PROMPT = `You are a professional chef. Generate 3 recipes based on these ingredients. Return ONLY valid JSON with keys: title, description, ingredients (array), instructions (array), cooking_time, and difficulty`;

async function generateRecipes(req, res) {
  const { ingredients, dietary_prefs } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'At least one ingredient is required' });
  }

  const dietaryText = dietary_prefs && dietary_prefs.length > 0
    ? `Dietary restrictions/preferences: ${dietary_prefs.join(', ')}.`
    : 'No specific dietary restrictions.';

  const userMessage = `Generate exactly 3 recipes using some or all of these ingredients: ${ingredients.join(', ')}.

${dietaryText}

Return ONLY a valid JSON array with exactly 3 recipe objects. No markdown code fences, no explanation — just the raw JSON array.

Each object must have exactly these keys:
- "title": string
- "description": string (2–3 sentences describing the dish)
- "ingredients": array of strings (with quantities, e.g. "2 cups flour")
- "instructions": array of strings (numbered steps as plain text)
- "cooking_time": integer (total minutes)
- "servings": integer
- "difficulty": string — must be exactly one of "Easy", "Medium", or "Hard"
- "image_query": string — 3 to 5 comma-separated English keywords for a food photo search (e.g. "pasta,carbonara,italian" or "grilled,chicken,herbs,lemon"). Focus on the finished dish appearance, not ingredients.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) {
      return res.status(500).json({ error: 'No response received from AI' });
    }

    // Strip markdown fences if Claude wrapped the JSON anyway
    let jsonText = textBlock.text.trim();
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const recipes = JSON.parse(jsonText);

    if (!Array.isArray(recipes) || recipes.length !== 3) {
      return res.status(500).json({ error: 'AI did not return exactly 3 recipes — please try again' });
    }

    res.json({ recipes });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse AI response — please try again' });
    }
    console.error('Recipe generation error:', err.status, err.message);
    const body = err.error?.error;
    if (err.status === 400 && body?.message?.includes('credit balance')) {
      return res.status(402).json({ error: 'Anthropic account has no credits. Add credits at console.anthropic.com → Plans & Billing.' });
    }
    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid Anthropic API key. Check your .env file.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limited by Anthropic. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: 'Failed to generate recipes. Please try again.' });
  }
}

function getSavedRecipes(req, res) {
  try {
    const rows = db.prepare(
      'SELECT * FROM saved_recipes WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.userId);

    const recipes = rows.map(r => ({
      ...r,
      ingredients: JSON.parse(r.ingredients),
      instructions: JSON.parse(r.instructions)
    }));

    res.json({ recipes });
  } catch {
    res.status(500).json({ error: 'Failed to fetch saved recipes' });
  }
}

function saveRecipe(req, res) {
  const { title, description, ingredients, instructions, cooking_time, servings, difficulty } = req.body;

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO saved_recipes (user_id, title, description, ingredients, instructions, cooking_time, servings, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      title,
      description || '',
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      cooking_time || 0,
      servings || 0,
      difficulty || 'Medium'
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Recipe saved successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to save recipe' });
  }
}

function deleteSavedRecipe(req, res) {
  const { id } = req.params;

  try {
    const result = db.prepare(
      'DELETE FROM saved_recipes WHERE id = ? AND user_id = ?'
    ).run(Number(id), req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found or you do not have permission to delete it' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
}

module.exports = { generateRecipes, getSavedRecipes, saveRecipe, deleteSavedRecipe };
