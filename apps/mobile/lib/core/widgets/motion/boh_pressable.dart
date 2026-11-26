import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';

/// Interaction state handed to a [BOHPressable.builder].
@immutable
class BOHPressState {
  const BOHPressState({
    required this.pressed,
    required this.focused,
    required this.enabled,
  });

  final bool pressed;
  final bool focused;
  final bool enabled;
}

/// The one tap primitive behind every interactive BOH component.
///
/// Replaces Material ink: pressing scales the surface to 0.98 and lets the
/// component restyle itself through [builder]. Handles keyboard/switch
/// activation and exposes button semantics.
class BOHPressable extends StatefulWidget {
  const BOHPressable({
    super.key,
    this.child,
    this.builder,
    this.onTap,
    this.onLongPress,
    this.semanticLabel,
    this.selected,
    this.isButton = true,
    this.scaleOnPress = true,
  }) : assert(
         (child == null) != (builder == null),
         'Provide exactly one of child or builder',
       );

  final Widget? child;
  final Widget Function(BuildContext context, BOHPressState state)? builder;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  /// When set, replaces the semantics of the subtree (avoids "Log in, Log in").
  final String? semanticLabel;
  final bool? selected;
  final bool isButton;
  final bool scaleOnPress;

  @override
  State<BOHPressable> createState() => _BOHPressableState();
}

class _BOHPressableState extends State<BOHPressable> {
  bool _pressed = false;
  bool _focused = false;

  bool get _enabled => widget.onTap != null || widget.onLongPress != null;

  void _setPressed(bool value) {
    if (_pressed == value || !mounted) return;
    setState(() => _pressed = value);
  }

  @override
  void didUpdateWidget(BOHPressable oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_enabled) _pressed = false;
  }

  @override
  Widget build(BuildContext context) {
    final state = BOHPressState(
      pressed: _pressed,
      focused: _focused,
      enabled: _enabled,
    );

    Widget content = widget.builder?.call(context, state) ?? widget.child!;

    if (widget.scaleOnPress) {
      content = AnimatedScale(
        scale: _pressed ? AppMotion.pressedScale : 1,
        duration: MediaQuery.disableAnimationsOf(context)
            ? Duration.zero
            : AppMotion.fast,
        curve: AppMotion.standard,
        child: content,
      );
    }

    return Semantics(
      button: widget.isButton,
      enabled: _enabled,
      selected: widget.selected,
      label: widget.semanticLabel,
      excludeSemantics: widget.semanticLabel != null,
      onTap: widget.onTap,
      child: FocusableActionDetector(
        enabled: _enabled,
        mouseCursor: _enabled ? SystemMouseCursors.click : MouseCursor.defer,
        onShowFocusHighlight: (value) {
          if (mounted) setState(() => _focused = value);
        },
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              widget.onTap?.call();
              return null;
            },
          ),
        },
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTapDown: _enabled ? (_) => _setPressed(true) : null,
          onTapUp: _enabled ? (_) => _setPressed(false) : null,
          onTapCancel: _enabled ? () => _setPressed(false) : null,
          onTap: widget.onTap == null
              ? null
              : () {
                  HapticFeedback.selectionClick();
                  widget.onTap!();
                },
          onLongPress: widget.onLongPress,
          child: content,
        ),
      ),
    );
  }
}
