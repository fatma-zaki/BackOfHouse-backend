import {
  adminStatusOf,
  appStatusOf,
  canEditDocuments,
  nextState,
  stateOfAdminStatus,
  VERIFICATION_STATES,
  VERIFICATION_TRANSITIONS,
  VerificationState,
  VerificationTransition,
} from './verification-state';

/** Every allowed move; everything else must be refused. */
const ALLOWED: Record<string, VerificationState> = {
  'DRAFT:submit': 'IN_REVIEW',
  'MORE_INFO:submit': 'IN_REVIEW',
  'REJECTED:submit': 'IN_REVIEW',
  'IN_REVIEW:approve': 'APPROVED',
  'IN_REVIEW:reject': 'REJECTED',
  'IN_REVIEW:request_info': 'MORE_INFO',
  'APPROVED:remove': 'REJECTED',
};

describe('verification state machine (every transition)', () => {
  const pairs = VERIFICATION_STATES.flatMap((state) =>
    VERIFICATION_TRANSITIONS.map((t) => [state, t] as [VerificationState, VerificationTransition]),
  );

  it.each(pairs)('%s --%s-->', (state, transition) => {
    expect(nextState(state, transition)).toBe(ALLOWED[`${state}:${transition}`] ?? null);
  });

  it('makes APPROVED reachable only by approve', () => {
    const into = pairs.filter(([s, t]) => nextState(s, t) === 'APPROVED').map(([s, t]) => `${s}:${t}`);
    expect(into).toEqual(['IN_REVIEW:approve']);
  });
});

describe('document editing and status mapping', () => {
  it.each([
    ['DRAFT', true, 'DRAFT'],
    ['MORE_INFO', true, 'DRAFT'],
    ['REJECTED', true, 'DRAFT'],
    ['IN_REVIEW', false, 'IN_REVIEW'],
    ['APPROVED', false, 'IN_REVIEW'],
  ] as const)('%s: editable %s, app status %s', (state, editable, app) => {
    expect(canEditDocuments(state)).toBe(editable);
    expect(appStatusOf(state)).toBe(app);
  });

  it('maps admin statuses both ways', () => {
    expect(adminStatusOf('IN_REVIEW')).toBe('PENDING');
    expect(adminStatusOf('MORE_INFO')).toBe('MORE_INFO');
    for (const s of ['PENDING', 'MORE_INFO', 'APPROVED', 'REJECTED'] as const) {
      expect(adminStatusOf(stateOfAdminStatus(s))).toBe(s);
    }
  });
});
