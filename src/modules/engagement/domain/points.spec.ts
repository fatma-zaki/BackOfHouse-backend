import {
  ACTIVITY_OF,
  adjustmentRefusal,
  balanceDelta,
  isProfileComplete,
  levelFor,
  levelTarget,
  POINT_ENTRY_TYPES,
} from './points';

describe('points rules', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [499, 2],
    [500, 3],
    [1499, 3],
    [1500, 4],
    [9000, 4],
  ])('puts %i lifetime earned points at level %i', (earned, level) => {
    expect(levelFor(earned)).toBe(level);
  });

  it('targets the next level, or the balance at the top', () => {
    expect(levelTarget(40, 40)).toBe(100);
    expect(levelTarget(120, 20)).toBe(500);
    expect(levelTarget(2000, 300)).toBe(300);
  });

  it('keeps the level when points are spent (only earned points count)', () => {
    const earned = 600;
    const spent = balanceDelta('REWARD_REDEMPTION', -500, null);
    expect(spent).toEqual({ earned: 0, spent: 500 });
    expect(levelFor(earned + spent.earned)).toBe(3);
  });

  it('gives back spent points when a redemption is reversed, and earned points otherwise', () => {
    expect(balanceDelta('REVERSAL', 500, 'REWARD_REDEMPTION')).toEqual({ earned: 0, spent: -500 });
    expect(balanceDelta('REVERSAL', -150, 'EVENT_ATTENDANCE')).toEqual({ earned: -150, spent: 0 });
    expect(balanceDelta('MANUAL_ADJUSTMENT', -20, null)).toEqual({ earned: -20, spent: 0 });
  });

  it('maps every entry type to an app activity', () => {
    expect(POINT_ENTRY_TYPES.every((t) => ACTIVITY_OF[t])).toBe(true);
    expect(ACTIVITY_OF.MANUAL_ADJUSTMENT).toBe('ADJUSTMENT');
  });

  it('limits Support to adding up to 500 points per member per month', () => {
    expect(adjustmentRefusal('SUPPORT', -10, 0)).toBe('NEGATIVE_NOT_ALLOWED');
    expect(adjustmentRefusal('SUPPORT', 500, 0)).toBeNull();
    expect(adjustmentRefusal('SUPPORT', 1, 500)).toBe('MONTHLY_CAP_REACHED');
    expect(adjustmentRefusal('SUPPORT', 200, 350)).toBe('MONTHLY_CAP_REACHED');
    expect(adjustmentRefusal('SUPER_ADMIN', -10, 0)).toBeNull();
    expect(adjustmentRefusal('SUPER_ADMIN', 5000, 10_000)).toBeNull();
  });

  it('counts a profile complete with headline, city, about, an experience, a skill and a project', () => {
    const full = { headline: 'Rigger', city: 'Riyadh', about: 'Ten years', experience: 1, skills: 2, projects: 1 };
    expect(isProfileComplete(full)).toBe(true);
    for (const missing of [
      { headline: ' ' },
      { city: '' },
      { about: '' },
      { experience: 0 },
      { skills: 0 },
      { projects: 0 },
    ]) {
      expect(isProfileComplete({ ...full, ...missing })).toBe(false);
    }
  });
});
