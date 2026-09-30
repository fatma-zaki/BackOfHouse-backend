import 'package:intl/intl.dart' show NumberFormat;

import '../network/api_exception.dart';
import '../utils/validators.dart';
import 'generated/app_localizations.dart';

/// Translates non-UI error types into localized copy.
extension L10nMessages on AppLocalizations {
  String validation(ValidationError error) => switch (error) {
    ValidationError.required => validationRequired,
    ValidationError.emailRequired => validationEmailRequired,
    ValidationError.emailInvalid => validationEmailInvalid,
    ValidationError.nameRequired => validationNameRequired,
    ValidationError.nameTooShort => validationNameTooShort,
    ValidationError.phoneRequired => validationPhoneRequired,
    ValidationError.phoneInvalid => validationPhoneInvalid,
    ValidationError.passwordRequired => validationPasswordRequired,
    ValidationError.passwordTooShort => validationPasswordTooShort,
    ValidationError.passwordWeak => validationPasswordWeak,
    ValidationError.confirmRequired => validationConfirmRequired,
    ValidationError.passwordMismatch => validationPasswordMismatch,
    ValidationError.codeInvalid => validationCodeInvalid,
  };

  /// Adapts a [Validators] rule to a `FormField` validator.
  String? Function(String?) validator(ValidationError? Function(String?) rule) {
    return (value) {
      final error = rule(value);
      return error == null ? null : validation(error);
    };
  }

  /// A message safe to show for any thrown error.
  String error(Object error) {
    if (error is! ApiException) return errorUnknown;
    return switch (error.type) {
      ApiErrorType.timeout => errorTimeout,
      ApiErrorType.noConnection => errorNoConnection,
      ApiErrorType.badCertificate => errorBadCertificate,
      ApiErrorType.cancelled => errorCancelled,
      ApiErrorType.badRequest => errorBadRequest,
      ApiErrorType.unauthorized => errorSessionExpired,
      ApiErrorType.forbidden => errorForbidden,
      ApiErrorType.notFound => errorNotFound,
      ApiErrorType.validation => errorValidation,
      ApiErrorType.tooManyRequests => errorTooManyRequests,
      ApiErrorType.server => errorServer,
      ApiErrorType.invalidCredentials => errorInvalidCredentials,
      ApiErrorType.invalidCode => errorInvalidCode,
      ApiErrorType.insufficientPoints => errorInsufficientPoints,
      ApiErrorType.unknown => errorUnknown,
    };
  }

  /// "1,250" — grouped, Western digits in both languages.
  String formatCount(num value) => _grouped.format(value);

  /// "1.2K" / "1.2 ألف" — compact counts (followers, views), Western digits.
  String formatCompact(num value) {
    final arabic = localeName.startsWith('ar');
    String scaled(num divisor, String en, String ar) {
      final v = value / divisor;
      final digits = v >= 100 || v == v.roundToDouble() ? 0 : 1;
      final number = v.toStringAsFixed(digits);
      return arabic ? '$number $ar' : '$number$en';
    }

    if (value >= 1000000) return scaled(1000000, 'M', 'مليون');
    if (value >= 1000) return scaled(1000, 'K', 'ألف');
    return formatCount(value);
  }

  static final NumberFormat _grouped = NumberFormat.decimalPattern('en');

  /// Compact relative time, e.g. "2h ago" / "قبل ساعتين".
  String relativeTime(DateTime moment, {DateTime? now}) {
    final elapsed = (now ?? DateTime.now()).difference(moment);
    if (elapsed.inMinutes < 1) return timeJustNow;
    if (elapsed.inHours < 1) return timeMinutesAgo(elapsed.inMinutes);
    if (elapsed.inDays < 1) return timeHoursAgo(elapsed.inHours);
    return timeDaysAgo(elapsed.inDays);
  }
}
