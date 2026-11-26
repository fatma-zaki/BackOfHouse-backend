import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../media/boh_glyph.dart';

enum BOHBannerTone {
  /// Green with a check — "You're eligible to apply".
  success,

  /// Amber with a star — "Earn points when your attendance is verified".
  warning,

  /// Blue with a shield — review notices.
  info,

  /// Soft violet with a lock — privacy reassurance.
  privacy,

  /// Dashed outline, muted — neutral caveats and hints.
  dashed,

  /// Soft violet quote callout — article pull quotes.
  quote,
}

/// Inline notice. Every tone carries an icon, so meaning never depends on
/// colour alone.
class BOHBanner extends StatelessWidget {
  const BOHBanner(
    this.message, {
    super.key,
    this.tone = BOHBannerTone.dashed,
    this.icon,
    this.title,
  });

  final String message;
  final BOHBannerTone tone;

  /// Overrides the tone's icon.
  final IconData? icon;

  /// Bold first line (success banners use the title alone).
  final String? title;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final text = context.text;

    if (tone == BOHBannerTone.quote) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.s16),
        decoration: BoxDecoration(
          color: c.primaryTint,
          borderRadius: AppRadii.listCardAll,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const BOHGlyph(BOHGlyphType.quote, size: 26),
            const SizedBox(width: AppSpacing.s10),
            Expanded(
              child: Text(
                message,
                style: text.cardTitle.copyWith(
                  height: 23 / 15,
                  fontWeight: FontWeight.w600,
                  color: c.primaryText,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final (
      AppTone t,
      Widget glyph,
      double radius,
      bool dashed,
    ) = switch (tone) {
      BOHBannerTone.success => (
        c.statusSuccess,
        Icon(
          icon ?? AppIcons.success,
          size: 20,
          color: c.statusSuccess.foreground,
        ),
        AppRadii.medium,
        false,
      ),
      BOHBannerTone.warning => (
        c.statusWarning,
        icon != null
            ? Icon(icon, size: 20, color: c.statusWarning.foreground)
            : BOHGlyph(
                BOHGlyphType.star,
                size: 20,
                color: c.statusWarning.foreground,
              ),
        AppRadii.medium,
        false,
      ),
      BOHBannerTone.info => (
        c.statusInfo,
        Icon(
          icon ?? AppIcons.identity,
          size: 18,
          color: c.statusInfo.foreground,
        ),
        AppRadii.input,
        false,
      ),
      BOHBannerTone.privacy => (
        AppTone(c.primaryTint, c.textSecondary),
        Icon(icon ?? AppIcons.password, size: 18, color: c.primaryText),
        AppRadii.input,
        false,
      ),
      BOHBannerTone.dashed || BOHBannerTone.quote => (
        AppTone(AppColors.transparent, c.textSecondary),
        Icon(icon ?? AppIcons.info, size: 18, color: c.textSecondary),
        AppRadii.input,
        true,
      ),
    };

    final bold = tone == BOHBannerTone.success || tone == BOHBannerTone.warning;
    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null)
          Text(
            title!,
            style: text.label.copyWith(color: bold ? t.foreground : null),
          ),
        if (message.isNotEmpty)
          Text(
            message,
            style: (bold ? text.bodySmall : text.caption).copyWith(
              height: bold ? 17 / 12 : 16 / 11,
              color: t.foreground,
              fontWeight: tone == BOHBannerTone.info || bold
                  ? FontWeight.w600
                  : null,
            ),
          ),
      ],
    );

    final content = Padding(
      padding: EdgeInsets.symmetric(
        horizontal: bold ? AppSpacing.s14 : AppSpacing.s12,
        vertical: bold ? AppSpacing.s12 : AppSpacing.s10,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          glyph,
          const SizedBox(width: AppSpacing.s10),
          Expanded(child: body),
        ],
      ),
    );

    if (dashed) {
      return CustomPaint(
        painter: BOHDashedBorderPainter(color: c.borderStrong, radius: radius),
        child: content,
      );
    }
    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.background,
        borderRadius: BorderRadius.circular(radius),
      ),
      child: content,
    );
  }
}

/// Quiet inline notice — terms, caveats, hints. A dashed [BOHBanner].
class BOHInfoNote extends StatelessWidget {
  const BOHInfoNote(this.message, {super.key, this.icon = AppIcons.info});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) => BOHBanner(message, icon: icon);
}

/// Attention card — "Changes requested on 'Stage Manager'… Edit listing".
class BOHAlertCard extends StatelessWidget {
  const BOHAlertCard({
    super.key,
    required this.title,
    required this.message,
    this.action,
  });

  final String title;
  final String message;

  /// Usually a warning-coloured `BOHLinkButton`.
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s14),
      decoration: BoxDecoration(
        color: c.alertWarning,
        borderRadius: AppRadii.listCardAll,
        border: Border.all(color: c.alertWarningBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(AppIcons.error, size: 22, color: c.statusWarning.foreground),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: context.text.label),
                const SizedBox(height: 2),
                Text(
                  message,
                  style: context.text.bodySmall.copyWith(height: 17 / 12),
                ),
                ?action,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Dashed rounded outline — dashed notes, ticket tear lines, code boxes.
class BOHDashedBorderPainter extends CustomPainter {
  const BOHDashedBorderPainter({
    required this.color,
    this.radius = AppRadii.input,
    this.strokeWidth = 1,
    this.dash = 4,
    this.gap = 3,
  });

  final Color color;
  final double radius;
  final double strokeWidth;
  final double dash;
  final double gap;

  @override
  void paint(Canvas canvas, Size size) {
    final inset = strokeWidth / 2;
    final path = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            inset,
            inset,
            size.width - strokeWidth,
            size.height - strokeWidth,
          ),
          Radius.circular(radius),
        ),
      );
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    for (final metric in path.computeMetrics()) {
      var d = 0.0;
      while (d < metric.length) {
        canvas.drawPath(metric.extractPath(d, d + dash), paint);
        d += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(BOHDashedBorderPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}
