import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../lists/boh_list_tile.dart';
import '../media/boh_image.dart';
import '../motion/boh_pressable.dart';
import 'boh_card.dart';

/// Hero card with the photo on the inline-end side fading into the surface
/// — the featured event and the news lead. Content sits on the start side.
class BOHFadeImageCard extends StatelessWidget {
  const BOHFadeImageCard({
    super.key,
    required this.image,
    required this.child,
    this.height = 196,
    this.imageWidth = 190,
    this.fadeWidth = 100,
    this.contentWidth = 200,
    this.borderRadius = AppRadii.largeAll,
    this.accentBorder = true,
    this.overlay,
    this.onTap,
    this.semanticLabel,
  });

  final AppImage? image;
  final Widget child;
  final double height;
  final double imageWidth;
  final double fadeWidth;

  /// Max width of the text column.
  final double contentWidth;
  final BorderRadius borderRadius;
  final bool accentBorder;

  /// Positioned over the image at the bottom end (e.g. "Read more").
  final Widget? overlay;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final surface = c.surface;
    // The text keeps clear of the photo on narrow screens: it may run at
    // most a little into the fade.
    Widget frame(double textWidth) => Container(
      height: height,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: surface,
        borderRadius: borderRadius,
        border: Border.all(
          color: accentBorder ? c.borderAccent : c.border,
          width: accentBorder ? AppSizes.outline : AppSizes.hairline,
        ),
        boxShadow: AppShadows.card(c),
      ),
      child: Stack(
        children: [
          PositionedDirectional(
            top: 0,
            bottom: 0,
            end: 0,
            width: imageWidth,
            child: BOHImage(image: image),
          ),
          PositionedDirectional(
            top: 0,
            bottom: 0,
            end: imageWidth - fadeWidth,
            width: fadeWidth,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: AlignmentDirectional.centerStart.resolve(
                    Directionality.of(context),
                  ),
                  end: AlignmentDirectional.centerEnd.resolve(
                    Directionality.of(context),
                  ),
                  colors: [surface, surface.withValues(alpha: 0)],
                ),
              ),
            ),
          ),
          PositionedDirectional(
            start: AppSpacing.s16,
            top: AppSpacing.s14,
            bottom: AppSpacing.s14,
            width: textWidth,
            child: child,
          ),
          if (overlay != null)
            PositionedDirectional(end: 12, bottom: 12, child: overlay!),
        ],
      ),
    );
    final card = LayoutBuilder(
      builder: (context, constraints) =>
          frame(math.min(contentWidth, constraints.maxWidth - imageWidth + 24)),
    );
    if (onTap == null) return card;
    return BOHPressable(
      onTap: onTap,
      semanticLabel: semanticLabel,
      child: card,
    );
  }
}

/// Card with the image on top — reward catalog, portfolio, project tiles.
class BOHMediaTile extends StatelessWidget {
  const BOHMediaTile({
    super.key,
    required this.image,
    required this.child,
    this.imageHeight = 62,
    this.padding = const EdgeInsets.fromLTRB(12, 10, 12, 12),
    this.borderRadius = AppRadii.listCardAll,
    this.imageOverlay,
    this.onTap,
    this.semanticLabel,
  });

  final AppImage? image;
  final Widget child;
  final double imageHeight;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final Widget? imageOverlay;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return BOHCard(
      padding: EdgeInsets.zero,
      borderRadius: borderRadius,
      onTap: onTap,
      semanticLabel: semanticLabel,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: imageHeight,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: image),
                ?imageOverlay,
              ],
            ),
          ),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

/// Icon tile, title and subtitle with an optional trailing link — event
/// date, venue and organiser rows.
class BOHInfoRow extends StatelessWidget {
  const BOHInfoRow({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return MergeSemantics(
      child: Row(
        children: [
          BOHIconCircle(icon: icon, size: AppSizes.iconTile, rounded: true),
          const SizedBox(width: AppSpacing.s10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: context.text.label),
                if (subtitle != null)
                  Text(subtitle!, style: context.text.bodySmall),
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Label / value well set inside a card — "BUDGET  SAR 40K".
class BOHFieldTile extends StatelessWidget {
  const BOHFieldTile({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final arabic = context.isArabic;
    return MergeSemantics(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: c.surfaceElevated,
          borderRadius: AppRadii.smallAll,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              arabic ? label : label.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.eyebrow.copyWith(
                letterSpacing: arabic ? 0 : 1,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.label,
            ),
          ],
        ),
      ),
    );
  }
}

/// Event date block — "THU / 15 / OCT" on a soft violet tile.
class BOHDateBlock extends StatelessWidget {
  const BOHDateBlock({
    super.key,
    required this.day,
    required this.month,
    this.weekday,
  });

  final String day;
  final String month;
  final String? weekday;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final small = context.text.labelMedium.copyWith(
      fontSize: 9.5,
      height: 1.1,
      color: c.textSecondary,
    );
    return Container(
      width: 46,
      height: 60,
      decoration: BoxDecoration(
        color: c.primaryTint,
        borderRadius: AppRadii.smallAll,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (weekday != null) Text(weekday!, style: small),
          Text(day, style: context.text.number(19, color: c.primaryText)),
          Text(month, style: small),
        ],
      ),
    );
  }
}

/// One card holding rows separated by hairlines — settings, recent
/// applicants, points history.
class BOHGroupedList extends StatelessWidget {
  const BOHGroupedList({super.key, required this.children, this.flat = false});

  final List<Widget> children;

  /// No shadow (settings-style groups).
  final bool flat;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHCard(
      padding: EdgeInsets.zero,
      tone: flat ? BOHCardTone.flat : BOHCardTone.normal,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < children.length; i++)
            DecoratedBox(
              decoration: BoxDecoration(
                border: i == children.length - 1
                    ? null
                    : Border(bottom: BorderSide(color: c.border)),
              ),
              child: children[i],
            ),
        ],
      ),
    );
  }
}

/// A stat: label, big number and optional change. [highlight] fills it
/// violet — the one tile that matters most on the dashboard.
class BOHStatTile extends StatelessWidget {
  const BOHStatTile({
    super.key,
    required this.label,
    required this.value,
    this.delta,
    this.highlight = false,
    this.onTap,
  });

  final String label;
  final String value;
  final String? delta;
  final bool highlight;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final soft = highlight
        ? c.onPrimary.withValues(alpha: 0.85)
        : c.textSecondary;
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: context.text.caption.copyWith(
            fontWeight: FontWeight.w700,
            color: soft,
          ),
        ),
        const SizedBox(height: AppSpacing.s6),
        Text(
          value,
          style: context.text.number(
            26,
            lineHeight: 30,
            color: highlight ? c.onPrimary : c.textPrimary,
          ),
        ),
        if (delta != null) ...[
          const SizedBox(height: AppSpacing.s4),
          Text(
            delta!,
            style: context.text.caption.copyWith(
              fontWeight: FontWeight.w700,
              color: soft,
            ),
          ),
        ],
      ],
    );
    final semantics = [label, value, ?delta].join(', ');
    if (!highlight) {
      return BOHCard(
        borderRadius: AppRadii.listCardAll,
        onTap: onTap,
        semanticLabel: semantics,
        child: content,
      );
    }
    final tile = Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: c.primary,
        borderRadius: AppRadii.listCardAll,
        boxShadow: AppShadows.violet(c, blur: 24),
      ),
      child: content,
    );
    return BOHPressable(onTap: onTap, semanticLabel: semantics, child: tile);
  }
}

/// A row of stats divided by hairlines — profile counts, points totals.
/// [violet] renders the filled hero version.
class BOHStatStrip extends StatelessWidget {
  const BOHStatStrip({super.key, required this.items, this.violet = false});

  final List<(String value, String label)> items;
  final bool violet;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final divider = violet ? c.onPrimary.withValues(alpha: 0.25) : c.border;
    final row = IntrinsicHeight(
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++)
            Expanded(
              child: MergeSemantics(
                child: Container(
                  decoration: BoxDecoration(
                    border: i == 0
                        ? null
                        : BorderDirectional(start: BorderSide(color: divider)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        items[i].$1,
                        style: context.text.number(
                          violet ? 20 : 19,
                          lineHeight: 24,
                          color: violet ? c.onPrimary : c.primaryText,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        items[i].$2,
                        textAlign: TextAlign.center,
                        style: context.text.caption.copyWith(
                          fontSize: violet ? 10.5 : 10,
                          height: 13 / 10,
                          color: violet
                              ? c.onPrimary.withValues(alpha: 0.85)
                              : c.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
    final padding = EdgeInsets.symmetric(
      vertical: violet ? AppSpacing.s14 : AppSpacing.s12,
      horizontal: AppSpacing.s4,
    );
    if (!violet) {
      return BOHCard(padding: padding, child: row);
    }
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: c.primary,
        borderRadius: AppRadii.largeAll,
        boxShadow: AppShadows.violet(c, blur: 30, dy: 12),
      ),
      child: row,
    );
  }
}

/// Solid "done" badge set on photos — "Redeemed". Same in both modes.
class BOHPhotoBadge extends StatelessWidget {
  const BOHPhotoBadge({super.key, required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        // The deep green reads on any photo, in either mode.
        color: AppColors.light.statusSuccess.foreground,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.onPhoto),
          const SizedBox(width: AppSpacing.s4),
          Text(
            label,
            style: context.text.badge.copyWith(
              fontSize: 11,
              color: AppColors.onPhoto,
            ),
          ),
        ],
      ),
    );
  }
}
