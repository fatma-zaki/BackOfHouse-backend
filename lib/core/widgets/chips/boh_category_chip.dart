import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// Selectable category filter.
///
/// * With an [icon] it renders as a tile (icon over label).
/// * Without, it renders as a compact pill — filter rows ("All · Conferences").
///
/// Selection is signalled by fill *and* label weight, and exposed to
/// assistive tech as a selected state.
class BOHCategoryChip extends StatelessWidget {
  const BOHCategoryChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback? onSelected;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return BOHPressable(
      onTap: onSelected,
      selected: selected,
      semanticLabel: label,
      builder: (context, state) {
        final pill = icon == null;
        // Stitch pills sit on a soft grey fill; tiles are white cards.
        final background = selected
            ? c.primary
            : pill
            ? (state.pressed ? c.border : c.surfaceElevated)
            : (state.pressed ? c.surfaceElevated : c.surface);
        final foreground = selected ? c.onPrimary : c.textSecondary;
        final labelStyle = context.text.label.copyWith(
          color: foreground,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
        );

        final decoration = BoxDecoration(
          color: background,
          border: Border.all(
            color: selected
                ? c.primary
                : pill && !c.isDark
                ? c.surfaceElevated
                : c.border,
          ),
          borderRadius: icon == null ? AppRadii.pillAll : AppRadii.mediumAll,
          boxShadow: selected && c.isDark ? AppShadows.accentGlow(c) : null,
        );

        if (icon == null) {
          // 36px visual inside a 44px hit area.
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
            child: AnimatedContainer(
              duration: AppMotion.fast,
              curve: AppMotion.standard,
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
              decoration: decoration,
              child: Center(
                widthFactor: 1,
                child: Text(label, style: labelStyle, maxLines: 1),
              ),
            ),
          );
        }

        return AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.standard,
          constraints: const BoxConstraints(minWidth: 76, minHeight: 84),
          padding: const EdgeInsets.all(AppSpacing.s12),
          decoration: decoration,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: AppSizes.iconLarge, color: foreground),
              const SizedBox(height: AppSpacing.s8),
              Text(label, style: labelStyle, maxLines: 1),
            ],
          ),
        );
      },
    );
  }
}
