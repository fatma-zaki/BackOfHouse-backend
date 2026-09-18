import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../constants/app_assets.dart';
import '../../extensions/context_extensions.dart';

/// The ground behind a screen.
///
/// * Light mode: a clean off-white ground. Content carries the page.
/// * Dark mode: the backstage atmosphere — one soft purple light source,
///   faint rigging lines and film grain.
///
/// Static by design and painted inside a [RepaintBoundary], so scrolling
/// content above it never repaints it.
class BOHAmbientBackground extends StatelessWidget {
  const BOHAmbientBackground({
    super.key,
    this.glowAlignment = AlignmentDirectional.topEnd,
    this.intensity = 0.14,
  }) : assert(
         intensity >= 0.05 && intensity <= 0.20,
         'Motif opacity is specified at 5–20%',
       );

  /// Where the stage light sits (dark mode). Mirrors in Arabic.
  final AlignmentDirectional glowAlignment;

  /// Peak opacity of the purple light (dark mode), 0.05–0.20.
  final double intensity;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    if (!c.isDark) return ColoredBox(color: c.background);

    final direction = Directionality.of(context);
    final glow = glowAlignment.resolve(direction);

    return RepaintBoundary(
      child: IgnorePointer(
        child: Stack(
          fit: StackFit.expand,
          children: [
            ColoredBox(color: c.background),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: glow,
                  radius: 1.1,
                  colors: [
                    c.primary.withValues(alpha: intensity),
                    c.primaryPressed.withValues(alpha: intensity * 0.35),
                    AppColors.transparent,
                  ],
                  stops: const [0, 0.45, 1],
                ),
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(-glow.x, 1.1),
                  radius: 0.9,
                  colors: [
                    c.primaryPressed.withValues(alpha: intensity * 0.5),
                    AppColors.transparent,
                  ],
                ),
              ),
            ),
            CustomPaint(
              painter: _RiggingLinesPainter(
                mirrored: direction == TextDirection.rtl,
                beam: c.primaryText.withValues(alpha: intensity * 1.6),
                faint: c.primary.withValues(alpha: intensity * 1.3),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(AppAssets.grain),
                  repeat: ImageRepeat.repeat,
                  opacity: 0.35,
                  filterQuality: FilterQuality.none,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Thin diagonal lines and an open chevron, echoing lighting truss geometry.
class _RiggingLinesPainter extends CustomPainter {
  const _RiggingLinesPainter({
    required this.mirrored,
    required this.beam,
    required this.faint,
  });

  final bool mirrored;
  final Color beam;
  final Color faint;

  @override
  void paint(Canvas canvas, Size size) {
    if (mirrored) {
      canvas
        ..translate(size.width, 0)
        ..scale(-1, 1);
    }

    final w = size.width;
    final h = size.height;
    Paint stroke(Color color) => Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = color;

    canvas
      ..drawLine(Offset(w * 0.30, 0), Offset(w * 1.05, h * 0.34), stroke(beam))
      ..drawLine(Offset(w * 0.62, 0), Offset(w * 0.18, h * 0.22), stroke(beam));

    final chevron = Path()
      ..moveTo(w * 1.02, h * 0.70)
      ..lineTo(w * 0.78, h * 0.86)
      ..lineTo(w * 0.78, h * 0.94)
      ..lineTo(w * 1.02, h * 0.78);
    canvas
      ..drawPath(chevron, stroke(faint))
      ..drawLine(
        Offset(w * 0.62, h * 1.02),
        Offset(w * 1.02, h * 0.80),
        stroke(faint),
      );
  }

  @override
  bool shouldRepaint(_RiggingLinesPainter oldDelegate) =>
      oldDelegate.mirrored != mirrored ||
      oldDelegate.beam != beam ||
      oldDelegate.faint != faint;
}
