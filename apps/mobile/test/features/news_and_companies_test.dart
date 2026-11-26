import 'package:backofhouse/core/network/api_exception.dart';
import 'package:backofhouse/core/utils/paginated.dart';
import 'package:backofhouse/features/auth/domain/account_type.dart';
import 'package:backofhouse/features/auth/domain/app_user.dart';
import 'package:backofhouse/features/companies/data/companies_data.dart';
import 'package:backofhouse/features/companies/domain/company.dart';
import 'package:backofhouse/features/companies/domain/company_membership.dart';
import 'package:backofhouse/features/companies/domain/company_type.dart';
import 'package:backofhouse/features/news/data/news_data.dart';
import 'package:backofhouse/features/news/domain/article.dart';
import 'package:backofhouse/features/opportunities/data/opportunities_data.dart';
import 'package:backofhouse/features/opportunities/domain/opportunity.dart';
import 'package:flutter_test/flutter_test.dart';

const _member = AppUser(
  id: 'u1',
  fullName: 'Sara Al-Qahtani',
  email: 'sara@crew.sa',
  accountType: AccountType.individual,
  headline: 'Stage Manager',
);

const _otherMember = AppUser(
  id: 'u2',
  fullName: 'Omar Haddad',
  email: 'omar@crew.sa',
  accountType: AccountType.individual,
);

const _companyAccount = AppUser(
  id: 'c1',
  fullName: 'Lina Al-Saud',
  email: 'ops@lumen.sa',
  accountType: AccountType.company,
  membership: CompanyMembership(
    company: CompanySummary(
      id: 'lumen',
      name: 'Lumen Staging',
      type: CompanyType.production,
    ),
    role: CompanyRole.owner,
  ),
);

const _article = 'rigging-mandate-2026';

NewsMockDataSource _news(AppUser? Function() user) => NewsMockDataSource(
  language: () => 'en',
  latency: Duration.zero,
  user: user,
);

Matcher _apiError(ApiErrorType type) =>
    throwsA(isA<ApiException>().having((e) => e.type, 'type', type));

void main() {
  group('article engagement', () {
    test('only individual members may like and comment', () {
      expect(ArticleEngagementRules.canEngage(AccountType.individual), isTrue);
      expect(ArticleEngagementRules.canEngage(AccountType.company), isFalse);
    });

    test('a comment is 1–500 characters after trimming', () {
      expect(ArticleEngagementRules.validateComment('   '), CommentIssue.empty);
      expect(
        ArticleEngagementRules.validateComment('x' * 501),
        CommentIssue.tooLong,
      );
      expect(ArticleEngagementRules.validateComment(' Great read '), isNull);
    });

    test('liking counts once and can be undone', () async {
      final source = _news(() => _member);
      final before = await source.getArticle(_article);

      final liked = await source.setLiked(_article, liked: true);
      expect(liked.liked, isTrue);
      expect(liked.likeCount, before.likeCount + 1);

      final again = await source.setLiked(_article, liked: true);
      expect(again.likeCount, before.likeCount + 1);

      final unliked = await source.setLiked(_article, liked: false);
      expect(unliked.liked, isFalse);
      expect(unliked.likeCount, before.likeCount);
    });

    test('companies read comments but cannot like or comment', () async {
      final source = _news(() => _companyAccount);
      final comments = await source.getComments(_article, const PageRequest());
      expect(comments.items, isNotEmpty);
      expect(
        () => source.setLiked(_article, liked: true),
        _apiError(ApiErrorType.forbidden),
      );
      expect(
        () => source.addComment(_article, 'Hello'),
        _apiError(ApiErrorType.forbidden),
      );
    });

    test('a comment is posted newest first with the author snapshot', () async {
      final source = _news(() => _member);
      final before = await source.getArticle(_article);

      final comment = await source.addComment(_article, '  Useful update.  ');
      expect(comment.text, 'Useful update.');
      expect(comment.authorName, _member.fullName);
      expect(comment.authorHeadline, _member.headline);
      expect(comment.mine, isTrue);

      final page = await source.getComments(_article, const PageRequest());
      expect(page.items.first.id, comment.id);
      expect(
        (await source.getArticle(_article)).commentCount,
        before.commentCount + 1,
      );
    });

    test('empty or overlong comments are rejected', () async {
      final source = _news(() => _member);
      expect(
        () => source.addComment(_article, '  '),
        _apiError(ApiErrorType.validation),
      );
      expect(
        () => source.addComment(_article, 'x' * 501),
        _apiError(ApiErrorType.validation),
      );
    });

    test('only the author may delete a comment', () async {
      var current = _member;
      final source = _news(() => current);
      final comment = await source.addComment(_article, 'Mine');

      current = _otherMember;
      final seen = await source.getComments(_article, const PageRequest());
      expect(seen.items.firstWhere((c) => c.id == comment.id).mine, isFalse);
      await expectLater(
        () => source.deleteComment(_article, comment.id),
        _apiError(ApiErrorType.forbidden),
      );

      current = _member;
      await source.deleteComment(_article, comment.id);
      final after = await source.getComments(_article, const PageRequest());
      expect(after.items.map((c) => c.id), isNot(contains(comment.id)));
    });
  });

  group('company public profile', () {
    final companies = CompaniesMockDataSource(
      language: () => 'en',
      latency: Duration.zero,
    );

    test('every company an opportunity names has a profile', () async {
      final opportunities = OpportunitiesMockDataSource(
        language: () => 'en',
        latency: Duration.zero,
        audience: () => OpportunityAudience.individual,
      );
      final page = await opportunities.getOpportunities((
        type: null,
        query: '',
      ), const PageRequest(pageSize: 100));
      for (final o in page.items) {
        final company = await companies.getCompany(o.company.id);
        expect(company.name, o.company.name, reason: o.company.id);
      }
    });

    test('an unknown company is not found', () {
      expect(
        () => companies.getCompany('nope'),
        _apiError(ApiErrorType.notFound),
      );
    });

    test('its listings are published and individual-facing only', () async {
      final opportunities = OpportunitiesMockDataSource(
        language: () => 'en',
        latency: Duration.zero,
        audience: () => OpportunityAudience.individual,
      );
      final listings = await opportunities.getByCompany('midan');
      expect(listings, isNotEmpty);
      for (final o in listings) {
        expect(o.company.id, 'midan');
        expect(o.status, OpportunityStatus.published);
        expect(o.type.audience, OpportunityAudience.individual);
      }
    });
  });
}
