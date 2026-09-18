import 'dart:async';

import 'package:flutter/material.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../buttons/boh_icon_button.dart';
import '../motion/boh_pressable.dart';

/// Search input. [onChanged] is debounced so typing does not fire a query
/// per keystroke.
///
/// Set [readOnly] with [onTap] to use it as an entry point that opens a
/// dedicated search screen.
class BOHSearchField extends StatefulWidget {
  const BOHSearchField({
    super.key,
    this.controller,
    this.hint,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.readOnly = false,
    this.autofocus = false,
    this.debounce = const Duration(milliseconds: 300),
  });

  final TextEditingController? controller;
  final String? hint;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onTap;
  final bool readOnly;
  final bool autofocus;
  final Duration debounce;

  @override
  State<BOHSearchField> createState() => _BOHSearchFieldState();
}

class _BOHSearchFieldState extends State<BOHSearchField> {
  TextEditingController? _ownedController;
  final FocusNode _focusNode = FocusNode();
  Timer? _debounce;

  TextEditingController get _controller =>
      widget.controller ?? (_ownedController ??= TextEditingController());

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_rebuild);
    _controller.addListener(_rebuild);
  }

  void _rebuild() {
    if (mounted) setState(() {});
  }

  void _handleChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(widget.debounce, () => widget.onChanged?.call(value));
  }

  void _clear() {
    _controller.clear();
    _debounce?.cancel();
    widget.onChanged?.call('');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.removeListener(_rebuild);
    _focusNode
      ..removeListener(_rebuild)
      ..dispose();
    _ownedController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final focused = _focusNode.hasFocus;
    final l10n = context.l10n;

    final field = AnimatedContainer(
      duration: AppMotion.fast,
      curve: AppMotion.standard,
      height: AppSizes.buttonHeightMedium,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.smallAll,
        border: Border.all(color: focused ? c.primary : c.border),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.only(start: AppSpacing.s16),
            child: Icon(
              AppIcons.search,
              size: AppSizes.iconMedium,
              color: focused ? c.primary : c.textSecondary,
            ),
          ),
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              readOnly: widget.readOnly,
              autofocus: widget.autofocus,
              onTap: widget.readOnly ? widget.onTap : null,
              onChanged: _handleChanged,
              onSubmitted: widget.onSubmitted,
              textInputAction: TextInputAction.search,
              style: context.text.body.copyWith(color: c.textPrimary),
              cursorColor: c.primary,
              decoration: InputDecoration(
                hintText: widget.hint ?? l10n.searchHint,
                hintStyle: context.text.body.copyWith(color: c.textMuted),
                filled: false,
                isDense: true,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s12,
                  vertical: AppSpacing.s12,
                ),
              ),
            ),
          ),
          if (_controller.text.isNotEmpty && !widget.readOnly)
            BOHIconButton(
              icon: AppIcons.close,
              iconSize: AppSizes.iconSmall,
              semanticLabel: l10n.actionClearSearch,
              color: c.textSecondary,
              onPressed: _clear,
            )
          else
            const SizedBox(width: AppSpacing.s16),
        ],
      ),
    );

    if (!widget.readOnly || widget.onTap == null) {
      return Semantics(textField: true, label: l10n.actionSearch, child: field);
    }
    return BOHPressable(
      onTap: widget.onTap,
      semanticLabel: widget.hint ?? l10n.searchHint,
      child: IgnorePointer(child: field),
    );
  }
}
