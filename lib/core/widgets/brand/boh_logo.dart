import 'package:flutter/widgets.dart';

import '../../../app/theme/app_typography.dart';
import '../../extensions/context_extensions.dart';

/// The boxed "BACK OF HOUSE" wordmark: ink frame, purple corner square and a
/// purple "OF" with its underline.
///
/// Drawn in code so it stays crisp at any size and follows the theme's ink;
/// swap the body for the official vector once supplied. A logo never
/// mirrors, so it is pinned LTR, and never stretches.
class BOHLogo extends StatelessWidget {
  const BOHLogo({super.key, this.size = 56});

  /// Width of the frame; height follows the brand ratio.
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final ink = c.textPrimary;
    final stroke = (size * 0.03).clamp(1.2, 3.0);
    final word = size * 0.2;
    final corner = size * 0.12;

    TextStyle wordStyle(Color color, double fontSize) => TextStyle(
      fontFamily: AppTypography.fontFamily,
      fontSize: fontSize,
      height: 1,
      fontWeight: FontWeight.w700,
      letterSpacing: -fontSize * 0.04,
      color: color,
    );

    return Semantics(
      label: context.l10n.appName,
      image: true,
      excludeSemantics: true,
      child: Align(
        alignment: AlignmentDirectional.centerStart,
        widthFactor: 1,
        heightFactor: 1,
        child: Directionality(
          textDirection: TextDirection.ltr,
          child: Container(
            width: size,
            height: size * 0.7,
            padding: EdgeInsets.all(size * 0.07),
            decoration: BoxDecoration(
              color: c.isDark ? c.background : null,
              border: Border.all(color: ink, width: stroke),
            ),
            child: Stack(
              children: [
                Positioned(
                  top: 0,
                  right: 0,
                  child: SizedBox.square(
                    dimension: corner,
                    child: ColoredBox(color: c.primary),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomLeft,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.bottomLeft,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('BACK', style: wordStyle(ink, word)),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Padding(
                              padding: EdgeInsets.only(bottom: word * 0.08),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'OF',
                                    style: wordStyle(
                                      c.headlineAccent,
                                      word * 0.52,
                                    ),
                                  ),
                                  SizedBox(height: word * 0.08),
                                  Container(
                                    width: word * 0.7,
                                    height: word * 0.1,
                                    color: c.headlineAccent,
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(width: size * 0.02),
                            Text('HOUSE', style: wordStyle(ink, word)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
