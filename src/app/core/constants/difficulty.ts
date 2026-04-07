/** Canonical ordering of difficulty keys. */
export const DIFFICULTY_KEYS = [
  'VERY_EASY', 'EASY', 'NORMAL', 'HARD', 'VERY_HARD',
] as const;

/** Union of all difficulty key strings, derived from DIFFICULTY_KEYS. */
export type DifficultyKey = typeof DIFFICULTY_KEYS[number];

/** Short human-readable label for each difficulty. */
export const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  VERY_EASY: 'Very Easy',
  EASY:      'Easy',
  NORMAL:    'Normal',
  HARD:      'Hard',
  VERY_HARD: 'Very Hard',
};

/**
 * Enemy damage rate multiplier per difficulty level.
 * Applied multiplicatively with star level and extra damage factors.
 * e.g. HARD = 1.50 means enemies deal 150 % of their base damage.
 */
export const DIFFICULTY_ENEMY_DAMAGE_RATE: Record<DifficultyKey, number> = {
  VERY_EASY: 0.50,
  EASY:      0.75,
  NORMAL:    1.00,
  HARD:      1.50,
  VERY_HARD: 2.00,
};


