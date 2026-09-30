import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/article.dart';
import '../controllers/news_providers.dart';

extension NewsOrderLabel on NewsOrder {
  String label(AppLocalizations l10n) => switch (this) {
    NewsOrder.forYou => l10n.newsFilterForYou,
    NewsOrder.latest => l10n.newsFilterLatest,
  };
}

extension NewsTopicLabel on NewsTopic {
  /// Full desk name, e.g. "Technical Briefings".
  String label(AppLocalizations l10n) => switch (this) {
    NewsTopic.technical => l10n.newsTopicTechnical,
    NewsTopic.regulatory => l10n.newsTopicRegulatory,
    NewsTopic.market => l10n.newsTopicMarket,
  };

  /// Short desk name for filters and tags, e.g. "Technical".
  String shortLabel(AppLocalizations l10n) => switch (this) {
    NewsTopic.technical => l10n.newsDeskTechnical,
    NewsTopic.regulatory => l10n.newsDeskRegulatory,
    NewsTopic.market => l10n.newsDeskMarket,
  };

  BOHTagVariant get tagVariant => switch (this) {
    NewsTopic.technical => BOHTagVariant.accent,
    NewsTopic.regulatory => BOHTagVariant.blue,
    NewsTopic.market => BOHTagVariant.amber,
  };

  IconData get icon => switch (this) {
    NewsTopic.technical => AppIcons.technology,
    NewsTopic.regulatory => AppIcons.shield,
    NewsTopic.market => AppIcons.trendingUp,
  };
}

/// "7 min read · 5h ago".
String articleMeta(AppLocalizations l10n, Article article) =>
    '${l10n.readTimeMinutes(article.readMinutes)} · '
    '${l10n.relativeTime(article.publishedAt)}';

/// Bookmark toggle shared by cards and the article screen. Confirms the
/// change in a snackbar and restores the previous state on failure.
class ArticleSaveButton extends ConsumerWidget {
  const ArticleSaveButton({
    super.key,
    required this.article,
    this.variant = BOHIconButtonVariant.plain,
    this.iconSize = AppSizes.iconMedium,
  });

  final Article article;
  final BOHIconButtonVariant variant;
  final double iconSize;

  Future<void> _toggle(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    String message;
    try {
      final saved = await ref
          .read(savedArticlesProvider.notifier)
          .toggle(article);
      message = saved ? l10n.articleSavedMessage : l10n.articleRemovedMessage;
    } catch (error) {
      message = l10n.error(error);
    }
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    ref.watch(savedArticlesProvider);
    final saved = ref.read(savedArticlesProvider.notifier).isSaved(article);
    final photo = variant == BOHIconButtonVariant.photo;

    return BOHIconButton(
      icon: saved ? AppIcons.saved : AppIcons.bookmark,
      semanticLabel: saved ? l10n.actionSaved : l10n.actionSave,
      variant: variant,
      active: photo && saved,
      iconSize: iconSize,
      color: photo
          ? null
          : saved
          ? context.colors.primaryText
          : context.colors.textSecondary,
      onPressed: () => _toggle(context, ref),
    );
  }
}

/// The lead briefing at the top of the News tab: photo fading in from the
/// end, the "Latest news" overline, title, summary and a Read More pill.
class NewsLeadCard extends StatelessWidget {
  const NewsLeadCard({super.key, required this.article, required this.onTap});

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final text = context.text;
    final c = context.colors;

    return BOHFadeImageCard(
      image: article.image,
      height: 164,
      imageWidth: 210,
      fadeWidth: 120,
      contentWidth: 190,
      borderRadius: AppRadii.heroAll,
      accentBorder: false,
      onTap: onTap,
      semanticLabel: '${article.title}. ${articleMeta(l10n, article)}',
      overlay: BOHButton(
        label: l10n.actionReadMore,
        variant: BOHButtonVariant.overlay,
        size: BOHButtonSize.compact,
        expand: false,
        onPressed: onTap,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BOHEyebrow(
            l10n.newsLatestEyebrow,
            lead: BOHEyebrowLead.skewBar,
            tracking: 3,
          ),
          const SizedBox(height: AppSpacing.s6),
          Text(
            article.title,
            style: text.h2.copyWith(height: 23 / 18),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Row(
            children: [
              Icon(AppIcons.clock, size: 12, color: c.textSecondary),
              const SizedBox(width: AppSpacing.s4),
              Flexible(
                child: Text(
                  articleMeta(l10n, article),
                  style: text.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// A briefing in the News list: desk tag, title and read time, with the
/// photo at the end.
class ArticleCard extends StatelessWidget {
  const ArticleCard({
    super.key,
    required this.article,
    required this.onTap,
    this.showSave = true,
  });

  final Article article;
  final VoidCallback onTap;
  final bool showSave;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;

    return BOHCard(
      onTap: onTap,
      borderRadius: AppRadii.listCardAll,
      padding: const EdgeInsets.all(AppSpacing.s10),
      semanticLabel: '${article.title}. ${articleMeta(l10n, article)}',
      child: Row(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsetsDirectional.only(start: AppSpacing.s4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      BOHTag(
                        article.topic.shortLabel(l10n),
                        variant: article.topic.tagVariant,
                      ),
                      const Spacer(),
                      if (showSave)
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: OverflowBox(
                            maxWidth: AppSizes.minTouchTarget,
                            maxHeight: AppSizes.minTouchTarget,
                            child: ArticleSaveButton(
                              article: article,
                              iconSize: 15,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s4),
                  Text(
                    article.title,
                    style: text.itemTitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.s4),
                  Row(
                    children: [
                      Icon(AppIcons.clock, size: 11, color: c.textSecondary),
                      const SizedBox(width: AppSpacing.s4),
                      Flexible(
                        child: Text(
                          articleMeta(l10n, article),
                          style: text.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.s12),
          BOHImage(
            image: article.image,
            width: 104,
            height: 78,
            borderRadius: AppRadii.smallAll,
          ),
        ],
      ),
    );
  }
}

/// Compact row for "Related briefings" — the list card without the save
/// action.
class ArticleListTile extends StatelessWidget {
  const ArticleListTile({
    super.key,
    required this.article,
    required this.onTap,
  });

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) =>
      ArticleCard(article: article, onTap: onTap, showSave: false);
}

class ArticleListSkeleton extends StatelessWidget {
  const ArticleListSkeleton({super.key, this.count = 3});

  final int count;

  @override
  Widget build(BuildContext context) {
    return BOHShimmer(
      child: Column(
        children: [
          for (var i = 0; i < count; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.gridGap),
              child: BOHSkeleton(
                height: 98,
                borderRadius: AppRadii.listCardAll,
              ),
            ),
        ],
      ),
    );
  }
}
