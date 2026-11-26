import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/domain/company_type.dart';
import '../../../companies/presentation/company_labels.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../domain/supplier_response.dart';

extension SupplierResponseEligibilityPresentation
    on SupplierResponseEligibility {
  /// Why the company cannot respond; empty when eligible.
  String message(AppLocalizations l10n) => switch (this) {
    SupplierResponseEligibility.eligible => '',
    SupplierResponseEligibility.notSupplierRequest ||
    SupplierResponseEligibility.notInvited => l10n.supplierNotInvited,
    SupplierResponseEligibility.ownRequest => l10n.supplierOwnRequest,
    SupplierResponseEligibility.closed => l10n.opportunityClosed,
    SupplierResponseEligibility.alreadyResponded =>
      l10n.supplierAlreadyResponded,
  };
}

class SupplierTypesWrap extends StatelessWidget {
  const SupplierTypesWrap({super.key, required this.types});

  final List<CompanyType> types;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Wrap(
      spacing: AppSpacing.s8,
      runSpacing: AppSpacing.s8,
      children: [
        for (final t in types)
          BOHTag(t.label(l10n), variant: BOHTagVariant.outline, icon: t.icon),
      ],
    );
  }
}

/// A response in a list: the responding company (for buyers) or the
/// request it answers (for responders).
class SupplierResponseTile extends StatelessWidget {
  const SupplierResponseTile({
    super.key,
    required this.response,
    required this.onTap,
    this.asBuyer = false,
  });

  final SupplierResponse response;
  final VoidCallback onTap;
  final bool asBuyer;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final r = response;
    return WorkspaceTile(
      onTap: onTap,
      title: asBuyer ? r.responder.name : r.requestTitle,
      subtitle: asBuyer
          ? r.responder.type.label(l10n)
          : l10n.supplierForBuyer(r.buyer.name),
      caption: [?r.proposedPrice, postedAgo(l10n, r.submittedAt)].join(' · '),
      leading: asBuyer
          ? BOHIconCircle(icon: r.responder.type.icon, size: 40, rounded: true)
          : null,
      trailing: SupplierResponseStatusPill(r.status),
    );
  }
}
