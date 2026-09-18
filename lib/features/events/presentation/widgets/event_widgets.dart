import 'package:flutter/material.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/event.dart';

extension EventTypeL10n on EventType {
  /// Plural filter label.
  String filterLabel(AppLocalizations l10n) => switch (this) {
    EventType.conference => l10n.eventFilterConferences,
    EventType.workshop => l10n.eventFilterWorkshops,
    EventType.networking => l10n.eventFilterNetworking,
    EventType.expo => l10n.eventFilterExpos,
  };
}

/// "NOV / 18" block.
class EventDateBadge extends StatelessWidget {
  const EventDateBadge({super.key, required this.date, this.size = 52});

  final DateTime date;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final month = AppDateFormats.monthShort(context).format(date);
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: c.primaryWash,
          borderRadius: AppRadii.smallAll,
          border: Border.all(color: c.primaryTint),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              context.isArabic ? month : month.toUpperCase(),
              style: context.text.caption.copyWith(color: c.primaryText),
              maxLines: 1,
            ),
            Text(
              AppDateFormats.day(context).format(date),
              style: context.text.h3.copyWith(
                color: c.primaryText,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Icon + small text line.
class EventMetaLine extends StatelessWidget {
  const EventMetaLine({super.key, required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      children: [
        Icon(icon, size: 14, color: c.textMuted),
        const SizedBox(width: AppSpacing.s4),
        Flexible(
          child: Text(
            text,
            style: context.text.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

/// Compact row — Home "Upcoming Industry Events" and the Events list.
class EventListItem extends StatelessWidget {
  const EventListItem({super.key, required this.event, required this.onTap});

  final Event event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final range = AppDateFormats.range(context, event.startsAt, event.endsAt);

    return BOHCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.s12),
      semanticLabel: [
        event.title,
        range,
        event.venue,
        if (event.isRegistered) l10n.eventRegisteredTag,
      ].join('. '),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EventDateBadge(date: event.startsAt),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: BOHTag(range, variant: BOHTagVariant.neutral),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.s8),
                    if (event.isRegistered)
                      BOHTag(
                        l10n.eventRegisteredTag,
                        variant: BOHTagVariant.success,
                      )
                    else
                      BOHTag(l10n.eventRegister, variant: BOHTagVariant.solid),
                  ],
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  event.title,
                  style: context.text.cardTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                EventMetaLine(icon: AppIcons.location, text: event.venue),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Flagship card with photography — Discover and the top of the Events hub.
class EventFeatureCard extends StatelessWidget {
  const EventFeatureCard({
    super.key,
    required this.event,
    required this.onTap,
    this.eyebrow,
    this.compact = false,
  });

  final Event event;
  final VoidCallback onTap;

  /// e.g. "Flagship Summit".
  final String? eyebrow;

  /// Drops the description and organizer, for Discover.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final range = AppDateFormats.range(context, event.startsAt, event.endsAt);
    final kicker = [?eyebrow, ...event.topics.take(1)].join(' · ');

    return BOHCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      semanticLabel: '${event.title}. $range. ${event.venue}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: compact ? 2 : 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: event.image, scrim: BOHImageScrim.bottom),
                PositionedDirectional(
                  top: AppSpacing.s12,
                  start: AppSpacing.s12,
                  end: AppSpacing.s12,
                  child: Row(
                    children: [
                      // The date always shows in full; the accreditation
                      // label gives way on narrow cards.
                      if (event.accredited)
                        Flexible(
                          child: _PhotoChip(
                            icon: AppIcons.verified,
                            label: l10n.geaAccredited,
                          ),
                        ),
                      const Spacer(),
                      const SizedBox(width: AppSpacing.s8),
                      _PhotoChip(label: range),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (kicker.isNotEmpty) ...[
                  Text(
                    context.isArabic ? kicker : kicker.toUpperCase(),
                    style: context.text.labelMedium.copyWith(
                      color: c.primaryText,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.s4),
                ],
                Text(event.title, style: context.text.h3),
                const SizedBox(height: AppSpacing.s8),
                EventMetaLine(icon: AppIcons.location, text: event.venue),
                if (!compact) ...[
                  const SizedBox(height: AppSpacing.s12),
                  Row(
                    children: [
                      Flexible(
                        child: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(text: '${l10n.eventOrganizedBy} '),
                              TextSpan(
                                text: event.organizer,
                                style: TextStyle(
                                  color: c.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          style: context.text.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (event.organizerVerified) ...[
                        const SizedBox(width: AppSpacing.s4),
                        Icon(
                          AppIcons.verified,
                          size: AppSizes.iconSmall,
                          color: c.primaryText,
                          semanticLabel: l10n.eventVerifiedOrganizer,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s8),
                  Text(
                    event.description,
                    style: context.text.body,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: AppSpacing.s16),
                Row(
                  children: [
                    BOHButton(
                      label: compact ? l10n.actionRsvp : l10n.eventViewEvent,
                      size: BOHButtonSize.small,
                      expand: false,
                      onPressed: onTap,
                    ),
                    const Spacer(),
                    if (event.isRegistered)
                      BOHTag(
                        l10n.eventRegisteredTag,
                        variant: BOHTagVariant.success,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Opaque label over photography.
class _PhotoChip extends StatelessWidget {
  const _PhotoChip({required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8 + 2,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: c.surface.withValues(alpha: 0.94),
        borderRadius: AppRadii.pillAll,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: c.primaryText),
            const SizedBox(width: AppSpacing.s4),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.labelMedium.copyWith(color: c.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

class EventListSkeleton extends StatelessWidget {
  const EventListSkeleton({super.key, this.count = 3});

  final int count;

  @override
  Widget build(BuildContext context) {
    return BOHShimmer(
      child: Column(
        children: [
          for (var i = 0; i < count; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.s12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  BOHSkeleton(width: 52, height: 52),
                  SizedBox(width: AppSpacing.s12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        BOHSkeleton.line(width: 110),
                        SizedBox(height: AppSpacing.s8),
                        BOHSkeleton.line(height: 14),
                        SizedBox(height: AppSpacing.s8),
                        BOHSkeleton.line(width: 160),
                      ],
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
