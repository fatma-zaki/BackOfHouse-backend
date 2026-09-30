import 'package:flutter/painting.dart';

/// Corner radii. Pick by role, not by taste:
///
/// * [tag]      — category tags
/// * [small]    — thumbnails, icon tiles, field tiles
/// * [input]    — text fields, banners
/// * [medium]   — small cards, tiles, portfolio
/// * [listCard] — list rows (events, news, notifications)
/// * [large]    — standard cards
/// * [hero]     — hero cards (profile header, tickets)
/// * [sheet]    — bottom bar, sticky footers, sheets
/// * [pill]     — buttons, chips, badges, avatars
abstract final class AppRadii {
  static const double tag = 6;
  static const double small = 12;
  static const double input = 14;
  static const double medium = 16;
  static const double listCard = 18;
  static const double large = 20;
  static const double hero = 22;
  static const double sheet = 24;
  static const double photoSheet = 28;
  static const double pill = 999;

  static const BorderRadius tagAll = BorderRadius.all(Radius.circular(tag));
  static const BorderRadius smallAll = BorderRadius.all(Radius.circular(small));
  static const BorderRadius inputAll = BorderRadius.all(Radius.circular(input));
  static const BorderRadius mediumAll = BorderRadius.all(
    Radius.circular(medium),
  );
  static const BorderRadius listCardAll = BorderRadius.all(
    Radius.circular(listCard),
  );
  static const BorderRadius largeAll = BorderRadius.all(Radius.circular(large));
  static const BorderRadius heroAll = BorderRadius.all(Radius.circular(hero));
  static const BorderRadius pillAll = BorderRadius.all(Radius.circular(pill));

  /// Rounded top edge of the bottom bar and sticky footers.
  static const BorderRadius sheetTop = BorderRadius.vertical(
    top: Radius.circular(sheet),
  );

  /// Content sheet overlapping a photo header.
  static const BorderRadius photoSheetTop = BorderRadius.vertical(
    top: Radius.circular(photoSheet),
  );
}
