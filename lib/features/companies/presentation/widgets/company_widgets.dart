import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../supplier_responses/domain/supplier_response.dart';

extension OpportunityStatusPresentation on OpportunityStatus {
  String label(AppLocalizations l10n) => switch (this) {
    OpportunityStatus.draft => l10n.opportunityStatusDraft,
    OpportunityStatus.inReview => l10n.opportunityStatusInReview,
    OpportunityStatus.changesRequested =>
      l10n.opportunityStatusChangesRequested,
    OpportunityStatus.published => l10n.opportunityStatusPublished,
    OpportunityStatus.paused => l10n.opportunityStatusPaused,
    OpportunityStatus.closed => l10n.opportunityStatusClosed,
    OpportunityStatus.archived => l10n.opportunityStatusArchived,
  };

  IconData get icon => switch (this) {
    OpportunityStatus.draft => AppIcons.edit,
    OpportunityStatus.inReview => AppIcons.clock,
    OpportunityStatus.changesRequested => AppIcons.edit,
    OpportunityStatus.published => AppIcons.success,
    OpportunityStatus.paused => AppIcons.hidden,
    OpportunityStatus.closed || OpportunityStatus.archived => AppIcons.close,
  };

  Color color(AppColors c) => switch (this) {
    OpportunityStatus.published => c.success,
    OpportunityStatus.inReview => c.warning,
    OpportunityStatus.changesRequested => c.error,
    OpportunityStatus.draft => c.primaryText,
    _ => c.textMuted,
  };
}

extension SupplierResponseStatusPresentation on SupplierResponseStatus {
  String label(AppLocalizations l10n) => switch (this) {
    SupplierResponseStatus.submitted => l10n.applicationStatusSubmitted,
    SupplierResponseStatus.reviewed => l10n.applicationStatusReviewed,
    SupplierResponseStatus.shortlisted => l10n.applicationStatusShortlisted,
    SupplierResponseStatus.selected => l10n.supplierResponseSelected,
    SupplierResponseStatus.rejected => l10n.applicationStatusRejected,
  };

  IconData get icon => switch (this) {
    SupplierResponseStatus.submitted => AppIcons.post,
    SupplierResponseStatus.reviewed => AppIcons.show,
    SupplierResponseStatus.shortlisted => AppIcons.success,
    SupplierResponseStatus.selected => AppIcons.verified,
    SupplierResponseStatus.rejected => AppIcons.close,
  };

  Color color(AppColors c) => switch (this) {
    SupplierResponseStatus.selected => c.success,
    SupplierResponseStatus.rejected => c.textMuted,
    _ => c.primaryText,
  };
}

/// Icon + label pill; never colour alone.
class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8 + 2,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: c.isDark ? 0.16 : 0.10),
        borderRadius: AppRadii.pillAll,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: AppSpacing.s4),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class OpportunityStatusPill extends StatelessWidget {
  const OpportunityStatusPill(this.status, {super.key});

  final OpportunityStatus status;

  @override
  Widget build(BuildContext context) => StatusPill(
    label: status.label(context.l10n),
    icon: status.icon,
    color: status.color(context.colors),
  );
}

class SupplierResponseStatusPill extends StatelessWidget {
  const SupplierResponseStatusPill(this.status, {super.key});

  final SupplierResponseStatus status;

  @override
  Widget build(BuildContext context) => StatusPill(
    label: status.label(context.l10n),
    icon: status.icon,
    color: status.color(context.colors),
  );
}

/// Card with an icon heading.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.child,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, size: AppSizes.iconMedium, color: c.primaryText),
              const SizedBox(width: AppSpacing.s8),
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(title, style: context.text.cardTitle),
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          child,
        ],
      ),
    );
  }
}

/// A label/value line in a details card; hidden when [value] is empty.
class DetailLine extends StatelessWidget {
  const DetailLine({
    super.key,
    required this.icon,
    required this.value,
    this.label,
  });

  final IconData icon;
  final String? value;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return const SizedBox.shrink();
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s8),
      child: MergeSemantics(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Icon(icon, size: AppSizes.iconSmall, color: c.textMuted),
            ),
            const SizedBox(width: AppSpacing.s8),
            Expanded(
              child: Text.rich(
                TextSpan(
                  children: [
                    if (label != null)
                      TextSpan(text: '$label  ', style: context.text.caption),
                    TextSpan(
                      text: v,
                      style: context.text.body.copyWith(color: c.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class Bulleted extends StatelessWidget {
  const Bulleted({super.key, required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(
                    AppIcons.success,
                    size: AppSizes.iconSmall,
                    color: c.primaryText,
                  ),
                ),
                const SizedBox(width: AppSpacing.s8),
                Expanded(child: Text(item, style: context.text.body)),
              ],
            ),
          ),
      ],
    );
  }
}

/// Loading, error with retry, or [data].
class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({
    super.key,
    required this.value,
    required this.data,
    required this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T value) data;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => switch (value) {
    AsyncData(:final value) => data(value),
    AsyncError(:final error) => BOHErrorState(error: error, onRetry: onRetry),
    _ => const BOHLoadingState(),
  };
}

/// Runs a mutation and reports the outcome in a snackbar. Returns whether
/// it succeeded.
Future<bool> runCompanyAction(
  BuildContext context,
  Future<void> Function() action, {
  String? success,
}) async {
  final messenger = ScaffoldMessenger.of(context);
  final l10n = context.l10n;
  String? message;
  var ok = false;
  try {
    await action();
    ok = true;
    message = success;
  } catch (error) {
    message = l10n.error(error);
  }
  if (message != null) {
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
  return ok;
}

/// Bottom sheet asking to confirm [action]. Resolves to `true` on confirm.
Future<bool> confirmCompanyAction(
  BuildContext context, {
  required String title,
  required String message,
  required String action,
}) async {
  final l10n = context.l10n;
  final confirmed = await showBOHSheet<bool>(
    context,
    builder: (sheet) => Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(title, style: sheet.text.h2),
        const SizedBox(height: AppSpacing.s8),
        Text(message, style: sheet.text.body),
        const SizedBox(height: AppSpacing.s20),
        BOHButton(
          label: action,
          trailingIcon: null,
          onPressed: () => Navigator.of(sheet).pop(true),
        ),
        const SizedBox(height: AppSpacing.s8),
        BOHButton(
          label: l10n.actionCancel,
          variant: BOHButtonVariant.ghost,
          trailingIcon: null,
          onPressed: () => Navigator.of(sheet).pop(false),
        ),
      ],
    ),
  );
  return confirmed ?? false;
}

/// One item per line, for list fields edited as text.
List<String> linesOf(String text) => [
  for (final line in text.split('\n'))
    if (line.trim().isNotEmpty) line.trim(),
];

/// Title-row for a list item that belongs to the workspace.
class WorkspaceTile extends StatelessWidget {
  const WorkspaceTile({
    super.key,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.caption,
    this.leading,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final String? caption;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return BOHCard(
      onTap: onTap,
      semanticLabel: [title, ?subtitle, ?caption].join('. '),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (leading != null) ...[
            leading!,
            const SizedBox(width: AppSpacing.s12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: context.text.cardTitle),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: context.text.bodySmall),
                ],
                if (caption != null) ...[
                  const SizedBox(height: AppSpacing.s4),
                  Text(caption!, style: context.text.caption),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: AppSpacing.s8),
            trailing!,
          ],
        ],
      ),
    );
  }
}
