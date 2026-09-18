import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../brand/boh_logo.dart';
import '../motion/boh_pressable.dart';
import '../typography/boh_eyebrow.dart';
import 'boh_nav_item.dart';

/// The destinations of a shell as a slide-in panel: brand block, then one row
/// per destination, read top to bottom. It opens from the start edge, so it
/// arrives from the right in Arabic.
///
/// The active row is marked by a purple rail, a tinted tile, a heavier label
/// and colour — never colour alone. Choosing a row closes the panel first, so
/// the destination arrives on a clean screen.
class BOHNavDrawer extends StatelessWidget {
  const BOHNavDrawer({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onSelected,
    this.footer,
  }) : assert(items.length >= 2, 'Use two or more destinations');

  final List<BOHNavItem> items;
  final int currentIndex;
  final ValueChanged<int> onSelected;

  /// Optional block under the destinations (a version line, a sign-out row).
  final Widget? footer;

  /// Widest the panel gets; on narrow screens a strip of the page stays
  /// visible, so the way back is never in doubt.
  static const double maxWidth = 300;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final width = math.min(maxWidth, MediaQuery.sizeOf(context).width * 0.84);

    return Drawer(
      width: width,
      backgroundColor: c.isDark ? c.backgroundSecondary : c.surface,
      elevation: 0,
      shadowColor: AppColors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadiusDirectional.horizontal(
          end: Radius.circular(AppRadii.hero),
        ),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(boxShadow: AppShadows.raised(c)),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _Brand(),
              _Hairline(color: c.borderSoft),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s12,
                    vertical: AppSpacing.s16,
                  ),
                  children: [
                    Padding(
                      padding: const EdgeInsetsDirectional.only(
                        start: AppSpacing.s12,
                        bottom: AppSpacing.s8,
                      ),
                      child: BOHEyebrow(context.l10n.navMenu),
                    ),
                    for (var i = 0; i < items.length; i++)
                      _Destination(
                        item: items[i],
                        active: i == currentIndex,
                        onTap: () {
                          Scaffold.maybeOf(context)?.closeDrawer();
                          onSelected(i);
                        },
                      ),
                  ],
                ),
              ),
              if (footer != null) ...[
                _Hairline(color: c.borderSoft),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.s16),
                  child: footer,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Hairline extends StatelessWidget {
  const _Hairline({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) =>
      Container(height: AppSizes.hairline, color: color);
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const BOHLogo(size: 64),
          const SizedBox(height: AppSpacing.s12),
          Text(
            context.l10n.brandMotto,
            style: context.text.bodySmall,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _Destination extends StatelessWidget {
  const _Destination({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final BOHNavItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: BOHPressable(
        onTap: onTap,
        selected: active,
        semanticLabel: item.label,
        builder: (context, state) => AnimatedContainer(
          duration: context.reduceMotion ? Duration.zero : AppMotion.fast,
          curve: AppMotion.standard,
          constraints: const BoxConstraints(
            minHeight: AppSizes.minTouchTarget + AppSpacing.s8,
          ),
          padding: const EdgeInsetsDirectional.only(
            start: AppSpacing.s8,
            end: AppSpacing.s16,
            top: AppSpacing.s8,
            bottom: AppSpacing.s8,
          ),
          decoration: BoxDecoration(
            color: active
                ? c.primaryTint
                : state.pressed
                ? c.pressedOverlay
                : AppColors.transparent,
            borderRadius: AppRadii.mediumAll,
          ),
          child: Row(
            children: [
              // Position marks the active row as much as colour does; the
              // rail keeps its slot when inactive so nothing shifts.
              Container(
                width: 3,
                height: 22,
                decoration: BoxDecoration(
                  color: active ? c.primary : AppColors.transparent,
                  borderRadius: AppRadii.pillAll,
                ),
              ),
              const SizedBox(width: AppSpacing.s12),
              _IconWithBadge(
                item: item,
                color: active ? c.primaryText : c.textMuted,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.cardTitle.copyWith(
                    color: active ? c.primaryText : c.textSecondary,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IconWithBadge extends StatelessWidget {
  const _IconWithBadge({required this.item, required this.color});

  final BOHNavItem item;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(item.icon, size: AppSizes.iconLarge, color: color),
        if (item.showBadge)
          PositionedDirectional(
            top: 0,
            end: -1,
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: c.error,
                shape: BoxShape.circle,
                border: Border.all(color: c.surface, width: 1.5),
              ),
            ),
          ),
      ],
    );
  }
}

/// Puts the shell's [BOHNavDrawer] within reach of the screens inside it.
///
/// Tab screens build their own [Scaffold], so `Scaffold.of` would find that
/// one rather than the shell's. This scope hands them the shell's opener, and
/// its absence is what tells a screen it is not inside a shell.
class BOHNavDrawerScope extends InheritedWidget {
  const BOHNavDrawerScope({
    super.key,
    required this.openDrawer,
    required super.child,
  });

  final VoidCallback openDrawer;

  /// Null when the screen is not inside a navigation shell.
  static VoidCallback? maybeOf(BuildContext context) => context
      .dependOnInheritedWidgetOfExactType<BOHNavDrawerScope>()
      ?.openDrawer;

  @override
  bool updateShouldNotify(BOHNavDrawerScope oldWidget) =>
      openDrawer != oldWidget.openDrawer;
}
