import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/article.dart';
import '../controllers/news_providers.dart';

extension NewsFilterLabel on NewsFilter {
  String label(AppLocalizations l10n) => switch (this) {
    NewsFilter.forYou => l10n.newsFilterForYou,
    NewsFilter.latest => l10n.newsFilterLatest,
    NewsFilter.technical => l10n.newsTopicTechnical,
    NewsFilter.regulatory => l10n.newsTopicRegulatory,
    NewsFilter.market => l10n.newsTopicMarket,
  };
}

extension NewsTopicLabel on NewsTopic {
  String label(AppLocalizations l10n) => switch (this) {
    NewsTopic.technical => l10n.newsTopicTechnical,
    NewsTopic.regulatory => l10n.newsTopicRegulatory,
    NewsTopic.market => l10n.newsTopicMarket,
  };

  IconData get icon => switch (this) {
    NewsTopic.technical => AppIcons.technology,
    NewsTopic.regulatory => AppIcons.shield,
    NewsTopic.market => AppIcons.trendingUp,
  };
}

/// Bookmark toggle shared by cards and the article screen. Confirms the
/// change in a snackbar and restores the previous state on failure.
class ArticleSaveButton extends ConsumerWidget {
  const ArticleSaveButton({
    super.key,
    required this.article,
    this.variant = BOHIconButtonVariant.plain,
  });

  final Article article;
  final BOHIconButtonVariant variant;

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

    return BOHIconButton(
      icon: saved ? AppIcons.saved : AppIcons.bookmark,
      semanticLabel: saved ? l10n.actionSaved : l10n.actionSave,
      variant: variant,
      color: saved ? context.colors.primaryText : null,
      onPressed: () => _toggle(context, ref),
    );
  }
}

/// Opaque label set on photography — legible over any image.
class _PhotoLabel extends StatelessWidget {
  const _PhotoLabel(this.text, {this.dotColor});

  final String text;
  final Color? dotColor;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8 + 2,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.pillAll,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dotColor != null) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: AppSpacing.s4),
          ],
          Text(
            context.isArabic ? text : text.toUpperCase(),
            style: AppTypography.caption.copyWith(
              color: c.primaryText,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ArticleMeta extends StatelessWidget {
  const _ArticleMeta({required this.article, this.showDate = false});

  final Article article;
  final bool showDate;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final parts = [
      article.source,
      if (showDate)
        AppDateFormats.mediumDate(context).format(article.publishedAt),
      l10n.readTimeMinutes(article.readMinutes),
    ];
    return Row(
      children: [
        Icon(
          article.topic.icon,
          size: AppSizes.iconSmall,
          color: c.primaryText,
        ),
        const SizedBox(width: AppSpacing.s8),
        Expanded(
          child: Text(
            parts.join(' · '),
            style: context.text.caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

/// The lead briefing at the top of the News tab.
class NewsLeadCard extends StatelessWidget {
  const NewsLeadCard({super.key, required this.article, required this.onTap});

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      semanticLabel: '${article.title}. ${article.source}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: article.image),
                PositionedDirectional(
                  top: AppSpacing.s12,
                  start: AppSpacing.s12,
                  end: AppSpacing.s64,
                  child: Wrap(
                    spacing: AppSpacing.s8,
                    runSpacing: AppSpacing.s8,
                    children: [
                      for (final (i, label) in article.labels.indexed)
                        _PhotoLabel(label, dotColor: i == 0 ? null : c.error),
                    ],
                  ),
                ),
                PositionedDirectional(
                  top: AppSpacing.s4,
                  end: AppSpacing.s4,
                  child: ArticleSaveButton(
                    article: article,
                    variant: BOHIconButtonVariant.tonal,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.s16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BOHEyebrow(article.category, color: c.primaryText),
                const SizedBox(height: AppSpacing.s8),
                Semantics(
                  header: true,
                  child: Text(article.title, style: context.text.h2),
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  article.summary,
                  style: context.text.body,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.s12),
                _ArticleMeta(article: article, showDate: true),
                const SizedBox(height: AppSpacing.s12),
                Divider(height: 1, color: c.borderSoft),
                const SizedBox(height: AppSpacing.s4),
                Row(
                  children: [
                    BOHButton(
                      label: l10n.actionReadFullBriefing,
                      variant: BOHButtonVariant.text,
                      expand: false,
                      onPressed: onTap,
                    ),
                    const Spacer(),
                    BOHTag(
                      article.topic.label(l10n),
                      variant: BOHTagVariant.outline,
                      icon: article.topic.icon,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A briefing in the News list.
class ArticleCard extends StatelessWidget {
  const ArticleCard({super.key, required this.article, required this.onTap});

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return BOHCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      semanticLabel: '${article.title}. ${article.source}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: article.image),
                PositionedDirectional(
                  top: AppSpacing.s12,
                  start: AppSpacing.s12,
                  end: AppSpacing.s64,
                  child: Align(
                    alignment: AlignmentDirectional.topStart,
                    child: _PhotoLabel(article.category),
                  ),
                ),
                PositionedDirectional(
                  top: AppSpacing.s4,
                  end: AppSpacing.s4,
                  child: ArticleSaveButton(
                    article: article,
                    variant: BOHIconButtonVariant.tonal,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(article.title, style: context.text.h3),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  article.summary,
                  style: context.text.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.s12),
                _ArticleMeta(article: article),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact row for "Related Briefings".
class ArticleListTile extends StatelessWidget {
  const ArticleListTile({
    super.key,
    required this.article,
    required this.onTap,
  });

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      onTap: onTap,
      semanticLabel:
          '${article.title}. ${l10n.readTimeMinutes(article.readMinutes)}',
      child: Row(
        children: [
          BOHImage(
            image: article.image,
            width: 64,
            height: 64,
            borderRadius: AppRadii.smallAll,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BOHEyebrow(article.category, color: c.primaryText),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  article.title,
                  style: context.text.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.s4),
                Row(
                  children: [
                    Icon(AppIcons.clock, size: 14, color: c.textMuted),
                    const SizedBox(width: AppSpacing.s4),
                    Text(
                      l10n.readTimeMinutes(article.readMinutes),
                      style: context.text.caption,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Icon(
            AppIcons.chevronForward,
            size: AppSizes.iconMedium,
            color: c.textMuted,
          ),
        ],
      ),
    );
  }
}

/// Closing note on who writes the briefings.
class EditorialStandardsCard extends StatelessWidget {
  const EditorialStandardsCard({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.s20),
      decoration: BoxDecoration(
        color: c.primaryWash,
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: c.primaryTint),
      ),
      child: MergeSemantics(
        child: Column(
          children: [
            const BOHIconCircle(icon: AppIcons.identity, size: 44),
            const SizedBox(height: AppSpacing.s12),
            Text(
              l10n.newsStandardsTitle,
              style: context.text.label,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s4),
            Text(
              l10n.newsStandardsBody,
              style: context.text.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class ArticleListSkeleton extends StatelessWidget {
  const ArticleListSkeleton({super.key, this.count = 2});

  final int count;

  @override
  Widget build(BuildContext context) {
    return BOHShimmer(
      child: Column(
        children: [
          for (var i = 0; i < count; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.s12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  BOHSkeleton(height: 180, borderRadius: AppRadii.mediumAll),
                  SizedBox(height: AppSpacing.s12),
                  BOHSkeleton.line(height: 16),
                  SizedBox(height: AppSpacing.s8),
                  BOHSkeleton.line(width: 200),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
