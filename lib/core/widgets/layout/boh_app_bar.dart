import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../brand/boh_logo.dart';
import '../buttons/boh_icon_button.dart';
import '../media/boh_glyph.dart';
import 'boh_section_header.dart';

enum _BOHAppBarKind { back, brand, tab, company }

/// Top bar (56 tall, no background — the page ground shows through).
///
/// * [BOHAppBar.brand]   — logo, divider and tagline (Home).
/// * [BOHAppBar.tab]     — skew bar and a 24px title (Discover, News, …).
/// * [BOHAppBar.company] — company logo, name, verified badge, subtitle
///   (Company dashboard).
/// * [BOHAppBar.new]     — bordered back (or close) button and title, with
///   an optional [overline] or [subtitle]; [centerTitle] for detail screens.
class BOHAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BOHAppBar({
    super.key,
    this.title,
    this.subtitle,
    this.overline,
    this.actions = const [],
    this.showBack,
    this.onBack,
    this.closeIcon = false,
    this.centerTitle = false,
    this.titleWidget,
  }) : _kind = _BOHAppBarKind.back,
       leading = null,
       verified = false;

  const BOHAppBar.brand({super.key, this.actions = const []})
    : _kind = _BOHAppBarKind.brand,
      title = null,
      subtitle = null,
      overline = null,
      showBack = false,
      onBack = null,
      closeIcon = false,
      centerTitle = false,
      titleWidget = null,
      leading = null,
      verified = false;

  const BOHAppBar.tab({super.key, required this.title, this.actions = const []})
    : _kind = _BOHAppBarKind.tab,
      subtitle = null,
      overline = null,
      showBack = false,
      onBack = null,
      closeIcon = false,
      centerTitle = false,
      titleWidget = null,
      leading = null,
      verified = false;

  const BOHAppBar.company({
    super.key,
    required this.title,
    required this.leading,
    this.subtitle,
    this.verified = false,
    this.actions = const [],
  }) : _kind = _BOHAppBarKind.company,
       overline = null,
       showBack = false,
       onBack = null,
       closeIcon = false,
       centerTitle = false,
       titleWidget = null;

  final String? title;
  final String? subtitle;

  /// Small muted line above the title (applicant detail).
  final String? overline;
  final List<Widget> actions;

  /// Defaults to whether the route can pop.
  final bool? showBack;
  final VoidCallback? onBack;

  /// Use a close (×) button instead of the back arrow.
  final bool closeIcon;
  final bool centerTitle;

  /// Replaces the title text, e.g. the centred logo on sign-in or step
  /// dashes on multi-step forms.
  final Widget? titleWidget;

  /// Company logo for [BOHAppBar.company].
  final Widget? leading;
  final bool verified;
  final _BOHAppBarKind _kind;

  @override
  Size get preferredSize => const Size.fromHeight(AppSizes.appBarHeight);

  @override
  Widget build(BuildContext context) {
    final (content, EdgeInsetsDirectional padding) = switch (_kind) {
      _BOHAppBarKind.brand => (
        _brand(context),
        const EdgeInsetsDirectional.only(start: 16, end: 8),
      ),
      _BOHAppBarKind.tab => (
        _tab(context),
        EdgeInsetsDirectional.only(start: 20, end: actions.isEmpty ? 20 : 8),
      ),
      _BOHAppBarKind.company => (
        _company(context),
        const EdgeInsetsDirectional.only(start: 16, end: 8),
      ),
      _BOHAppBarKind.back => (
        _back(context),
        const EdgeInsetsDirectional.symmetric(horizontal: 16),
      ),
    };

    return SafeArea(
      bottom: false,
      child: SizedBox(
        height: preferredSize.height,
        child: Padding(padding: padding, child: content),
      ),
    );
  }

  Widget _withActions(Widget lead) => Row(
    children: [
      Expanded(child: lead),
      for (final action in actions) action,
    ],
  );

  Widget _brand(BuildContext context) {
    final c = context.colors;
    return _withActions(
      Row(
        children: [
          const BOHLogo(),
          const SizedBox(width: AppSpacing.s10),
          Container(width: 1, height: 26, color: c.border),
          const SizedBox(width: AppSpacing.s10),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Text(
                context.l10n.appTagline,
                maxLines: 2,
                style: context.text.eyebrow.copyWith(
                  fontSize: 9,
                  height: 13 / 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: context.isArabic ? 0 : 2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tab(BuildContext context) => _withActions(
    Row(
      children: [
        const BOHSkewBar(height: 24),
        const SizedBox(width: AppSpacing.s10),
        Flexible(
          child: Semantics(
            header: true,
            child: Text(
              title!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.h1,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _company(BuildContext context) => _withActions(
    Row(
      children: [
        ?leading,
        const SizedBox(width: AppSpacing.s10),
        Flexible(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      title!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.label.copyWith(fontSize: 14),
                    ),
                  ),
                  if (verified) ...[
                    const SizedBox(width: 5),
                    BOHGlyph(
                      BOHGlyphType.verified,
                      size: 14,
                      semanticLabel: context.l10n.verifiedLabel,
                    ),
                  ],
                ],
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.caption,
                ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _back(BuildContext context) {
    final canPop = showBack ?? GoRouter.of(context).canPop();
    final l10n = context.l10n;
    final back = canPop
        ? BOHIconButton(
            icon: closeIcon ? AppIcons.close : AppIcons.arrowBack,
            iconSize: closeIcon ? 18 : 20,
            semanticLabel: closeIcon ? l10n.actionClose : l10n.actionBack,
            variant: BOHIconButtonVariant.outlined,
            onPressed: onBack ?? () => context.pop(),
          )
        : null;

    final titleBlock =
        titleWidget ??
        (title == null
            ? const SizedBox.shrink()
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: centerTitle
                    ? CrossAxisAlignment.center
                    : CrossAxisAlignment.start,
                children: [
                  if (overline != null)
                    Text(
                      overline!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.caption.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  Semantics(
                    header: true,
                    child: Text(
                      title!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: centerTitle || overline != null
                          ? context.text.h3
                          : subtitle != null
                          ? context.text.appBarTitle.copyWith(
                              fontSize: 19,
                              height: 24 / 19,
                            )
                          : context.text.appBarTitle,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodySmall,
                    ),
                ],
              ));

    if (centerTitle) {
      return Row(
        children: [
          back ?? const SizedBox(width: AppSizes.minTouchTarget),
          Expanded(child: Center(child: titleBlock)),
          if (actions.isEmpty)
            const SizedBox(width: AppSizes.minTouchTarget)
          else
            ...actions,
        ],
      );
    }

    return Row(
      children: [
        if (back != null) ...[back, const SizedBox(width: AppSpacing.s12)],
        Expanded(child: titleBlock),
        ...actions,
      ],
    );
  }
}

/// Progress dashes for multi-step flows ("▬ ▬ Step 1 of 2").
class BOHStepDashes extends StatelessWidget {
  const BOHStepDashes({
    super.key,
    required this.current,
    required this.total,
    this.label,
    this.dashWidth = 28,
  });

  /// 1-based.
  final int current;
  final int total;
  final String? label;
  final double dashWidth;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      label: label,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 1; i <= total; i++) ...[
            if (i > 1) const SizedBox(width: AppSpacing.s4),
            Container(
              width: dashWidth,
              height: 5,
              decoration: BoxDecoration(
                color: i <= current ? c.primary : c.border,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ],
          if (label != null) ...[
            const SizedBox(width: AppSpacing.s10),
            ExcludeSemantics(
              child: Text(
                label!,
                style: context.text.labelMedium.copyWith(
                  color: c.textSecondary,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
