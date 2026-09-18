import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/domain/account_type.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../notifications/presentation/controllers/notifications_providers.dart';
import '../../../profile/data/profile_data.dart';
import '../../domain/article.dart';
import '../controllers/news_providers.dart';
import '../widgets/news_widgets.dart';

/// News & Insights: briefings from the Back Of House editorial desk. The
/// lead briefing first, then the curated list, filterable by desk.
class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});

  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  NewsFilter _filter = NewsFilter.forYou;
  String _query = '';

  NewsQuery get _key => (filter: _filter, query: _query);

  bool get _showLead => _filter == NewsFilter.forYou && _query.trim().isEmpty;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final articles = ref.watch(newsProvider(_key));
    final profile = ref.watch(myProfileProvider).value;
    final unread = ref.watch(unreadNotificationsProvider);
    final individual =
        ref.watch(sessionAccountTypeProvider) == AccountType.individual;

    return BOHScaffold(
      appBar: BOHAppBar.brand(
        title: l10n.navNews,
        // Notifications and the member avatar are the individual's; a
        // company reaches its profile from the bottom bar.
        actions: [
          if (individual) ...[
            BOHIconButton(
              icon: AppIcons.notifications,
              semanticLabel: unread > 0
                  ? l10n.notificationsUnreadCount(unread)
                  : l10n.notificationsLabel,
              showBadge: unread > 0,
              onPressed: () => context.push(AppRoutes.notifications),
            ),
            if (profile != null)
              BOHAvatar(
                name: profile.name,
                image: profile.avatar,
                size: BOHAvatarSize.small,
                semanticLabel: l10n.profileAvatarLabel,
                onTap: () => context.go(AppRoutes.profile),
              ),
          ],
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
                  BOHPageHeader(
                    eyebrow: l10n.newsEyebrow,
                    title: l10n.newsTitle,
                    subtitle: l10n.newsSubtitle,
                  ),
                  const SizedBox(height: AppSpacing.s16),
                  BOHSearchField(
                    hint: l10n.newsSearchHint,
                    onChanged: (q) => setState(() => _query = q),
                  ),
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 68,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: BOHScaffold.screenPadding.add(
                    const EdgeInsets.symmetric(vertical: AppSpacing.s12),
                  ),
                  children: [
                    for (final filter in NewsFilter.values)
                      Padding(
                        padding: const EdgeInsetsDirectional.only(
                          end: AppSpacing.s8,
                        ),
                        child: BOHCategoryChip(
                          label: filter.label(l10n),
                          selected: _filter == filter,
                          onSelected: () => setState(() => _filter = filter),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s4,
              sliver: BOHPagedSliverList<Article>(
                state: articles,
                skeleton: const ArticleListSkeleton(),
                emptyIcon: AppIcons.news,
                emptyTitle: l10n.newsEmptyTitle,
                emptyMessage: l10n.newsEmptyMessage,
                onLoadMore: () =>
                    ref.read(newsProvider(_key).notifier).loadMore(),
                onRetry: () => ref.invalidate(newsProvider(_key)),
                itemBuilder: (context, article, i) {
                  void open() => context.push(AppRoutes.article(article.id));
                  if (i == 0 && _showLead) {
                    return BOHFadeSlide(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          NewsLeadCard(article: article, onTap: open),
                          const SizedBox(height: AppSpacing.sectionSpacing),
                          BOHSectionHeader(
                            title: l10n.newsCurated,
                            subtitle: l10n.newsCuratedSubtitle,
                            trailing: BOHStatusLabel(
                              label: l10n.newsPeerReviewed,
                              color: c.primaryText,
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  return BOHFadeSlide(
                    delay: BOHFadeSlide.stagger(i),
                    child: ArticleCard(article: article, onTap: open),
                  );
                },
              ),
            ),
            if (articles.value?.items.isNotEmpty ?? false)
              const BOHSliverPadding(
                top: AppSpacing.sectionSpacing,
                sliver: SliverToBoxAdapter(child: EditorialStandardsCard()),
              ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}
