import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Type scale — Poppins for Latin text and every number, Cairo for Arabic.
///
/// Metrics follow the design hand-off (`docs/design/design-tokens.json`).
/// Poppins comes first in the stack, so digits stay Western and in Poppins in
/// both languages; Arabic glyphs fall through to Cairo. These are metrics
/// only; colour (and Arabic letter-spacing) is applied by [AppTextStyles]
/// through `context.text`.
abstract final class AppTypography {
  static const String fontFamily = 'Poppins';
  static const String arabicFontFamily = 'Cairo';
  static const List<String> fontFamilyFallback = [arabicFontFamily];

  static const TextStyle _base = TextStyle(
    fontFamily: fontFamily,
    fontFamilyFallback: fontFamilyFallback,
    leadingDistribution: TextLeadingDistribution.even,
  );

  static TextStyle _style(
    double size,
    double lineHeight,
    FontWeight weight, [
    double letterSpacing = 0,
  ]) => _base.copyWith(
    fontSize: size,
    height: lineHeight / size,
    fontWeight: weight,
    letterSpacing: letterSpacing,
  );

  /// 30 / 38 Bold — Welcome and sign-in statements.
  static final TextStyle display = _style(30, 38, FontWeight.w700, -0.6);

  /// 26 / 32 Bold — Sign-up and confirmation titles.
  static final TextStyle titleXL = _style(26, 32, FontWeight.w700, -0.5);

  /// 24 / 30 Bold — Tab screen titles and greetings.
  static final TextStyle h1 = _style(24, 30, FontWeight.w700, -0.4);

  /// 22 / 28 Bold — Dashboard greeting, notifications title.
  static final TextStyle title = _style(22, 28, FontWeight.w700, -0.5);

  /// 20 / 26 Bold — Back-button app bar titles, detail headings.
  static final TextStyle appBarTitle = _style(20, 26, FontWeight.w700, -0.5);

  /// 18 / 24 Bold — Section headings next to the skew bar.
  static final TextStyle h2 = _style(18, 24, FontWeight.w700, -0.4);

  /// 16 / 21 Bold — Large card titles, sub-sections.
  static final TextStyle h3 = _style(16, 21, FontWeight.w700);

  /// 15 / 20 Bold — Card titles, primary button labels.
  static final TextStyle cardTitle = _style(15, 20, FontWeight.w700);

  /// 14 / 19 Bold — List card titles.
  static final TextStyle itemTitle = _style(14, 19, FontWeight.w700);

  /// 15 / 25 Regular — Long-form reading (articles).
  static final TextStyle article = _style(15, 25, FontWeight.w400);

  /// 14 / 21 Regular — Field values, lead paragraphs.
  static final TextStyle bodyLarge = _style(14, 21, FontWeight.w400);

  /// 13 / 20 Regular — Default reading text.
  static final TextStyle body = _style(13, 20, FontWeight.w400);

  /// 12 / 16 Regular — Secondary lines and metadata.
  static final TextStyle bodySmall = _style(12, 16, FontWeight.w400);

  /// 13 / 18 Bold — Row titles, compact buttons, links.
  static final TextStyle label = _style(13, 18, FontWeight.w700);

  /// 12 / 16 Bold — Field labels, chips, small buttons.
  static final TextStyle labelMedium = _style(12, 16, FontWeight.w700);

  /// 11 / 15 Regular — Timestamps, helper text.
  static final TextStyle caption = _style(11, 15, FontWeight.w400);

  /// 10.5 / 14 ExtraBold — Status badges.
  static final TextStyle badge = _style(10.5, 14, FontWeight.w800);

  /// 11 / 14 — Bottom navigation labels (weight set per state).
  static final TextStyle nav = _style(11, 14, FontWeight.w600);

  // ── Roles derived from the scale ─────────────────────────────────────────

  /// Button labels — same metrics as [cardTitle].
  static final TextStyle button = cardTitle;

  /// Uppercase overline, e.g. "TODAY", "DATE". Tracking and uppercasing are
  /// dropped for Arabic, since both break cursive joining.
  static final TextStyle eyebrow = _style(10, 14, FontWeight.w800, 1);

  /// Category tag text, e.g. "CONFERENCE".
  static final TextStyle tag = _style(9.5, 13, FontWeight.w800, 1);

  /// Stats, points, dates and codes. Always Poppins (Western digits), in
  /// both languages; pick the size per use.
  static TextStyle number(double size, {double? lineHeight}) =>
      _style(size, lineHeight ?? size * 1.2, FontWeight.w700);
}

/// The type scale coloured for the active mode. Use via `context.text`.
///
/// Default ink per role: headings and titles in [AppColors.textPrimary],
/// reading text and small print in [AppColors.textSecondary] (the design's
/// single muted ink). With [arabic], letter-spacing is removed everywhere.
@immutable
class AppTextStyles {
  const AppTextStyles(this.c, {this.arabic = false});

  final AppColors c;
  final bool arabic;

  TextStyle _ink(TextStyle style, Color color) => arabic
      ? style.copyWith(color: color, letterSpacing: 0)
      : style.copyWith(color: color);

  TextStyle get display => _ink(AppTypography.display, c.textPrimary);
  TextStyle get titleXL => _ink(AppTypography.titleXL, c.textPrimary);
  TextStyle get h1 => _ink(AppTypography.h1, c.textPrimary);
  TextStyle get title => _ink(AppTypography.title, c.textPrimary);
  TextStyle get appBarTitle => _ink(AppTypography.appBarTitle, c.textPrimary);
  TextStyle get h2 => _ink(AppTypography.h2, c.textPrimary);
  TextStyle get h3 => _ink(AppTypography.h3, c.textPrimary);
  TextStyle get cardTitle => _ink(AppTypography.cardTitle, c.textPrimary);
  TextStyle get itemTitle => _ink(AppTypography.itemTitle, c.textPrimary);
  TextStyle get article => _ink(AppTypography.article, c.textPrimary);
  TextStyle get bodyLarge => _ink(AppTypography.bodyLarge, c.textPrimary);
  TextStyle get body => _ink(AppTypography.body, c.textSecondary);
  TextStyle get bodySmall => _ink(AppTypography.bodySmall, c.textSecondary);
  TextStyle get label => _ink(AppTypography.label, c.textPrimary);
  TextStyle get labelMedium => _ink(AppTypography.labelMedium, c.textPrimary);
  TextStyle get caption => _ink(AppTypography.caption, c.textSecondary);
  TextStyle get badge => _ink(AppTypography.badge, c.textSecondary);
  TextStyle get eyebrow => _ink(AppTypography.eyebrow, c.textSecondary);
  TextStyle get tag => _ink(AppTypography.tag, c.primaryText);

  /// Numbers keep Poppins and their tracking in both languages.
  TextStyle number(double size, {double? lineHeight, Color? color}) =>
      AppTypography.number(
        size,
        lineHeight: lineHeight,
      ).copyWith(color: color ?? c.textPrimary);

  /// Material text theme mapped onto the scale, for framework widgets.
  TextTheme get material => TextTheme(
    displayLarge: display,
    displayMedium: titleXL,
    displaySmall: h1,
    headlineLarge: h1,
    headlineMedium: title,
    headlineSmall: appBarTitle,
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
