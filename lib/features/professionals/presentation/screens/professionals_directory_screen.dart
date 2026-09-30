import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/professional.dart';
import '../controllers/professionals_providers.dart';

/// Professionals and students in the community (individuals only). A
/// "Highlighted" tag marks a Profile Highlight bought with points — never
/// verification, never paid placement.
class ProfessionalsDirectoryScreen extends ConsumerStatefulWidget {
  const ProfessionalsDirectoryScreen({super.key});

  @override
  ConsumerState<ProfessionalsDirectoryScreen> createState() =>
      _ProfessionalsDirectoryScreenState();
}

class _ProfessionalsDirectoryScreenState
    extends ConsumerState<ProfessionalsDirectoryScreen> {
  ProfessionalFilter? _filter;
  String _query = '';

  Future<void> _connect(ProfessionalsQuery key, Professional person) async {
    try {
      await ref
          .read(professionalsDirectoryProvider(key).notifier)
          .toggleConnect(person);
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
    final ProfessionalsQuery key = (filter: _filter, query: _query.trim());

    String label(ProfessionalFilter f) => switch (f) {
      ProfessionalFilter.producers => l10n.professionalsFilterProducers,
      ProfessionalFilter.designers => l10n.professionalsFilterDesigners,
      ProfessionalFilter.technical => l10n.professionalsFilterTechnical,
      ProfessionalFilter.students => l10n.professionalsFilterStudents,
    };

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.directoryProfessionals),
      body: BOHRefresh(
        onRefresh: () async =>
            ref.invalidate(professionalsDirectoryProvider(key)),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverToBoxAdapter(
                child: BOHSearchField(
                  hint: l10n.professionalsSearchHint,
                  onChanged: (q) => setState(() => _query = q),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<ProfessionalFilter?>(
                options: [null, ...ProfessionalFilter.values],
                selected: _filter,
                label: (f) => f == null ? l10n.filterAll : label(f),
                onSelected: (f) => setState(() => _filter = f),
              ),
            ),
            BOHSliverPadding(
              sliver: BOHPagedSliverList<Professional>(
                state: ref.watch(professionalsDirectoryProvider(key)),
                emptyIcon: AppIcons.professionals,
                emptyTitle: l10n.professionalsEmpty,
                emptyMessage: l10n.newsEmptyMessage,
                onLoadMore: () => ref
                    .read(professionalsDirectoryProvider(key).notifier)
                    .loadMore(),
                onRetry: () =>
                    ref.invalidate(professionalsDirectoryProvider(key)),
                itemBuilder: (context, person, i) => ProfessionalDirectoryCard(
                  professional: person,
                  onConnect: () => _connect(key, person),
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

/// A person in the directory: avatar (with the verified check), name and
/// the Highlighted tag, role and city, Connect, and skills.
class ProfessionalDirectoryCard extends StatelessWidget {
  const ProfessionalDirectoryCard({
    super.key,
    required this.professional,
    required this.onConnect,
  });

  final Professional professional;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final p = professional;
    return BOHCard(
      tone: p.highlighted ? BOHCardTone.warning : BOHCardTone.normal,
      semanticLabel: [
        p.name,
        if (p.highlighted) l10n.professionalsHighlighted,
        p.role,
        p.city,
      ].join('. '),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BOHAvatar(
                name: p.name,
                image: p.avatar,
                dimension: 50,
                verified: p.verified,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: AppSpacing.s6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(p.name, style: context.text.itemTitle),
                        if (p.highlighted)
                          BOHTag(
                            l10n.professionalsHighlighted,
                            variant: BOHTagVariant.highlight,
                          ),
                      ],
                    ),
                    Text(
                      [p.role, p.city].join(' · '),
                      style: context.text.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              BOHButton(
                label: p.connected ? l10n.actionConnected : l10n.actionConnect,
                variant: p.connected
                    ? BOHButtonVariant.primary
                    : BOHButtonVariant.secondary,
                size: BOHButtonSize.compact,
                trailingIcon: null,
                expand: false,
                onPressed: onConnect,
              ),
            ],
          ),
          if (p.skills.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s10),
            Wrap(
              spacing: AppSpacing.s6,
              runSpacing: AppSpacing.s6,
              children: [for (final s in p.skills.take(3)) BOHMetaChip(s)],
            ),
          ],
        ],
      ),
    );
  }
}
