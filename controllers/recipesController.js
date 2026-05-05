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
- "image_query": string — 3 to 5 comma-separated English keywords for a food photo search (e.g. "pasta,carbonara,italian" or "grilled,chicken,herbs,lemon"). Focus on the finished dish appearance, not ingredients.
- "calories_per_serving": integer (estimated kcal per serving)
- "protein_g": integer (estimated grams of protein per serving)
- "carbs_g": integer (estimated grams of carbohydrates per serving)
- "fat_g": integer (estimated grams of fat per serving)`;

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

// ── Vision: scan fridge photo ─────────────────────────────────────────────────
async function scanFridge(req, res) {
  const { imageData, mediaType } = req.body;

  if (!imageData || !mediaType) {
    return res.status(400).json({ error: 'imageData and mediaType are required' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(mediaType)) {
    return res.status(400).json({ error: 'Unsupported image type. Use JPEG, PNG, GIF, or WebP.' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: `Act as an expert computer vision and culinary assistant. Analyze this image of a refrigerator, pantry, or grocery shelf.

Identify all visible, edible ingredients.
Filter out non-food items (containers, magnets, décor, packaging labels that aren't the food itself).
Format the output as a comma-separated list of raw ingredients only (e.g., 'Spinach, Tomato, Chicken Breast, Greek Yogurt').
Exclude quantities or brand names unless they are essential for identifying the item.
Only return the list. Do not provide conversational text.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || !textBlock.text.trim()) {
      return res.status(500).json({ error: 'No ingredients detected — try a clearer photo.' });
    }

    // Parse "Ingredient A, Ingredient B, ..." into an array
    const raw = textBlock.text.trim();
    const ingredients = raw
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 60); // sanity filter

    if (ingredients.length === 0) {
      return res.status(422).json({ error: 'Could not identify any ingredients. Try a clearer photo.' });
    }

    res.json({ ingredients });
  } catch (err) {
    console.error('Fridge scan error:', err.status, err.message);
    if (err.status === 401) return res.status(401).json({ error: 'Invalid Anthropic API key.' });
    if (err.status === 429) return res.status(429).json({ error: 'Rate limited — please wait a moment.' });
    if (err.status === 400 && err.error?.error?.message?.includes('credit')) {
      return res.status(402).json({ error: 'Anthropic account has no credits.' });
    }
    res.status(500).json({ error: 'Failed to scan image. Please try again.' });
  }
}

module.exports = { generateRecipes, getSavedRecipes, saveRecipe, deleteSavedRecipe, scanFridge, smartSuggestions };

// ── Smart healthy grocery suggestions ────────────────────────────────────────
async function smartSuggestions(req, res) {
  const { ingredients } = req.body;

  const haveText = (ingredients && ingredients.length > 0)
    ? `The user currently has: ${ingredients.join(', ')}.`
    : 'The user currently has no ingredients listed.';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a nutritionist and culinary expert. ${haveText}

Suggest exactly 12 healthy grocery items the user does NOT already have that would complement their pantry, improve their nutrition, and enable more diverse cooking.

Return ONLY a valid JSON array of 12 objects. No markdown, no explanation.

Each object must have exactly these keys:
- "name": string (the ingredient name, 1–3 words)
- "category": string — exactly one of: "Protein", "Vegetables", "Fruits", "Grains & Legumes", "Dairy & Eggs", "Healthy Fats", "Spices & Herbs", "Superfoods"
- "benefit": string (one sentence, max 12 words, explaining the key health benefit)
- "emoji": string (a single relevant food emoji)`
        }
      ]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) return res.status(500).json({ error: 'No response from AI' });

    let jsonText = textBlock.text.trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const suggestions = JSON.parse(jsonText);
    if (!Array.isArray(suggestions)) throw new SyntaxError('Not an array');

    res.json({ suggestions });
  } catch (err) {
    if (err instanceof SyntaxError) return res.status(500).json({ error: 'AI response parse error — try again.' });
    console.error('Smart suggestions error:', err.status, err.message);
    if (err.status === 429) return res.status(429).json({ error: 'Rate limited — please wait a moment.' });
    if (err.status === 401) return res.status(401).json({ error: 'Invalid API key.' });
    res.status(500).json({ error: 'Failed to get suggestions. Please try again.' });
  }
}
