/// Bundled asset paths. Widgets never spell out an asset path themselves.
abstract final class AppAssets {
  /// Official logo artwork (2:1, transparent). Black for light grounds,
  /// white for dark grounds and photos. Used only through `BOHLogo`.
  static const String logoBlack = 'assets/images/logo_black.png';
  static const String logoWhite = 'assets/images/logo_white.png';

  /// Production crew at the console, facing a lit stage.
  static const String heroCrew = 'assets/images/hero_crew.png';

  // ── Editorial photography (mock content) ────────────────────────────────
  static const String conventionHall =
      'assets/images/content/convention_hall.jpg';
  static const String festivalStage =
      'assets/images/content/festival_stage.jpg';
  static const String auditorium = 'assets/images/content/auditorium.jpg';
  static const String concertStage = 'assets/images/content/concert_stage.jpg';
  static const String headshotDirector =
      'assets/images/content/headshot_director.jpg';
  static const String avatarMember = 'assets/images/content/avatar_member.jpg';
  static const String companyLogoSeg =
      'assets/images/content/company_logo_seg.jpg';
  static const String summit = 'assets/images/content/summit.jpg';
  static const String concertCrowd = 'assets/images/content/concert_crowd.jpg';
  static const String riyadhSkyline =
      'assets/images/content/riyadh_skyline.jpg';
  static const String event1 = 'assets/images/content/event_1.jpg';
  static const String event2 = 'assets/images/content/event_2.jpg';
  static const String event3 = 'assets/images/content/event_3.jpg';
  static const String event4 = 'assets/images/content/event_4.jpg';
  static const String news1 = 'assets/images/content/news_1.jpg';
  static const String news2 = 'assets/images/content/news_2.jpg';
  static const String news3 = 'assets/images/content/news_3.jpg';
  static const String news4 = 'assets/images/content/news_4.jpg';

  /// Official Google "G" mark for the sign-in button (brand guidelines
  /// require the unmodified multicolour logo).
  static const String googleLogo = 'assets/icons/google_g.png';
}
