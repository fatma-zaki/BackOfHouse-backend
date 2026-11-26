import 'dart:async';

import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';

/// Entrance animation: fade in while rising a few pixels. Plays once.
///
/// For lists, pass `delay: BOHFadeSlide.stagger(index)` — the stagger is
/// capped so long lists never make the user wait.
class BOHFadeSlide extends StatefulWidget {
  const BOHFadeSlide({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = AppMotion.slow,
    this.offset = 12,
  });

  final Widget child;
  final Duration delay;
  final Duration duration;

  /// Vertical travel in logical pixels.
  final double offset;

  static Duration stagger(int index) =>
      Duration(milliseconds: 40 * index.clamp(0, 6));

  @override
  State<BOHFadeSlide> createState() => _BOHFadeSlideState();
}

class _BOHFadeSlideState extends State<BOHFadeSlide>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: widget.duration,
  );
  late final Animation<double> _curve = CurvedAnimation(
    parent: _controller,
    curve: AppMotion.emphasized,
  );
  Timer? _timer;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;

    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.value = 1;
    } else if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      _timer = Timer(widget.delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curve,
      child: widget.child,
      builder: (context, child) => Opacity(
        opacity: _curve.value,
        child: Transform.translate(
          offset: Offset(0, widget.offset * (1 - _curve.value)),
          child: child,
        ),
      ),
    );
  }
}
