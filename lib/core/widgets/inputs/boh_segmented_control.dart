import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHSegmentedStyle {
  /// Full-width tabs on a soft violet track; the selected segment is a
  /// surface thumb with violet text ("Overview · Agenda · Venue").
  tabs,

  /// Compact thumb that sizes to its labels ("For you · Latest").
  compact,

  /// Compact, selected segment filled violet — settings choices
  /// (Appearance, Language, "I'm a").
  radio,

  /// Language switch set on a photo (Welcome).
  photo,
}

/// Pill segments. Only [BOHSegmentedStyle.tabs] fills the width.
class BOHSegmentedControl<T> extends StatelessWidget {
  const BOHSegmentedControl({
    super.key,
    required this.segments,
    required this.selected,
    required this.onChanged,
    this.style = BOHSegmentedStyle.tabs,
  });

  final List<(T value, String label)> segments;
  final T selected;
  final ValueChanged<T> onChanged;
  final BOHSegmentedStyle style;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final expand = style == BOHSegmentedStyle.tabs;
    final photo = style == BOHSegmentedStyle.photo;
    final trackPadding = expand ? AppSpacing.s4 : 3.0;
    final segmentHeight = switch (style) {
      BOHSegmentedStyle.tabs => 36.0,
      BOHSegmentedStyle.photo => 30.0,
      _ => 28.0,
    };

    Widget segment(int i) {
      final (value, label) = segments[i];
      final active = value == selected;
      return Semantics(
        inMutuallyExclusiveGroup: true,
        child: BOHPressable(
          selected: active,
          semanticLabel: label,
          scaleOnPress: false,
          onTap: () => onChanged(value),
          builder: (context, state) {
            final (
              Color fill,
              Color ink,
              List<BoxShadow>? shadow,
            ) = switch (style) {
              BOHSegmentedStyle.tabs || BOHSegmentedStyle.compact =>
                active
                    ? (c.surface, c.primaryText, AppShadows.thumb(c))
                    : (AppColors.transparent, c.textSecondary, null),
              BOHSegmentedStyle.radio =>
                active
                    ? (
                        c.primary,
                        c.onPrimary,
                        AppShadows.violet(c, blur: 12, dy: 4),
                      )
                    : (AppColors.transparent, c.textSecondary, null),
              BOHSegmentedStyle.photo =>
                active
                    ? (c.primary, AppColors.onPhoto, null)
                    : (AppColors.transparent, AppColors.onPhoto, null),
            };
            // Visual segment inside a 44 hit area.
            return ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: expand ? segmentHeight : AppSizes.minTouchTarget,
                minWidth: photo ? AppSizes.minTouchTarget : 0,
              ),
              child: Center(
                widthFactor: expand ? null : 1,
                heightFactor: 1,
                child: AnimatedContainer(
                  duration: AppMotion.fast,
                  curve: AppMotion.standard,
                  height: segmentHeight,
                  constraints: BoxConstraints(minWidth: photo ? 40 : 0),
                  alignment: Alignment.center,
                  padding: EdgeInsets.symmetric(
                    horizontal: expand ? AppSpacing.s4 : AppSpacing.s12,
                  ),
                  decoration: BoxDecoration(
                    color: fill,
                    borderRadius: AppRadii.pillAll,
                    boxShadow: shadow,
                  ),
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.labelMedium.copyWith(
                      fontSize: expand ? 13 : 12,
                      color: ink,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      );
    }

    final track = BoxDecoration(
      color: photo ? AppColors.photoInk.withValues(alpha: 0.55) : c.primaryTint,
      borderRadius: AppRadii.pillAll,
      border: photo
          ? Border.all(color: AppColors.onPhoto.withValues(alpha: 0.18))
          : null,
    );
    final row = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      children: [
        for (var i = 0; i < segments.length; i++)
          expand ? Expanded(child: segment(i)) : segment(i),
      ],
    );

    if (expand) {
      return Container(
        padding: EdgeInsets.all(trackPadding),
        decoration: track,
        child: row,
      );
    }

    // Compact tracks are drawn at the design's height behind a row of 44px
    // hit areas, so touch targets stay accessible without a taller track.
    final inset =
        (AppSizes.minTouchTarget - segmentHeight - 2 * trackPadding) / 2;
    return Stack(
      alignment: Alignment.center,
      children: [
        Positioned.fill(
          top: inset,
          bottom: inset,
          child: DecoratedBox(decoration: track),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: trackPadding),
          child: row,
        ),
      ],
    );
  }
}
