import 'package:backofhouse/core/network/api_exception.dart';
import 'package:backofhouse/features/applications/domain/application.dart';
import 'package:backofhouse/features/auth/domain/account_type.dart';
import 'package:backofhouse/features/auth/domain/app_user.dart';
import 'package:backofhouse/features/profile/data/profile_data.dart';
import 'package:backofhouse/features/profile/data/verification_data.dart';
import 'package:backofhouse/features/profile/domain/profile.dart';
import 'package:backofhouse/features/profile/domain/profile_status.dart';
import 'package:backofhouse/features/profile/domain/verification.dart';
import 'package:flutter_test/flutter_test.dart';

const _member = AppUser(
  id: 'u1',
  fullName: 'Sara Ahmed',
  email: 'sara@example.com',
  accountType: AccountType.individual,
  profileStatus: ProfileStatus.professional,
);

ProfileDraft _draft({
  String name = 'Sara Ahmed',
  String about = '',
  ProfileStatus status = ProfileStatus.professional,
  ContactPrivacy privacy = const ContactPrivacy(),
}) => ProfileDraft(
  name: name,
  headline: 'Event producer',
  city: 'Riyadh',
  about: about,
  status: status,
  interests: const {ProfileInterest.design},
  contactPrivacy: privacy,
);

void main() {
  group('profile editing', () {
    test('a name is required and About is capped', () {
      expect(_draft().validate(), isEmpty);
      expect(_draft(name: ' ').validate(), [ProfileDraftIssue.nameRequired]);
      expect(
        _draft(about: 'x' * (ProfileDraft.aboutMaxLength + 1)).validate(),
        [ProfileDraftIssue.aboutTooLong],
      );
    });

    test('contact sharing defaults to nothing', () async {
      final profile = await ProfileMockDataSource(
        user: _member,
        language: () => 'en',
        latency: Duration.zero,
        edits: ProfileEditsStore(),
      ).getMyProfile();
      expect(profile.contactPrivacy.shareEmail, isFalse);
      expect(profile.contactPrivacy.sharePhone, isFalse);
    });

    test('saved edits are what the profile returns', () async {
      final source = ProfileMockDataSource(
        user: _member,
        language: () => 'en',
        latency: Duration.zero,
        edits: ProfileEditsStore(),
      );
      await source.updateProfile(
        _draft(
          status: ProfileStatus.student,
          privacy: const ContactPrivacy(shareEmail: true),
        ),
      );
      final profile = await source.getMyProfile();
      expect(profile.status, ProfileStatus.student);
      expect(profile.interests, {ProfileInterest.design});
      expect(profile.contactPrivacy.shareEmail, isTrue);
      expect(profile.contactPrivacy.sharePhone, isFalse);
    });

    test('an invalid draft is rejected by the data layer', () async {
      final source = ProfileMockDataSource(
        user: _member,
        language: () => 'en',
        latency: Duration.zero,
        edits: ProfileEditsStore(),
      );
      await expectLater(
        source.updateProfile(_draft(name: '')),
        throwsA(isA<ApiException>()),
      );
    });

    test('student status is a profile attribute, not an account type', () {
      final student = _member.copyWith(profileStatus: ProfileStatus.student);
      expect(student.accountType, AccountType.individual);
      expect(student.profileStatus, ProfileStatus.student);
    });
  });

  group('verification requests', () {
    test('both documents are needed before review', () async {
      final repo = VerificationMockRepository(latency: Duration.zero);
      await expectLater(repo.submit(), throwsA(isA<ApiException>()));
      await repo.upload(
        VerificationDocument.identity,
        fileName: 'id.pdf',
        bytes: const [1],
      );
      var request = await repo.getMyRequest();
      expect(request.canSubmit, isFalse);
      expect(request.nextDocument, VerificationDocument.experience);
      request = await repo.upload(
        VerificationDocument.experience,
        fileName: 'letter.pdf',
        bytes: const [1],
      );
      expect(request.canSubmit, isTrue);
    });

    test('submitting asks for a review and grants nothing', () async {
      final repo = VerificationMockRepository(latency: Duration.zero);
      for (final d in VerificationDocument.values) {
        await repo.upload(d, fileName: '${d.name}.pdf', bytes: const [1]);
      }
      final request = await repo.submit();
      expect(request.status, VerificationRequestStatus.inReview);
      expect(request.canSubmit, isFalse);
      // No further uploads once in review.
      await expectLater(
        repo.upload(
          VerificationDocument.identity,
          fileName: 'again.pdf',
          bytes: const [1],
        ),
        throwsA(isA<ApiException>()),
      );
      // The review stays pending: there is no "verified" outcome here.
      expect(
        VerificationRequestStatus.values,
        isNot(contains(predicate((s) => '$s'.contains('verified')))),
      );
    });
  });
}
