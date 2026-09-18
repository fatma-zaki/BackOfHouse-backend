/// Bundled asset paths. Widgets never spell out an asset path themselves.
abstract final class AppAssets {
  /// Production crew at the console, facing a lit stage.
  static const String heroCrew = 'assets/images/hero_crew.png';

  /// 128px tileable film grain used by `BOHAmbientBackground`.
  static const String grain = 'assets/images/grain.png';

  // ── Editorial photography (mock content) ────────────────────────────────
  static const String conventionHall =
      'assets/images/content/convention_hall.jpg';
  static const String festivalStage =
      'assets/images/content/festival_stage.jpg';
  static const String auditorium = 'assets/images/content/auditorium.jpg';
  static const String concertStage = 'assets/images/content/concert_stage.jpg';
  static const String headshotDirector =
      'assets/images/content/headshot_director.jpg';

  /// Official Google "G" mark for the sign-in button (brand guidelines
  /// require the unmodified multicolour logo).
  static const String googleLogo = 'assets/icons/google_g.png';
}
