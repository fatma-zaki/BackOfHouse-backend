import 'package:flutter/painting.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/media/app_image.dart';

/// Sample content for the component gallery. Developer tooling only — real
/// screens get content from repositories and copy from ARB files.
class GallerySample {
  const GallerySample({
    required this.tag,
    required this.title,
    required this.description,
    required this.meta,
    this.image = AppImage.placeholder,
  });

  final String tag;
  final String title;
  final String description;
  final List<String> meta;
  final AppImage? image;

  static List<GallerySample> of({required bool arabic}) => arabic ? _ar : _en;

  static const _en = [
    GallerySample(
      tag: 'Industry',
      title: 'Saudi Events Industry Continues to Grow in 2025',
      description:
          'New reports show a significant increase in events, attendees, and '
          "investment in the Kingdom's events sector.",
      meta: ['2h ago', '5 min read'],
    ),
    GallerySample(
      tag: 'Technology',
      title: 'How Technology is Transforming Live Events',
      description:
          'From AI to real-time analytics, discover how innovation is '
          'creating smarter, more engaging event experiences.',
      meta: ['5h ago', '7 min read'],
      image: null,
    ),
  ];

  static const _ar = [
    GallerySample(
      tag: 'القطاع',
      title: 'قطاع الفعاليات السعودي يواصل النمو في 2025',
      description:
          'تقارير جديدة تكشف عن زيادة كبيرة في عدد الفعاليات والحضور '
          'والاستثمارات في قطاع الفعاليات بالمملكة.',
      meta: ['قبل ساعتين', 'قراءة 5 د'],
    ),
    GallerySample(
      tag: 'التقنية',
      title: 'كيف تعيد التقنية تشكيل الفعاليات الحية',
      description:
          'من الذكاء الاصطناعي إلى التحليلات اللحظية، اكتشف كيف يصنع '
          'الابتكار تجارب أذكى وأكثر تفاعلًا.',
      meta: ['قبل 5 ساعات', 'قراءة 7 د'],
      image: null,
    ),
  ];
}

/// Every colour role, in display order, for the active mode.
List<(String, Color)> galleryColorTokens(AppColors c) => [
  ('background', c.background),
  ('surface', c.surface),
  ('surfaceElevated', c.surfaceElevated),
  ('unreadSurface', c.unreadSurface),
  ('primary', c.primary),
  ('primaryText', c.primaryText),
  ('primaryTint', c.primaryTint),
  ('inverse', c.inverse),
  ('textPrimary', c.textPrimary),
  ('textSecondary', c.textSecondary),
  ('textDisabled', c.textDisabled),
  ('border', c.border),
  ('borderAccent', c.borderAccent),
  ('borderStrong', c.borderStrong),
  ('success', c.success),
  ('warning', c.warning),
  ('error', c.error),
  ('alertWarning', c.alertWarning),
];

/// Tag and status tones, for the active mode.
List<(String, AppTone)> galleryTones(AppColors c) => [
  ('tagViolet', c.tagViolet),
  ('tagGreen', c.tagGreen),
  ('tagAmber', c.tagAmber),
  ('tagBlue', c.tagBlue),
  ('statusSuccess', c.statusSuccess),
  ('statusWarning', c.statusWarning),
  ('statusInfo', c.statusInfo),
  ('statusNeutral', c.statusNeutral),
  ('statusViolet', c.statusViolet),
];
