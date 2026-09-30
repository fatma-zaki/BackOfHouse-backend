import 'package:flutter/widgets.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';

/// Horizontal status tracker — application stages. Steps up to and
/// including [reached] (0-based) are done; `-1` means none.
class BOHStatusTracker extends StatelessWidget {
  const BOHStatusTracker({
    super.key,
    required this.steps,
    required this.reached,
    this.semanticLabel,
  });

  final List<String> steps;
  final int reached;

  /// Announced once for the whole tracker, e.g. "Step 3 of 5: Shortlisted".
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      label: semanticLabel,
      excludeSemantics: semanticLabel != null,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final slot = constraints.maxWidth / steps.length;
          return Stack(
            children: [
              // Connectors run between node centres.
              for (var i = 0; i < steps.length - 1; i++)
                PositionedDirectional(
                  top: 9,
                  start: slot * i + slot / 2,
                  width: slot,
                  child: Container(
                    height: 3,
                    color: i + 1 <= reached ? c.primary : c.border,
                  ),
                ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (var i = 0; i < steps.length; i++)
                    Expanded(
                      child: Column(
                        children: [
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: i <= reached ? c.primary : c.surface,
                              border: Border.all(
                                color: i <= reached ? c.primary : c.border,
                                width: 2,
                              ),
                            ),
                            child: i <= reached
                                ? Icon(
                                    AppIcons.check,
                                    size: 10,
                                    color: c.onPrimary,
                                  )
                                : null,
                          ),
                          const SizedBox(height: AppSpacing.s6),
                          Text(
                            steps[i],
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: context.text.labelMedium.copyWith(
                              fontSize: 10,
                              height: 13 / 10,
                              color: i <= reached
                                  ? c.textPrimary
                                  : c.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

enum BOHStepState { done, current, pending }

/// Vertical step card — "Get verified" steps. The current step gets a
/// violet border and may carry an [action].
class BOHStepCard extends StatelessWidget {
  const BOHStepCard({
    super.key,
    required this.number,
    required this.title,
    required this.state,
    this.subtitle,
    this.action,
  });

  final int number;
  final String title;
  final String? subtitle;
  final BOHStepState state;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final current = state == BOHStepState.current;
    final (Color fill, Widget mark) = switch (state) {
      BOHStepState.done => (
        c.statusSuccess.background,
        Icon(AppIcons.check, size: 14, color: c.statusSuccess.foreground),
      ),
      BOHStepState.current => (
        c.primary,
        Text('$number', style: context.text.number(13, color: c.onPrimary)),
      ),
      BOHStepState.pending => (
        c.primaryTint,
        Text('$number', style: context.text.number(13, color: c.textSecondary)),
      ),
    };
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.listCardAll,
        border: Border.all(
          color: current ? c.primary : c.border,
          width: current ? AppSizes.outline : AppSizes.hairline,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: fill, shape: BoxShape.circle),
            child: mark,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: context.text.label),
                if (subtitle != null)
                  Text(subtitle!, style: context.text.caption),
              ],
            ),
          ),
          if (action != null) ...[
            const SizedBox(width: AppSpacing.s8),
            action!,
          ],
        ],
      ),
    );
  }
}

/// Numbered instruction — "1  Open the event…".
class BOHNumberedStep extends StatelessWidget {
  const BOHNumberedStep({super.key, required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: c.primaryTint,
            shape: BoxShape.circle,
          ),
          child: Text(
            '$number',
            style: context.text.number(13, color: c.primaryText),
          ),
        ),
        const SizedBox(width: AppSpacing.s12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              text,
              style: context.text.body.copyWith(
                height: 19 / 13,
                color: c.textPrimary,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Check-marked bullet — requirements and responsibilities.
class BOHCheckBullet extends StatelessWidget {
  const BOHCheckBullet(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          margin: const EdgeInsets.only(top: 1),
          decoration: BoxDecoration(
            color: c.primaryTint,
            shape: BoxShape.circle,
          ),
          child: Icon(AppIcons.check, size: 12, color: c.primaryText),
        ),
        const SizedBox(width: AppSpacing.s10),
        Expanded(
          child: Text(
            text,
            style: context.text.body.copyWith(color: c.textPrimary),
          ),
        ),
      ],
    );
  }
}
