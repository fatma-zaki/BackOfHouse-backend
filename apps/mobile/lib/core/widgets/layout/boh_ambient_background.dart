import 'package:flutter/widgets.dart';

import '../../extensions/context_extensions.dart';

/// The ground behind a screen: the plain page colour in both modes.
///
/// The design keeps grounds flat (lavender-white in light, midnight in
/// dark); depth comes from cards and shadows. [glowAlignment] and
/// [intensity] are accepted for API stability and ignored.
class BOHAmbientBackground extends StatelessWidget {
  const BOHAmbientBackground({
    super.key,
    this.glowAlignment = AlignmentDirectional.topEnd,
    this.intensity = 0.14,
  });

  final AlignmentDirectional glowAlignment;
  final double intensity;

  @override
  Widget build(BuildContext context) =>
      ColoredBox(color: context.colors.background);
}
