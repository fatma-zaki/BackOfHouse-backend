import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../feedback/boh_shimmer.dart';
import '../media/boh_image.dart';
import '../motion/boh_pressable.dart';

enum BOHImageCardLayout {
  /// Thumbnail beside text — news rows, search results.
  horizontal,

  /// Image above text — grids of courses, companies, events.
  vertical,

  /// Text set over full-bleed photography — featured events.
  overlay,
}

/// Content card built around photography. Content-agnostic: news, courses,
/// companies and events all compose it with their own tag and metadata.
class BOHImageCard extends StatelessWidget {
  const BOHImageCard({
    super.key,
    required this.image,
    required this.title,
    this.description,
    this.tag,
    this.metadata = const [],
    this.metadataIcon = AppIcons.clock,
    this.layout = BOHImageCardLayout.horizontal,
    this.onTap,
    this.showArrow = true,
  });

  final AppImage? image;
  final String title;
  final String? description;

  /// Usually a `BOHTag`.
  final Widget? tag;

  /// Short facts joined with a dot — "2h ago · 5 min read".
  final List<String> metadata;
  final IconData? metadataIcon;
  final BOHImageCardLayout layout;
  final VoidCallback? onTap;

  /// The trailing chevron (horizontal layout only).
  final bool showArrow;

  @override
  Widget build(BuildContext context) {
    final semantic = [title, ?description, ...metadata].join('. ');

    return BOHPressable(
      onTap: onTap,
      semanticLabel: semantic,
      builder: (context, state) => switch (layout) {
        BOHImageCardLayout.horizontal => _horizontal(context, state.pressed),
        BOHImageCardLayout.vertical => _vertical(context, state.pressed),
        BOHImageCardLayout.overlay => _overlay(context),
      },
    );
  }

  BoxDecoration _surface(AppColors c, bool pressed) => BoxDecoration(
    color: pressed ? c.surfaceElevated : c.surface,
    borderRadius: AppRadii.mediumAll,
    border: Border.all(color: pressed ? c.border : c.borderSoft),
    boxShadow: AppShadows.card(c),
  );

  Widget _horizontal(BuildContext context, bool pressed) {
    final c = context.colors;
    return Container(
      decoration: _surface(c, pressed),
      clipBehavior: Clip.antiAlias,
      padding: const EdgeInsets.all(AppSpacing.s12),
      child: Row(
        children: [
          // Fixed frame: keeps list rows even and lets the image decode at a
          // known size. Text may grow past it at large text scales.
          BOHImage(
            image: image,
            width: 112,
            height: 104,
            borderRadius: AppRadii.smallAll,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: _Text(
              tag: tag,
              title: title,
              description: description,
              metadata: metadata,
              metadataIcon: metadataIcon,
            ),
          ),
          if (showArrow && onTap != null)
            Padding(
              padding: const EdgeInsetsDirectional.only(start: AppSpacing.s8),
              child: Icon(
                AppIcons.chevronForward,
                size: AppSizes.iconMedium,
                color: c.textMuted,
              ),
            ),
        ],
      ),
    );
  }

  Widget _vertical(BuildContext context, bool pressed) {
    return Container(
      decoration: _surface(context.colors, pressed),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              BOHImage(image: image, aspectRatio: 16 / 10),
              if (tag != null)
                PositionedDirectional(
                  top: AppSpacing.s12,
                  start: AppSpacing.s12,
                  child: tag!,
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: _Text(
              title: title,
              description: description,
              metadata: metadata,
              metadataIcon: metadataIcon,
            ),
          ),
        ],
      ),
    );
  }

  Widget _overlay(BuildContext context) {
    return ClipRRect(
      borderRadius: AppRadii.largeAll,
      child: AspectRatio(
        aspectRatio: 4 / 5,
        child: Stack(
          fit: StackFit.expand,
          children: [
            BOHImage(image: image, scrim: BOHImageScrim.bottom),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.s20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ?tag,
                  const Spacer(),
                  // Photography is always dark under the scrim, so the text
                  // is always light — in either theme mode.
                  _Text(
                    title: title,
                    titleStyle: AppTypography.h2.copyWith(
                      color: AppColors.onPhoto,
                    ),
                    bodyColor: AppColors.onPhoto.withValues(alpha: 0.85),
                    description: description,
                    metadata: metadata,
                    metadataIcon: metadataIcon,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Loading placeholder matching a [BOHImageCard] layout. Wrap a list of
/// these in one [BOHShimmer].
class BOHImageCardSkeleton extends StatelessWidget {
  const BOHImageCardSkeleton({
    super.key,
    this.layout = BOHImageCardLayout.horizontal,
  });

  final BOHImageCardLayout layout;

  @override
  Widget build(BuildContext context) {
    const lines = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        BOHSkeleton.line(width: 64, height: 16),
        SizedBox(height: AppSpacing.s12),
        BOHSkeleton.line(height: 14),
        SizedBox(height: AppSpacing.s8),
        BOHSkeleton.line(width: 140, height: 14),
        SizedBox(height: AppSpacing.s12),
        BOHSkeleton.line(width: 96, height: 10),
      ],
    );

    return Container(
      decoration: BoxDecoration(
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: context.colors.borderSoft),
      ),
      padding: const EdgeInsets.all(AppSpacing.s12),
      child: layout == BOHImageCardLayout.horizontal
          ? const Row(
              children: [
                BOHSkeleton(width: 112, height: 104),
                SizedBox(width: AppSpacing.s12),
                Expanded(child: lines),
              ],
            )
          : const Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AspectRatio(aspectRatio: 16 / 10, child: BOHSkeleton()),
                Padding(padding: EdgeInsets.all(AppSpacing.s8), child: lines),
              ],
            ),
    );
  }
}

class _Text extends StatelessWidget {
  const _Text({
    required this.title,
    required this.description,
    required this.metadata,
    required this.metadataIcon,
    this.tag,
    this.titleStyle,
    this.bodyColor,
  });

  final Widget? tag;
  final String title;
  final TextStyle? titleStyle;
  final Color? bodyColor;
  final String? description;
  final List<String> metadata;
  final IconData? metadataIcon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (tag != null) ...[tag!, const SizedBox(height: AppSpacing.s8)],
        Text(
          title,
          style: titleStyle ?? context.text.cardTitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        if (description != null) ...[
          const SizedBox(height: AppSpacing.s4),
          Text(
            description!,
            style: context.text.bodySmall.copyWith(
              color: bodyColor ?? c.textSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        if (metadata.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s8),
          BOHMetaRow(items: metadata, icon: metadataIcon, color: bodyColor),
        ],
      ],
    );
  }
}

/// "◷ 2h ago · 5 min read"
class BOHMetaRow extends StatelessWidget {
  const BOHMetaRow({super.key, required this.items, this.icon, this.color});

  final List<String> items;
  final IconData? icon;

  /// Defaults to the muted ink.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final ink = color ?? context.colors.textMuted;
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 14, color: ink),
          const SizedBox(width: AppSpacing.s8),
        ],
        Flexible(
          child: Text(
            items.join('  ·  '),
            style: context.text.caption.copyWith(color: ink),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
