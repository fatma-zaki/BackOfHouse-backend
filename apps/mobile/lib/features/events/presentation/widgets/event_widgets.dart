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

  /// Singular category, for tags.
  String label(AppLocalizations l10n) => switch (this) {
    EventType.conference => l10n.eventTypeConference,
    EventType.workshop => l10n.eventTypeWorkshop,
    EventType.networking => l10n.eventTypeNetworking,
    EventType.expo => l10n.eventTypeExpo,
  };

  /// Category colour, shared by every event tag.
  BOHTagVariant get tagVariant => switch (this) {
    EventType.conference => BOHTagVariant.accent,
    EventType.workshop => BOHTagVariant.green,
    EventType.networking => BOHTagVariant.amber,
    EventType.expo => BOHTagVariant.blue,
  };

  IconData get icon => switch (this) {
    EventType.conference => AppIcons.keynote,
    EventType.workshop => AppIcons.workshop,
    EventType.networking => AppIcons.people,
    EventType.expo => AppIcons.companies,
  };
}

/// The event's category tag.
class EventTypeTag extends StatelessWidget {
  const EventTypeTag(this.type, {super.key, this.large = false});

  final EventType type;
  final bool large;

  @override
  Widget build(BuildContext context) =>
      BOHTag(type.label(context.l10n), variant: type.tagVariant, large: large);
}

/// "THU / 15 / OCT" block.
class EventDateBadge extends StatelessWidget {
  const EventDateBadge({super.key, required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final month = AppDateFormats.monthShort(context).format(date);
    final weekday = AppDateFormats.weekdayShort(context).format(date);
    final arabic = context.isArabic;
    return ExcludeSemantics(
      child: BOHDateBlock(
        weekday: arabic ? weekday : weekday.toUpperCase(),
        day: AppDateFormats.day(context).format(date),
        month: arabic ? month : month.toUpperCase(),
      ),
    );
  }
}

/// Icon + small text line.
class EventMetaLine extends StatelessWidget {
  const EventMetaLine({
    super.key,
    required this.icon,
    required this.text,
    this.iconSize = 12,
  });

  final IconData icon;
  final String text;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      children: [
        Icon(icon, size: iconSize, color: c.textSecondary),
        const SizedBox(width: 5),
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

/// Event row — photo, category, title, city and the date block. Discover,
/// the Events list and Home.
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
      borderRadius: AppRadii.listCardAll,
      padding: const EdgeInsets.all(AppSpacing.s10),
      semanticLabel: [
        event.title,
        event.type.label(l10n),
        range,
        event.city,
        if (event.isRegistered) l10n.eventRegisteredTag,
      ].join('. '),
      child: Row(
        children: [
          BOHImage(
            image: event.image,
            width: 84,
            height: 72,
            borderRadius: AppRadii.smallAll,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    EventTypeTag(event.type),
                    if (event.isRegistered) ...[
                      const SizedBox(width: AppSpacing.s6),
                      Flexible(
                        child: BOHTag(
                          l10n.eventRegisteredTag,
                          variant: BOHTagVariant.success,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  event.title,
                  style: context.text.itemTitle.copyWith(height: 18 / 14),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.s4),
                EventMetaLine(icon: AppIcons.location, text: event.city),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.s10),
          EventDateBadge(date: event.startsAt),
        ],
      ),
    );
  }
}

/// Flagship event — photo fading in from the end, the neutral "Flagship"
/// tag (never "Featured": free picks are not paid placement), dates, venue
/// and a Register action.
class EventFeatureCard extends StatelessWidget {
  const EventFeatureCard({
    super.key,
    required this.event,
    required this.onTap,
    this.eyebrow,
  });

  final Event event;
  final VoidCallback onTap;

  /// Tag above the title; defaults to "Flagship".
  final String? eyebrow;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;
    final range = AppDateFormats.range(context, event.startsAt, event.endsAt);
    final category = {
      event.type.label(l10n),
      ...event.topics.take(1),
    }.join(' · ');

    return BOHFadeImageCard(
      image: event.image,
      onTap: onTap,
      semanticLabel: '${event.title}. $range. ${event.venue}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BOHTag(
            eyebrow ?? l10n.eventFlagshipTag,
            variant: BOHTagVariant.solid,
            large: true,
          ),
          const SizedBox(height: AppSpacing.s6),
          Text(
            event.title,
            style: text.h3.copyWith(fontSize: 17, height: 22 / 17),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.s4),
          Text(
            category,
            style: text.labelMedium.copyWith(
              color: c.primaryText,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.s6),
          EventMetaLine(icon: AppIcons.calendar, text: range, iconSize: 13),
          const SizedBox(height: 3),
          EventMetaLine(
            icon: AppIcons.location,
            text: event.venue,
            iconSize: 13,
          ),
          const Spacer(),
          if (event.isRegistered)
            BOHTag(l10n.eventRegisteredTag, variant: BOHTagVariant.success)
          else
            SizedBox(
              height: 32,
              child: BOHButton(
                label: l10n.eventRegister,
                variant: BOHButtonVariant.secondary,
                size: BOHButtonSize.compact,
                expand: false,
                onPressed: onTap,
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
              padding: EdgeInsets.only(bottom: AppSpacing.s10),
              child: BOHSkeleton(
                height: 92,
                borderRadius: AppRadii.listCardAll,
              ),
            ),
        ],
      ),
    );
  }
}
