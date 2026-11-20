import { ForbiddenError } from '../../../common/errors';
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  blocksNewApplication,
  canCompanyMove,
  canWithdraw,
  COMPANY_MOVES,
  CompanyMove,
  requireApplicationDecider,
} from './application-status.policy';
import { applyRefusal } from './opportunity-type.policy';

describe('application status policy', () => {
  const allowed: [ApplicationStatus, CompanyMove][] = [
    ['SUBMITTED', 'REVIEWED'],
    ['REVIEWED', 'SHORTLISTED'],
    ['SHORTLISTED', 'CONTACT'],
    ['CONTACT', 'ACCEPTED'],
    ['SUBMITTED', 'REJECTED'],
    ['REVIEWED', 'REJECTED'],
    ['SHORTLISTED', 'REJECTED'],
    ['CONTACT', 'REJECTED'],
  ];

  it.each(allowed)('lets the company move %s → %s', (from, to) => {
    expect(canCompanyMove(from, to)).toBe(true);
  });

  const refused = APPLICATION_STATUSES.flatMap((from) =>
    COMPANY_MOVES.filter((to) => !allowed.some(([f, t]) => f === from && t === to)).map(
      (to) => [from, to] as [ApplicationStatus, CompanyMove],
    ),
  );

  it.each(refused)('refuses %s → %s (no skipping, decisions are final)', (from, to) => {
    expect(canCompanyMove(from, to)).toBe(false);
  });

  it('lets the applicant withdraw only an active application', () => {
    expect(APPLICATION_STATUSES.filter(canWithdraw)).toEqual(['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'CONTACT']);
  });

  it('lets only a WITHDRAWN application make way for a new one', () => {
    expect(APPLICATION_STATUSES.filter((s) => !blocksNewApplication(s))).toEqual(['WITHDRAWN']);
  });

  it('refuses everyone but a Company Account with REVIEW_APPLICANTS, staff included', () => {
    expect(() => requireApplicationDecider({ kind: 'staff', staffId: 's', role: 'SUPER_ADMIN' } as never)).toThrow(
      ForbiddenError,
    );
    expect(() => requireApplicationDecider({ kind: 'member', userId: 'u', isStudent: false })).toThrow(ForbiddenError);
    expect(() => requireApplicationDecider(undefined)).toThrow(ForbiddenError);
    const company = { kind: 'company', userId: 'u', companyId: 'c', permissions: ['REVIEW_APPLICANTS'] } as never;
    expect(requireApplicationDecider(company)).toBe(company);
    expect(() =>
      requireApplicationDecider({ kind: 'company', userId: 'u', companyId: 'c', permissions: [] } as never),
    ).toThrow(expect.objectContaining({ code: 'PERMISSION_DENIED' }));
  });
});

describe('who may apply (applyRefusal)', () => {
  const member = { kind: 'member' as const, student: false };
  const student = { kind: 'member' as const, student: true };

  it('checks in the contract order', () => {
    expect(applyRefusal({ type: 'SUPPLIER_REQUEST', open: false }, { kind: 'company', student: false })).toBe(
      'COMPANY_FACING',
    );
    expect(applyRefusal({ type: 'CO_OP', open: false }, { kind: 'company', student: false })).toBe('INDIVIDUALS_ONLY');
    expect(applyRefusal({ type: 'CO_OP', open: false }, member)).toBe('CLOSED');
    expect(applyRefusal({ type: 'CO_OP', open: true }, member)).toBe('STUDENTS_ONLY');
  });

  it('lets students apply to co-ops and everyone to the other individual listings', () => {
    expect(applyRefusal({ type: 'CO_OP', open: true }, student)).toBeNull();
    for (const type of ['JOB', 'PROJECT', 'VOLUNTEERING'] as const) {
      expect(applyRefusal({ type, open: true }, member)).toBeNull();
      expect(applyRefusal({ type, open: true }, student)).toBeNull();
    }
  });
});
