import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/article.dart';
import '../controllers/news_providers.dart';
import '../widgets/news_widgets.dart';

/// News: briefings from the Back Of House editorial desk. The lead
/// briefing, desk filters, then the briefings list in the chosen order.
/// Shared by both account types; there are no member posts.
class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});

  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  NewsOrder _order = NewsOrder.forYou;
  NewsTopic? _topic;
  String _query = '';
  bool _searching = false;

  NewsQuery get _key => (order: _order, topic: _topic, query: _query);

  /// The lead card shows only on the unfiltered "For you" feed.
  bool get _showLead =>
      _order == NewsOrder.forYou && _topic == null && _query.trim().isEmpty;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final articles = ref.watch(newsProvider(_key));
    final items = articles.value?.items ?? const <Article>[];
    final lead = _showLead && items.isNotEmpty ? items.first : null;

    return BOHScaffold(
      appBar: BOHAppBar.tab(
        title: l10n.navNews,
        actions: [
          BOHIconButton(
            icon: _searching ? AppIcons.close : AppIcons.search,
            iconSize: 21,
            semanticLabel: _searching
                ? l10n.actionClearSearch
                : l10n.newsSearchHint,
            onPressed: () => setState(() {
              _searching = !_searching;
              if (!_searching) _query = '';
            }),
          ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () => ref.read(newsProvider(_key).notifier).refresh(),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverList.list(
                children: [
                  if (_searching) ...[
                    BOHSearchField(
                      hint: l10n.newsSearchHint,
                      autofocus: true,
                      onChanged: (q) => setState(() => _query = q),
                    ),
                    const SizedBox(height: AppSpacing.s14),
                  ],
                  if (lead != null) ...[
                    BOHFadeSlide(
                      child: NewsLeadCard(
                        article: lead,
                        onTap: () => context.push(AppRoutes.article(lead.id)),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s14),
                  ],
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<NewsTopic?>(
                options: [null, ...NewsTopic.values],
                selected: _topic,
                label: (t) => t?.shortLabel(l10n) ?? l10n.newsAllDesks,
                style: BOHChipStyle.violet,
                large: true,
                padding: BOHScaffold.screenPadding,
                onSelected: (t) => setState(() => _topic = t),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s10,
              sliver: SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.gridGap),
                  child: BOHSectionHeader(
                    title: l10n.newsBriefings,
                    trailing: Semantics(
                      label: l10n.newsOrderLabel,
                      child: BOHSegmentedControl<NewsOrder>(
                        style: BOHSegmentedStyle.compact,
                        segments: [
                          for (final o in NewsOrder.values) (o, o.label(l10n)),
                        ],
                        selected: _order,
                        onChanged: (o) => setState(() => _order = o),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            BOHSliverPadding(
              sliver: BOHPagedSliverList<Article>(
                state: articles,
                spacing: AppSpacing.gridGap,
                skeleton: const ArticleListSkeleton(),
                emptyIcon: AppIcons.news,
                emptyTitle: l10n.newsEmptyTitle,
                emptyMessage: l10n.newsEmptyMessage,
                onLoadMore: () =>
                    ref.read(newsProvider(_key).notifier).loadMore(),
                onRetry: () => ref.invalidate(newsProvider(_key)),
                itemBuilder: (context, article, i) {
                  // The lead is shown above; the list continues after it.
                  if (lead != null && article.id == lead.id) {
                    return const SizedBox.shrink();
                  }
                  return BOHFadeSlide(
                    delay: BOHFadeSlide.stagger(i),
                    child: ArticleCard(
                      article: article,
                      onTap: () => context.push(AppRoutes.article(article.id)),
                    ),
                  );
                },
              ),
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}
