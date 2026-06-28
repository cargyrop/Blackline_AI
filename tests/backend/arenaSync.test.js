const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  normalizeModelName,
  matchArenaScores,
  applyArenaScores,
} = require('../../backend/services/arenaSync');

describe('backend/services/arenaSync', () => {
  it('normalizes provider-specific model names for matching', () => {
    assert.strictEqual(normalizeModelName('google/gemini-3.5-flash-preview'), 'gemini-3-5-flash');
    assert.strictEqual(normalizeModelName('models/gemini-3.5-flash'), 'gemini-3-5-flash');
  });

  it('matches Text/Search/Vision/Document and Code WebDev ELOs', () => {
    const cache = {
      source: 'test',
      fetchedAt: '2026-06-25T00:00:00Z',
      leaderboards: {
        text: { models: [{ model: 'gemini-3.5-flash', normalized: 'gemini-3-5-flash', score: 1504, rank: 7, ci: 10, votes: 1000 }] },
        search: { models: [{ model: 'gemini-3.5-flash', normalized: 'gemini-3-5-flash', score: 1499, rank: 4, ci: 9, votes: 900 }] },
        vision: { models: [{ model: 'gemini-3.5-flash', normalized: 'gemini-3-5-flash', score: 1301, rank: 2, ci: 8, votes: 800 }] },
        document: { models: [{ model: 'gemini-3.5-flash', normalized: 'gemini-3-5-flash', score: 1410, rank: 5, ci: 7, votes: 700 }] },
        code: { models: [{ model: 'gemini-3.5-flash', normalized: 'gemini-3-5-flash', score: 1506, rank: 10, ci: 13, votes: 2217 }] },
      }
    };
    const scores = matchArenaScores('gemini', 'models/gemini-3.5-flash-preview', 'Gemini 3.5 Flash Preview', cache);
    assert.strictEqual(scores.matched, true);
    assert.strictEqual(scores.chatElo, 1504);
    assert.strictEqual(scores.codeElo, 1506);
    assert.strictEqual(scores.leaderboards.search.score, 1499);
    assert.strictEqual(scores.leaderboards.document.score, 1410);
  });

  it('applies matched arena scores without losing model metadata', () => {
    const model = { id: 'gemini-3.5-flash', provider: 'gemini', name: 'Gemini 3.5 Flash', arena: { matched: false, textElo: 1100, codingElo: 1110 }, evolve: { score: 50, reasons: [] } };
    const cache = { source: 'test', fetchedAt: 'now', leaderboards: { code: { models: [{ model: 'gemini-3.5-flash', normalized: 'gemini-3-5-flash', score: 1506, rank: 1 }] } } };
    const enriched = applyArenaScores(model, cache);
    assert.strictEqual(enriched.arena.matched, true);
    assert.strictEqual(enriched.arena.codeElo, 1506);
    assert(enriched.evolve.score > 50);
  });
});
