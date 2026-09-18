import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart' show DateFormat;

/// Locale-aware date formats for the UI.
///
/// Month and day names follow the active language, but digits are always
/// Western (0–9) so dates match points, prices and counts elsewhere in the
/// app instead of mixing numeral systems within one Arabic screen.
abstract final class AppDateFormats {
  static String _locale(BuildContext context) =>
      Localizations.localeOf(context).toString();

  static DateFormat _western(DateFormat format) =>
      format..useNativeDigits = false;

  /// "SEP" / "سبتمبر"
  static DateFormat monthShort(BuildContext context) =>
      _western(DateFormat.MMM(_locale(context)));

  /// "28"
  static DateFormat day(BuildContext context) =>
      _western(DateFormat.d(_locale(context)));

  /// "10:00 AM"
  static DateFormat time(BuildContext context) =>
      _western(DateFormat.jm(_locale(context)));

  /// "September 28"
  static DateFormat monthDay(BuildContext context) =>
      _western(DateFormat.MMMMd(_locale(context)));

  /// "Sep 12, 2026"
  static DateFormat mediumDate(BuildContext context) =>
      _western(DateFormat.yMMMd(_locale(context)));

  /// "Monday, September 28, 2026"
  static DateFormat fullDate(BuildContext context) =>
      _western(DateFormat.yMMMMEEEEd(_locale(context)));

  /// "Mar 2025"
  static DateFormat monthYear(BuildContext context) =>
      _western(DateFormat.yMMM(_locale(context)));

  /// "18–20 Nov 2026", "30 Nov – 2 Dec 2026", or one date for a single day.
  static String range(BuildContext context, DateTime start, DateTime end) {
    final locale = _locale(context);
    final sameDay =
        start.year == end.year &&
        start.month == end.month &&
        start.day == end.day;
    if (sameDay) return _western(DateFormat('d MMM y', locale)).format(start);
    if (start.year == end.year && start.month == end.month) {
      final day = _western(DateFormat.d(locale));
      final monthYear = _western(DateFormat('MMM y', locale));
      return '${ltr('${day.format(start)}–${day.format(end)}')} '
          '${monthYear.format(end)}';
    }
    final short = _western(DateFormat('d MMM', locale));
    final long = _western(DateFormat('d MMM y', locale));
    return '${short.format(start)} – ${long.format(end)}';
  }

  // Unicode isolates, built from code points so no invisible characters
  // live in source.
  static final String _lri = String.fromCharCode(0x2066);
  static final String _fsi = String.fromCharCode(0x2068);
  static final String _pdi = String.fromCharCode(0x2069);

  /// Keeps a numeric run such as "28–30" or "09:00 – 18:00" in reading
  /// order inside Arabic text; the dash alone would let bidi flip the ends.
  static String ltr(String run) => _lri + run + _pdi;

  /// Isolates user-entered text (names, titles) of unknown direction so its
  /// punctuation stays with it inside a translated sentence.
  static String isolate(String text) => _fsi + text + _pdi;

  /// "09:00" — 24-hour clock for agendas and session windows.
  static DateFormat time24(BuildContext context) =>
      _western(DateFormat.Hm(_locale(context)));
}
