import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../buttons/boh_icon_button.dart';

/// Form input with an optional label above. Draws its own resting /
/// focused / error / disabled states and renders validation errors with an
/// icon, so state never relies on the border colour alone.
///
/// Works inside a [Form]: `Form.validate()` runs [validator].
class BOHTextField extends StatefulWidget {
  const BOHTextField({
    super.key,
    this.controller,
    this.focusNode,
    this.label,
    this.hint,
    this.prefixIcon,
    this.obscurable = false,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.autofillHints,
    this.inputFormatters,
    this.enabled = true,
    this.autofocus = false,
    this.autovalidateMode = AutovalidateMode.onUserInteraction,
    this.forceLtr = false,
    this.minLines,
    this.maxLines = 1,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;

  /// Persistent label above the field.
  final String? label;
  final String? hint;
  final IconData? prefixIcon;

  /// Adds the show/hide toggle and disables suggestions.
  final bool obscurable;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final Iterable<String>? autofillHints;
  final List<TextInputFormatter>? inputFormatters;
  final bool enabled;
  final bool autofocus;
  final AutovalidateMode autovalidateMode;

  /// Grow between [minLines] and [maxLines]; `maxLines: null` is unbounded.
  final int? minLines;
  final int? maxLines;

  /// Keep content left-to-right in Arabic — phone numbers, emails, URLs —
  /// while it still sits at the reading-start edge of the field.
  final bool forceLtr;

  @override
  State<BOHTextField> createState() => _BOHTextFieldState();
}

class _BOHTextFieldState extends State<BOHTextField> {
  TextEditingController? _ownedController;
  FocusNode? _ownedFocusNode;
  late bool _obscured = widget.obscurable;
  bool _focused = false;

  TextEditingController get _controller =>
      widget.controller ?? (_ownedController ??= TextEditingController());
  FocusNode get _focusNode =>
      widget.focusNode ?? (_ownedFocusNode ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(BOHTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      (oldWidget.focusNode ?? _ownedFocusNode)?.removeListener(_onFocusChange);
      _focusNode.addListener(_onFocusChange);
    }
  }

  void _onFocusChange() {
    if (_focused != _focusNode.hasFocus) {
      setState(() => _focused = _focusNode.hasFocus);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _ownedController?.dispose();
    _ownedFocusNode?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final text = context.text;

    return FormField<String>(
      initialValue: _controller.text,
      validator: widget.validator == null
          ? null
          : (_) => widget.validator!(_controller.text),
      autovalidateMode: widget.autovalidateMode,
      enabled: widget.enabled,
      builder: (field) {
        final hasError = field.hasError;
        final borderColor = !widget.enabled
            ? c.borderSoft
            : hasError
            ? c.error
            : _focused
            ? c.primary
            : c.border;
        final iconColor = !widget.enabled
            ? c.textDisabled
            : _focused
            ? c.primary
            : c.textSecondary;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.label != null) ...[
              Text(
                widget.label!,
                style: text.label.copyWith(
                  color: widget.enabled ? c.textPrimary : c.textDisabled,
                ),
              ),
              const SizedBox(height: AppSpacing.s8),
            ],
            AnimatedContainer(
              duration: AppMotion.fast,
              curve: AppMotion.standard,
              constraints: const BoxConstraints(
                minHeight: AppSizes.inputHeight,
              ),
              decoration: BoxDecoration(
                color: widget.enabled ? c.surface : c.surfaceElevated,
                borderRadius: AppRadii.smallAll,
                border: Border.all(color: borderColor),
                boxShadow: _focused && !hasError ? AppShadows.focus(c) : null,
              ),
              child: Row(
                children: [
                  if (widget.prefixIcon != null)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(
                        start: AppSpacing.s16,
                        end: AppSpacing.s4,
                      ),
                      child: Icon(
                        widget.prefixIcon,
                        size: AppSizes.iconMedium,
                        color: iconColor,
                      ),
                    ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      focusNode: _focusNode,
                      enabled: widget.enabled,
                      autofocus: widget.autofocus,
                      obscureText: _obscured,
                      enableSuggestions: !widget.obscurable,
                      autocorrect: !widget.obscurable,
                      keyboardType: widget.keyboardType,
                      textInputAction: widget.textInputAction,
                      textCapitalization: widget.textCapitalization,
                      autofillHints: widget.autofillHints,
                      inputFormatters: widget.inputFormatters,
                      minLines: widget.minLines,
                      maxLines: widget.obscurable ? 1 : widget.maxLines,
                      style: text.body.copyWith(
                        color: widget.enabled ? c.textPrimary : c.textDisabled,
                      ),
                      cursorColor: c.primary,
                      textDirection: widget.forceLtr ? TextDirection.ltr : null,
                      textAlign: widget.forceLtr && context.isRtl
                          ? TextAlign.right
                          : TextAlign.start,
                      onChanged: (value) {
                        field.didChange(value);
                        widget.onChanged?.call(value);
                      },
                      onSubmitted: widget.onSubmitted,
                      decoration: InputDecoration(
                        hintText: widget.hint,
                        // The hint takes the ambient direction unless told.
                        hintTextDirection: widget.forceLtr
                            ? TextDirection.ltr
                            : null,
                        hintStyle: text.body.copyWith(color: c.textMuted),
                        filled: false,
                        isDense: true,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        disabledBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.s12,
                          vertical: AppSpacing.s16,
                        ),
                      ),
                    ),
                  ),
                  if (widget.obscurable)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(
                        end: AppSpacing.s4,
                      ),
                      child: BOHIconButton(
                        icon: _obscured ? AppIcons.show : AppIcons.hide,
                        semanticLabel: _obscured
                            ? context.l10n.actionShowPassword
                            : context.l10n.actionHidePassword,
                        color: c.textSecondary,
                        onPressed: widget.enabled
                            ? () => setState(() => _obscured = !_obscured)
                            : null,
                      ),
                    ),
                ],
              ),
            ),
            AnimatedSize(
              duration: AppMotion.fast,
              curve: AppMotion.standard,
              alignment: AlignmentDirectional.topStart,
              child: hasError
                  ? Padding(
                      padding: const EdgeInsets.only(top: AppSpacing.s8),
                      child: Semantics(
                        liveRegion: true,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(top: 1),
                              child: Icon(
                                AppIcons.info,
                                size: AppSizes.iconSmall,
                                color: c.error,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.s8),
                            Expanded(
                              child: Text(
                                field.errorText!,
                                style: text.bodySmall.copyWith(color: c.error),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : const SizedBox(width: double.infinity),
            ),
          ],
        );
      },
    );
  }
}
