import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../extensions/context_extensions.dart';
import '../../l10n/locale_controller.dart';
import 'boh_segmented_control.dart';

/// "EN | ع" — switches the app language in place.
///
/// Each language is labelled in its own script so it is recognisable to a
/// reader of that language, whichever language is active. [onPhoto] uses
/// the translucent switch set on Welcome's photo.
class BOHLanguageSwitch extends ConsumerWidget {
  const BOHLanguageSwitch({super.key, this.onPhoto = false});

  final bool onPhoto;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = Localizations.localeOf(context).languageCode;
    return Semantics(
      label: '${context.l10n.languageEnglish} / ${context.l10n.languageArabic}',
      child: BOHSegmentedControl<String>(
        style: onPhoto ? BOHSegmentedStyle.photo : BOHSegmentedStyle.radio,
        segments: [('en', 'EN'), ('ar', onPhoto ? 'ع' : 'عربي')],
        selected: current,
        onChanged: (code) =>
            ref.read(localeControllerProvider.notifier).setLocale(Locale(code)),
      ),
    );
  }
}
