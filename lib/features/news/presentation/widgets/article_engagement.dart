import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../domain/article.dart';
import '../controllers/news_providers.dart';

void _showMessage(BuildContext context, String message) =>
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));

/// Like toggle and comment count under an article. Companies see the counts;
/// only individual members can like.
class ArticleEngagementBar extends ConsumerWidget {
  const ArticleEngagementBar({super.key, required this.article});

  final Article article;

  Future<void> _toggleLike(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(articleEngagementProvider.notifier).toggleLike(article);
    } catch (error) {
      if (context.mounted) _showMessage(context, context.l10n.error(error));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;
    ref.watch(articleEngagementProvider);
    final engagement = ref.read(articleEngagementProvider.notifier).of(article);
    final canEngage = ArticleEngagementRules.canEngage(
      ref.watch(sessionAccountTypeProvider),
    );

    return Wrap(
      spacing: AppSpacing.s12,
      runSpacing: AppSpacing.s8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Semantics(
          value: l10n.articleLikeCount(engagement.likes),
          child: BOHCategoryChip(
            icon: AppIcons.like,
            // The label changes with the state, so it never rests on colour.
            label:
                '${engagement.liked ? l10n.articleLiked : l10n.articleLike}'
                ' · ${engagement.likes}',
            selected: engagement.liked,
            onSelected: canEngage ? () => _toggleLike(context, ref) : null,
          ),
        ),
        MergeSemantics(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                AppIcons.comment,
                size: AppSizes.iconSmall,
                color: c.textMuted,
              ),
              const SizedBox(width: AppSpacing.s4),
              Text(
                l10n.articleCommentsCount(engagement.comments),
                style: context.text.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Members' comments on an article, newest first, with a composer for
/// individual members. Flat: no replies or reactions.
class ArticleCommentsSection extends ConsumerWidget {
  const ArticleCommentsSection({super.key, required this.article});

  final Article article;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final provider = articleCommentsProvider(article.id);
    final comments = ref.watch(provider);
    final canEngage = ArticleEngagementRules.canEngage(
      ref.watch(sessionAccountTypeProvider),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHSectionHeader(title: l10n.articleComments),
        const SizedBox(height: AppSpacing.s12),
        if (canEngage)
          _Composer(article: article)
        else
          BOHInfoNote(l10n.articleCommentsMembersOnly),
        const SizedBox(height: AppSpacing.s16),
        switch (comments) {
          AsyncValue(:final value?) when value.items.isEmpty => Text(
            l10n.articleCommentsEmpty,
            style: context.text.bodySmall,
          ),
          AsyncValue(:final value?) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (final (i, comment) in value.items.indexed) ...[
                if (i > 0) const BOHDivider(),
                _CommentTile(article: article, comment: comment),
              ],
              if (value.hasMore)
                BOHButton(
                  label: l10n.articleCommentsMore,
                  variant: BOHButtonVariant.text,
                  trailingIcon: null,
                  isLoading: value.isLoadingMore,
                  onPressed: () => ref.read(provider.notifier).loadMore(),
                ),
            ],
          ),
          AsyncError() => Row(
            children: [
              Expanded(
                child: Text(
                  l10n.articleCommentsError,
                  style: context.text.bodySmall,
                ),
              ),
              BOHButton(
                label: l10n.actionRetry,
                variant: BOHButtonVariant.text,
                trailingIcon: null,
                expand: false,
                onPressed: () => ref.invalidate(provider),
              ),
            ],
          ),
          _ => const BOHShimmer(
            child: Column(
              children: [
                BOHSkeleton(height: 64, borderRadius: AppRadii.mediumAll),
                SizedBox(height: AppSpacing.s12),
                BOHSkeleton(height: 64, borderRadius: AppRadii.mediumAll),
              ],
            ),
          ),
        },
      ],
    );
  }
}

class _Composer extends ConsumerStatefulWidget {
  const _Composer({required this.article});

  final Article article;

  @override
  ConsumerState<_Composer> createState() => _ComposerState();
}

class _ComposerState extends ConsumerState<_Composer> {
  final _controller = TextEditingController();
  var _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _canSend =>
      !_sending &&
      ArticleEngagementRules.validateComment(_controller.text) == null;

  Future<void> _send() async {
    setState(() => _sending = true);
    try {
      await ref
          .read(articleCommentsProvider(widget.article.id).notifier)
          .add(widget.article, _controller.text);
      _controller.clear();
      if (mounted) FocusScope.of(context).unfocus();
    } catch (error) {
      if (mounted) _showMessage(context, context.l10n.error(error));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final user = ref.watch(authControllerProvider).value;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (user != null) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s4),
            child: BOHAvatar(
              name: user.fullName,
              image: user.avatar,
              size: BOHAvatarSize.small,
            ),
          ),
          const SizedBox(width: AppSpacing.s8),
        ],
        Expanded(
          child: BOHTextField(
            controller: _controller,
            hint: l10n.articleCommentHint,
            minLines: 1,
            maxLines: 4,
            keyboardType: TextInputType.multiline,
            textCapitalization: TextCapitalization.sentences,
            inputFormatters: [
              LengthLimitingTextInputFormatter(
                ArticleEngagementRules.commentMaxLength,
              ),
            ],
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(width: AppSpacing.s8),
        BOHIconButton(
          icon: AppIcons.send,
          semanticLabel: l10n.articleCommentPost,
          variant: BOHIconButtonVariant.filled,
          size: AppSizes.inputHeight,
          onPressed: _canSend ? _send : null,
        ),
      ],
    );
  }
}

class _CommentTile extends ConsumerWidget {
  const _CommentTile({required this.article, required this.comment});

  final Article article;
  final ArticleComment comment;

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final l10n = context.l10n;
    final confirmed = await showBOHSheet<bool>(
      context,
      builder: (sheet) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.articleCommentDeleteTitle, style: sheet.text.h2),
          const SizedBox(height: AppSpacing.s8),
          Text(l10n.articleCommentDeleteBody, style: sheet.text.body),
          const SizedBox(height: AppSpacing.s20),
          BOHButton(
            label: l10n.actionDelete,
            trailingIcon: null,
            onPressed: () => Navigator.of(sheet).pop(true),
          ),
          const SizedBox(height: AppSpacing.s8),
          BOHButton(
            label: l10n.actionCancel,
            variant: BOHButtonVariant.ghost,
            trailingIcon: null,
            onPressed: () => Navigator.of(sheet).pop(false),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await ref
          .read(articleCommentsProvider(article.id).notifier)
          .delete(article, comment);
      if (context.mounted) _showMessage(context, l10n.articleCommentDeleted);
    } catch (error) {
      if (context.mounted) _showMessage(context, l10n.error(error));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BOHAvatar(
            name: comment.authorName,
            image: comment.authorAvatar,
            size: BOHAvatarSize.small,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: MergeSemantics(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: AppSpacing.s8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(comment.authorName, style: context.text.label),
                      if (comment.mine) BOHTag(l10n.articleCommentYou),
                      Text(
                        l10n.relativeTime(comment.createdAt),
                        style: context.text.caption,
                      ),
                    ],
                  ),
                  if (comment.authorHeadline case final headline?)
                    Text(
                      headline,
                      style: context.text.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: AppSpacing.s4),
                  Text(
                    comment.text,
                    style: context.text.body.copyWith(color: c.textPrimary),
                  ),
                ],
              ),
            ),
          ),
          if (comment.mine)
            BOHIconButton(
              icon: AppIcons.delete,
              semanticLabel: l10n.articleCommentDelete,
              color: c.textMuted,
              onPressed: () => _delete(context, ref),
            ),
        ],
      ),
    );
  }
}
