/**
 * Shared fixtures for app.normalize_ar (SQL) and normalizeArabic (TS).
 * Each pair is [input, expected]. Add a case here whenever either side changes.
 */
export const NORMALIZE_ARABIC_FIXTURES: ReadonlyArray<readonly [string, string]> = [
  ['أحمد', 'احمد'],
  ['إبراهيم', 'ابراهيم'],
  ['آمنة', 'امنه'],
  ['ٱلمدينة', 'المدينه'],
  ['مؤسسة', 'موسسه'],
  ['هيئة', 'هييه'],
  ['مستشفى', 'مستشفي'],
  ['مُحَمَّد', 'محمد'],
  ['شركـــة', 'شركه'],
  ['فعاليّات', 'فعاليات'],
  ['  الرياض   جدة  ', 'الرياض جده'],
  ['Café Réunion', 'cafe reunion'],
  ['Straße', 'strasse'],
  ['EVENTS Co', 'events co'],
  ['شركة ABC للفعاليات', 'شركه abc للفعاليات'],
  ['', ''],
];
