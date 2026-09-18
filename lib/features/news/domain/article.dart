import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';
import '../../../core/utils/paginated.dart';
import '../../auth/domain/account_type.dart';

/// Editorial desk an article is filed under.
enum NewsTopic { technical, regulatory, market }

/// The chips on the News tab: two orderings, then one per topic.
enum NewsFilter { forYou, latest, technical, regulatory, market }

typedef NewsQuery = ({NewsFilter filter, String query});

/// Byline of a named contributor. Articles without one credit their desk.
@immutable
class ArticleAuthor {
  const ArticleAuthor({
    required this.name,
    required this.role,
    this.photo,
    this.verified = false,
  });

  final String name;

  /// e.g. "VP Production, NEXA & Advisory Board".
  final String role;
  final AppImage? photo;
  final bool verified;
}

/// One piece of the article body, in reading order.
@immutable
sealed class ArticleBlock {
  const ArticleBlock();
}

final class ArticleParagraph extends ArticleBlock {
  const ArticleParagraph(this.text);

  final String text;
}

final class ArticleQuote extends ArticleBlock {
  const ArticleQuote({required this.text, required this.attribution});

  final String text;
  final String attribution;
}

/// Boxed call-out for an enforcement rule or deadline.
final class ArticleNotice extends ArticleBlock {
  const ArticleNotice({required this.title, required this.text});

  final String title;
  final String text;
}

/// A briefing published by the Back Of House editorial desk. Members read,
/// save, share, like and comment on articles; they never publish their own.
@immutable
class Article {
  const Article({
    required this.id,
    required this.topic,
    required this.category,
    required this.title,
    required this.summary,
    required this.source,
    required this.teaser,
    required this.readMinutes,
    required this.publishedAt,
    this.image,
    this.imageCaption,
    this.breaking = false,
    this.labels = const [],
    this.author,
    this.directives = const [],
    this.body = const [],
    this.keywords = const [],
    this.saved = false,
    this.likeCount = 0,
    this.liked = false,
    this.commentCount = 0,
  });

  final String id;
  final NewsTopic topic;

  /// Editorial label, e.g. "Technical Mandate".
  final String category;
  final String title;
  final String summary;

  /// Issuing body or desk, e.g. "General Entertainment Authority".
  final String source;

  /// One-line call-out under hero cards, e.g. "Compliance guidelines…".
  final String teaser;
  final int readMinutes;
  final DateTime publishedAt;
  final AppImage? image;
  final String? imageCaption;
  final bool breaking;

  /// Short labels set on the lead photo, e.g. "Mandate", "Civil Defense".
  final List<String> labels;
  final ArticleAuthor? author;

  /// Key rules summarised at the top of a regulatory briefing.
  final List<String> directives;
  final List<ArticleBlock> body;
  final List<String> keywords;
  final bool saved;
  final int likeCount;

  /// Whether the signed-in member likes the article.
  final bool liked;
  final int commentCount;

  Article copyWith({bool? saved}) => Article(
    id: id,
    topic: topic,
    category: category,
    title: title,
    summary: summary,
    source: source,
    teaser: teaser,
    readMinutes: readMinutes,
    publishedAt: publishedAt,
    image: image,
    imageCaption: imageCaption,
    breaking: breaking,
    labels: labels,
    author: author,
    directives: directives,
    body: body,
    keywords: keywords,
    saved: saved ?? this.saved,
    likeCount: likeCount,
    liked: liked,
    commentCount: commentCount,
  );
}

/// A member's comment on an article. Flat: no replies, reactions or edits.
@immutable
class ArticleComment {
  const ArticleComment({
    required this.id,
    required this.articleId,
    required this.authorName,
    required this.text,
    required this.createdAt,
    this.authorHeadline,
    this.authorAvatar,
    this.mine = false,
  });

  final String id;
  final String articleId;

  /// Snapshot of the author when the comment was posted.
  final String authorName;
  final String? authorHeadline;
  final AppImage? authorAvatar;
  final String text;
  final DateTime createdAt;

  /// Posted by the signed-in member, who may delete it.
  final bool mine;
}

enum CommentIssue { empty, tooLong }

/// Who may react to an article and what a comment may hold. The data layer
/// enforces these; screens use them to explain.
abstract final class ArticleEngagementRules {
  static const int commentMaxLength = 500;

  /// Liking and commenting are for individual members. Companies read
  /// articles and their comments.
  static bool canEngage(AccountType account) =>
      account == AccountType.individual;

  static CommentIssue? validateComment(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return CommentIssue.empty;
    if (trimmed.length > commentMaxLength) return CommentIssue.tooLong;
    return null;
  }
}

abstract interface class NewsRepository {
  Future<Paginated<Article>> getArticles(NewsQuery query, PageRequest request);

  Future<Article> getArticle(String id);

  /// Other briefings to read next, same desk first.
  Future<List<Article>> getRelated(String id);

  /// Adds or removes the article from the member's saved items.
  Future<Article> setSaved(String id, {required bool saved});

  /// Individuals only; returns the article with its updated count.
  Future<Article> setLiked(String id, {required bool liked});

  /// Newest first.
  Future<Paginated<ArticleComment>> getComments(
    String articleId,
    PageRequest request,
  );

  /// Individuals only. The text must pass
  /// [ArticleEngagementRules.validateComment].
  Future<ArticleComment> addComment(String articleId, String text);

  /// Only the author may delete a comment.
  Future<void> deleteComment(String articleId, String commentId);
}
