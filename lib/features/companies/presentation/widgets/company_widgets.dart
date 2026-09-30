import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_assets.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/media/app_image.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../supplier_responses/domain/supplier_response.dart';
import '../../domain/company.dart';
import '../../domain/company_project.dart';
import '../company_labels.dart';

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

  /// Live (published) green, in review blue, changes requested amber,
  /// draft and closed neutral.
  BOHStatusTone get tone => switch (this) {
    OpportunityStatus.published => BOHStatusTone.success,
    OpportunityStatus.inReview => BOHStatusTone.info,
    OpportunityStatus.changesRequested => BOHStatusTone.warning,
    _ => BOHStatusTone.neutral,
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

  BOHStatusTone get tone => switch (this) {
    SupplierResponseStatus.submitted => BOHStatusTone.info,
    SupplierResponseStatus.reviewed => BOHStatusTone.warning,
    SupplierResponseStatus.shortlisted => BOHStatusTone.violet,
    SupplierResponseStatus.selected => BOHStatusTone.success,
    SupplierResponseStatus.rejected => BOHStatusTone.neutral,
  };
}

/// Status pill; the label carries the meaning.
class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    this.tone = BOHStatusTone.neutral,
    this.dot = true,
  });

  final String label;
  final BOHStatusTone tone;
  final bool dot;

  @override
  Widget build(BuildContext context) =>
      BOHStatusBadge(label, tone: tone, dot: dot);
}

class OpportunityStatusPill extends StatelessWidget {
  const OpportunityStatusPill(this.status, {super.key});

  final OpportunityStatus status;

  @override
  Widget build(BuildContext context) =>
      StatusPill(label: status.label(context.l10n), tone: status.tone);
}

class SupplierResponseStatusPill extends StatelessWidget {
  const SupplierResponseStatusPill(this.status, {super.key});

  final SupplierResponseStatus status;

  @override
  Widget build(BuildContext context) => StatusPill(
    label: status.label(context.l10n),
    tone: status.tone,
    dot: false,
  );
}

/// A titled section: the skew-bar heading above a card.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.child,
    this.trailing,
  });

  /// Kept for callers; the design's section motif replaces icons.
  final IconData icon;
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHSectionHeader(
          title: title,
          size: BOHSectionSize.sub,
          trailing: trailing,
        ),
        const SizedBox(height: AppSpacing.gridGap),
        BOHCard(child: child),
      ],
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
              child: Icon(icon, size: AppSizes.iconSmall, color: c.primaryText),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s8),
            child: BOHCheckBullet(item),
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
      borderRadius: AppRadii.largeAll,
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

/// A company page: the cover photo with the logo overlapping the sheet.
/// Shared by the company's own profile and its public profile.
class CompanyPhotoPage extends StatelessWidget {
  const CompanyPhotoPage({
    super.key,
    required this.company,
    required this.body,
    this.leading,
    this.actions = const [],
  });

  final Company company;
  final Widget body;
  final Widget? leading;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return BOHPhotoPage(
      // TODO(api): company cover photo.
      image: const AppImage.asset(AppAssets.concertCrowd),
      height: 170,
      overlap: 36,
      roundedSheet: false,
      leading: leading,
      actions: actions,
      overPhoto: BOHCompanyLogo(
        name: company.name,
        size: 76,
        borderColor: context.colors.background,
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screenHorizontal,
          AppSpacing.s8,
          AppSpacing.screenHorizontal,
          AppSpacing.s32,
        ),
        child: body,
      ),
    );
  }
}

/// Name and verification, what the company does, where, the stat strip
/// and services. [action] (Edit or Follow) sits opposite the logo.
/// Verification is shown as a state only; nothing here grants it.
class CompanyIdentity extends StatelessWidget {
  const CompanyIdentity({
    super.key,
    required this.company,
    required this.projects,
    this.action,
  });

  final Company company;

  /// Portfolio size.
  final int projects;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // The logo overlaps the cover at the start; the action sits opposite.
        SizedBox(
          height: 40,
          child: Align(
            alignment: AlignmentDirectional.centerEnd,
            child: action,
          ),
        ),
        const SizedBox(height: AppSpacing.s8),
        Row(
          children: [
            Flexible(
              child: Semantics(
                header: true,
                child: Text(company.name, style: context.text.title),
              ),
            ),
            if (company.verified) ...[
              const SizedBox(width: AppSpacing.s6),
              BOHGlyph(
                BOHGlyphType.verified,
                size: 18,
                semanticLabel: l10n.verifiedLabel,
              ),
            ],
          ],
        ),
        Text(
          company.specialization.isNotEmpty
              ? company.specialization
              : company.type.label(l10n),
          style: context.text.label.copyWith(color: c.primaryText),
        ),
        const SizedBox(height: 2),
        Text(
          [
            if (company.city.isNotEmpty) company.city,
            company.verified
                ? l10n.companyVerifiedByBoh
                : l10n.companyNotVerified,
          ].join(' · '),
          style: context.text.bodySmall,
        ),
        const SizedBox(height: AppSpacing.s14),
        BOHStatStrip(
          items: [
            (l10n.formatCount(projects), l10n.companyStatProjects),
            (
              l10n.formatCount(company.openOpportunities),
              l10n.companyStatLiveListings,
            ),
            (l10n.formatCompact(company.followers), l10n.companyStatFollowers),
          ],
        ),
        if (company.services.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s14),
          Wrap(
            spacing: AppSpacing.s6,
            runSpacing: AppSpacing.s6,
            children: [
              for (final s in company.services) BOHMetaChip(s, large: true),
            ],
          ),
        ],
      ],
    );
  }
}

/// The portfolio as a two-column photo grid. `null` [projects] shows a
/// skeleton.
class CompanyPortfolioGrid extends StatelessWidget {
  const CompanyPortfolioGrid({
    super.key,
    required this.projects,
    required this.emptyMessage,
    this.onTap,
  });

  final List<CompanyProject>? projects;
  final String emptyMessage;
  final ValueChanged<CompanyProject>? onTap;

  @override
  Widget build(BuildContext context) {
    final all = projects;
    if (all == null) {
      return const BOHShimmer(
        child: BOHSkeleton(height: 150, borderRadius: AppRadii.mediumAll),
      );
    }
    if (all.isEmpty) return BOHInfoNote(emptyMessage);
    return GridView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: AppSpacing.gridGap,
        mainAxisSpacing: AppSpacing.gridGap,
        mainAxisExtent: 144,
      ),
      children: [
        for (final p in all)
          BOHMediaTile(
            image: p.images.firstOrNull,
            imageHeight: 70,
            borderRadius: AppRadii.mediumAll,
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            semanticLabel: p.title,
            onTap: onTap == null ? null : () => onTap!(p),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p.title,
                  style: context.text.labelMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  [
                    '${p.startedAt.year}',
                    if (p.location.isNotEmpty) p.location,
                  ].join(' · '),
                  style: context.text.caption.copyWith(fontSize: 10.5),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// About, industries and contact. Services show as chips in
/// [CompanyIdentity]. With [showEmptyContact] the contact card says nothing
/// is listed (the owner's view); otherwise an empty one is hidden.
class CompanyAboutSections extends StatelessWidget {
  const CompanyAboutSections({
    super.key,
    required this.company,
    this.showEmptyContact = false,
  });

  final Company company;
  final bool showEmptyContact;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final hasContact =
        (company.contactEmail ?? company.contactPhone ?? company.website) !=
        null;
    const gap = SizedBox(height: AppSpacing.s12);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (company.description.isNotEmpty ||
            company.specialization.isNotEmpty ||
            company.city.isNotEmpty) ...[
          gap,
          SectionCard(
            icon: AppIcons.companies,
            title: l10n.companyAbout,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (company.description.isNotEmpty) ...[
                  Text(company.description, style: context.text.body),
                  const SizedBox(height: AppSpacing.s12),
                ],
                DetailLine(
                  icon: AppIcons.job,
                  label: l10n.companySpecialization,
                  value: company.specialization,
                ),
                DetailLine(icon: AppIcons.location, value: company.city),
              ],
            ),
          ),
        ],
        if (company.industries.isNotEmpty) ...[
          gap,
          SectionCard(
            icon: AppIcons.technology,
            title: l10n.companyIndustries,
            child: Wrap(
              spacing: AppSpacing.s6,
              runSpacing: AppSpacing.s6,
              children: [for (final i in company.industries) BOHMetaChip(i)],
            ),
          ),
        ],
        if (hasContact || showEmptyContact) ...[
          gap,
          SectionCard(
            icon: AppIcons.email,
            title: l10n.companyContact,
            child: hasContact
                ? Column(
                    children: [
                      DetailLine(
                        icon: AppIcons.email,
                        value: company.contactEmail,
                      ),
                      DetailLine(
                        icon: AppIcons.phone,
                        value: company.contactPhone,
                      ),
                      DetailLine(
                        icon: AppIcons.website,
                        value: company.website,
                      ),
                    ],
                  )
                : Text(l10n.companyContactEmpty, style: context.text.bodySmall),
          ),
        ],
      ],
    );
  }
}
