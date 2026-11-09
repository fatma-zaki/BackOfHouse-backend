import { ContactSubject, visibleContact } from './contact-visibility.policy';

const member = (shareEmail: boolean, sharePhone: boolean): ContactSubject => ({
  email: 'sara@example.com',
  phone: '+966500000001',
  shareEmail,
  sharePhone,
});
const hidden = { email: null, phone: null };

describe('visibleContact', () => {
  it('always shows a member their own details', () => {
    expect(visibleContact(member(false, false), { kind: 'self' })).toEqual({
      email: 'sara@example.com',
      phone: '+966500000001',
    });
  });

  it('hides everything by default, even from a company at the CONTACT stage', () => {
    expect(visibleContact(member(false, false), { kind: 'company', applicationStatus: 'CONTACT' })).toEqual(hidden);
  });

  it('shows only what was shared, from the CONTACT stage on', () => {
    expect(visibleContact(member(true, false), { kind: 'company', applicationStatus: 'CONTACT' })).toEqual({
      email: 'sara@example.com',
      phone: null,
    });
    expect(visibleContact(member(true, true), { kind: 'company', applicationStatus: 'ACCEPTED' })).toEqual({
      email: 'sara@example.com',
      phone: '+966500000001',
    });
  });

  it.each(['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'WITHDRAWN', null])(
    'hides shared details from a company at status %s',
    (applicationStatus) => {
      expect(visibleContact(member(true, true), { kind: 'company', applicationStatus })).toEqual(hidden);
    },
  );

  it('never shows details to other members', () => {
    expect(visibleContact(member(true, true), { kind: 'other' })).toEqual(hidden);
  });
});
