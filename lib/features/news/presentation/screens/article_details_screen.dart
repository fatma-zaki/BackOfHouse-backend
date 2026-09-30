import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
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

    return switch (article) {
      AsyncData(:final value) => BOHScaffold(
        body: BOHPhotoPage(
          image: value.image,
          height: 270,
          leading: BOHIconButton(
            icon: AppIcons.arrowBack,
            semanticLabel: l10n.actionBack,
            variant: BOHIconButtonVariant.photo,
            onPressed: () => context.pop(),
          ),
          actions: [
            BOHIconButton(
              icon: AppIcons.share,
              iconSize: 19,
              semanticLabel: l10n.actionShare,
              variant: BOHIconButtonVariant.photo,
              onPressed: () => ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(SnackBar(content: Text(l10n.comingSoonMessage))),
            ),
            ArticleSaveButton(
              article: value,
              variant: BOHIconButtonVariant.photo,
              iconSize: 19,
            ),
          ],
          body: _Body(article: value),
        ),
      ),
      AsyncError(:final error) => BOHScaffold(
        appBar: BOHAppBar(title: l10n.articleDetailsTitle),
        body: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(articleDetailProvider(articleId)),
        ),
      ),
      _ => BOHScaffold(
        appBar: BOHAppBar(title: l10n.articleDetailsTitle),
        body: const BOHLoadingState(),
      ),
    };
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.formHorizontal,
        AppSpacing.s20,
        AppSpacing.formHorizontal,
        AppSpacing.s24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Flexible(
                child: BOHTag(
                  article.category,
                  variant: article.topic.tagVariant,
                  large: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s10),
          Semantics(
            header: true,
            child: Text(article.title, style: context.text.h1),
          ),
          const SizedBox(height: AppSpacing.s14),
          _Byline(article: article),
          const SizedBox(height: AppSpacing.s14),
          if (article.directives.isNotEmpty) ...[
            _Directives(directives: article.directives),
            const SizedBox(height: AppSpacing.s16),
          ],
          for (final (i, block) in article.body.indexed) ...[
            switch (block) {
              ArticleParagraph(:final text) => Text(
                text,
                style: context.text.article.copyWith(
                  color: i == 0 ? c.textPrimary : c.articleSecondary,
                ),
              ),
              ArticleQuote(:final text, :final attribution) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  BOHBanner(text, tone: BOHBannerTone.quote),
                  const SizedBox(height: AppSpacing.s6),
                  Padding(
                    padding: const EdgeInsetsDirectional.only(
                      start: AppSpacing.s16,
                    ),
                    child: Text(attribution, style: context.text.caption),
                  ),
                ],
              ),
              ArticleNotice(:final title, :final text) => BOHAlertCard(
                title: title,
                message: text,
              ),
            },
            const SizedBox(height: AppSpacing.s16),
          ],
          if (article.keywords.isNotEmpty) ...[
            Wrap(
              spacing: AppSpacing.s8,
              runSpacing: AppSpacing.s8,
              children: [for (final k in article.keywords) BOHMetaChip(k)],
            ),
            const SizedBox(height: AppSpacing.s16),
          ],
          ArticleEngagementBar(article: article),
          const SizedBox(height: AppSpacing.s20),
          ArticleCommentsSection(article: article),
          const SizedBox(height: AppSpacing.s20),
          BOHSectionHeader(
            title: l10n.articleRelated,
            onAction: () => context.go(AppRoutes.news),
          ),
          const SizedBox(height: AppSpacing.gridGap),
          _Related(articleId: article.id),
        ],
      ),
    );
  }
}

/// Author (or desk) with date and read time, above a hairline.
class _Byline extends StatelessWidget {
  const _Byline({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final author = article.author;
    final meta = [
      AppDateFormats.mediumDate(context).format(article.publishedAt),
      l10n.readTimeMinutes(article.readMinutes),
    ].join(' · ');

    return Container(
      padding: const EdgeInsets.only(bottom: AppSpacing.s14),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: c.border)),
      ),
      child: MergeSemantics(
        child: Row(
          children: [
            if (author != null)
              BOHAvatar(name: author.name, image: author.photo, dimension: 36)
            else
              // Desk briefings carry the Back Of House mark.
              Container(
                width: 36,
                height: 36,
                padding: const EdgeInsets.all(5),
                decoration: const BoxDecoration(
                  color: AppColors.photoInk,
                  shape: BoxShape.circle,
                ),
                child: const BOHLogo(height: 13, onDark: true),
              ),
            const SizedBox(width: AppSpacing.s10),
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
                        BOHGlyph(
                          BOHGlyphType.verified,
                          size: 14,
                          semanticLabel: l10n.verifiedLabel,
                        ),
                      ],
                    ],
                  ),
                  Text(meta, style: context.text.caption),
                ],
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
    return BOHCard(
      tone: BOHCardTone.accent,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(l10n.articleDirectives, style: context.text.cardTitle),
          ),
          const SizedBox(height: AppSpacing.s10),
          for (final d in directives)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: BOHCheckBullet(d),
            ),
        ],
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
              padding: const EdgeInsets.only(bottom: AppSpacing.gridGap),
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
