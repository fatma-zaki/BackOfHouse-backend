import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../../l10n/l10n_messages.dart';
import '../buttons/boh_button.dart';
import '../motion/boh_fade_slide.dart';

/// Loading placeholder for a whole region. For content-shaped loading
/// (lists, cards) prefer a `BOHShimmer` skeleton instead.
class BOHLoadingState extends StatelessWidget {
  const BOHLoadingState({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    final text = message ?? context.l10n.stateLoading;
    return Semantics(
      liveRegion: true,
      label: text,
      excludeSemantics: true,
      child: _StateLayout(
        emblem: SizedBox.square(
          dimension: 28,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: context.colors.primary,
          ),
        ),
        tone: _Tone.brand,
        title: null,
        message: text,
      ),
    );
  }
}

/// Something failed. Pass [error] to derive a localized message from it.
class BOHErrorState extends StatelessWidget {
  const BOHErrorState({
    super.key,
    this.error,
    this.title,
    this.message,
    this.onRetry,
  });

  final Object? error;
  final String? title;
  final String? message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return _StateLayout(
      emblem: Icon(
        AppIcons.error,
        size: AppSizes.iconLarge,
        color: context.colors.error,
      ),
      tone: _Tone.error,
      title: title ?? l10n.errorStateTitle,
      message:
          message ??
          (error == null ? l10n.errorStateMessage : l10n.error(error!)),
      action: onRetry == null
          ? null
          : BOHSecondaryButton(
              label: l10n.actionRetry,
              onPressed: onRetry,
              size: BOHButtonSize.medium,
              leadingIcon: AppIcons.refresh,
              trailingIcon: null,
              expand: false,
            ),
    );
  }
}

/// Nothing to show — yet.
class BOHEmptyState extends StatelessWidget {
  const BOHEmptyState({
    super.key,
    this.icon = AppIcons.empty,
    this.title,
    this.message,
    this.actionLabel,
    this.onAction,
    this.extra,
  });

  /// The default [AppIcons.empty] draws the design's search illustration;
  /// any other icon is shown in a soft violet disc.
  final IconData icon;

  /// Extra content between message and action (suggestion chips).
  final Widget? extra;
  final String? title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return _StateLayout(
      emblem: icon == AppIcons.empty
          ? null
          : Icon(
              icon,
              size: AppSizes.iconLarge,
              color: context.colors.primaryText,
            ),
      illustration: icon == AppIcons.empty,
      tone: _Tone.brand,
      title: title ?? l10n.emptyStateTitle,
      message: message ?? l10n.emptyStateMessage,
      extra: extra,
      action: actionLabel == null || onAction == null
          ? null
          : BOHButton(
              label: actionLabel!,
              onPressed: onAction,
              size: BOHButtonSize.medium,
              trailingIcon: null,
              expand: false,
            ),
    );
  }
}

enum _Tone { brand, error }

class _StateLayout extends StatelessWidget {
  const _StateLayout({
    required this.emblem,
    required this.tone,
    required this.title,
    required this.message,
    this.action,
    this.extra,
    this.illustration = false,
  });

  final Widget? emblem;
  final Widget? extra;
  final bool illustration;
  final _Tone tone;
  final String? title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final accent = tone == _Tone.error ? c.error : c.primary;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.s32),
        child: BOHFadeSlide(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 320),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (illustration)
                  const _EmptyIllustration()
                else
                  Container(
                    width: 72,
                    height: 72,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: tone == _Tone.error
                          ? accent.withValues(alpha: 0.12)
                          : c.primaryTint,
                    ),
                    child: emblem,
                  ),
                const SizedBox(height: AppSpacing.s16),
                if (title != null) ...[
                  Text(
                    title!,
                    style: context.text.title.copyWith(
                      fontSize: 21,
                      height: 28 / 21,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.s8),
                ],
                Text(
                  message,
                  style: context.text.body,
                  textAlign: TextAlign.center,
                ),
                if (extra != null) ...[
                  const SizedBox(height: AppSpacing.s16),
                  extra!,
                ],
                if (action != null) ...[
                  const SizedBox(height: AppSpacing.s24),
                  action!,
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The design's "nothing found" mark: two offset rounded squares and a
/// magnifier. Built from shapes, so it follows the theme.
class _EmptyIllustration extends StatelessWidget {
  const _EmptyIllustration();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    Widget square({required Color fill}) => Container(
      width: 84,
      height: 84,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.borderAccent, width: 2),
      ),
    );
    return ExcludeSemantics(
      child: SizedBox(
        width: 150,
        height: 130,
        child: Stack(
          children: [
            Positioned(
              left: 18,
              top: 10,
              child: Transform.rotate(
                angle: -0.14,
                child: square(fill: c.surface),
              ),
            ),
            Positioned(left: 40, top: 24, child: square(fill: c.primaryTint)),
            Positioned(
              left: 70,
              top: 50,
              child: Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: c.primary, width: 5),
                ),
              ),
            ),
            Positioned(
              left: 112,
              top: 104,
              child: Transform.rotate(
                angle: 0.785,
                child: Container(
                  width: 28,
                  height: 7,
                  decoration: BoxDecoration(
                    color: c.primary,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 128,
              top: 16,
              child: Container(width: 12, height: 12, color: c.primary),
            ),
          ],
        ),
      ),
    );
  }
}
