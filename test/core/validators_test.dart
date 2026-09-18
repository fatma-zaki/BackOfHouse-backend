import 'package:backofhouse/core/utils/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Validators.email', () {
    test('accepts a normal address', () {
      expect(Validators.email('crew@backofhouse.space'), isNull);
    });
    test('rejects empty and malformed input', () {
      expect(Validators.email(''), ValidationError.emailRequired);
      expect(Validators.email('not-an-email'), ValidationError.emailInvalid);
    });
  });

  group('Validators.phone (Saudi mobile)', () {
    test('accepts local and international formats', () {
      expect(Validators.phone('0551234567'), isNull);
      expect(Validators.phone('+966551234567'), isNull);
      expect(Validators.phone('966 55 123 4567'), isNull);
    });
    test('accepts Eastern Arabic numerals from an Arabic keyboard', () {
      expect(Validators.phone('٠٥٥١٢٣٤٥٦٧'), isNull);
    });
    test('rejects landlines and short numbers', () {
      expect(Validators.phone('0112345678'), ValidationError.phoneInvalid);
      expect(Validators.phone('05512'), ValidationError.phoneInvalid);
      expect(Validators.phone(''), ValidationError.phoneRequired);
    });
  });

  group('Validators.password', () {
    test('requires 8+ chars with a letter and a digit', () {
      expect(Validators.password('abc12345'), isNull);
      expect(Validators.password('short1'), ValidationError.passwordTooShort);
      expect(Validators.password('onlyletters'), ValidationError.passwordWeak);
    });
    test('sign in only checks presence', () {
      expect(Validators.passwordPresent('x'), isNull);
      expect(Validators.passwordPresent(''), ValidationError.passwordRequired);
    });
    test('confirmPassword must match', () {
      expect(Validators.confirmPassword('abc12345', 'abc12345'), isNull);
      expect(
        Validators.confirmPassword('abc12345', 'different1'),
        ValidationError.passwordMismatch,
      );
    });
  });
}
