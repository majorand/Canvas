import { appUrl } from './runtime.mjs';
import { requireMember, signOut } from './auth-client.mjs';
import { games, gameCategories, filterGames, gameLaunchUrl } from './games-catalog.mjs';

const $ = id => document.getElementById(id);
const favoritesKey = 'canvas.game-favorites';
const catalogIds = new Set(games.map(game => game.id));
let favorites = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => catalogIds.has(id)));
} catch {}
const visuals = [
  { hue: 147, symbol: '◆' }, { hue: 206, symbol: '◈' }, { hue: 268, symbol: '✦' },
  { hue: 24, symbol: '◎' }, { hue: 341, symbol: '✧' }, { hue: 54, symbol: '▦' },
  { hue: 177, symbol: '➤' }, { hue: 310, symbol: '◒' },
];
const categoryVisuals = new Map(gameCategories.map((category, index) => [category, visuals[index % visuals.length]]));
document.querySelectorAll('[data-app-link]').forEach(link => { link.href = appUrl(link.dataset.appLink); });
$('sign-out').addEventListener('click', () => signOut());
$('games-filter').addEventListener('submit', event => event.preventDefault());
$('game-search').addEventListener('input', render);
$('game-category').addEventListener('change', render);
$('favorites-only').addEventListener('change', render);
$('clear-search').addEventListener('click', () => { $('game-search').value = ''; render(); $('game-search').focus(); });
$('reset-filters').addEventListener('click', resetFilters);
$('empty-reset').addEventListener('click', resetFilters);
document.addEventListener('keydown', event => {
  const editing = event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName));
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !editing && !$('games-content').hidden) {
    event.preventDefault(); $('game-search').focus();
  }
  if (event.key === 'Escape' && event.target === $('game-search') && $('game-search').value) {
    $('game-search').value = ''; render();
  }
});
for (const category of gameCategories) {
  const option = document.createElement('option');
  option.value = category; option.textContent = category; $('game-category').append(option);
}
function resetFilters() {
  $('game-search').value = ''; $('game-category').value = ''; $('favorites-only').checked = false;
  render(); $('game-search').focus();
}
function saveFavorites() {
  try { localStorage.setItem(favoritesKey, JSON.stringify([...favorites])); }
  catch {
    $('favorites-note').textContent = 'Favorites are available for this visit. Your browser did not allow saving them.';
  }
}
function updateFavorite(button, game) {
  const selected = favorites.has(game.id);
  button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', (selected ? 'Remove ' : 'Add ') + game.name + (selected ? ' from favorites' : ' to favorites'));
  button.title = selected ? 'Remove from favorites' : 'Add to favorites';
  button.textContent = selected ? '★' : '☆';
}
function gameCard(game) {
  const item = document.createElement('li'); item.className = 'game-card';
  const visual = categoryVisuals.get(game.category) || visuals[0];
  item.style.setProperty('--game-hue', String(visual.hue));
  const art = document.createElement('div'); art.className = 'game-art'; art.setAttribute('aria-hidden', 'true');
  const symbol = document.createElement('span'); symbol.className = 'game-symbol'; symbol.textContent = visual.symbol; art.append(symbol);
  const favorite = document.createElement('button'); favorite.className = 'favorite-button'; favorite.type = 'button'; updateFavorite(favorite, game);
  favorite.addEventListener('click', () => {
    favorites.has(game.id) ? favorites.delete(game.id) : favorites.add(game.id); saveFavorites();
    if ($('favorites-only').checked) {
      const cards = [...$('game-grid').children]; const index = cards.indexOf(item);
      render();
      const next = $('game-grid').children[Math.min(index, $('game-grid').children.length - 1)];
      (next?.querySelector('.favorite-button') || $('favorites-only')).focus();
    } else updateFavorite(favorite, game);
  });
  const details = document.createElement('div'); details.className = 'game-details';
  const category = document.createElement('span'); category.className = 'game-category'; category.textContent = game.category;
  const title = document.createElement('h2'); title.textContent = game.name;
  const actions = document.createElement('div'); actions.className = 'game-actions';
  const play = document.createElement('a'); play.className = 'play-link'; play.href = gameLaunchUrl(game);
  play.setAttribute('aria-label', 'Play ' + game.name + ' in workspace'); play.append(document.createTextNode('Play'));
  const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗'; play.append(arrow);
  const original = document.createElement('a'); original.className = 'original-link'; original.href = game.url; original.target = '_blank'; original.rel = 'noopener noreferrer';
  original.textContent = 'Original page'; original.setAttribute('aria-label', 'Open ' + game.name + ' original page in a new tab');
  actions.append(play, original); details.append(category, title, actions); item.append(art, favorite, details); return item;
}
function render() {
  const query = $('game-search').value.trim();
  const category = $('game-category').value;
  const onlyFavorites = $('favorites-only').checked;
  const filtered = filterGames({ query, category, favorites, onlyFavorites });
  const fragment = document.createDocumentFragment();
  for (const game of filtered) fragment.append(gameCard(game));
  $('game-grid').replaceChildren(fragment);
  $('games-count').textContent = filtered.length + (filtered.length === 1 ? ' game' : ' games') + ' of ' + games.length + (onlyFavorites ? ' · Favorites' : '');
  $('no-games').hidden = filtered.length !== 0;
  $('empty-message').textContent = onlyFavorites && favorites.size === 0 ? 'Save games with the star button to see your favorites here.' : 'Try a different search or category.';
  $('clear-search').hidden = !query;
  $('reset-filters').hidden = !query && !category && !onlyFavorites;
}
try {
  const user = await requireMember();
  if (user) {
    $('signed-in-name').textContent = user.display_name || user.username || user.email;
    render(); $('auth-status').hidden = true; $('games-content').hidden = false;
  }
} catch (error) {
  $('auth-status-text').textContent = error.message || 'Unable to check sign-in. Please try again.';
}
