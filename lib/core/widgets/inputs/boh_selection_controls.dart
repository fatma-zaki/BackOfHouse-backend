import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../lists/boh_list_tile.dart';
import '../media/boh_image.dart';
import '../motion/boh_pressable.dart';

/// On/off switch: 48×28 pill, white thumb; violet track when on.
class BOHSwitch extends StatelessWidget {
  const BOHSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    this.semanticLabel,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onChanged != null;
    return Semantics(
      toggled: value,
      label: semanticLabel,
      child: BOHPressable(
        onTap: enabled ? () => onChanged!(!value) : null,
        isButton: false,
        scaleOnPress: false,
        child: SizedBox(
          width: 52,
          height: AppSizes.minTouchTarget,
          child: Center(
            child: AnimatedContainer(
              duration: context.reduceMotion ? Duration.zero : AppMotion.fast,
              curve: AppMotion.standard,
              width: 48,
              height: 28,
              padding: const EdgeInsets.all(3),
              alignment: value
                  ? AlignmentDirectional.centerEnd
                  : AlignmentDirectional.centerStart,
              decoration: BoxDecoration(
                color: !enabled
                    ? c.border
                    : value
                    ? c.primary
                    : c.switchTrackOff,
                borderRadius: AppRadii.pillAll,
              ),
              child: Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  color: AppColors.onPhoto,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x40000000),
                      blurRadius: 3,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Label with a trailing [BOHSwitch] — privacy and settings rows.
class BOHToggleRow extends StatelessWidget {
  const BOHToggleRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.showDivider = true,
  });

  final String label;
  final bool value;
  final ValueChanged<bool>? onChanged;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return MergeSemantics(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s14),
        decoration: BoxDecoration(
          border: showDivider ? Border(top: BorderSide(color: c.border)) : null,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: context.text.body.copyWith(color: c.textPrimary),
              ),
            ),
            BOHSwitch(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }
}

/// Checkable card — "Add my portfolio projects". Border turns violet when
/// checked and a check box leads the text.
class BOHCheckCard extends StatelessWidget {
  const BOHCheckCard({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool>? onChanged;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      checked: value,
      child: BOHPressable(
        onTap: onChanged == null ? null : () => onChanged!(!value),
        isButton: false,
        semanticLabel: subtitle == null ? title : '$title, $subtitle',
        builder: (context, state) => AnimatedContainer(
          duration: AppMotion.fast,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s14,
            vertical: AppSpacing.s12,
          ),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: AppRadii.mediumAll,
            border: Border.all(
              color: value ? c.primary : c.border,
              width: AppSizes.outline,
            ),
          ),
          child: Row(
            children: [
              _CheckBox(checked: value),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: context.text.label),
                    if (subtitle != null)
                      Text(subtitle!, style: context.text.caption),
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
        ),
      ),
    );
  }
}

/// Soft violet banner with a check box — "I'm currently a student".
class BOHCheckBanner extends StatelessWidget {
  const BOHCheckBanner({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      checked: value,
      child: BOHPressable(
        onTap: onChanged == null ? null : () => onChanged!(!value),
        isButton: false,
        semanticLabel: subtitle == null ? title : '$title, $subtitle',
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s14,
            vertical: AppSpacing.s12,
          ),
          decoration: BoxDecoration(
            color: c.primaryTint,
            borderRadius: AppRadii.mediumAll,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CheckBox(checked: value),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: context.text.label),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: context.text.caption.copyWith(height: 15 / 11),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CheckBox extends StatelessWidget {
  const _CheckBox({required this.checked});

  final bool checked;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return AnimatedContainer(
      duration: AppMotion.fast,
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: checked ? c.primary : c.surface,
        borderRadius: BorderRadius.circular(5),
        border: Border.all(
          color: checked ? c.primary : c.borderStrong,
          width: AppSizes.outline,
        ),
      ),
      child: checked
          ? Icon(AppIcons.check, size: 14, color: c.onPrimary)
          : null,
    );
  }
}

/// Selectable option card with icon tile, title, description and a radio
/// dot — account type on sign-up.
class BOHRadioCard extends StatelessWidget {
  const BOHRadioCard({
    super.key,
    required this.icon,
    required this.title,
    required this.selected,
    required this.onTap,
    this.description,
  });

  final IconData icon;
  final String title;
  final String? description;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      inMutuallyExclusiveGroup: true,
      child: BOHPressable(
        onTap: onTap,
        selected: selected,
        semanticLabel: description == null ? title : '$title, $description',
        builder: (context, state) => AnimatedContainer(
          duration: AppMotion.fast,
          padding: const EdgeInsets.all(AppSpacing.s14),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: AppRadii.listCardAll,
            border: Border.all(
              color: selected ? c.primary : c.border,
              width: AppSizes.outline,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: c.violetShadow(0.18),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : null,
          ),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  BOHIconCircle(
                    icon: icon,
                    size: AppSizes.iconTile,
                    rounded: true,
                    tone: selected
                        ? BOHIconCircleTone.violet
                        : BOHIconCircleTone.brand,
                  ),
                  const SizedBox(height: AppSpacing.s10),
                  Text(title, style: context.text.itemTitle),
                  if (description != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      description!,
                      style: context.text.caption.copyWith(height: 15 / 11),
                    ),
                  ],
                ],
              ),
              PositionedDirectional(
                top: 0,
                end: 0,
                child: AnimatedContainer(
                  duration: AppMotion.fast,
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: c.surface,
                    border: Border.all(
                      color: selected ? c.primary : c.border,
                      width: selected ? 5 : AppSizes.outline,
                    ),
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

/// Image tile with a check badge — pick projects to attach.
class BOHSelectableMediaTile extends StatelessWidget {
  const BOHSelectableMediaTile({
    super.key,
    required this.label,
    required this.selected,
    required this.onChanged,
    this.image,
    this.imageHeight = 62,
  });

  final String label;
  final AppImage? image;
  final bool selected;
  final ValueChanged<bool>? onChanged;
  final double imageHeight;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      checked: selected,
      child: BOHPressable(
        onTap: onChanged == null ? null : () => onChanged!(!selected),
        isButton: false,
        semanticLabel: label,
        child: AnimatedContainer(
          duration: AppMotion.fast,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: AppRadii.mediumAll,
            border: Border.all(
              color: selected ? c.primary : c.border,
              width: 2,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                height: imageHeight,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    BOHImage(image: image),
                    PositionedDirectional(
                      top: 6,
                      end: 6,
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: selected
                              ? c.primary
                              : AppColors.photoInk.withValues(alpha: 0.35),
                        ),
                        child: selected
                            ? Icon(AppIcons.check, size: 11, color: c.onPrimary)
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                child: Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.labelMedium.copyWith(
                    fontSize: 11,
                    height: 14 / 11,
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

/// Field-styled button that opens a picker — selects and dates.
class BOHSelectField extends StatelessWidget {
  const BOHSelectField({
    super.key,
    required this.value,
    required this.onTap,
    this.label,
    this.placeholder,
    this.icon = AppIcons.chevronDown,
    this.errorText,
  });

  final String? label;
  final String? value;
  final String? placeholder;
  final VoidCallback? onTap;

  /// Trailing icon: chevron for selects, calendar for dates.
  final IconData icon;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final hasValue = value != null && value!.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(label!, style: context.text.labelMedium),
          const SizedBox(height: AppSpacing.s6),
        ],
        BOHPressable(
          onTap: onTap,
          semanticLabel: [label, value ?? placeholder].nonNulls.join(', '),
          scaleOnPress: false,
          child: Container(
            height: AppSizes.inputHeight,
            padding: const EdgeInsetsDirectional.only(start: 14, end: 12),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: AppRadii.inputAll,
              border: Border.all(
                color: errorText != null ? c.error : c.border,
                width: errorText != null ? AppSizes.outline : AppSizes.hairline,
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    hasValue ? value! : (placeholder ?? ''),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.bodyLarge.copyWith(
                      color: hasValue ? c.textPrimary : c.textMuted,
                    ),
                  ),
                ),
                Icon(icon, size: 16, color: c.textSecondary),
              ],
            ),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.s8),
            child: Row(
              children: [
                Icon(AppIcons.info, size: 16, color: c.error),
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: Text(
                    errorText!,
                    style: context.text.bodySmall.copyWith(color: c.error),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
