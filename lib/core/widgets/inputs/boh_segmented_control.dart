import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// Equal-width pill segments — "All · Earned · Redeemed".
class BOHSegmentedControl<T> extends StatelessWidget {
  const BOHSegmentedControl({
    super.key,
    required this.segments,
    required this.selected,
    required this.onChanged,
  });

  final List<(T value, String label)> segments;
  final T selected;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    // Stitch segmented control: soft track, white selected segment.
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s4),
      decoration: BoxDecoration(
        color: c.surfaceElevated,
        borderRadius: AppRadii.mediumAll,
      ),
      child: Row(
        children: [
          for (var i = 0; i < segments.length; i++)
            Expanded(
              child: Semantics(
                inMutuallyExclusiveGroup: true,
                child: BOHPressable(
                  selected: segments[i].$1 == selected,
                  semanticLabel: segments[i].$2,
                  scaleOnPress: false,
                  onTap: () => onChanged(segments[i].$1),
                  builder: (context, state) {
                    final active = segments[i].$1 == selected;
                    return AnimatedContainer(
                      duration: AppMotion.fast,
                      curve: AppMotion.standard,
                      height: AppSizes.minTouchTarget,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s4,
                      ),
                      decoration: BoxDecoration(
                        color: active ? c.surface : AppColors.transparent,
                        borderRadius: AppRadii.smallAll,
                        boxShadow: active ? AppShadows.card(c) : null,
                      ),
                      child: Text(
                        segments[i].$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.label.copyWith(
                          color: active ? c.primaryText : c.textSecondary,
                          fontWeight: active
                              ? FontWeight.w600
                              : FontWeight.w500,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}
