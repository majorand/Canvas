import test from 'node:test';
import assert from 'node:assert/strict';
import { games, gameCategories, filterGames, gameLaunchUrl } from '../public/games-catalog.mjs';

test('catalog includes all 138 unique original game pages with usable metadata', () => {
  assert.equal(games.length, 138);
  assert.equal(new Set(games.map(game => game.id)).size, 138);
  assert.equal(new Set(games.map(game => game.url)).size, 138);
  for (const game of games) {
    assert.ok(game.name.trim().length > 0);
    assert.ok(game.category.trim().length > 0);
    const url = new URL(game.url);
    assert.equal(url.origin, 'https://www.invisible-character.com');
    assert.equal(url.protocol, 'https:');
    assert.equal(url.username, '');
    assert.equal(url.password, '');
    assert.equal(url.search, '');
    assert.equal(url.hash, '');
    assert.equal(url.pathname, '/activities/' + game.id);
  }
  assert.equal(games.find(game => game.name === 'Stickman Hook').id, 'stickman--hook');
  assert.equal(games.find(game => game.name === 'Drone Delivery Chaos').id, 'drone-delivery-choas');
  assert.equal(games.find(game => game.name === 'Time Shooter 2').id, 'timeshooter2');
  assert.ok(gameCategories.includes('SPORTS'));
  assert.ok(gameCategories.includes('CAR GAMES'));
});

test('search, category and saved favorites combine without changing catalog order', () => {
  assert.deepEqual(filterGames({ query: '  RETRO   bowl ' }).map(game => game.name), ['Retro Bowl', 'Retro Bowl College']);
  assert.ok(filterGames({ query: 'sport', category: 'sports' }).length > 0);
  assert.ok(filterGames({ category: 'sports' }).every(game => game.category === 'SPORTS'));
  const selected = new Set(['retro-bowl', 'drive-mad']);
  assert.deepEqual(filterGames({ onlyFavorites: true, favorites: selected }).map(game => game.name), ['Drive Mad', 'Retro Bowl']);
  assert.deepEqual(filterGames({ category: 'sports', onlyFavorites: true, favorites: selected }).map(game => game.name), ['Retro Bowl']);
  assert.equal(filterGames({ onlyFavorites: true }).length, 0);
  assert.equal(filterGames({ query: 'there-is-no-game-with-this-name' }).length, 0);
  assert.equal(filterGames().length, games.length);
});

test('game launch uses the current Pages subpath and keeps revision and exact original slug', () => {
  for (const name of ['Tom & Jerry Run', 'Horde Killer: You vs 100', 'Stickman Hook']) {
    const game = games.find(item => item.name === name);
    const url = gameLaunchUrl(game, 'https://majorand.github.io/Canvas/games-catalog.mjs?v=release42');
    assert.equal(url.origin, 'https://majorand.github.io');
    assert.equal(url.pathname, '/Canvas/workspace.html');
    assert.equal(url.searchParams.get('v'), 'release42');
    assert.equal(url.searchParams.get('goto'), game.url);
    assert.equal([...url.searchParams.keys()].length, 2);
  }
  const root = gameLaunchUrl(games[0], 'https://scramjet-xi.vercel.app/games-catalog.mjs?v=release42');
  assert.equal(root.pathname, '/workspace.html');
  assert.equal(root.searchParams.get('v'), 'release42');
  for (const url of ['javascript:alert(1)', 'http://www.invisible-character.com/activities/game', 'https://other.example/activities/game', 'https://www.invisible-character.com/elsewhere', 'https://user:password@www.invisible-character.com/activities/game']) {
    assert.throws(() => gameLaunchUrl({ url }));
  }
});
