import 'package:flutter/widgets.dart';

import '../../constants/app_assets.dart';
import '../../extensions/context_extensions.dart';

/// The official Back Of House logo. Always the supplied artwork, never
/// retyped: black on light grounds, white on dark grounds and photos.
///
/// The artwork is 2:1 with built-in padding, so [height] is the height of
/// the image box (the design's 36 in headers, 38 on sign-in). A logo never
/// mirrors and never stretches.
class BOHLogo extends StatelessWidget {
  const BOHLogo({super.key, this.height = 36, this.onDark = false});

  final double height;

  /// Force the white artwork, e.g. over a photo, whatever the theme.
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final white = onDark || context.isDark;
    return Semantics(
      label: context.l10n.appName,
      image: true,
      excludeSemantics: true,
      child: Image.asset(
        white ? AppAssets.logoWhite : AppAssets.logoBlack,
        height: height,
        width: height * 2,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.medium,
      ),
    );
  }
}
