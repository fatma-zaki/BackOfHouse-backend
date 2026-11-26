import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHChipStyle {
  /// Selected = ink fill (Discover, Rewards, directories, listings).
  inverse,

  /// Selected = violet fill (News, Notifications).
  violet,
}

/// Selectable filter.
///
/// * Without an [icon]: a 34px pill in a filter row ("All · Conferences"),
///   optionally with a [count] badge.
/// * With an [icon]: a tile (icon over label) — Discover categories and the
///   listing-type picker; selected tiles fill violet.
///
/// Selection is signalled by fill *and* weight, and exposed to assistive
/// tech as a selected state.
class BOHCategoryChip extends StatelessWidget {
  const BOHCategoryChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.icon,
    this.style = BOHChipStyle.inverse,
    this.count,
    this.large = false,
    this.expandTile = false,
  });

  final String label;
  final bool selected;
  final VoidCallback? onSelected;
  final IconData? icon;
  final BOHChipStyle style;

  /// Unread or item count shown in a small badge after the label.
  final int? count;

  /// 36px pill (Discover tab row, News topics).
  final bool large;

  /// Tiles fill their cell (grid pickers) instead of the 74×72 default.
  final bool expandTile;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return BOHPressable(
      onTap: onSelected,
      selected: selected,
      semanticLabel: count == null ? label : '$label, $count',
      builder: (context, state) =>
          icon == null ? _pill(context, c, state) : _tile(context, c, state),
    );
  }

  Widget _pill(BuildContext context, AppColors c, BOHPressState state) {
    final violet = style == BOHChipStyle.violet;
    final background = selected
        ? (violet ? c.primary : c.inverse)
        : (state.pressed ? c.primaryWash : c.surface);
    final foreground = selected
        ? (violet ? c.onPrimary : c.onInverse)
        : c.textPrimary;

    // 34/36px visual inside a 44px hit area.
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: AppSizes.minTouchTarget),
      child: Center(
        widthFactor: 1,
        heightFactor: 1,
        child: AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.standard,
          height: large ? 36 : AppSizes.chipHeight,
          padding: EdgeInsets.symmetric(
            horizontal: large ? AppSpacing.s16 : AppSpacing.s14,
          ),
          decoration: BoxDecoration(
            color: background,
            borderRadius: AppRadii.pillAll,
            border: Border.all(color: selected ? background : c.border),
            boxShadow: selected && violet && large
                ? AppShadows.violet(c, strength: 0.3, blur: 16, dy: 6)
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                maxLines: 1,
                style: context.text.labelMedium.copyWith(
                  fontSize: large ? 13 : 12,
                  color: foreground,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                ),
              ),
              if (count != null && count! > 0) ...[
                const SizedBox(width: AppSpacing.s6),
                Container(
                  constraints: const BoxConstraints(minWidth: 18),
                  height: 18,
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected ? c.surface : c.primaryTint,
                    borderRadius: AppRadii.pillAll,
                  ),
                  child: Text(
                    '$count',
                    style: context.text.badge.copyWith(
                      fontSize: 10,
                      color: c.primaryText,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _tile(BuildContext context, AppColors c, BOHPressState state) {
    final foreground = selected ? c.onPrimary : c.textPrimary;
    return AnimatedContainer(
      duration: AppMotion.fast,
      curve: AppMotion.standard,
      width: expandTile ? null : 74,
      height: expandTile ? 64 : 72,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2),
      decoration: BoxDecoration(
        color: selected
            ? c.primary
            : (state.pressed ? c.primaryWash : c.surface),
        borderRadius: AppRadii.mediumAll,
        border: Border.all(
          color: selected ? c.primary : c.border,
          width: expandTile ? AppSizes.outline : AppSizes.hairline,
        ),
        boxShadow: selected ? AppShadows.accentGlow(c) : null,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: expandTile ? 20 : 22, color: foreground),
          SizedBox(height: expandTile ? 5 : AppSpacing.s6),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: context.text.labelMedium.copyWith(
              fontSize: 11,
              color: foreground,
            ),
          ),
        ],
      ),
    );
  }
}

/// Multi-select chip — interests on Edit profile.
class BOHSelectChip extends StatelessWidget {
  const BOHSelectChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onChanged,
  });

  final String label;
  final bool selected;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHPressable(
      onTap: onChanged == null ? null : () => onChanged!(!selected),
      selected: selected,
      semanticLabel: label,
      builder: (context, state) => ConstrainedBox(
        constraints: const BoxConstraints(minHeight: AppSizes.minTouchTarget),
        child: Center(
          widthFactor: 1,
          heightFactor: 1,
          child: AnimatedContainer(
            duration: AppMotion.fast,
            height: 32,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s14),
            decoration: BoxDecoration(
              color: selected ? c.primaryTint : c.surface,
              borderRadius: AppRadii.pillAll,
              border: Border.all(color: selected ? c.primary : c.border),
            ),
            child: Center(
              widthFactor: 1,
              child: Text(
                label,
                style: context.text.labelMedium.copyWith(
                  color: selected ? c.primaryText : c.textPrimary,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Active filter with a remove affordance — search results.
class BOHRemovableChip extends StatelessWidget {
  const BOHRemovableChip({
    super.key,
    required this.label,
    required this.onRemove,
    required this.removeLabel,
  });

  final String label;
  final VoidCallback onRemove;

  /// Screen-reader label, e.g. "Remove filter Riyadh".
  final String removeLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHPressable(
      onTap: onRemove,
      semanticLabel: removeLabel,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: AppSizes.minTouchTarget),
        child: Center(
          widthFactor: 1,
          heightFactor: 1,
          child: Container(
            height: 32,
            padding: const EdgeInsetsDirectional.only(start: 14, end: 12),
            decoration: BoxDecoration(
              color: c.primary,
              borderRadius: AppRadii.pillAll,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: context.text.labelMedium.copyWith(color: c.onPrimary),
                ),
                const SizedBox(width: AppSpacing.s6),
                Icon(AppIcons.close, size: 12, color: c.onPrimary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A horizontally scrolling row of single-select filter chips — the filter
/// strip under a search field or header. Use a nullable [T] with `null`
/// first in [options] for "All".
class BOHFilterChips<T> extends StatelessWidget {
  const BOHFilterChips({
    super.key,
    required this.options,
    required this.selected,
    required this.label,
    required this.onSelected,
    this.count,
    this.icon,
    this.style = BOHChipStyle.inverse,
    this.large = false,
    this.padding = const EdgeInsetsDirectional.symmetric(
      horizontal: AppSpacing.screenHorizontal,
      vertical: AppSpacing.s6,
    ),
    this.semanticLabel,
  });

  final List<T> options;
  final T selected;
  final String Function(T option) label;
  final ValueChanged<T> onSelected;

  /// Badge count per option, or `null` for none.
  final int? Function(T option)? count;
  final IconData? Function(T option)? icon;
  final BOHChipStyle style;
  final bool large;
  final EdgeInsetsGeometry padding;

  /// Names the group for screen readers ("Sections", "Filter").
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final row = SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: padding,
      child: Row(
        children: [
          for (final (i, option) in options.indexed) ...[
            if (i > 0) const SizedBox(width: AppSpacing.s8),
            BOHCategoryChip(
              label: label(option),
              icon: icon?.call(option),
              count: count?.call(option),
              style: style,
              large: large,
              selected: option == selected,
              onSelected: () => onSelected(option),
            ),
          ],
        ],
      ),
    );
    return semanticLabel == null
        ? row
        : Semantics(label: semanticLabel, container: true, child: row);
  }
}
