import 'package:flutter/material.dart';

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

/// Circular portrait with an initials fallback on a lavender disc.
///
/// [verified] adds the gold badge — one of the few sanctioned uses of gold.
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
    final d = size.dimension;
    final initialsStyle =
        (d >= BOHAvatarSize.large.dimension
                ? AppTypography.h2
                : AppTypography.label)
            .copyWith(color: c.primaryText, fontWeight: FontWeight.w600);

    Widget avatar = Container(
      width: d,
      height: d,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: c.primaryTint,
        border: c.isDark ? Border.all(color: c.border) : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: image == null
          ? Center(child: Text(initialsOf(name), style: initialsStyle))
          : BOHImage(image: image),
    );

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
      final badge = (d * 0.34).clamp(14.0, 28.0);
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          PositionedDirectional(
            end: -2,
            bottom: -2,
            child: Container(
              width: badge,
              height: badge,
              decoration: BoxDecoration(
                color: c.surface,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(AppIcons.verified, size: badge * 0.8, color: c.gold),
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
