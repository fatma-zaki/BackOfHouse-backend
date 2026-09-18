import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../extensions/context_extensions.dart';

/// A slow band of light sweeping across skeleton shapes.
///
/// Wrap a whole skeleton layout in one [BOHShimmer] rather than each box, so
/// a list of placeholders runs on a single ticker. Static under reduce-motion.
class BOHShimmer extends StatefulWidget {
  const BOHShimmer({super.key, required this.child, this.enabled = true});

  final Widget child;
  final bool enabled;

  @override
  State<BOHShimmer> createState() => _BOHShimmerState();
}

class _BOHShimmerState extends State<BOHShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: AppMotion.shimmer,
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(BOHShimmer oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  void _sync() {
    final animate = widget.enabled && !MediaQuery.disableAnimationsOf(context);
    if (animate && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!animate && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final base = c.surfaceElevated;
    final highlight = c.isDark ? c.borderSoft : c.surface;

    return ExcludeSemantics(
      child: RepaintBoundary(
        child: AnimatedBuilder(
          animation: _controller,
          child: widget.child,
          builder: (context, child) {
            // Sweep from off-canvas start to off-canvas end.
            final t = _controller.value * 2 - 0.5;
            return ShaderMask(
              blendMode: BlendMode.srcATop,
              shaderCallback: (bounds) => LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [base, highlight, base],
                stops: [
                  (t - 0.25).clamp(0.0, 1.0),
                  t.clamp(0.0, 1.0),
                  (t + 0.25).clamp(0.0, 1.0),
                ],
              ).createShader(bounds),
              child: child,
            );
          },
        ),
      ),
    );
  }
}

/// Placeholder shape to compose inside a [BOHShimmer].
class BOHSkeleton extends StatelessWidget {
  const BOHSkeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = AppRadii.smallAll,
  });

  /// One line of text.
  const BOHSkeleton.line({super.key, this.width, this.height = 12})
    : borderRadius = AppRadii.pillAll;

  const BOHSkeleton.circle({super.key, required double size})
    : width = size,
      height = size,
      borderRadius = AppRadii.pillAll;

  final double? width;
  final double? height;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: context.colors.surfaceElevated,
        borderRadius: borderRadius,
      ),
    );
  }
}
