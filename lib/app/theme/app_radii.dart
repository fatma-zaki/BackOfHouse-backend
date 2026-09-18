import 'package:flutter/painting.dart';

/// Corner radii. Pick by role, not by taste:
///
/// * [small]  — buttons, inputs, icon tiles, thumbnails (Stitch rounded-xl)
/// * [medium] — cards, panels, dialogs (Stitch rounded-2xl)
/// * [large]  — floating bottom navigation, hero banners
/// * [hero]   — full-bleed editorial compositions
/// * [pill]   — chips, badges, avatars, status tags
abstract final class AppRadii {
  static const double small = 12;
  static const double medium = 16;
  static const double large = 20;
  static const double hero = 24;
  static const double pill = 999;

  static const BorderRadius smallAll = BorderRadius.all(Radius.circular(small));
  static const BorderRadius mediumAll = BorderRadius.all(
    Radius.circular(medium),
  );
  static const BorderRadius largeAll = BorderRadius.all(Radius.circular(large));
  static const BorderRadius heroAll = BorderRadius.all(Radius.circular(hero));
  static const BorderRadius pillAll = BorderRadius.all(Radius.circular(pill));
}
