import 'package:flutter/widgets.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/account_type.dart';

extension AccountTypePresentation on AccountType {
  String label(AppLocalizations l10n) => switch (this) {
    AccountType.individual => l10n.accountIndividual,
    AccountType.company => l10n.accountCompany,
  };

  String description(AppLocalizations l10n) => switch (this) {
    AccountType.individual => l10n.accountIndividualHint,
    AccountType.company => l10n.accountCompanyHint,
  };

  IconData get icon => switch (this) {
    AccountType.individual => AppIcons.user,
    AccountType.company => AppIcons.companies,
  };
}

/// Side-by-side radio cards for the account type on sign up.
class AccountTypeSelector extends StatelessWidget {
  const AccountTypeSelector({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final AccountType selected;
  final ValueChanged<AccountType>? onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Semantics(
      label: l10n.accountTypeLabel,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final (i, type) in AccountType.values.indexed) ...[
              if (i > 0) const SizedBox(width: AppSpacing.s10),
              Expanded(
                child: BOHRadioCard(
                  icon: type.icon,
                  title: type.label(l10n),
                  description: type.description(l10n),
                  selected: type == selected,
                  onTap: onChanged == null ? null : () => onChanged!(type),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
