import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Type scale — Plus Jakarta Sans, falling back to Inter, then the system face.
///
/// Derived from the Stitch design system (`ui-refrence/stitch/back_of_house/
/// DESIGN.md`), stepped down one notch so compact phones (360dp) fit
/// titles and metadata on one line. These are metrics only; colour is applied per
/// mode by [AppTextStyles] through `context.text`.
abstract final class AppTypography {
  static const String fontFamily = 'PlusJakartaSans';
  static const List<String> fontFamilyFallback = ['Inter'];

  static const TextStyle _base = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    leadingDistribution: TextLeadingDistribution.even,
  );

  /// 26 / 32 Bold — headline-lg. Hero statements.
  static final TextStyle display = _base.copyWith(
    fontSize: 26,
    height: 32 / 26,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.39,
  );

  /// 22 / 28 Bold — Page titles.
  static final TextStyle h1 = _base.copyWith(
    fontSize: 22,
    height: 28 / 22,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.33,
  );

  /// 19 / 24 SemiBold — Greetings, stat values.
  static final TextStyle h2 = _base.copyWith(
    fontSize: 19,
    height: 24 / 19,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.19,
  );

  /// 16 / 22 SemiBold — Section titles.
  static final TextStyle h3 = _base.copyWith(
    fontSize: 16,
    height: 22 / 16,
    fontWeight: FontWeight.w600,
  );

  /// 15 / 20 SemiBold — Card titles, primary button labels.
  static final TextStyle cardTitle = _base.copyWith(
    fontSize: 15,
    height: 20 / 15,
    fontWeight: FontWeight.w600,
  );

  /// 15 / 22 Regular — Long-form reading.
  static final TextStyle bodyLarge = _base.copyWith(
    fontSize: 15,
    height: 22 / 15,
    fontWeight: FontWeight.w400,
  );

  /// 13 / 19 Regular — Default reading text.
  static final TextStyle body = _base.copyWith(
    fontSize: 13,
    height: 19 / 13,
    fontWeight: FontWeight.w400,
  );

  /// 12 / 16 Regular — Secondary lines.
  static final TextStyle bodySmall = _base.copyWith(
    fontSize: 12,
    height: 16 / 12,
    fontWeight: FontWeight.w400,
  );

  /// 13 / 18 SemiBold — Field labels, compact buttons, chips.
  static final TextStyle label = _base.copyWith(
    fontSize: 13,
    height: 18 / 13,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.13,
  );

  /// 11.5 / 15 SemiBold — Links in section headers, tags.
  static final TextStyle labelMedium = _base.copyWith(
    fontSize: 11.5,
    height: 15 / 11.5,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.23,
  );

  /// 10.5 / 13 SemiBold — Metadata, timestamps, nav labels.
  static final TextStyle caption = _base.copyWith(
    fontSize: 10.5,
    height: 13 / 10.5,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
  );

  // ── Roles derived from the scale ─────────────────────────────────────────

  /// Button labels — same metrics as [cardTitle].
  static final TextStyle button = cardTitle;

  /// Uppercase overline, e.g. "ECOSYSTEM DIRECTORY". Tracking is dropped for
  /// Arabic by `BOHEyebrow`, since spacing breaks cursive joining.
  static final TextStyle eyebrow = caption.copyWith(letterSpacing: 1.1);

  /// Tag text, e.g. "Verified".
  static final TextStyle tag = labelMedium;
}

/// The type scale coloured for the active mode. Use via `context.text`.
///
/// Default ink per role: headings and titles in [AppColors.textPrimary],
/// reading text in [AppColors.textSecondary], small print in
/// [AppColors.textMuted].
@immutable
class AppTextStyles {
  const AppTextStyles(this.c);

  final AppColors c;

  TextStyle get display => AppTypography.display.copyWith(color: c.textPrimary);
  TextStyle get h1 => AppTypography.h1.copyWith(color: c.textPrimary);
  TextStyle get h2 => AppTypography.h2.copyWith(color: c.textPrimary);
  TextStyle get h3 => AppTypography.h3.copyWith(color: c.textPrimary);
  TextStyle get cardTitle =>
      AppTypography.cardTitle.copyWith(color: c.textPrimary);
  TextStyle get bodyLarge =>
      AppTypography.bodyLarge.copyWith(color: c.textSecondary);
  TextStyle get body => AppTypography.body.copyWith(color: c.textSecondary);
  TextStyle get bodySmall =>
      AppTypography.bodySmall.copyWith(color: c.textSecondary);
  TextStyle get label => AppTypography.label.copyWith(color: c.textPrimary);
  TextStyle get labelMedium =>
      AppTypography.labelMedium.copyWith(color: c.textSecondary);
  TextStyle get caption => AppTypography.caption.copyWith(color: c.textMuted);
  TextStyle get eyebrow =>
      AppTypography.eyebrow.copyWith(color: c.textSecondary);
  TextStyle get tag => AppTypography.tag.copyWith(color: c.primaryText);

  /// Material text theme mapped onto the scale, for framework widgets.
  TextTheme get material => TextTheme(
    displayLarge: display,
    displayMedium: display,
    displaySmall: h1,
    headlineLarge: h1,
    headlineMedium: h2,
    headlineSmall: h3,
    titleLarge: h2,
    titleMedium: h3,
    titleSmall: cardTitle,
    bodyLarge: bodyLarge,
    bodyMedium: body,
    bodySmall: bodySmall,
    labelLarge: label,
    labelMedium: labelMedium,
    labelSmall: caption,
  );
}
