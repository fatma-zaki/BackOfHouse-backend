import {
  BUYER_MOVES,
  BuyerMove,
  canBuyerMove,
  respondRefusal,
  SUPPLIER_RESPONSE_STATUSES,
  SupplierResponseStatus,
} from './supplier-response.policy';

describe('supplier response policy', () => {
  const allowed: [SupplierResponseStatus, BuyerMove][] = [
    ['SUBMITTED', 'REVIEWED'],
    ['REVIEWED', 'SHORTLISTED'],
    ['SHORTLISTED', 'SELECTED'],
    ['SUBMITTED', 'REJECTED'],
    ['REVIEWED', 'REJECTED'],
    ['SHORTLISTED', 'REJECTED'],
  ];

  it.each(allowed)('lets the buyer move %s → %s', (from, to) => {
    expect(canBuyerMove(from, to)).toBe(true);
  });

  const refused = SUPPLIER_RESPONSE_STATUSES.flatMap((from) =>
    BUYER_MOVES.filter((to) => !allowed.some(([f, t]) => f === from && t === to)).map(
      (to) => [from, to] as [SupplierResponseStatus, BuyerMove],
    ),
  );

  it.each(refused)('refuses %s → %s (no skipping, decisions are final)', (from, to) => {
    expect(canBuyerMove(from, to)).toBe(false);
  });

  describe('who may respond', () => {
    const request = { type: 'SUPPLIER_REQUEST' as const, companyId: 'buyer', supplierTypes: ['SUPPLIER'], open: true };
    const supplier = { companyId: 'supplier', companyType: 'SUPPLIER' };

    it('checks in the contract order', () => {
      expect(
        respondRefusal({ ...request, type: 'JOB', open: false }, { companyId: 'buyer', companyType: 'AGENCY' }),
      ).toBe('NOT_SUPPLIER_REQUEST');
      expect(respondRefusal({ ...request, open: false }, { companyId: 'buyer', companyType: 'SUPPLIER' })).toBe(
        'OWN_REQUEST',
      );
      expect(respondRefusal({ ...request, open: false }, { companyId: 'x', companyType: 'AGENCY' })).toBe(
        'NOT_INVITED',
      );
      expect(respondRefusal({ ...request, open: false }, supplier)).toBe('CLOSED');
      expect(respondRefusal(request, supplier)).toBeNull();
    });
  });
});
