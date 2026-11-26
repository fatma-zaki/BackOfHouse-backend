import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';
import 'boh_nav_item.dart';

/// Bottom navigation: a surface bar with a rounded top edge. The active
/// destination sits in a soft violet pill with a violet icon and an
/// extra-bold violet label. Order follows the reading direction.
///
/// The active tab is marked by the pill, a heavier label and colour —
/// never colour alone.
class BOHBottomNavigation extends StatelessWidget {
  const BOHBottomNavigation({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onSelected,
    this.compactLabels = false,
  }) : assert(items.length >= 2 && items.length <= 5, 'Use 2–5 destinations');

  final List<BOHNavItem> items;
  final int currentIndex;
  final ValueChanged<int> onSelected;

  /// 10.5px labels (the company bar's longer names).
  final bool compactLabels;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final bottom = math.max(MediaQuery.paddingOf(context).bottom, 12.0);

    return Container(
      padding: EdgeInsets.fromLTRB(6, AppSpacing.s8, 6, bottom),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.sheetTop,
        border: Border(top: BorderSide(color: c.border)),
        boxShadow: AppShadows.nav(c),
      ),
      child: Semantics(
        container: true,
        explicitChildNodes: true,
        child: SizedBox(
          height: AppSizes.bottomNavHeight - AppSpacing.s8,
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: _NavButton(
                    item: items[i],
                    active: i == currentIndex,
                    compact: compactLabels,
                    onTap: () => onSelected(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({
    required this.item,
    required this.active,
    required this.compact,
    required this.onTap,
  });

  final BOHNavItem item;
  final bool active;
  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final iconColor = active
        ? (c.isDark ? c.primaryText : c.primary)
        : c.textSecondary;

    return BOHPressable(
      onTap: onTap,
      selected: active,
      semanticLabel: item.label,
      scaleOnPress: false,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: context.reduceMotion ? Duration.zero : AppMotion.fast,
            curve: AppMotion.standard,
            width: 52,
            height: 30,
            decoration: BoxDecoration(
              color: active ? c.primaryTint : AppColors.transparent,
              borderRadius: AppRadii.pillAll,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(item.icon, size: AppSizes.iconLarge, color: iconColor),
                if (item.showBadge)
                  PositionedDirectional(
                    top: 3,
                    end: 12,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: c.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: c.surface, width: 1.5),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 3),
          Text(
            item.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            // The bar has a fixed height; labels grow only a little.
            textScaler: MediaQuery.textScalerOf(context)
                .clamp(maxScaleFactor: 1.2),
            style: AppTypography.nav.copyWith(
              fontSize: compact ? 10.5 : 11,
              color: active ? c.primaryText : c.textSecondary,
              fontWeight: active ? FontWeight.w800 : FontWeight.w600,
              letterSpacing: 0,
            ),
          ),
        ],
      ),
    );
  }
}
