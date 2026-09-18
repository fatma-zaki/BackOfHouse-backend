import 'package:flutter/widgets.dart';

import '../../../../app/theme/app_motion.dart';
import '../../../../app/theme/app_radii.dart';
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

  IconData get icon => switch (this) {
    AccountType.individual => AppIcons.user,
    AccountType.company => AppIcons.companies,
  };
}

/// Side-by-side radio group for the "I am" question on sign up.
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
    return Row(
      children: [
        for (final (i, type) in AccountType.values.indexed) ...[
          if (i > 0) const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: _Option(
              type: type,
              selected: type == selected,
              onTap: onChanged == null ? null : () => onChanged!(type),
            ),
          ),
        ],
      ],
    );
  }
}

class _Option extends StatelessWidget {
  const _Option({
    required this.type,
    required this.selected,
    required this.onTap,
  });

  final AccountType type;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final label = type.label(context.l10n);

    return Semantics(
      inMutuallyExclusiveGroup: true,
      checked: selected,
      child: BOHPressable(
        onTap: onTap,
        selected: selected,
        semanticLabel: label,
        builder: (context, state) => AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.standard,
          constraints: const BoxConstraints(minHeight: AppSizes.inputHeight),
          padding: const EdgeInsetsDirectional.only(
            start: AppSpacing.s16,
            end: AppSpacing.s12,
          ),
          decoration: BoxDecoration(
            color: selected ? c.primaryWash : c.surface,
            borderRadius: AppRadii.smallAll,
            border: Border.all(color: selected ? c.primary : c.border),
          ),
          child: Row(
            children: [
              Icon(
                type.icon,
                size: AppSizes.iconMedium,
                color: selected ? c.primary : c.textSecondary,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Text(
                  label,
                  style: context.text.body.copyWith(
                    color: c.textPrimary,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              AnimatedContainer(
                duration: AppMotion.fast,
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? c.primary : c.surface,
                  border: Border.all(
                    color: selected ? c.primary : c.textDisabled,
                    width: 1.5,
                  ),
                ),
                child: selected
                    ? Icon(AppIcons.check, size: 12, color: c.onPrimary)
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
