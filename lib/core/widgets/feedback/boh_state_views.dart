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
  });

  final IconData icon;
  final String? title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return _StateLayout(
      emblem: Icon(
        icon,
        size: AppSizes.iconLarge,
        color: context.colors.primaryText,
      ),
      tone: _Tone.brand,
      title: title ?? l10n.emptyStateTitle,
      message: message ?? l10n.emptyStateMessage,
      action: actionLabel == null || onAction == null
          ? null
          : BOHSecondaryButton(
              label: actionLabel!,
              onPressed: onAction,
              size: BOHButtonSize.medium,
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
  });

  final Widget emblem;
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
                Container(
                  width: 72,
                  height: 72,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: c.isDark
                        ? c.surface
                        : accent.withValues(alpha: 0.08),
                    border: c.isDark
                        ? Border.all(color: accent.withValues(alpha: 0.4))
                        : null,
                    boxShadow: c.isDark
                        ? [
                            BoxShadow(
                              color: accent.withValues(alpha: 0.18),
                              blurRadius: 28,
                            ),
                          ]
                        : null,
                  ),
                  child: emblem,
                ),
                const SizedBox(height: AppSpacing.s24),
                if (title != null) ...[
                  Text(
                    title!,
                    style: context.text.h3,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.s8),
                ],
                Text(
                  message,
                  style: context.text.body,
                  textAlign: TextAlign.center,
                ),
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
