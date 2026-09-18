import 'package:flutter/material.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';
import 'boh_nav_item.dart';

/// Floating navigation bar. The active destination rises out of the bar
/// into a purple disc, and the notch beneath it glides to follow the
/// selection. Order and motion follow the reading direction.
///
/// The active tab is marked by position, the disc, a heavier label and
/// colour — never colour alone.
class BOHBottomNavigation extends StatelessWidget {
  const BOHBottomNavigation({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onSelected,
  }) : assert(items.length >= 2 && items.length <= 5, 'Use 2–5 destinations');

  final List<BOHNavItem> items;
  final int currentIndex;
  final ValueChanged<int> onSelected;

  static const double _barHeight = AppSizes.bottomNavHeight;
  static const double _discSize = 52;

  /// How far the disc rises above the bar's top edge.
  static const double _rise = 22;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final rtl = context.isRtl;

    return SafeArea(
      top: false,
      minimum: const EdgeInsets.only(bottom: AppSpacing.s12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
        child: SizedBox(
          height: _barHeight + _rise,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final slot = width / items.length;
              double centerOf(int index) {
                final x = (index + 0.5) * slot;
                return rtl ? width - x : x;
              }

              return TweenAnimationBuilder<double>(
                tween: Tween(end: centerOf(currentIndex)),
                duration: context.reduceMotion ? Duration.zero : AppMotion.base,
                curve: AppMotion.emphasized,
                builder: (context, x, _) => Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned.fill(
                      top: _rise,
                      child: CustomPaint(
                        painter: _NotchedBarPainter(
                          notchX: x,
                          notchCenterY: _discSize / 2 - _rise,
                          notchRadius: _discSize / 2 + 7,
                          fill: c.isDark ? c.backgroundSecondary : c.surface,
                          stroke: c.borderSoft,
                          shadow: AppShadows.floating(c).first.color,
                        ),
                        child: Semantics(
                          container: true,
                          explicitChildNodes: true,
                          child: Row(
                            children: [
                              for (var i = 0; i < items.length; i++)
                                Expanded(
                                  child: _Destination(
                                    item: items[i],
                                    active: i == currentIndex,
                                    onTap: () => onSelected(i),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 0,
                      left: x - _discSize / 2,
                      child: _ActiveDisc(
                        item: items[currentIndex],
                        onTap: () => onSelected(currentIndex),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
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
    final color = active ? c.primaryText : c.textMuted;

    return BOHPressable(
      onTap: onTap,
      selected: active,
      semanticLabel: item.label,
      child: Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 8),
        child: Column(
          children: [
            // The active icon lives in the raised disc; keep its slot so the
            // label does not jump.
            AnimatedOpacity(
              opacity: active ? 0 : 1,
              duration: AppMotion.fast,
              child: _IconWithBadge(item: item, color: color),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  item.label,
                  maxLines: 1,
                  style: AppTypography.caption.copyWith(
                    color: color,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActiveDisc extends StatelessWidget {
  const _ActiveDisc({required this.item, required this.onTap});

  final BOHNavItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return ExcludeSemantics(
      child: BOHPressable(
        onTap: onTap,
        isButton: false,
        child: Container(
          width: BOHBottomNavigation._discSize,
          height: BOHBottomNavigation._discSize,
          decoration: BoxDecoration(
            color: c.primary,
            shape: BoxShape.circle,
            boxShadow: AppShadows.accentGlow(c),
          ),
          alignment: Alignment.center,
          child: AnimatedSwitcher(
            duration: AppMotion.fast,
            child: Icon(
              item.icon,
              key: ValueKey(item.icon),
              size: AppSizes.iconLarge,
              color: c.onPrimary,
            ),
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

/// Rounded bar with a circular bite under the active disc, outlined with a
/// hairline that follows the notch.
class _NotchedBarPainter extends CustomPainter {
  const _NotchedBarPainter({
    required this.notchX,
    required this.notchCenterY,
    required this.notchRadius,
    required this.fill,
    required this.stroke,
    required this.shadow,
  });

  final double notchX;
  final double notchCenterY;
  final double notchRadius;
  final Color fill;
  final Color stroke;
  final Color shadow;

  @override
  void paint(Canvas canvas, Size size) {
    final bar = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          Offset.zero & size,
          const Radius.circular(AppRadii.large),
        ),
      );
    final notch = Path()
      ..addOval(
        Rect.fromCircle(
          center: Offset(notchX, notchCenterY),
          radius: notchRadius,
        ),
      );
    final shape = Path.combine(PathOperation.difference, bar, notch);

    canvas
      ..drawShadow(shape, shadow, 10, false)
      ..drawPath(shape, Paint()..color = fill)
      ..drawPath(
        shape,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = AppSizes.hairline
          ..color = stroke,
      );
  }

  @override
  bool shouldRepaint(_NotchedBarPainter oldDelegate) =>
      oldDelegate.notchX != notchX ||
      oldDelegate.fill != fill ||
      oldDelegate.stroke != stroke ||
      oldDelegate.shadow != shadow;
}
