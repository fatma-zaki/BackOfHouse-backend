// Public API of the identity module (nest-module-map.md §2.1 rule 1).
export { IdentityModule } from './identity.module';
export {
  MemberAuthService,
  type AuthenticatedMember,
  type OnRegistered,
  type RegisterInput,
} from './services/member-auth.service';
export { PhoneSignInService } from './services/phone-sign-in.service';
export { MembersService, type MemberView } from './services/members.service';
export { ActivityService } from './services/activity.service';
export { MEMBER_AUTH_PROVIDER, type AuthTokens, type MemberAuthProvider } from './infrastructure/member-auth-provider';
export { InMemoryMemberAuthProvider } from './infrastructure/in-memory-member-auth.provider';
export { SMS_SENDER, DevSmsSender, type SmsSender } from './infrastructure/sms-sender';
export { PHONE_CODE, normalizePhone } from './domain/phone-code';
