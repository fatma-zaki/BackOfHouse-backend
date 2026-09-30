import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../discover/presentation/controllers/discover_providers.dart';
import '../../domain/company.dart';
import '../../domain/company_type.dart';
import '../controllers/company_directory_providers.dart';

/// Companies in the ecosystem (individuals only): search, type filters,
/// the editor's "Companies to Watch" (never "Featured") and the directory.
class CompaniesDirectoryScreen extends ConsumerStatefulWidget {
  const CompaniesDirectoryScreen({super.key});

  @override
  ConsumerState<CompaniesDirectoryScreen> createState() =>
      _CompaniesDirectoryScreenState();
}

class _CompaniesDirectoryScreenState
    extends ConsumerState<CompaniesDirectoryScreen> {
  CompanyType? _type;
  String _query = '';

  static const _filters = [
    CompanyType.eventOrganizer,
    CompanyType.venue,
    CompanyType.supplier,
    CompanyType.agency,
  ];

  Future<void> _follow(CompaniesQuery key, Company company) async {
    try {
      await ref
          .read(companiesDirectoryProvider(key).notifier)
          .toggleFollow(company);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(context.l10n.error(error))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final CompaniesQuery key = (type: _type, query: _query.trim());
    final browsing = _type == null && key.query.isEmpty;

    String label(CompanyType t) => switch (t) {
      CompanyType.eventOrganizer => l10n.companiesFilterOrganizers,
      CompanyType.venue => l10n.companiesFilterVenues,
      CompanyType.supplier => l10n.companiesFilterSuppliers,
      _ => l10n.companiesFilterAgencies,
    };

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.routeCompanies),
      body: BOHRefresh(
        onRefresh: () async => ref.invalidate(companiesDirectoryProvider(key)),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverToBoxAdapter(
                child: BOHSearchField(
                  hint: l10n.companiesSearchHint,
                  onChanged: (q) => setState(() => _query = q),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<CompanyType?>(
                options: [null, ..._filters],
                selected: _type,
                label: (t) => t == null ? l10n.filterAll : label(t),
                onSelected: (t) => setState(() => _type = t),
              ),
            ),
            if (browsing)
              const BOHSliverPadding(
                sliver: SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: AppSpacing.s12),
                    child: _CompaniesToWatch(),
                  ),
                ),
              ),
            BOHSliverPadding(
              sliver: BOHPagedSliverList<Company>(
                state: ref.watch(companiesDirectoryProvider(key)),
                emptyIcon: AppIcons.companies,
                emptyTitle: l10n.companiesEmpty,
                emptyMessage: l10n.newsEmptyMessage,
                onLoadMore: () => ref
                    .read(companiesDirectoryProvider(key).notifier)
                    .loadMore(),
                onRetry: () => ref.invalidate(companiesDirectoryProvider(key)),
                itemBuilder: (context, company, i) => CompanyDirectoryCard(
                  company: company,
                  onFollow: () => _follow(key, company),
                ),
              ),
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}

/// The editor's pick of companies: a soft violet strip of three tiles.
class _CompaniesToWatch extends ConsumerWidget {
  const _CompaniesToWatch();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;
    final picks = ref.watch(companiesToWatchProvider).value;
    if (picks == null || picks.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.s14),
      decoration: BoxDecoration(
        color: c.primaryTint,
        borderRadius: AppRadii.largeAll,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const BOHGlyph(BOHGlyphType.star, size: 16),
              const SizedBox(width: AppSpacing.s6),
              Expanded(
                child: Text(
                  l10n.homeCompaniesToWatch,
                  style: context.text.itemTitle,
                ),
              ),
              Text(
                l10n.companiesEditorsPick,
                style: context.text.caption.copyWith(fontSize: 10.5),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s10),
          Row(
            children: [
              for (final (i, company) in picks.take(3).indexed) ...[
                if (i > 0) const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: BOHPressable(
                    onTap: () => context.push(AppRoutes.company(company.id)),
                    semanticLabel: company.name,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.s10,
                        horizontal: AppSpacing.s6,
                      ),
                      decoration: BoxDecoration(
                        color: c.surface,
                        borderRadius: AppRadii.mediumAll,
                      ),
                      child: Column(
                        children: [
                          BOHCompanyLogo(name: company.name, size: 44),
                          const SizedBox(height: AppSpacing.s6),
                          Text(
                            company.name,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: context.text.labelMedium.copyWith(
                              fontSize: 11,
                              height: 14 / 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// A company in the directory: logo, name and verification, what it does
/// and where, Follow, and its services.
class CompanyDirectoryCard extends StatelessWidget {
  const CompanyDirectoryCard({
    super.key,
    required this.company,
    required this.onFollow,
  });

  final Company company;
  final VoidCallback onFollow;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final co = company;
    return BOHCard(
      onTap: () => context.push(AppRoutes.company(co.id)),
      semanticLabel: '${co.name}. ${co.specialization}. ${co.city}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BOHCompanyLogo(name: co.name, size: 50),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            co.name,
                            style: context.text.itemTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (co.verified) ...[
                          const SizedBox(width: 5),
                          BOHGlyph(
                            BOHGlyphType.verified,
                            size: 14,
                            semanticLabel: l10n.verifiedLabel,
                          ),
                        ],
                      ],
                    ),
                    Text(
                      [co.specialization, co.city].join(' · '),
                      style: context.text.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              BOHButton(
                label: co.followed ? l10n.actionFollowing : l10n.actionFollow,
                variant: co.followed
                    ? BOHButtonVariant.primary
                    : BOHButtonVariant.secondary,
                size: BOHButtonSize.compact,
                trailingIcon: null,
                expand: false,
                onPressed: onFollow,
              ),
            ],
          ),
          if (co.services.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s10),
            Wrap(
              spacing: AppSpacing.s6,
              runSpacing: AppSpacing.s6,
              children: [for (final s in co.services.take(3)) BOHMetaChip(s)],
            ),
          ],
        ],
      ),
    );
  }
}
