import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../lists/boh_list_tile.dart';
import '../motion/boh_pressable.dart';

/// Directory entry tile — icon tile, title and a count line, with a faint
/// tinted corner ("Companies · 840+ verified agencies").
class BOHFeatureTile extends StatelessWidget {
  const BOHFeatureTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.tone = BOHIconCircleTone.brand,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final BOHIconCircleTone tone;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final glow = switch (tone) {
      BOHIconCircleTone.gold => c.heroAccent,
      BOHIconCircleTone.error => c.error,
      _ => c.primary,
    };

    return BOHPressable(
      onTap: onTap,
      semanticLabel: '$title, $subtitle',
      builder: (context, state) => AnimatedContainer(
        duration: AppMotion.fast,
        curve: AppMotion.standard,
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: AppRadii.mediumAll,
          border: Border.all(color: state.pressed ? c.border : c.borderSoft),
          boxShadow: state.pressed ? AppShadows.raised(c) : AppShadows.card(c),
          gradient: c.isDark
              ? null
              : RadialGradient(
                  center: AlignmentDirectional.topEnd.resolve(
                    Directionality.of(context),
                  ),
                  radius: 1.1,
                  colors: [glow.withValues(alpha: 0.07), AppColors.transparent],
                ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BOHIconCircle(icon: icon, tone: tone, rounded: true),
            const SizedBox(height: AppSpacing.s12),
            Text(
              title,
              style: context.text.cardTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: context.text.bodySmall.copyWith(color: c.textMuted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

/// "● Available for Q3/Q4" — a status dot that always carries its text.
class BOHStatusLabel extends StatelessWidget {
  const BOHStatusLabel({
    super.key,
    required this.label,
    required this.color,
    this.filled = false,
  });

  final String label;
  final Color color;

  /// Tinted pill background instead of plain text.
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: AppSpacing.s8),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: context.text.labelMedium.copyWith(
              color: context.colors.textPrimary,
            ),
          ),
        ),
      ],
    );
    if (!filled) return content;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s12,
        vertical: AppSpacing.s4 + 2,
      ),
      decoration: BoxDecoration(
        color: context.colors.surfaceElevated,
        borderRadius: AppRadii.pillAll,
      ),
      child: content,
    );
  }
}
