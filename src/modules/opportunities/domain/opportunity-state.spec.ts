import {
  isEditable,
  nextOpportunityStatus,
  nextRevisionStatus,
  OPPORTUNITY_STATUSES,
  OpportunityAction,
  OpportunityStatus,
  REVISION_STATUSES,
  RevisionAction,
  RevisionStatus,
} from './opportunity-state';

const ACTIONS: OpportunityAction[] = ['SUBMIT', 'RETURN_TO_DRAFT', 'APPROVE', 'REQUEST_CHANGES', 'REJECT', 'CLOSE'];

describe('opportunity state machine', () => {
  const allowed: [OpportunityStatus, OpportunityAction, OpportunityStatus][] = [
    ['DRAFT', 'SUBMIT', 'IN_REVIEW'],
    ['CHANGES_REQUESTED', 'SUBMIT', 'IN_REVIEW'],
    ['IN_REVIEW', 'RETURN_TO_DRAFT', 'DRAFT'],
    ['IN_REVIEW', 'APPROVE', 'PUBLISHED'],
    ['IN_REVIEW', 'REQUEST_CHANGES', 'CHANGES_REQUESTED'],
    ['IN_REVIEW', 'REJECT', 'REJECTED'],
    ['PUBLISHED', 'CLOSE', 'CLOSED'],
  ];

  it.each(allowed)('%s --%s--> %s', (from, action, to) => {
    expect(nextOpportunityStatus(from, action)).toBe(to);
  });

  it('refuses every other move', () => {
    const ok = new Set(allowed.map(([from, action]) => `${from}:${action}`));
    for (const from of OPPORTUNITY_STATUSES) {
      for (const action of ACTIONS) {
        if (!ok.has(`${from}:${action}`))
          expect([from, action, nextOpportunityStatus(from, action)]).toEqual([from, action, null]);
      }
    }
  });

  it('edits content in place only before review and when changes were asked for', () => {
    expect(OPPORTUNITY_STATUSES.filter(isEditable)).toEqual(['DRAFT', 'CHANGES_REQUESTED']);
  });
});

describe('revision state machine', () => {
  const REVISION_ACTIONS: RevisionAction[] = ['START', 'SUBMIT', 'APPROVE', 'REQUEST_CHANGES', 'REJECT'];
  const allowed: [RevisionStatus | null, RevisionAction, RevisionStatus | 'NONE'][] = [
    [null, 'START', 'DRAFT'],
    ['DRAFT', 'SUBMIT', 'IN_REVIEW'],
    ['CHANGES_REQUESTED', 'SUBMIT', 'IN_REVIEW'],
    ['IN_REVIEW', 'APPROVE', 'NONE'],
    ['IN_REVIEW', 'REQUEST_CHANGES', 'CHANGES_REQUESTED'],
    ['IN_REVIEW', 'REJECT', 'NONE'],
  ];

  it.each(allowed)('%s --%s--> %s on a published listing', (from, action, to) => {
    expect(nextRevisionStatus('PUBLISHED', from, action)).toBe(to);
  });

  it('refuses every other move, and any revision of a listing that is not live', () => {
    const ok = new Set(allowed.map(([from, action]) => `${from}:${action}`));
    for (const from of [null, ...REVISION_STATUSES]) {
      for (const action of REVISION_ACTIONS) {
        if (!ok.has(`${from}:${action}`)) expect(nextRevisionStatus('PUBLISHED', from, action)).toBeUndefined();
      }
    }
    for (const listing of OPPORTUNITY_STATUSES.filter((s) => s !== 'PUBLISHED')) {
      expect(nextRevisionStatus(listing, null, 'START')).toBeUndefined();
    }
  });
});
