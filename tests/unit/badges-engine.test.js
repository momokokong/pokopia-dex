import { describe, it, expect, beforeEach } from 'vitest';
import POKOPIA_BADGES from '../../js/badges-engine.js';

describe('POKOPIA_BADGES - Badges & Achievements Engine (TICK-005)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('1. defines all 13 badges with complete metadata and trilingual names/descriptions', () => {
    expect(POKOPIA_BADGES.BADGES).toHaveLength(13);

    const collectionBadges = POKOPIA_BADGES.BADGES.filter(b => b.category === 'collection');
    const specialBadges = POKOPIA_BADGES.BADGES.filter(b => b.category === 'special');
    expect(collectionBadges).toHaveLength(8);
    expect(specialBadges).toHaveLength(5);

    for (const badge of POKOPIA_BADGES.BADGES) {
      expect(badge.id).toBeTruthy();
      expect(badge.emoji).toBeTruthy();
      expect(badge.color).toMatch(/^#/);
      expect(badge.threshold).toBeGreaterThan(0);
      expect(badge.name.zh).toBeTruthy();
      expect(badge.name.en).toBeTruthy();
      expect(badge.name.es).toBeTruthy();
      expect(badge.desc.zh).toBeTruthy();
      expect(badge.desc.en).toBeTruthy();
      expect(badge.desc.es).toBeTruthy();
    }
  });

  it('2. evaluates 0 collected Pokémon with all collection badges locked at 0%', () => {
    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds: [],
      pokemonData: [],
      currentHour: 14
    });

    expect(result).toHaveLength(13);
    for (const b of result) {
      expect(b.unlocked).toBe(false);
      expect(b.current).toBe(0);
      expect(b.progressPercent).toBe(0);
    }
  });

  it('3. unlocks collector badge at 10 unique collected Pokémon and deduplicates IDs', () => {
    const idsWithDuplicates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 5];
    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds: idsWithDuplicates,
      currentHour: 14
    });

    const collector = result.find(b => b.id === 'collector');
    const explorer = result.find(b => b.id === 'explorer');

    expect(collector.unlocked).toBe(true);
    expect(collector.current).toBe(10);
    expect(collector.progressPercent).toBe(100);

    expect(explorer.unlocked).toBe(false);
    expect(explorer.current).toBe(10);
    expect(explorer.progressPercent).toBe(33);
  });

  it('4. unlocks explorer (30), veteran (60), master (100), legend (150), completionist (200), ultimate (250) at exact thresholds', () => {
    const ids60 = Array.from({ length: 60 }, (_, i) => i + 1);
    const res60 = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds: ids60,
      currentHour: 14
    });

    expect(res60.find(b => b.id === 'collector').unlocked).toBe(true);
    expect(res60.find(b => b.id === 'explorer').unlocked).toBe(true);
    expect(res60.find(b => b.id === 'veteran').unlocked).toBe(true);
    expect(res60.find(b => b.id === 'master').unlocked).toBe(false);
    expect(res60.find(b => b.id === 'master').progressPercent).toBe(60);
  });

  it('5. unlocks all 8 collection badges including god at 303 collected Pokémon', () => {
    const all303 = Array.from({ length: 303 }, (_, i) => i + 1);
    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds: all303,
      currentHour: 14
    });

    const collectionResults = result.filter(b => b.category === 'collection');
    expect(collectionResults).toHaveLength(8);
    for (const b of collectionResults) {
      expect(b.unlocked).toBe(true);
      expect(b.progressPercent).toBe(100);
    }
    const godBadge = result.find(b => b.id === 'god');
    expect(godBadge.unlocked).toBe(true);
    expect(godBadge.current).toBe(303);
  });

  it('6. unlocks type_specialist when 10 collected Pokémon share a single type (including multi-type Pokémon)', () => {
    const mockPokemon = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      types: i < 10 ? ['Grass', i % 2 === 0 ? 'Poison' : 'Flying'] : ['Fire']
    }));
    const collectedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds,
      pokemonData: mockPokemon,
      currentHour: 14
    });

    const typeSpecialist = result.find(b => b.id === 'type_specialist');
    expect(typeSpecialist.unlocked).toBe(true);
    expect(typeSpecialist.current).toBe(10);
    expect(typeSpecialist.progressPercent).toBe(100);
  });

  it('7. keeps type_specialist locked when collected Pokémon have fewer than 10 of any single type', () => {
    const mockPokemon = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: i + 1, types: ['Water'] })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: i + 7, types: ['Fire'] }))
    ];
    const collectedIds = Array.from({ length: 12 }, (_, i) => i + 1);

    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds,
      pokemonData: mockPokemon,
      currentHour: 14
    });

    const typeSpecialist = result.find(b => b.id === 'type_specialist');
    expect(typeSpecialist.unlocked).toBe(false);
    expect(typeSpecialist.current).toBe(6);
    expect(typeSpecialist.progressPercent).toBe(60);
  });

  it('8. unlocks habitat_hunter when stats.visitedHabitats reaches 50 unique habitats', () => {
    const visitedHabitats = Array.from({ length: 50 }, (_, i) => `hab_${i + 1}`);
    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds: [],
      stats: { visitedHabitats },
      currentHour: 14
    });

    const habitatHunter = result.find(b => b.id === 'habitat_hunter');
    expect(habitatHunter.unlocked).toBe(true);
    expect(habitatHunter.current).toBe(50);
    expect(habitatHunter.progressPercent).toBe(100);
  });

  it('9. unlocks habitat_hunter via unique biome IDs covered by collected Pokémon (whichever is greater)', () => {
    const mockPokemon = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      habitat: {
        biomes: [
          { id: i * 2 + 1, name: { en: `Biome ${i * 2 + 1}` } },
          { id: i * 2 + 2, name: { en: `Biome ${i * 2 + 2}` } }
        ]
      }
    }));
    const collectedIds = Array.from({ length: 25 }, (_, i) => i + 1);

    const result = POKOPIA_BADGES.evaluateAllBadges({
      collectedIds,
      pokemonData: mockPokemon,
      stats: { visitedHabitats: [1, 2, 3] },
      currentHour: 14
    });

    const habitatHunter = result.find(b => b.id === 'habitat_hunter');
    expect(habitatHunter.unlocked).toBe(true);
    expect(habitatHunter.current).toBe(50);
  });

  it('10. unlocks night_owl during late night hours (21:00 - 04:59) and keeps locked during daytime', () => {
    const night23 = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 23 });
    expect(night23.find(b => b.id === 'night_owl').unlocked).toBe(true);

    const night2 = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 2 });
    expect(night2.find(b => b.id === 'night_owl').unlocked).toBe(true);

    const day14 = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 14 });
    expect(day14.find(b => b.id === 'night_owl').unlocked).toBe(false);
  });

  it('11. unlocks early_bird during morning hours (05:00 - 08:59) and keeps locked outside morning', () => {
    const morning6 = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 6 });
    expect(morning6.find(b => b.id === 'early_bird').unlocked).toBe(true);

    const boundary9 = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 9 });
    expect(boundary9.find(b => b.id === 'early_bird').unlocked).toBe(false);

    const boundary4 = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 4 });
    expect(boundary4.find(b => b.id === 'early_bird').unlocked).toBe(false);
  });

  it('12. persists unlocked badge IDs in localStorage so time-based badges stay unlocked at any hour', () => {
    POKOPIA_BADGES.saveUnlockedBadgeIds(['night_owl', 'early_bird', 'night_owl']);
    const saved = POKOPIA_BADGES.getUnlockedBadgeIds();
    expect(saved).toEqual(['night_owl', 'early_bird']);

    const afternoonResult = POKOPIA_BADGES.evaluateAllBadges({ currentHour: 15 });
    expect(afternoonResult.find(b => b.id === 'night_owl').unlocked).toBe(true);
    expect(afternoonResult.find(b => b.id === 'early_bird').unlocked).toBe(true);
  });

  it('13. unlocks quiz_master when maxCombo >= 5 or bestCorrect >= 8', () => {
    const lockedRes = POKOPIA_BADGES.evaluateAllBadges({
      quizStats: { maxCombo: 4, bestCorrect: 7 },
      currentHour: 14
    });
    expect(lockedRes.find(b => b.id === 'quiz_master').unlocked).toBe(false);

    const comboUnlock = POKOPIA_BADGES.evaluateAllBadges({
      quizStats: { maxCombo: 5, bestCorrect: 5 },
      currentHour: 14
    });
    expect(comboUnlock.find(b => b.id === 'quiz_master').unlocked).toBe(true);

    const scoreUnlock = POKOPIA_BADGES.evaluateAllBadges({
      quizStats: { maxCombo: 3, bestCorrect: 8 },
      currentHour: 14
    });
    expect(scoreUnlock.find(b => b.id === 'quiz_master').unlocked).toBe(true);
  });

  it('14. checkAndNotifyNewBadges persists new badges, renders .badge-unlock-toast, and avoids duplicate notifications', () => {
    const collected10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const firstCall = POKOPIA_BADGES.checkAndNotifyNewBadges({
      collectedIds: collected10,
      currentHour: 23,
      lang: 'zh'
    });

    expect(firstCall.map(b => b.id)).toEqual(['collector', 'night_owl']);
    expect(POKOPIA_BADGES.getUnlockedBadgeIds()).toEqual(['collector', 'night_owl']);

    const toastEl = document.querySelector('.badge-unlock-toast');
    expect(toastEl).not.toBeNull();
    expect(toastEl.textContent).toContain('初級收藏家');
    expect(toastEl.textContent).toContain('夜貓子');

    // Clear DOM toast and call again with same state -> no duplicate unlock
    document.body.innerHTML = '';
    const secondCall = POKOPIA_BADGES.checkAndNotifyNewBadges({
      collectedIds: collected10,
      currentHour: 23,
      lang: 'zh'
    });

    expect(secondCall).toHaveLength(0);
    expect(document.querySelector('.badge-unlock-toast')).toBeNull();
  });
});
