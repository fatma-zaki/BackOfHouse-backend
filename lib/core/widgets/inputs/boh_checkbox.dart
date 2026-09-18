import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// Square check with an inline label. The box and a plain-text label are
/// both 44pt touch targets.
///
/// Pass [label] as plain text, or [labelWidget] for rich text with links
/// (links inside keep their own gestures).
class BOHCheckbox extends StatelessWidget {
  const BOHCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    this.label,
    this.labelWidget,
  }) : assert(label != null || labelWidget != null, 'Provide a label');

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? label;
  final Widget? labelWidget;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onChanged != null;
    void toggle() => onChanged!(!value);

    final box = AnimatedContainer(
      duration: AppMotion.fast,
      curve: AppMotion.standard,
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: value ? c.primary : c.surface,
        borderRadius: const BorderRadius.all(Radius.circular(5)),
        border: Border.all(
          color: !enabled
              ? c.borderSoft
              : value
              ? c.primary
              : c.textDisabled,
          width: 1.5,
        ),
      ),
      child: value ? Icon(AppIcons.check, size: 14, color: c.onPrimary) : null,
    );

    final text =
        labelWidget ??
        Text(
          label!,
          style: context.text.body.copyWith(
            color: enabled ? c.textSecondary : c.textDisabled,
          ),
        );

    return MergeSemantics(
      child: Semantics(
        checked: value,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            BOHPressable(
              onTap: enabled ? toggle : null,
              isButton: false,
              scaleOnPress: false,
              child: SizedBox.square(
                dimension: AppSizes.minTouchTarget,
                child: Center(child: box),
              ),
            ),
            Flexible(
              child: labelWidget != null
                  ? text
                  : BOHPressable(
                      onTap: enabled ? toggle : null,
                      isButton: false,
                      scaleOnPress: false,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: AppSizes.minTouchTarget,
                        ),
                        child: Align(
                          alignment: AlignmentDirectional.centerStart,
                          widthFactor: 1,
                          child: text,
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
