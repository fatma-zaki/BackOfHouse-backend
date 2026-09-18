import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/article.dart';
import '../controllers/news_providers.dart';
import '../widgets/article_engagement.dart';
import '../widgets/news_widgets.dart';

/// A full briefing. Individual members like and comment; everyone can read
/// the comments, save and share.
class ArticleDetailsScreen extends ConsumerWidget {
  const ArticleDetailsScreen({super.key, required this.articleId});

  final String articleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final article = ref.watch(articleDetailProvider(articleId));

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.articleDetailsTitle,
        actions: [
          if (article.value case final value?)
            ArticleSaveButton(article: value),
          BOHIconButton(
            icon: AppIcons.share,
            semanticLabel: l10n.actionShare,
            onPressed: () => ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(content: Text(l10n.comingSoonMessage))),
          ),
        ],
      ),
      body: switch (article) {
        AsyncData(:final value) => _Body(article: value),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(articleDetailProvider(articleId)),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        EdgeInsets.only(
          top: AppSpacing.s8,
          bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
        ),
      ),
      children: [
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: BOHTag(article.category),
        ),
        const SizedBox(height: AppSpacing.s12),
        Semantics(
          header: true,
          child: Text(article.title, style: context.text.h1),
        ),
        const SizedBox(height: AppSpacing.s16),
        _Byline(article: article),
        const SizedBox(height: AppSpacing.s16),
        _LeadImage(article: article),
        if (article.directives.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s20),
          _Directives(directives: article.directives),
        ],
        const SizedBox(height: AppSpacing.s20),
        for (final block in article.body) ...[
          switch (block) {
            ArticleParagraph(:final text) => Text(
              text,
              style: context.text.bodyLarge,
            ),
            ArticleQuote() => _QuoteBlock(quote: block),
            ArticleNotice() => _NoticeBlock(notice: block),
          },
          const SizedBox(height: AppSpacing.s16),
        ],
        if (article.keywords.isNotEmpty) ...[
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [
              for (final k in article.keywords)
                BOHTag(k, variant: BOHTagVariant.outline),
            ],
          ),
          const SizedBox(height: AppSpacing.s4),
        ],
        const SizedBox(height: AppSpacing.s16),
        ArticleEngagementBar(article: article),
        const SizedBox(height: AppSpacing.sectionSpacing),
        ArticleCommentsSection(article: article),
        const SizedBox(height: AppSpacing.sectionSpacing),
        BOHSectionHeader(
          title: l10n.articleRelated,
          actionLabel: l10n.actionViewAll,
          onAction: () => context.go(AppRoutes.news),
        ),
        const SizedBox(height: AppSpacing.s12),
        _Related(articleId: article.id),
        const SizedBox(height: AppSpacing.s8),
        Divider(height: 1, color: c.borderSoft),
      ],
    );
  }
}

class _Byline extends StatelessWidget {
  const _Byline({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final author = article.author;
    final published = [
      l10n.articlePublished(
        AppDateFormats.mediumDate(context).format(article.publishedAt),
      ),
      l10n.readTimeMinutes(article.readMinutes),
    ].join(' · ');

    return MergeSemantics(
      child: Row(
        children: [
          BOHAvatar(
            name: author?.name ?? article.source,
            image: author?.photo,
            size: BOHAvatarSize.medium,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        author?.name ?? article.source,
                        style: context.text.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (author?.verified ?? false) ...[
                      const SizedBox(width: AppSpacing.s4),
                      Icon(
                        AppIcons.verified,
                        size: AppSizes.iconSmall,
                        color: c.gold,
                        semanticLabel: l10n.verifiedLabel,
                      ),
                    ],
                  ],
                ),
                if (author != null)
                  Text(
                    author.role,
                    style: context.text.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                Text(published, style: context.text.caption),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LeadImage extends StatelessWidget {
  const _LeadImage({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final caption = article.imageCaption;
    return ClipRRect(
      borderRadius: AppRadii.mediumAll,
      child: AspectRatio(
        aspectRatio: 16 / 10,
        child: Stack(
          fit: StackFit.expand,
          children: [
            BOHImage(
              image: article.image,
              scrim: caption == null
                  ? BOHImageScrim.none
                  : BOHImageScrim.bottom,
              semanticLabel: caption,
            ),
            if (caption != null)
              PositionedDirectional(
                start: AppSpacing.s12,
                end: AppSpacing.s12,
                bottom: AppSpacing.s12,
                child: ExcludeSemantics(
                  child: Row(
                    children: [
                      const Icon(
                        AppIcons.camera,
                        size: 14,
                        color: AppColors.onPhoto,
                      ),
                      const SizedBox(width: AppSpacing.s8),
                      Expanded(
                        child: Text(
                          caption,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.onPhoto,
                          ),
                        ),
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

class _Directives extends StatelessWidget {
  const _Directives({required this.directives});

  final List<String> directives;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.s16),
      decoration: BoxDecoration(
        color: c.primaryWash,
        borderRadius: AppRadii.mediumAll,
        border: BorderDirectional(
          start: BorderSide(color: c.primary, width: 3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const BOHIconCircle(icon: AppIcons.report, size: 32),
              const SizedBox(width: AppSpacing.s8),
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(
                    l10n.articleDirectives,
                    style: context.text.cardTitle,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          for (final d in directives)
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
                  Expanded(
                    child: Text(
                      d,
                      style: context.text.body.copyWith(color: c.textPrimary),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _QuoteBlock extends StatelessWidget {
  const _QuoteBlock({required this.quote});

  final ArticleQuote quote;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s16),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: c.borderSoft),
      ),
      child: MergeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '“${quote.text}”',
              style: context.text.h3.copyWith(
                color: c.primaryText,
                fontStyle: context.isArabic ? null : FontStyle.italic,
              ),
            ),
            const SizedBox(height: AppSpacing.s12),
            BOHEyebrow(quote.attribution, showRule: true),
          ],
        ),
      ),
    );
  }
}

class _NoticeBlock extends StatelessWidget {
  const _NoticeBlock({required this.notice});

  final ArticleNotice notice;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s16),
      decoration: BoxDecoration(
        color: c.warning.withValues(alpha: c.isDark ? 0.14 : 0.10),
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: c.warning.withValues(alpha: 0.4)),
      ),
      child: MergeSemantics(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(AppIcons.error, size: AppSizes.iconMedium, color: c.warning),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(notice.title, style: context.text.label),
                  const SizedBox(height: AppSpacing.s4),
                  Text(notice.text, style: context.text.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Related extends ConsumerWidget {
  const _Related({required this.articleId});

  final String articleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final related = ref.watch(relatedArticlesProvider(articleId));
    return switch (related) {
      AsyncData(:final value) => Column(
        children: [
          for (final a in value)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s12),
              child: ArticleListTile(
                article: a,
                onTap: () => context.push(AppRoutes.article(a.id)),
              ),
            ),
        ],
      ),
      AsyncError() => const SizedBox.shrink(),
      _ => const BOHShimmer(
        child: Column(
          children: [
            BOHSkeleton(height: 88, borderRadius: AppRadii.mediumAll),
            SizedBox(height: AppSpacing.s12),
            BOHSkeleton(height: 88, borderRadius: AppRadii.mediumAll),
          ],
        ),
      ),
    };
  }
}
