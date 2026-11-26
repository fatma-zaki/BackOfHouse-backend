import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../motion/boh_pressable.dart';
import 'boh_image.dart';

enum BOHAvatarSize {
  small(32),
  medium(44),
  large(64),
  xlarge(96);

  const BOHAvatarSize(this.dimension);
  final double dimension;
}

/// Circular portrait with an initials fallback on a coloured disc (white
/// initials; the ground is picked from the name, so it is stable).
///
/// [ring] adds the design's violet ring separated by a ground-coloured gap;
/// [verified] adds the small violet check badge.
class BOHAvatar extends StatelessWidget {
  const BOHAvatar({
    super.key,
    required this.name,
    this.image,
    this.size = BOHAvatarSize.medium,
    this.verified = false,
    this.statusColor,
    this.onTap,
    this.semanticLabel,
    this.dimension,
    this.ring = false,
    this.ringGap,
    this.badge,
  });

  /// Used for initials and as the default semantic label.
  final String name;
  final AppImage? image;
  final BOHAvatarSize size;
  final bool verified;

  /// Presence dot at the bottom edge (e.g. available). Decorative: pair it
  /// with a text status elsewhere.
  final Color? statusColor;
  final VoidCallback? onTap;
  final String? semanticLabel;

  /// Exact diameter, overriding [size] (the design uses 34–76).
  final double? dimension;

  /// Violet ring around the photo.
  final bool ring;

  /// Colour of the gap between photo and ring; defaults to the page ground.
  final Color? ringGap;

  /// Small action badge at the bottom end, e.g. an "add" or camera button.
  final Widget? badge;

  /// First letters of the first and last name. The Arabic definite article
  /// "ال" is skipped ("فهد المطيري" → "فم", not "فا").
  @visibleForTesting
  static String initialsOf(String name) {
    final parts = name.trim().split(RegExp(r'\s+'))
      ..removeWhere((p) => p.isEmpty);
    if (parts.isEmpty) return '';

    String initial(String part) {
      final letters = part.startsWith('ال') && part.characters.length > 2
          ? part.characters.skip(2)
          : part.characters;
      return letters.first;
    }

    final first = initial(parts.first);
    if (parts.length == 1) return first.toUpperCase();
    return (first + initial(parts.last)).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final d = dimension ?? size.dimension;
    final initialsStyle = AppTypography.label.copyWith(
      fontSize: (d * 0.32).clamp(12.0, 26.0),
      height: 1,
      color: AppColors.onPhoto,
      fontWeight: FontWeight.w700,
    );
    const grounds = AppColors.avatarGrounds;
    final ground = grounds[name.hashCode.abs() % grounds.length];
    final gap = ring ? (d >= 70 ? 3.0 : 2.0) : 0.0;

    Widget avatar = Container(
      width: d,
      height: d,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: ground,
        border: ring
            ? Border.all(color: ringGap ?? c.background, width: gap)
            : null,
        boxShadow: ring ? [BoxShadow(color: c.primary, spreadRadius: 2)] : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: image == null
          ? Center(child: Text(initialsOf(name), style: initialsStyle))
          : ClipOval(child: BOHImage(image: image)),
    );

    if (badge != null) {
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          PositionedDirectional(end: -2, bottom: -2, child: badge!),
        ],
      );
    }

    if (statusColor != null && !verified) {
      final dot = (d * 0.28).clamp(10.0, 16.0);
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          PositionedDirectional(
            end: 0,
            bottom: 0,
            child: Container(
              width: dot,
              height: dot,
              decoration: BoxDecoration(
                color: statusColor,
                shape: BoxShape.circle,
                border: Border.all(color: c.surface, width: 2),
              ),
            ),
          ),
        ],
      );
    }

    if (verified) {
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          PositionedDirectional(
            end: -2,
            bottom: -2,
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                color: c.primary,
                shape: BoxShape.circle,
                border: Border.all(color: c.surface, width: 2),
              ),
              alignment: Alignment.center,
              child: Icon(AppIcons.check, size: 9, color: c.onPrimary),
            ),
          ),
        ],
      );
    }

    final label = semanticLabel ?? name;

    if (onTap == null) {
      return Semantics(
        image: true,
        label: label,
        excludeSemantics: true,
        child: avatar,
      );
    }

    // Keep the hit area at least 44×44 for small avatars.
    return BOHPressable(
      onTap: onTap,
      semanticLabel: label,
      child: SizedBox(
        width: d < 44 ? 44 : d,
        height: d < 44 ? 44 : d,
        child: Center(child: avatar),
      ),
    );
  }
}

/// Rounded-square company logo (or its initials) — lists 40–52, profile 76.
class BOHCompanyLogo extends StatelessWidget {
  const BOHCompanyLogo({
    super.key,
    required this.name,
    this.image,
    this.size = 44,
    this.borderColor,
  });

  final String name;
  final AppImage? image;
  final double size;

  /// Thick ground-coloured frame where the logo overlaps a cover photo.
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final radius = size >= 70 ? 20.0 : (size >= 50 ? 14.0 : 12.0);
    return Semantics(
      image: true,
      label: name,
      excludeSemantics: true,
      child: Container(
        width: size,
        height: size,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: image == null ? c.primaryTint : c.surface,
          borderRadius: BorderRadius.circular(radius),
          border: borderColor == null
              ? Border.all(color: c.border)
              : Border.all(color: borderColor!, width: 4),
        ),
        child: image == null
            ? Center(
                child: Text(
                  BOHAvatar.initialsOf(name),
                  style: AppTypography.label.copyWith(
                    fontSize: (size * 0.3).clamp(12.0, 24.0),
                    color: c.primaryText,
                  ),
                ),
              )
            : BOHImage(image: image),
      ),
    );
  }
}
