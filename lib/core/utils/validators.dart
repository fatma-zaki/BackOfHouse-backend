/// Why a form value was rejected. Mapped to localized copy by
/// `ValidationErrorMessage.message` so the rules stay free of UI strings.
enum ValidationError {
  required,
  emailRequired,
  emailInvalid,
  nameRequired,
  nameTooShort,
  phoneRequired,
  phoneInvalid,
  passwordRequired,
  passwordTooShort,
  passwordWeak,
  confirmRequired,
  passwordMismatch,
  codeInvalid,
}

/// Form rules shared by the auth screens.
abstract final class Validators {
  static final _emailRegExp = RegExp(
    r'^[\w.!#$%&’*+/=?^`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$',
  );

  /// Saudi mobile numbers, accepted as 05XXXXXXXX, 9665XXXXXXXX or +9665XXXXXXXX.
  static final _saudiPhoneRegExp = RegExp(r'^(?:\+?966|0)5\d{8}$');

  static ValidationError? email(String? value) {
    final input = value?.trim() ?? '';
    if (input.isEmpty) return ValidationError.emailRequired;
    if (!_emailRegExp.hasMatch(input)) return ValidationError.emailInvalid;
    return null;
  }

  static ValidationError? fullName(String? value) {
    final input = value?.trim() ?? '';
    if (input.isEmpty) return ValidationError.nameRequired;
    if (input.length < 2) return ValidationError.nameTooShort;
    return null;
  }

  static ValidationError? phone(String? value) {
    final input = _normaliseDigits(value ?? '')
        .replaceAll(RegExp(r'[\s()-]'), '');
    if (input.isEmpty) return ValidationError.phoneRequired;
    if (!_saudiPhoneRegExp.hasMatch(input)) return ValidationError.phoneInvalid;
    return null;
  }

  static ValidationError? password(String? value) {
    final input = value ?? '';
    if (input.isEmpty) return ValidationError.passwordRequired;
    if (input.length < 8) return ValidationError.passwordTooShort;
    if (!input.contains(RegExp(r'[A-Za-z]')) ||
        !input.contains(RegExp(r'\d'))) {
      return ValidationError.passwordWeak;
    }
    return null;
  }

  /// Sign in only checks presence; strength rules apply at sign up.
  static ValidationError? passwordPresent(String? value) {
    if ((value ?? '').isEmpty) return ValidationError.passwordRequired;
    return null;
  }

  static ValidationError? confirmPassword(String? value, String original) {
    if ((value ?? '').isEmpty) return ValidationError.confirmRequired;
    if (value != original) return ValidationError.passwordMismatch;
    return null;
  }

  static ValidationError? required(String? value) {
    if ((value?.trim() ?? '').isEmpty) return ValidationError.required;
    return null;
  }

  /// A 6-digit one-time sign-in code.
  static ValidationError? otpCode(String? value) {
    final input = _normaliseDigits(value ?? '').trim();
    return RegExp(r'^\d{6}$').hasMatch(input)
        ? null
        : ValidationError.codeInvalid;
  }

  /// A valid Saudi mobile number in E.164 (`+9665XXXXXXXX`), or `null`.
  static String? normalisePhone(String? value) {
    if (phone(value) != null) return null;
    final input = _normaliseDigits(value!).replaceAll(RegExp(r'[\s()+-]'), '');
    final local = input.startsWith('966')
        ? input.substring(3)
        : input.replaceFirst(RegExp('^0'), '');
    return '+966$local';
  }

  /// Digits only, with Eastern Arabic numerals converted.
  static String digits(String value) =>
      _normaliseDigits(value).replaceAll(RegExp(r'\D'), '');

  /// Arabic keyboards type Eastern Arabic numerals (٠-٩); treat them as digits.
  static String _normaliseDigits(String input) {
    const eastern = '٠١٢٣٤٥٦٧٨٩';
    final buffer = StringBuffer();
    for (final rune in input.runes) {
      final char = String.fromCharCode(rune);
      final index = eastern.indexOf(char);
      buffer.write(index == -1 ? char : index.toString());
    }
    return buffer.toString();
  }
}
