import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../data/news_data.dart';
import '../../domain/article.dart';

class NewsController extends PagedNotifier<Article> {
  NewsController(this.query);

  final NewsQuery query;

  @override
  void watchDependencies() => ref.watch(contentLanguageProvider);

  @override
  Future<Paginated<Article>> fetchPage(PageRequest request) =>
      ref.read(newsRepositoryProvider).getArticles(query, request);
}

final newsProvider = AsyncNotifierProvider.autoDispose
    .family<NewsController, PagedState<Article>, NewsQuery>(NewsController.new);

final articleDetailProvider = FutureProvider.autoDispose
    .family<Article, String>((ref, id) {
      ref.watch(contentLanguageProvider);
      return ref.watch(newsRepositoryProvider).getArticle(id);
    });

final relatedArticlesProvider = FutureProvider.autoDispose
    .family<List<Article>, String>((ref, id) {
      ref.watch(contentLanguageProvider);
      return ref.watch(newsRepositoryProvider).getRelated(id);
    });

/// Save toggles made this session, keyed by article id.
///
/// Lists and details load articles independently; reading `saved` through
/// [isSaved] keeps every card for the same article in step without
/// refetching.
class SavedArticlesController extends Notifier<Map<String, bool>> {
  @override
  Map<String, bool> build() => const {};

  bool isSaved(Article article) => state[article.id] ?? article.saved;

  /// Optimistic; rolls back and rethrows if the call fails. Returns the new
  /// state.
  Future<bool> toggle(Article article) async {
    final next = !isSaved(article);
    state = {...state, article.id: next};
    try {
      await ref.read(newsRepositoryProvider).setSaved(article.id, saved: next);
      return next;
    } catch (error, stack) {
      state = {...state, article.id: !next};
      Error.throwWithStackTrace(error, stack);
    }
  }
}

final savedArticlesProvider =
    NotifierProvider<SavedArticlesController, Map<String, bool>>(
      SavedArticlesController.new,
    );

/// A member's like on an article and its visible counts, as changed this
/// session. Like [SavedArticlesController], it keeps every view of the same
/// article in step without refetching.
typedef ArticleEngagement = ({bool liked, int likes, int comments});

class ArticleEngagementController
    extends Notifier<Map<String, ArticleEngagement>> {
  @override
  Map<String, ArticleEngagement> build() => const {};

  ArticleEngagement of(Article article) =>
      state[article.id] ??
      (
        liked: article.liked,
        likes: article.likeCount,
        comments: article.commentCount,
      );

  /// Optimistic; rolls back and rethrows if the call fails.
  Future<void> toggleLike(Article article) async {
    final before = of(article);
    state = {
      ...state,
      article.id: (
        liked: !before.liked,
        likes: before.likes + (before.liked ? -1 : 1),
        comments: before.comments,
      ),
    };
    try {
      final updated = await ref
          .read(newsRepositoryProvider)
          .setLiked(article.id, liked: !before.liked);
      state = {
        ...state,
        article.id: (
          liked: updated.liked,
          likes: updated.likeCount,
          comments: of(article).comments,
        ),
      };
    } catch (error, stack) {
      state = {...state, article.id: before};
      Error.throwWithStackTrace(error, stack);
    }
  }

  void _adjustComments(Article article, int delta) {
    final current = of(article);
    state = {
      ...state,
      article.id: (
        liked: current.liked,
        likes: current.likes,
        comments: current.comments + delta,
      ),
    };
  }
}

final articleEngagementProvider =
    NotifierProvider<
      ArticleEngagementController,
      Map<String, ArticleEngagement>
    >(ArticleEngagementController.new);

/// Comments on one article, newest first.
class ArticleCommentsController extends PagedNotifier<ArticleComment> {
  ArticleCommentsController(this.articleId);

  final String articleId;

  @override
  void watchDependencies() => ref.watch(contentLanguageProvider);

  @override
  Future<Paginated<ArticleComment>> fetchPage(PageRequest request) =>
      ref.read(newsRepositoryProvider).getComments(articleId, request);

  /// Posts [text] and puts the comment at the top. Rethrows on failure.
  Future<void> add(Article article, String text) async {
    final comment = await ref
        .read(newsRepositoryProvider)
        .addComment(articleId, text);
    _setItems((items) => [comment, ...items]);
    ref.read(articleEngagementProvider.notifier)._adjustComments(article, 1);
  }

  /// Deletes the member's own comment. Rethrows on failure.
  Future<void> delete(Article article, ArticleComment comment) async {
    await ref.read(newsRepositoryProvider).deleteComment(articleId, comment.id);
    _setItems(
      (items) => [
        for (final c in items)
          if (c.id != comment.id) c,
      ],
    );
    ref.read(articleEngagementProvider.notifier)._adjustComments(article, -1);
  }

  void _setItems(
    List<ArticleComment> Function(List<ArticleComment> items) change,
  ) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(items: change(current.items)));
  }
}

final articleCommentsProvider = AsyncNotifierProvider.autoDispose
    .family<ArticleCommentsController, PagedState<ArticleComment>, String>(
      ArticleCommentsController.new,
    );
