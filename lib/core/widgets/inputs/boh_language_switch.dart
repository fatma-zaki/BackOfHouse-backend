import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../../l10n/locale_controller.dart';
import '../motion/boh_pressable.dart';

/// "EN | عربي" — switches the app language in place.
///
/// Each language is labelled in its own script so it is recognisable to a
/// reader of that language, whichever language is active.
class BOHLanguageSwitch extends ConsumerWidget {
  const BOHLanguageSwitch({super.key});

  static const _options = [('en', 'EN'), ('ar', 'عربي')];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final current = Localizations.localeOf(context).languageCode;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < _options.length; i++) ...[
          if (i > 0) Container(width: 1, height: 20, color: c.border),
          Semantics(
            inMutuallyExclusiveGroup: true,
            child: BOHPressable(
              selected: current == _options[i].$1,
              semanticLabel: _options[i].$1 == 'en'
                  ? context.l10n.languageEnglish
                  : context.l10n.languageArabic,
              onTap: () => ref
                  .read(localeControllerProvider.notifier)
                  .setLocale(Locale(_options[i].$1)),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minWidth: AppSizes.minTouchTarget,
                  minHeight: AppSizes.minTouchTarget,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s12,
                  ),
                  child: Center(
                    widthFactor: 1,
                    child: Text(
                      _options[i].$2,
                      style: context.text.label.copyWith(
                        color: current == _options[i].$1
                            ? c.primaryText
                            : c.textMuted,
                        fontWeight: current == _options[i].$1
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
