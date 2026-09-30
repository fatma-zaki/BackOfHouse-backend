import 'package:flutter/widgets.dart';

import '../../extensions/context_extensions.dart';

/// Filled brand glyphs the outline icon set does not have. Paths are the
/// design hand-off's own SVGs (24×24 viewBox).
enum BOHGlyphType {
  /// Filled star — points, rewards, highlights.
  star,

  /// Verified starburst with a check — company verification (read-only).
  verified,

  /// Filled bookmark — saved state.
  bookmark,

  /// Opening quote mark — article callouts. Mirrors in RTL.
  quote,
}

/// A filled glyph in [color] (default: violet). Decorative unless
/// [semanticLabel] is given.
class BOHGlyph extends StatelessWidget {
  const BOHGlyph(
    this.type, {
    super.key,
    this.size = 20,
    this.color,
    this.semanticLabel,
  });

  final BOHGlyphType type;
  final double size;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final mirror = type == BOHGlyphType.quote && context.isRtl;
    Widget glyph = CustomPaint(
      size: Size.square(size),
      painter: _GlyphPainter(
        type,
        color ?? c.primary,
        // The verified check is always white on the violet burst.
        const Color(0xFFFFFFFF),
      ),
    );
    if (mirror) {
      glyph = Transform.flip(flipX: true, child: glyph);
    }
    return Semantics(
      label: semanticLabel,
      image: semanticLabel != null,
      excludeSemantics: true,
      child: glyph,
    );
  }
}

class _GlyphPainter extends CustomPainter {
  const _GlyphPainter(this.type, this.color, this.check);

  final BOHGlyphType type;
  final Color color;
  final Color check;

  static final Path _star = svgPath(
    'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  );
  static final Path _burst = svgPath(
    'M12 2l2.4 2.2 3.2-.4.9 3.1 2.9 1.5-1 3.1 1 3.1-2.9 1.5-.9 3.1-3.2-.4'
    'L12 22l-2.4-2.2-3.2.4-.9-3.1-2.9-1.5 1-3.1-1-3.1 2.9-1.5.9-3.1 3.2.4z',
  );
  static final Path _check = svgPath('M8.5 12l2.5 2.5 4.5-5');
  static final Path _bookmark = svgPath('M6 3h12v18l-6-4-6 4z');
  static final Path _quote = svgPath(
    'M7 7h4v4c0 3-1.5 5-4 6l-.8-1.4C7.6 14.8 8.3 13.6 8.4 12H7z'
    'm8 0h4v4c0 3-1.5 5-4 6l-.8-1.4c1.4-.8 2.1-2 2.2-3.6H15z',
  );

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    final fill = Paint()..color = color;
    final outline = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeJoin = StrokeJoin.round;
    switch (type) {
      case BOHGlyphType.star:
        canvas
          ..drawPath(_star, fill)
          ..drawPath(_star, outline);
      case BOHGlyphType.verified:
        canvas
          ..drawPath(_burst, fill)
          ..drawPath(
            _check,
            Paint()
              ..color = check
              ..style = PaintingStyle.stroke
              ..strokeWidth = 2
              ..strokeCap = StrokeCap.round
              ..strokeJoin = StrokeJoin.round,
          );
      case BOHGlyphType.bookmark:
        canvas
          ..drawPath(_bookmark, fill)
          ..drawPath(_bookmark, outline..strokeWidth = 1.8);
      case BOHGlyphType.quote:
        canvas.drawPath(_quote, fill);
    }
  }

  @override
  bool shouldRepaint(_GlyphPainter oldDelegate) =>
      oldDelegate.type != type || oldDelegate.color != color;
}

/// Parses the subset of SVG path data the design uses: M L H V C Z in
/// absolute and relative form, with implicit repeats.
@visibleForTesting
Path svgPath(String data) {
  final tokens = RegExp(r'[MmLlHhVvCcZz]|-?(?:\d+\.?\d*|\.\d+)')
      .allMatches(data)
      .map((m) => m.group(0)!)
      .toList();
  final path = Path();
  var i = 0;
  var command = 'M';
  var x = 0.0, y = 0.0, startX = 0.0, startY = 0.0;

  double next() => double.parse(tokens[i++]);
  bool isCommand(String t) => RegExp(r'^[A-Za-z]$').hasMatch(t);

  while (i < tokens.length) {
    if (isCommand(tokens[i])) command = tokens[i++];
    final rel = command == command.toLowerCase();
    switch (command.toUpperCase()) {
      case 'M':
        final (dx, dy) = (next(), next());
        x = rel ? x + dx : dx;
        y = rel ? y + dy : dy;
        startX = x;
        startY = y;
        path.moveTo(x, y);
        command = rel ? 'l' : 'L';
      case 'L':
        final (dx, dy) = (next(), next());
        x = rel ? x + dx : dx;
        y = rel ? y + dy : dy;
        path.lineTo(x, y);
      case 'H':
        final dx = next();
        x = rel ? x + dx : dx;
        path.lineTo(x, y);
      case 'V':
        final dy = next();
        y = rel ? y + dy : dy;
        path.lineTo(x, y);
      case 'C':
        final v = [for (var k = 0; k < 6; k++) next()];
        final ox = rel ? x : 0.0, oy = rel ? y : 0.0;
        path.cubicTo(
          ox + v[0],
          oy + v[1],
          ox + v[2],
          oy + v[3],
          ox + v[4],
          oy + v[5],
        );
        x = ox + v[4];
        y = oy + v[5];
      case 'Z':
        path.close();
        x = startX;
        y = startY;
    }
  }
  return path;
}
