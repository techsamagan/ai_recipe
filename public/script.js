'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  token:          localStorage.getItem('token'),
  user:           JSON.parse(localStorage.getItem('user') || 'null'),
  ingredients:    [],
  currentRecipes: [],
  cookRecipe:     null,
  cookDone:       new Set()
};

// ── DOM shorthand ─────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const el = {
  // Landing
  sectionLanding:  $('section-landing'),
  btnGetStarted:   $('btn-get-started'),
  btnSeeHow:       $('btn-see-how'),
  btnCtaBottom:    $('btn-cta-bottom'),
  glowGreen:       $('glow-green'),
  glowOrange:      $('glow-orange'),
  landingHero:     $('landing-hero'),

  // App
  sectionApp:      $('section-app'),
  sectionGenerate: $('section-generate'),
  sectionSaved:    $('section-saved'),
  logoBtn:         $('logo-btn'),

  // Navigation
  desktopNav:      $('desktop-nav'),

  // Header auth
  btnLogin:        $('btn-login'),
  btnRegister:     $('btn-register'),
  btnLogout:       $('btn-logout'),
  userGreeting:    $('user-greeting'),
  usernameDisplay: $('username-display'),

  // Mobile menu
  hamburgerBtn:    $('hamburger-btn'),
  mobileMenu:      $('mobile-menu'),
  mobileBackdrop:  $('mobile-backdrop'),
  mobileCloseBtn:  $('mobile-close-btn'),
  mobileBtnLogin:  $('mobile-btn-login'),
  mobileBtnReg:    $('mobile-btn-register'),
  mobileBtnLogout: $('mobile-btn-logout'),
  mobileLoggedOut: $('mobile-logged-out'),
  mobileLoggedIn:  $('mobile-logged-in'),
  mobileGreeting:  $('mobile-greeting'),

  // Ingredient
  ingredientInput: $('ingredient-input'),
  btnAddIng:       $('btn-add-ingredient'),
  ingredientTags:  $('ingredient-tags'),
  ingredientHint:  $('ingredient-hint'),

  // Generate
  btnGenerate:     $('btn-generate'),
  loading:         $('loading'),
  recipeResults:   $('recipe-results'),

  // Saved
  savedList:       $('saved-recipes-list'),
  savedAuthNotice: $('saved-auth-notice'),
  savedLoginLink:  $('saved-login-link'),

  // Cook Mode
  cookMode:        $('cook-mode'),
  cookCloseBtn:    $('cook-close-btn'),
  cookTitle:       $('cook-title'),
  cookBadges:      $('cook-badges'),
  cookIngredients: $('cook-ingredients'),
  cookSteps:       $('cook-steps'),
  cookProgress:    $('cook-progress'),

  // Auth modal
  modalAuth:       $('modal-auth'),
  modalBackdrop:   $('modal-backdrop'),
  modalCloseBtn:   $('modal-close-btn'),
  panelLogin:      $('panel-login'),
  panelRegister:   $('panel-register'),
  formLogin:       $('form-login'),
  formRegister:    $('form-register'),
  loginError:      $('login-error'),
  registerError:   $('register-error'),
  toRegister:      $('to-register'),
  toLogin:         $('to-login'),

  // Password strength
  pwStrength:      $('pw-strength'),
  pwFill:          $('pw-fill'),
  pwLabel:         $('pw-label'),

  toast: $('toast'),
};

// ════════════════════════════════════════════════════════
// LANDING ↔ APP TRANSITIONS
// ════════════════════════════════════════════════════════
function showApp(target = 'generate') {
  el.sectionLanding.classList.add('hidden');
  el.sectionApp.classList.remove('hidden');
  document.body.classList.remove('on-landing');
  closeMobileMenu();
  setActiveNav(target);
  showTab(target);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLanding() {
  el.sectionApp.classList.add('hidden');
  el.sectionLanding.classList.remove('hidden');
  document.body.classList.add('on-landing');
  setActiveNav('landing');
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setActiveNav(target) {
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === target);
  });
}

function handleNav(target) {
  if (target === 'landing') {
    showLanding();
  } else {
    showApp(target);
  }
}

// ════════════════════════════════════════════════════════
// MOBILE MENU
// ════════════════════════════════════════════════════════
function openMobileMenu() {
  el.mobileMenu.classList.add('open');
  el.mobileBackdrop.classList.remove('hidden');
  el.mobileBackdrop.classList.add('open');
  el.hamburgerBtn.classList.add('open');
  el.hamburgerBtn.setAttribute('aria-expanded', 'true');
  el.mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  el.mobileMenu.classList.remove('open');
  el.mobileBackdrop.classList.remove('open');
  el.hamburgerBtn.classList.remove('open');
  el.hamburgerBtn.setAttribute('aria-expanded', 'false');
  el.mobileMenu.setAttribute('aria-hidden', 'true');
  // Delay hidden so transition completes
  setTimeout(() => el.mobileBackdrop.classList.add('hidden'), 300);
  document.body.style.overflow = '';
}

// ════════════════════════════════════════════════════════
// MOUSE GLOW EFFECT
// ════════════════════════════════════════════════════════
function initMouseGlow() {
  const hero = el.landingHero;
  if (!hero) return;

  // Initial positions
  el.glowGreen.style.transform  = 'translate(10vw, 10vh)';
  el.glowOrange.style.transform = 'translate(55vw, 50vh)';

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.glowGreen.style.transform  = `translate(${x - 350}px, ${y - 350}px)`;
    el.glowOrange.style.transform = `translate(${x - 150}px, ${y + 60}px)`;
  });

  // Touch support
  hero.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const rect  = hero.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    el.glowGreen.style.transform  = `translate(${x - 350}px, ${y - 350}px)`;
    el.glowOrange.style.transform = `translate(${x - 150}px, ${y + 60}px)`;
  }, { passive: true });
}

// ════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════
let toastTimer;
function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.className   = `toast ${type} show`;
  toastTimer = setTimeout(() => { el.toast.className = 'toast'; }, 3500);
}

// ════════════════════════════════════════════════════════
// AUTH MODAL
// ════════════════════════════════════════════════════════
function showModal(panel = 'login') {
  el.modalAuth.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  closeMobileMenu();
  switchPanel(panel);
}

function closeModal() {
  el.modalAuth.classList.add('hidden');
  document.body.style.overflow = '';
}

function switchPanel(panel) {
  const toLogin    = panel === 'login';
  el.panelLogin.classList.toggle('active', toLogin);
  el.panelRegister.classList.toggle('active', !toLogin);
  clearFormError('login');
  clearFormError('register');
}

function clearFormError(which) {
  const err = which === 'login' ? el.loginError : el.registerError;
  if (err) { err.textContent = ''; err.classList.add('hidden'); }
}
function setFormError(which, msg) {
  const err = which === 'login' ? el.loginError : el.registerError;
  if (err) { err.textContent = msg; err.classList.remove('hidden'); }
}

// ════════════════════════════════════════════════════════
// PASSWORD STRENGTH
// ════════════════════════════════════════════════════════
function checkPwStrength(pw) {
  if (!pw) { el.pwStrength.classList.add('hidden'); return; }
  el.pwStrength.classList.remove('hidden');

  let score = 0;
  if (pw.length >= 6)            score++;
  if (pw.length >= 10)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;

  const levels = [
    { label: 'Weak',       color: '#ef4444', w: '16%'  },
    { label: 'Weak',       color: '#ef4444', w: '28%'  },
    { label: 'Fair',       color: '#f97316', w: '48%'  },
    { label: 'Good',       color: '#eab308', w: '66%'  },
    { label: 'Strong',     color: '#22c55e', w: '84%'  },
    { label: 'Very Strong',color: '#16a34a', w: '100%' },
  ];
  const lv = levels[score] || levels[0];
  el.pwFill.style.width      = lv.w;
  el.pwFill.style.background = lv.color;
  el.pwLabel.textContent     = lv.label;
  el.pwLabel.style.color     = lv.color;
}

// ════════════════════════════════════════════════════════
// PASSWORD VISIBILITY TOGGLE
// ════════════════════════════════════════════════════════
function initPwToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type  = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁';
    });
  });
}

// ════════════════════════════════════════════════════════
// AUTH UI
// ════════════════════════════════════════════════════════
function updateAuthUI() {
  const loggedIn = !!state.token;
  const name = state.user?.username || '';

  el.btnLogin.classList.toggle('hidden',    loggedIn);
  el.btnRegister.classList.toggle('hidden', loggedIn);
  el.btnLogout.classList.toggle('hidden',  !loggedIn);
  el.userGreeting.classList.toggle('hidden', !loggedIn);
  if (loggedIn) el.usernameDisplay.textContent = name;

  // Mobile
  el.mobileLoggedOut.classList.toggle('hidden', loggedIn);
  el.mobileLoggedIn.classList.toggle('hidden',  !loggedIn);
  if (loggedIn) el.mobileGreeting.textContent = `👋 Hi, ${name}`;

  if (state.currentRecipes.length) renderRecipes(state.currentRecipes);
}

function logout() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  showToast('Logged out successfully', 'info');
  showLanding();
}

// ════════════════════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════════════════════
function showTab(tab) {
  const isGenerate = tab === 'generate';
  el.sectionGenerate.classList.toggle('hidden', !isGenerate);
  el.sectionSaved.classList.toggle('hidden',    isGenerate);
  if (!isGenerate) loadSavedRecipes();
  setActiveNav(tab);
}

// ════════════════════════════════════════════════════════
// INGREDIENT TAG SYSTEM
// ════════════════════════════════════════════════════════
function addIngredient() {
  const raw   = el.ingredientInput.value.trim();
  const value = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (!value) return;

  const lower = value.toLowerCase();
  if (state.ingredients.some(i => i.toLowerCase() === lower)) {
    showToast('Already in your list!', 'warning');
    return;
  }

  state.ingredients.push(value);
  el.ingredientInput.value = '';
  renderTags();
  el.ingredientInput.focus();
}

function removeIngredient(value) {
  state.ingredients = state.ingredients.filter(i => i !== value);
  renderTags();
}

function renderTags() {
  const has = state.ingredients.length > 0;
  el.ingredientHint.classList.toggle('hidden', has);
  el.ingredientTags.innerHTML = state.ingredients
    .map(ing => `
      <span class="tag">
        ${escapeHtml(ing)}
        <button class="tag-remove" data-ingredient="${escapeAttr(ing)}" aria-label="Remove ${escapeHtml(ing)}">×</button>
      </span>`)
    .join('');
}

const escapeHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const escapeAttr = s => s.replace(/"/g,'&quot;');

// ════════════════════════════════════════════════════════
// DIETARY FILTER TOGGLES
// ════════════════════════════════════════════════════════
function initDietaryFilters() {
  document.querySelectorAll('.diet-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

function getSelectedDietary() {
  return Array.from(document.querySelectorAll('.diet-btn.active')).map(b => b.dataset.value);
}

// ════════════════════════════════════════════════════════
// RECIPE GENERATION
// ════════════════════════════════════════════════════════
async function generateRecipes() {
  if (state.ingredients.length === 0) {
    showToast('Add at least one ingredient first!', 'warning');
    el.ingredientInput.focus();
    return;
  }

  setLoading(true);

  try {
    const res  = await apiFetch('/api/recipes/generate', {
      method: 'POST',
      body:   JSON.stringify({
        ingredients:   state.ingredients,
        dietary_prefs: getSelectedDietary()
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed');

    state.currentRecipes = data.recipes;
    renderRecipes(data.recipes);
    el.recipeResults.classList.remove('hidden');
    setTimeout(() => {
      el.recipeResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  el.loading.classList.toggle('hidden', !on);
  el.btnGenerate.disabled = on;
  if (on) el.recipeResults.classList.add('hidden');
}

// ════════════════════════════════════════════════════════
// RENDER RECIPE CARDS
// ════════════════════════════════════════════════════════
const HEART_SVG = `<svg class="heart-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke-width="2" stroke-linecap="round"/></svg>`;

function diffClass(d) {
  return ({ Easy: 'easy', Medium: 'medium', Hard: 'hard' }[d] || 'medium');
}

function recipeImgUrl(recipe, idx) {
  // Use Claude's image_query; fall back to title words; add food,dish for relevance
  const base  = (recipe.image_query || recipe.title.split(' ').slice(0, 3).join(','))
                  .replace(/\s+/g, ',')
                  .replace(/[^a-zA-Z0-9,]/g, '')
                  .toLowerCase();
  const query = base ? `${base},food` : 'food,recipe,dish';
  // lock param keeps the same image on re-render for the same recipe slot
  return `https://loremflickr.com/640/340/${query}/all?lock=${idx + 1}`;
}

function macroPct(val, max) { return val != null ? Math.min(Math.round(val / max * 100), 100) : 0; }

function renderRecipes(recipes) {
  el.recipeResults.innerHTML = recipes.map((r, idx) => {
    const hasMacros = r.calories_per_serving != null;
    const macroHtml = hasMacros ? `
      <div class="macro-section">
        <p class="macro-title">📈 Nutrition per serving</p>
        <div class="macro-row"><span class="macro-label">Calories</span><div class="macro-bar-track"><div class="macro-bar macro-cal" style="--bar-w:${macroPct(r.calories_per_serving,800)}%"></div></div><span class="macro-val">${r.calories_per_serving} kcal</span></div>
        <div class="macro-row"><span class="macro-label">Protein</span><div class="macro-bar-track"><div class="macro-bar macro-protein" style="--bar-w:${macroPct(r.protein_g,60)}%"></div></div><span class="macro-val">${r.protein_g}g</span></div>
        <div class="macro-row"><span class="macro-label">Carbs</span><div class="macro-bar-track"><div class="macro-bar macro-carbs" style="--bar-w:${macroPct(r.carbs_g,100)}%"></div></div><span class="macro-val">${r.carbs_g}g</span></div>
        <div class="macro-row"><span class="macro-label">Fat</span><div class="macro-bar-track"><div class="macro-bar macro-fat" style="--bar-w:${macroPct(r.fat_g,50)}%"></div></div><span class="macro-val">${r.fat_g}g</span></div>
      </div>` : '';

    return `
    <div class="recipe-card">
      <div class="recipe-img-wrap">
        <img class="recipe-img" src="${recipeImgUrl(r, idx)}" alt="${escapeHtml(r.title)}" loading="lazy" onerror="this.parentElement.classList.add('img-error')" />
        <div class="recipe-img-overlay"></div>
        <div class="recipe-img-top">
          <div class="recipe-badges">
            <span class="badge badge-time">⏱ ${r.cooking_time} min</span>
            <span class="badge badge-${diffClass(r.difficulty)}">${escapeHtml(r.difficulty)}</span>
            <span class="badge badge-servings">👥 ${r.servings}</span>
          </div>
          <button class="btn-heart" data-index="${idx}" aria-label="Save ${escapeHtml(r.title)}">${HEART_SVG}</button>
        </div>
        <h3 class="recipe-card-title">${escapeHtml(r.title)}</h3>
      </div>
      <div class="recipe-body">
        <p class="recipe-desc">${escapeHtml(r.description)}</p>
        ${macroHtml}
        <details>
          <summary>🥕 Ingredients (${r.ingredients.length})</summary>
          <div class="detail-content"><ul class="ingredient-list">${r.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>
        </details>
        <details>
          <summary>📋 Instructions (${r.instructions.length} steps)</summary>
          <div class="detail-content"><ol class="instruction-list">${r.instructions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol></div>
        </details>
        <div class="recipe-action-row">
          <button class="btn-cook-now" data-index="${idx}">🍳 Cook Now</button>
          <button class="btn-grocery" data-index="${idx}">🛒 Grocery List</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════════
// SAVE RECIPE (heart button)
// ════════════════════════════════════════════════════════
async function saveRecipe(idx) {
  if (!state.token) { showModal('login'); return; }

  const recipe = state.currentRecipes[idx];
  const btn = el.recipeResults.querySelector(`.btn-heart[data-index="${idx}"]`);

  try {
    const res  = await apiFetch('/api/recipes/save', {
      method: 'POST',
      body:   JSON.stringify(recipe)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');

    if (btn) btn.classList.add('saved');
    showToast('Recipe saved! ❤️', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════
// COOK MODE
// ════════════════════════════════════════════════════════
function openCookMode(idx) {
  const recipe = state.currentRecipes[idx];
  if (!recipe) return;

  state.cookRecipe = recipe;
  state.cookDone.clear();

  el.cookTitle.textContent = recipe.title;

  el.cookBadges.innerHTML = `
    <span class="badge badge-time">⏱ ${recipe.cooking_time} min</span>
    <span class="badge badge-${diffClass(recipe.difficulty)}">${escapeHtml(recipe.difficulty)}</span>
    <span class="badge badge-servings">👥 ${recipe.servings} servings</span>`;

  el.cookIngredients.innerHTML = recipe.ingredients
    .map(i => `<li>${escapeHtml(i)}</li>`)
    .join('');

  el.cookSteps.innerHTML = recipe.instructions
    .map((step, i) => `
      <li class="cook-step-item" id="cook-step-${i}">
        <label class="cook-step-label">
          <input type="checkbox" data-step="${i}" />
          <div>
            <div class="cook-step-num">Step ${i + 1}</div>
            <div class="cook-step-text">${escapeHtml(step)}</div>
          </div>
        </label>
      </li>`)
    .join('');

  updateCookProgress();

  el.cookMode.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCookMode() {
  el.cookMode.classList.add('hidden');
  document.body.style.overflow = '';
}

function updateCookProgress() {
  const total = state.cookRecipe?.instructions.length || 0;
  const done  = state.cookDone.size;
  el.cookProgress.textContent = total ? `${done}/${total} done` : '';
}

// ════════════════════════════════════════════════════════
// SAVED RECIPES
// ════════════════════════════════════════════════════════
async function loadSavedRecipes() {
  el.savedAuthNotice.classList.add('hidden');
  el.savedList.innerHTML = '';

  if (!state.token) {
    el.savedAuthNotice.classList.remove('hidden');
    return;
  }

  el.savedList.innerHTML = '<p class="hint" style="text-align:center;padding:2rem">Loading…</p>';

  try {
    const res  = await apiFetch('/api/recipes/saved');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');

    if (!data.recipes.length) {
      el.savedList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <p>No saved recipes yet.<br>Generate some and tap the heart to save!</p>
        </div>`;
      return;
    }

    renderSavedRecipes(data.recipes);
  } catch (err) {
    el.savedList.innerHTML = `<p class="hint" style="text-align:center;color:var(--red)">${escapeHtml(err.message)}</p>`;
  }
}

function renderSavedRecipes(recipes) {
  el.savedList.innerHTML = recipes.map(r => `
    <div class="saved-recipe-card" data-id="${r.id}">
      <div class="saved-info">
        <h3>${escapeHtml(r.title)}</h3>
        <div class="saved-meta">
          <span class="saved-tag stag-green">⏱ ${r.cooking_time} min</span>
          <span class="saved-tag stag-orange">👥 ${r.servings} servings</span>
          <span class="saved-tag stag-gray">${escapeHtml(r.difficulty)}</span>
        </div>
        <p class="saved-desc">${escapeHtml(r.description || '')}</p>
      </div>
      <button class="btn-delete" data-id="${r.id}" aria-label="Delete ${escapeHtml(r.title)}">🗑</button>
    </div>`
  ).join('');
}

async function deleteRecipe(id) {
  if (!confirm('Delete this saved recipe?')) return;

  try {
    const res  = await apiFetch(`/api/recipes/saved/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');

    const card = el.savedList.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.style.transition = 'opacity .25s, transform .25s';
      card.style.opacity    = '0';
      card.style.transform  = 'translateX(40px)';
      setTimeout(() => {
        card.remove();
        if (!el.savedList.querySelector('.saved-recipe-card')) {
          el.savedList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">🍽️</div>
              <p>No saved recipes yet.</p>
            </div>`;
        }
      }, 250);
    }
    showToast('Recipe deleted', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════
// AUTH HANDLERS
// ════════════════════════════════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  clearFormError('login');

  const email    = el.formLogin.querySelector('[name=email]').value.trim();
  const password = el.formLogin.querySelector('[name=password]').value;

  const btn = el.formLogin.querySelector('[type=submit]');
  btn.disabled    = true;
  btn.textContent = 'Signing in…';

  try {
    const res  = await apiFetch('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { setFormError('login', data.error); return; }

    persistAuth(data);
    closeModal();
    el.formLogin.reset();
    updateAuthUI();
    showToast(`Welcome back, ${data.username}! 👋`, 'success');
    if (document.body.classList.contains('on-landing')) showApp();
  } catch {
    setFormError('login', 'Network error. Please try again.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearFormError('register');

  const username = el.formRegister.querySelector('[name=username]').value.trim();
  const email    = el.formRegister.querySelector('[name=email]').value.trim();
  const password = el.formRegister.querySelector('[name=password]').value;

  const btn = el.formRegister.querySelector('[type=submit]');
  btn.disabled    = true;
  btn.textContent = 'Creating account…';

  try {
    const res  = await apiFetch('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { setFormError('register', data.error); return; }

    persistAuth(data);
    closeModal();
    el.formRegister.reset();
    el.pwStrength.classList.add('hidden');
    updateAuthUI();
    showToast(`Welcome, ${data.username}! 🎉`, 'success');
    if (document.body.classList.contains('on-landing')) showApp();
  } catch {
    setFormError('register', 'Network error. Please try again.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Create Account';
  }
}

function persistAuth(data) {
  state.token = data.token;
  state.user  = { username: data.username, email: data.email };
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(state.user));
}

// ════════════════════════════════════════════════════════
// 🎙 VOICE INPUT
// ════════════════════════════════════════════════════════
const voiceInput = {
  recognition: null,
  isListening: false,
  btn: null,

  init() {
    this.btn = $('btn-mic');
    if (!this.btn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.btn.title   = 'Voice input not supported in this browser';
      this.btn.style.opacity = '0.35';
      this.btn.disabled = true;
      return;
    }
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.onresult = e => this.process(e.results[0][0].transcript);
    this.recognition.onend   = () => this.setListening(false);
    this.recognition.onerror = e => {
      this.setListening(false);
      if (e.error !== 'no-speech') showToast('🎙 Voice error: ' + e.error, 'error');
    };
    this.btn.addEventListener('click', () => this.toggle());
  },

  toggle() {
    if (this.isListening) { this.recognition.stop(); return; }
    this.recognition.start();
    this.setListening(true);
    showToast('🎙 Listening… say your ingredients', 'info');
  },

  setListening(on) {
    this.isListening = on;
    this.btn.classList.toggle('listening', on);
    this.btn.setAttribute('aria-pressed', String(on));
    this.btn.title = on ? 'Stop listening' : 'Voice input';
  },

  process(text) {
    // Split on commas, "and", spaces between words
    const parts = text
      .replace(/\band\b/gi, ',')
      .split(/,+/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50);
    let added = 0;
    parts.forEach(raw => {
      const value = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      if (!state.ingredients.some(i => i.toLowerCase() === value.toLowerCase())) {
        state.ingredients.push(value);
        added++;
      }
    });
    renderTags();
    showToast(added > 0 ? `🎙 Added: ${parts.slice(0, added).join(', ')}` : 'Already in your list!', added > 0 ? 'success' : 'warning');
  }
};

// ════════════════════════════════════════════════════════
// 🛒 GROCERY LIST
// ════════════════════════════════════════════════════════
const groceryList = {
  modal: null, recipeName: null, itemsList: null, copyBtn: null,

  init() {
    this.modal      = $('modal-grocery');
    this.recipeName = $('grocery-recipe-name');
    this.itemsList  = $('grocery-items');
    this.copyBtn    = $('btn-copy-grocery');
    $('grocery-close-btn').addEventListener('click', () => this.close());
    $('grocery-backdrop').addEventListener('click',  () => this.close());
    this.copyBtn.addEventListener('click', () => this.copyMissing());
  },

  open(idx) {
    const recipe = state.currentRecipes[idx];
    if (!recipe) return;
    this.recipeName.textContent = recipe.title;
    const userList = state.ingredients.map(i => i.toLowerCase());
    this.itemsList.innerHTML = recipe.ingredients.map(ing => {
      const ingLow = ing.toLowerCase();
      const have   = userList.some(u => ingLow.includes(u) || u.includes(ingLow.split(' ').pop()));
      return `<li class="grocery-item ${have ? 'have' : 'need'}">
        <label>
          <input type="checkbox" ${have ? '' : 'checked'} data-ing="${escapeAttr(ing)}" />
          <span class="grocery-ing">${escapeHtml(ing)}</span>
          ${have ? '<span class="grocery-badge">✓ have it</span>' : ''}
        </label>
      </li>`;
    }).join('');
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';
  },

  copyMissing() {
    const checked = [...this.itemsList.querySelectorAll('input:checked')];
    if (!checked.length) { showToast('No items selected!', 'warning'); return; }
    const text = checked.map(c => c.dataset.ing).join('\n');
    navigator.clipboard.writeText(text)
      .then(() => showToast(`📋 Copied ${checked.length} item${checked.length !== 1 ? 's' : ''} to clipboard!`, 'success'))
      .catch(() => showToast('Copy failed — try manually', 'error'));
  }
};

// ════════════════════════════════════════════════════════
// 💡 SMART GROCERY SUGGESTIONS
// ════════════════════════════════════════════════════════

const CATEGORY_COLORS = {
  'Protein':          { bg: 'rgba(33,150,243,.15)',  border: 'rgba(33,150,243,.4)',  text: '#64b5f6' },
  'Vegetables':       { bg: 'rgba(46,125,50,.15)',   border: 'rgba(46,125,50,.4)',   text: '#a5d6a7' },
  'Fruits':           { bg: 'rgba(230,81,0,.13)',    border: 'rgba(230,81,0,.4)',    text: '#ffb74d' },
  'Grains & Legumes': { bg: 'rgba(255,193,7,.12)',   border: 'rgba(255,193,7,.4)',   text: '#ffd54f' },
  'Dairy & Eggs':     { bg: 'rgba(189,189,189,.12)', border: 'rgba(189,189,189,.4)', text: '#e0e0e0' },
  'Healthy Fats':     { bg: 'rgba(102,187,106,.13)', border: 'rgba(102,187,106,.4)', text: '#c8e6c9' },
  'Spices & Herbs':   { bg: 'rgba(171,71,188,.14)',  border: 'rgba(171,71,188,.4)',  text: '#ce93d8' },
  'Superfoods':       { bg: 'rgba(239,83,80,.13)',   border: 'rgba(239,83,80,.4)',   text: '#ef9a9a' },
};

const smartSuggestions = {
  modal: null, loading: null, results: null, chips: null,
  addBtn: null, allBtn: null,
  selected: new Set(),

  init() {
    this.modal   = $('modal-suggest');
    this.loading = $('suggest-loading');
    this.results = $('suggest-results');
    this.chips   = $('suggest-chips');
    this.addBtn  = $('btn-suggest-add');
    this.allBtn  = $('btn-suggest-all');

    $('btn-smart-suggest').addEventListener('click', () => this.open());
    $('suggest-close-btn').addEventListener('click', () => this.close());
    $('suggest-backdrop').addEventListener('click',  () => this.close());
    this.addBtn.addEventListener('click', () => this.addSelected());
    this.allBtn.addEventListener('click', () => this.toggleSelectAll());
  },

  open() {
    this.modal.classList.remove('hidden');
    this.loading.classList.remove('hidden');
    this.results.classList.add('hidden');
    this.selected.clear();
    document.body.style.overflow = 'hidden';
    this.fetchSuggestions();
  },

  close() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';
  },

  async fetchSuggestions() {
    try {
      const res  = await apiFetch('/api/recipes/smart-suggestions', {
        method: 'POST',
        body:   JSON.stringify({ ingredients: state.ingredients })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get suggestions');
      this.renderChips(data.suggestions);
    } catch (err) {
      this.close();
      showToast(err.message, 'error');
    }
  },

  renderChips(suggestions) {
    // Group by category
    const groups = {};
    suggestions.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });

    this.chips.innerHTML = Object.entries(groups).map(([cat, items]) => {
      const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Vegetables'];
      const chipsHtml = items.map((s, i) => `
        <button class="suggest-chip" data-name="${escapeAttr(s.name)}"
          style="--chip-bg:${col.bg};--chip-border:${col.border};--chip-text:${col.text};animation-delay:${i * 40}ms"
          title="${escapeHtml(s.benefit)}">
          <span class="chip-emoji">${escapeHtml(s.emoji || '🌿')}</span>
          <span class="chip-name">${escapeHtml(s.name)}</span>
          <span class="chip-benefit">${escapeHtml(s.benefit)}</span>
        </button>`).join('');
      return `<div class="suggest-group">
        <p class="suggest-cat-label">${escapeHtml(cat)}</p>
        <div class="suggest-group-chips">${chipsHtml}</div>
      </div>`;
    }).join('');

    // Chip toggle
    this.chips.addEventListener('click', e => {
      const chip = e.target.closest('.suggest-chip');
      if (!chip) return;
      const name = chip.dataset.name;
      if (this.selected.has(name)) {
        this.selected.delete(name);
        chip.classList.remove('selected');
      } else {
        this.selected.add(name);
        chip.classList.add('selected');
      }
      this.updateAddBtn();
    });

    this.loading.classList.add('hidden');
    this.results.classList.remove('hidden');
    this.updateAddBtn();
  },

  updateAddBtn() {
    const n = this.selected.size;
    this.addBtn.textContent = n > 0 ? `✓ Add ${n} Item${n !== 1 ? 's' : ''} to My List` : '✓ Add Selected to My List';
    this.addBtn.disabled = n === 0;
  },

  toggleSelectAll() {
    const allChips = [...this.chips.querySelectorAll('.suggest-chip')];
    const allSelected = allChips.every(c => c.classList.contains('selected'));
    allChips.forEach(c => {
      if (allSelected) {
        c.classList.remove('selected');
        this.selected.delete(c.dataset.name);
      } else {
        c.classList.add('selected');
        this.selected.add(c.dataset.name);
      }
    });
    this.allBtn.textContent = allSelected ? 'Select All' : 'Deselect All';
    this.updateAddBtn();
  },

  addSelected() {
    let added = 0;
    this.selected.forEach(name => {
      const value = name.charAt(0).toUpperCase() + name.slice(1);
      if (!state.ingredients.some(i => i.toLowerCase() === value.toLowerCase())) {
        state.ingredients.push(value);
        added++;
      }
    });
    renderTags();
    this.close();
    showToast(
      added > 0 ? `💡 Added ${added} healthy ingredient${added !== 1 ? 's' : ''} to your list!` : 'Already in your list!',
      'success'
    );
    setTimeout(() => $('ingredient-tags')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
  }
};

// ════════════════════════════════════════════════════════
// API FETCH HELPER
// ════════════════════════════════════════════════════════
function apiFetch(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  return fetch(url, { ...opts, headers });
}

// ════════════════════════════════════════════════════════
// FRIDGE VISION
// ════════════════════════════════════════════════════════

const fridgeVision = {
  overlay:       null,
  fileInput:     null,
  previewImg:    null,
  scanText:      null,
  scanSub:       null,
  scanIcon:      null,
  detectedWrap:  null,
  detectedTags:  null,
  confirmBtn:    null,
  cancelBtn:     null,
  pendingItems:  [],

  init() {
    this.overlay      = $('fridge-scan-overlay');
    this.fileInput    = $('fridge-file-input');
    this.previewImg   = $('fridge-preview-img');
    this.scanText     = $('fridge-scan-text');
    this.scanSub      = $('fridge-scan-sub');
    this.scanIcon     = $('fridge-scan-icon');
    this.detectedWrap = $('fridge-detected-wrap');
    this.detectedTags = $('fridge-detected-tags');
    this.confirmBtn   = $('btn-fridge-confirm');
    this.cancelBtn    = $('btn-fridge-cancel');

    $('btn-scan-fridge').addEventListener('click', () => this.fileInput.click());

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.startScan(file);
      // Reset so same file can be re-selected
      e.target.value = '';
    });

    this.confirmBtn.addEventListener('click', () => this.confirmIngredients());
    this.cancelBtn.addEventListener('click',  () => this.closeOverlay());
  },

  startScan(file) {
    // Validate size (< 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large — please use a photo under 5 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // Show overlay with photo
      this.previewImg.src = dataUrl;
      this.overlay.classList.remove('hidden', 'done');
      this.detectedWrap.classList.add('hidden');
      this.detectedTags.innerHTML = '';
      this.scanText.textContent = 'AI is reading your fridge…';
      this.scanSub.textContent  = 'Identifying ingredients with computer vision';
      this.scanIcon.textContent = '👁';
      this.scanIcon.style.animation = '';
      document.body.style.overflow  = 'hidden';

      // Extract base64 (strip the data:...;base64, prefix)
      const [meta, imageData] = dataUrl.split(',');
      const mediaType = meta.replace('data:', '').replace(';base64', '');

      this.callApi(imageData, mediaType);
    };
    reader.readAsDataURL(file);
  },

  async callApi(imageData, mediaType) {
    try {
      const res  = await apiFetch('/api/recipes/scan-fridge', {
        method: 'POST',
        body:   JSON.stringify({ imageData, mediaType })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Scan failed');

      this.showResults(data.ingredients);
    } catch (err) {
      this.closeOverlay();
      showToast(err.message, 'error');
    }
  },

  showResults(ingredients) {
    // Stop sweep, show ✓
    this.overlay.classList.add('done');
    this.scanIcon.textContent = '✅';
    this.scanIcon.style.animation = 'none';
    this.scanText.textContent = `Found ${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''}!`;
    this.scanSub.textContent  = 'Review below and tap "Add All" to populate your list.';

    this.pendingItems = ingredients;

    // Animate chips in one-by-one
    this.detectedWrap.classList.remove('hidden');
    this.detectedTags.innerHTML = '';
    ingredients.forEach((ing, i) => {
      const chip = document.createElement('span');
      chip.className = 'detected-chip';
      chip.style.animationDelay = `${i * 60}ms`;
      chip.textContent = ing;
      this.detectedTags.appendChild(chip);
    });
  },

  confirmIngredients() {
    let added = 0;
    this.pendingItems.forEach(raw => {
      const value = raw.charAt(0).toUpperCase() + raw.slice(1);
      const lower = value.toLowerCase();
      if (!state.ingredients.some(i => i.toLowerCase() === lower)) {
        state.ingredients.push(value);
        added++;
      }
    });
    renderTags();
    this.closeOverlay();
    showToast(
      added > 0
        ? `✨ Added ${added} ingredient${added !== 1 ? 's' : ''} from your fridge!`
        : 'All detected ingredients were already in your list.',
      'success'
    );
    // Scroll to ingredients
    setTimeout(() => {
      $('ingredient-tags')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  },

  closeOverlay() {
    this.overlay.classList.add('hidden');
    document.body.style.overflow = '';
    this.previewImg.src = '';
    this.pendingItems   = [];
  }
};

// ════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════
function init() {

  // ── Landing ──
  el.btnGetStarted.addEventListener('click', () => showApp('generate'));
  el.btnCtaBottom.addEventListener('click',  () => showApp('generate'));
  el.btnSeeHow.addEventListener('click', () => {
    document.getElementById('how-it-works')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── Logo ──
  el.logoBtn.addEventListener('click', () => {
    if (!document.body.classList.contains('on-landing')) showLanding();
  });

  // ── Desktop nav ──
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => handleNav(btn.dataset.nav));
  });

  // ── Mobile hamburger ──
  el.hamburgerBtn.addEventListener('click', openMobileMenu);
  el.mobileCloseBtn.addEventListener('click', closeMobileMenu);
  el.mobileBackdrop.addEventListener('click', closeMobileMenu);
  document.querySelectorAll('.mobile-nav-link').forEach(btn => {
    btn.addEventListener('click', () => handleNav(btn.dataset.nav));
  });

  // ── Mobile auth buttons ──
  el.mobileBtnLogin.addEventListener('click',  () => showModal('login'));
  el.mobileBtnReg.addEventListener('click',    () => showModal('register'));
  el.mobileBtnLogout.addEventListener('click', logout);

  // ── Desktop auth buttons ──
  el.btnLogin.addEventListener('click',    () => showModal('login'));
  el.btnRegister.addEventListener('click', () => showModal('register'));
  el.btnLogout.addEventListener('click',   logout);
  el.savedLoginLink.addEventListener('click', () => showModal('login'));

  // ── Auth modal ──
  el.modalCloseBtn.addEventListener('click', closeModal);
  el.modalBackdrop.addEventListener('click', closeModal);
  el.toRegister.addEventListener('click',   () => switchPanel('register'));
  el.toLogin.addEventListener('click',      () => switchPanel('login'));
  el.formLogin.addEventListener('submit',    handleLogin);
  el.formRegister.addEventListener('submit', handleRegister);

  // Password strength
  document.getElementById('reg-password').addEventListener('input', (e) => {
    checkPwStrength(e.target.value);
  });

  // Escape closes modal / cook mode / fridge overlay / grocery
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!fridgeVision.overlay?.classList.contains('hidden')) { fridgeVision.closeOverlay(); return; }
      if (!$('modal-grocery')?.classList.contains('hidden'))   { groceryList.close(); return; }
    if (!$('modal-suggest')?.classList.contains('hidden'))   { smartSuggestions.close(); return; }
    if (!el.cookMode.classList.contains('hidden'))           closeCookMode();
    else if (!el.modalAuth.classList.contains('hidden'))     closeModal();
    else if (el.mobileMenu.classList.contains('open'))       closeMobileMenu();
  });

  // ── Ingredient input ──
  el.ingredientInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addIngredient(); }
  });
  el.btnAddIng.addEventListener('click', addIngredient);
  el.ingredientTags.addEventListener('click', e => {
    const btn = e.target.closest('.tag-remove');
    if (btn) removeIngredient(btn.dataset.ingredient);
  });

  // ── Dietary filters ──
  initDietaryFilters();

  // ── Generate ──
  el.btnGenerate.addEventListener('click', generateRecipes);

  // Recipe results — event delegation
  el.recipeResults.addEventListener('click', e => {
    const heartBtn   = e.target.closest('.btn-heart');
    const cookBtn    = e.target.closest('.btn-cook-now');
    const groceryBtn = e.target.closest('.btn-grocery');
    if (heartBtn && !heartBtn.classList.contains('saved')) saveRecipe(Number(heartBtn.dataset.index));
    if (cookBtn)    openCookMode(Number(cookBtn.dataset.index));
    if (groceryBtn) groceryList.open(Number(groceryBtn.dataset.index));
  });

  // ── Saved list ──
  el.savedList.addEventListener('click', e => {
    const btn = e.target.closest('.btn-delete');
    if (btn) deleteRecipe(btn.dataset.id);
  });

  // ── Cook Mode ──
  el.cookCloseBtn.addEventListener('click', closeCookMode);
  el.cookSteps.addEventListener('change', e => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    const stepIdx = Number(cb.dataset.step);
    const item    = document.getElementById(`cook-step-${stepIdx}`);
    if (cb.checked) {
      state.cookDone.add(stepIdx);
      item?.classList.add('done');
    } else {
      state.cookDone.delete(stepIdx);
      item?.classList.remove('done');
    }
    updateCookProgress();
  });

  // ── Password toggles ──
  initPwToggles();

  // ── Mouse glow ──
  initMouseGlow();

  // ── Fridge Vision ──
  fridgeVision.init();

  // ── Voice Input ──
  voiceInput.init();

  // ── Grocery List ──
  groceryList.init();

  // ── Smart Suggestions ──
  smartSuggestions.init();

  // ── Initial state ──
  updateAuthUI();
  renderTags();
  setActiveNav('landing');

  if (state.token) {
    showApp('generate');
  } else {
    showLanding();
  }
}

document.addEventListener('DOMContentLoaded', init);

