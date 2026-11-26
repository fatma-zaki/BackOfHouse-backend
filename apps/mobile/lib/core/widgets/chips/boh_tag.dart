import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';

enum BOHTagVariant {
  /// Violet category — conference, technical, full-time.
  accent,

  /// Green category — workshop, volunteering.
  green,

  /// Amber category — networking, market.
  amber,

  /// Blue category — exhibition, regulatory.
  blue,

  /// Solid violet — the one highlighted tag on a card or photo.
  solid,

  /// Soft violet — opportunity types, "Professional", "Profile Highlight".
  soft,

  /// Hairline outline, muted — "Not verified".
  outline,

  /// Amber "Highlighted" (a points reward — never trust or paid placement).
  highlight,

  /// Amber with a star. Rare; not for paid placement.
  gold,

  /// Verified company or credential: soft violet with a badge icon.
  verified,

  /// Soft neutral pill.
  neutral,

  success,
  warning,
  error,
}

/// Small non-interactive label: a 6px-radius tag, 9.5/800 tracked caps in
/// English, plain in Arabic. Status variants always carry an icon, so
/// meaning never depends on colour alone.
class BOHTag extends StatelessWidget {
  const BOHTag(
    this.label, {
    super.key,
    this.variant = BOHTagVariant.accent,
    this.icon,
    this.uppercase,
    this.large = false,
  });

  final String label;
  final BOHTagVariant variant;
  final IconData? icon;

  /// Editorial caps; defaults to on for category tags. Ignored for Arabic.
  final bool? uppercase;

  /// The 10px tag used on detail screens and photos.
  final bool large;

  static bool _capsByDefault(BOHTagVariant v) => switch (v) {
    BOHTagVariant.neutral ||
    BOHTagVariant.success ||
    BOHTagVariant.warning ||
    BOHTagVariant.error ||
    BOHTagVariant.verified ||
    BOHTagVariant.gold => false,
    _ => true,
  };

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    final (
      AppTone tone,
      Color? border,
      IconData? statusIcon,
    ) = switch (variant) {
      BOHTagVariant.accent => (c.tagViolet, null, null),
      BOHTagVariant.green => (c.tagGreen, null, null),
      BOHTagVariant.amber => (c.tagAmber, null, null),
      BOHTagVariant.blue => (c.tagBlue, null, null),
      BOHTagVariant.solid => (AppTone(c.primary, c.onPrimary), null, null),
      BOHTagVariant.soft => (AppTone(c.primaryTint, c.primaryText), null, null),
      BOHTagVariant.outline => (
        AppTone(AppColors.transparent, c.textSecondary),
        c.border,
        null,
      ),
      BOHTagVariant.highlight => (c.statusWarning, null, null),
      BOHTagVariant.gold => (c.statusWarning, null, AppIcons.star),
      BOHTagVariant.verified => (
        AppTone(c.primaryTint, c.primaryText),
        null,
        AppIcons.verified,
      ),
      BOHTagVariant.neutral => (c.statusNeutral, null, null),
      BOHTagVariant.success => (c.statusSuccess, null, AppIcons.success),
      BOHTagVariant.warning => (c.statusWarning, null, AppIcons.info),
      BOHTagVariant.error => (
        AppTone(c.error.withValues(alpha: 0.12), c.error),
        null,
        AppIcons.error,
      ),
    };

    final arabic = context.isArabic;
    final caps = (uppercase ?? _capsByDefault(variant)) && !arabic;
    final resolvedIcon = icon ?? statusIcon;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? AppSpacing.s8 : 7,
        vertical: border != null ? 1 : (large ? 3 : AppSpacing.s2),
      ),
      decoration: BoxDecoration(
        color: tone.background,
        borderRadius: AppRadii.tagAll,
        border: border == null ? null : Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (resolvedIcon != null) ...[
            Icon(resolvedIcon, size: 11, color: tone.foreground),
            const SizedBox(width: AppSpacing.s4),
          ],
          Flexible(
            child: Text(
              caps ? label.toUpperCase() : label,
              style: AppTypography.tag.copyWith(
                fontSize: large ? 10 : 9.5,
                color: tone.foreground,
                letterSpacing: caps ? 1 : 0,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

enum BOHStatusTone { success, warning, info, neutral, violet, error }

/// Status pill — "Live", "In review", "Changes requested", "Draft". The label
/// carries the meaning; [dot] adds the listing-style leading dot.
class BOHStatusBadge extends StatelessWidget {
  const BOHStatusBadge(
    this.label, {
    super.key,
    this.tone = BOHStatusTone.info,
    this.dot = false,
    this.icon,
  });

  final String label;
  final BOHStatusTone tone;
  final bool dot;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = switch (tone) {
      BOHStatusTone.success => c.statusSuccess,
      BOHStatusTone.warning => c.statusWarning,
      BOHStatusTone.info => c.statusInfo,
      BOHStatusTone.neutral => c.statusNeutral,
      BOHStatusTone.violet => c.statusViolet,
      BOHStatusTone.error => AppTone(c.error.withValues(alpha: 0.12), c.error),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: t.background,
        borderRadius: const BorderRadius.all(Radius.circular(12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: t.foreground,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 5),
          ] else if (icon != null) ...[
            Icon(icon, size: 12, color: t.foreground),
            const SizedBox(width: AppSpacing.s4),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.badge.copyWith(color: t.foreground),
            ),
          ),
        ],
      ),
    );
  }
}

/// Non-interactive detail chip — skills, services, applicant meta. Soft
/// violet, or a muted outline with an optional icon ("Contact private").
class BOHMetaChip extends StatelessWidget {
  const BOHMetaChip(
    this.label, {
    super.key,
    this.icon,
    this.outline = false,
    this.large = false,
  });

  final String label;
  final IconData? icon;
  final bool outline;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = outline ? c.textSecondary : c.primaryText;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? AppSpacing.s10 : 9,
        vertical: large ? 5 : 3,
      ),
      decoration: BoxDecoration(
        color: outline ? AppColors.transparent : c.primaryTint,
        borderRadius: BorderRadius.circular(large ? 14 : 12),
        border: outline ? Border.all(color: c.border) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: fg),
            const SizedBox(width: AppSpacing.s4),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.labelMedium.copyWith(
                fontSize: large ? 12 : 11,
                color: fg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
