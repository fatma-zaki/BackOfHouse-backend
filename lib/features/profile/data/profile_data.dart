import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/media/app_image.dart';
import '../../auth/domain/app_user.dart';
import '../../auth/presentation/controllers/auth_controller.dart';
import '../domain/profile.dart';
import '../domain/profile_status.dart';

abstract interface class ProfileDataSource {
  Future<Profile> getMyProfile();
}

class ProfileRepositoryImpl implements ProfileRepository {
  const ProfileRepositoryImpl(this._source);

  final ProfileDataSource _source;

  @override
  Future<Profile> getMyProfile() => _source.getMyProfile();
}

/// Builds the signed-in member's profile around their real name and
/// headline, filling the rest with sample content.
class ProfileMockDataSource implements ProfileDataSource {
  ProfileMockDataSource({
    required this.user,
    required this.language,
    required this.latency,
  });

  final AppUser? user;
  final String Function() language;
  final Duration latency;

  @override
  Future<Profile> getMyProfile() async {
    await Future<void>.delayed(latency);
    final lang = language();
    String t(String en, String ar) => MockText(en, ar).of(lang);

    return Profile(
      name: user?.fullName ?? 'Fatma Zaki',
      headline:
          user?.headline ??
          t(
            'Lead Event Director & Production Specialist',
            'مديرة فعاليات رئيسية وأخصائية إنتاج',
          ),
      company: t('Riyadh Season Mega Projects', 'مشاريع موسم الرياض'),
      city: t('Riyadh, Saudi Arabia', 'الرياض، السعودية'),
      industry: t('Saudi Events Industry', 'قطاع الفعاليات السعودي'),
      about: t(
        '10+ years directing large-scale corporate summits, cultural festivals, and governmental ceremonies across the GCC with an emphasis on production safety and bespoke guest journeys.',
        'أكثر من 10 سنوات في إدارة القمم المؤسسية الكبرى والمهرجانات الثقافية والمراسم الحكومية في دول الخليج، مع تركيز على سلامة الإنتاج وتجارب الضيوف المصممة بعناية.',
      ),
      experience: [
        Experience(
          id: 'exp-riyadh-season',
          role: t('Executive Event Director', 'مديرة فعاليات تنفيذية'),
          company: t('Riyadh Season Mega Projects', 'مشاريع موسم الرياض'),
          start: DateTime(2022, 3),
        ),
        Experience(
          id: 'exp-al-alamia',
          role: t('Senior Operations Manager', 'مديرة عمليات أولى'),
          company: t('Al-Alamia Events', 'العالمية للفعاليات'),
          start: DateTime(2018),
          end: DateTime(2022, 2),
        ),
      ],
      skills: [
        t('Festival Operations', 'عمليات المهرجانات'),
        t('Technical Production', 'الإنتاج التقني'),
        t('Crisis Management', 'إدارة الأزمات'),
        t('VIP & Diplomatic Protocol', 'بروتوكول كبار الشخصيات'),
        t('Vendor Procurement', 'مشتريات الموردين'),
        t('Stage Management', 'إدارة المسرح'),
      ],
      verified: true,
      avatar: const AppImage.asset(AppAssets.headshotDirector),
      visibilityScore: 82,
      yearsExperience: 10,
      attendancePoints: 45,
      eventsAttended: 3,
      verificationLevel: 2,
      status: user?.profileStatus ?? ProfileStatus.professional,
      availability: t(
        'Available for Q3/Q4 cultural projects',
        'متاحة لمشاريع ثقافية في الربعين الثالث والرابع',
      ),
      projects: [
        ProfileProject(
          id: 'project-noor-riyadh',
          year: 2024,
          category: t('Lighting & Staging', 'الإضاءة والمسارح'),
          title: t('Noor Riyadh 2024 Pavilion', 'جناح نور الرياض 2024'),
          role: t(
            'Lead Producer · 120k attendees',
            'منتجة رئيسية · 120 ألف زائر',
          ),
          image: const AppImage.asset(AppAssets.festivalStage),
        ),
        ProfileProject(
          id: 'project-world-defense-show',
          year: 2024,
          category: t('Gala Operations', 'عمليات الحفلات'),
          title: t('World Defense Show Opening', 'افتتاح معرض الدفاع العالمي'),
          role: t('Technical lead · Live broadcast', 'قائدة تقنية · بث مباشر'),
          image: const AppImage.asset(AppAssets.auditorium),
        ),
      ],
      badges: [
        ProfileBadge(
          title: t('Certified Event Director', 'مديرة فعاليات معتمدة'),
          issuer: t('General Entertainment Authority', 'الهيئة العامة للترفيه'),
          premium: true,
        ),
        ProfileBadge(
          title: t('Master Producer 2024', 'منتجة متميزة 2024'),
          issuer: t('Saudi Production Guild', 'رابطة الإنتاج السعودية'),
          premium: true,
        ),
        ProfileBadge(
          title: t('Community Speaker', 'متحدثة في المجتمع'),
          issuer: t('Middle East Event Summit', 'قمة فعاليات الشرق الأوسط'),
        ),
      ],
    );
  }
}

/// TODO(api): select a `ProfileRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final profileDataSourceProvider = Provider<ProfileDataSource>((ref) {
  return ProfileMockDataSource(
    user: ref.watch(authControllerProvider.select((s) => s.value)),
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
  );
});

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepositoryImpl(ref.watch(profileDataSourceProvider)),
);

final myProfileProvider = FutureProvider<Profile>((ref) {
  ref.watch(contentLanguageProvider);
  return ref.watch(profileRepositoryProvider).getMyProfile();
});
