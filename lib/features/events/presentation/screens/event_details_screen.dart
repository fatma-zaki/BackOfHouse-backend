import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_motion.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../../domain/event.dart';
import '../controllers/events_providers.dart';

void _comingSoon(BuildContext context) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(context.l10n.comingSoonMessage)));
}

class EventDetailsScreen extends ConsumerWidget {
  const EventDetailsScreen({super.key, required this.eventId});

  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final event = ref.watch(eventDetailProvider(eventId));

    return BOHScaffold(
      appBar: BOHAppBar(
        title: event.value?.topics.firstOrNull ?? l10n.eventDetailsTitle,
        actions: [
          BOHIconButton(
            icon: AppIcons.bookmark,
            semanticLabel: l10n.actionSave,
            onPressed: () => _comingSoon(context),
          ),
          BOHIconButton(
            icon: AppIcons.share,
            semanticLabel: l10n.actionShare,
            onPressed: () => _comingSoon(context),
          ),
        ],
      ),
      body: switch (event) {
        AsyncData(:final value) => _Body(event: value),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(eventDetailProvider(eventId)),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final role = ref.watch(myProfileProvider).value?.headline;
    final paragraphs = event.description.split('\n\n');

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        EdgeInsets.only(
          top: AppSpacing.s8,
          bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
        ),
      ),
      children: [
        _HeroCard(event: event),
        const SizedBox(height: AppSpacing.s16),
        _PassCard(event: event),
        const SizedBox(height: AppSpacing.s16),
        _WhyCard(event: event, role: role),
        const SizedBox(height: AppSpacing.sectionSpacing),
        BOHSectionHeader(title: l10n.eventBrief),
        const SizedBox(height: AppSpacing.s8),
        for (final p in paragraphs) ...[
          Text(p, style: context.text.bodyLarge),
          const SizedBox(height: AppSpacing.s8),
        ],
        const SizedBox(height: AppSpacing.s16),
        BOHSectionHeader(title: l10n.eventSpecs),
        const SizedBox(height: AppSpacing.s12),
        _SpecsGrid(event: event),
        if (event.speakers.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(
            title: l10n.eventKeynoteLeaders,
            subtitle: l10n.eventKeynoteSubtitle,
            trailing: Text(
              l10n.eventSpeakersCount(event.speakers.length),
              style: context.text.labelMedium.copyWith(
                color: context.colors.primaryText,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.s12),
          _Speakers(speakers: event.speakers),
        ],
        if (event.agenda.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          _Agenda(event: event),
        ],
        const SizedBox(height: AppSpacing.s16),
        _AttendeesRow(event: event),
        const SizedBox(height: AppSpacing.s12),
        _VenueCard(event: event),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final range = AppDateFormats.range(context, event.startsAt, event.endsAt);
    final time = AppDateFormats.time24(context);
    final type = event.topics.skip(1).take(2).join(' · ');

    return BOHCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: event.image, scrim: BOHImageScrim.bottom),
                if (event.accredited)
                  PositionedDirectional(
                    top: AppSpacing.s12,
                    end: AppSpacing.s12,
                    child: BOHTag(
                      l10n.geaAccredited,
                      variant: BOHTagVariant.verified,
                    ),
                  ),
                PositionedDirectional(
                  start: AppSpacing.s16,
                  end: AppSpacing.s16,
                  bottom: AppSpacing.s16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (type.isNotEmpty)
                        Text(
                          context.isArabic ? type : type.toUpperCase(),
                          style: AppTypography.caption.copyWith(
                            color: c.heroAccent,
                            letterSpacing: context.isArabic ? 0 : 0.8,
                          ),
                        ),
                      const SizedBox(height: AppSpacing.s4),
                      Semantics(
                        header: true,
                        child: Text(
                          event.title,
                          style: AppTypography.h1.copyWith(
                            color: AppColors.onPhoto,
                          ),
                        ),
                      ),
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
                _IconLine(icon: AppIcons.calendar, text: range),
                const SizedBox(height: AppSpacing.s8),
                _IconLine(
                  icon: AppIcons.clock,
                  text: AppDateFormats.ltr(
                    '${time.format(event.startsAt)} – ${time.format(event.endsAt)}',
                  ),
                ),
                const SizedBox(height: AppSpacing.s8),
                _IconLine(
                  icon: AppIcons.location,
                  text: '${event.venue}, ${event.city}',
                ),
                const SizedBox(height: AppSpacing.s12),
                Divider(height: 1, color: c.borderSoft),
                const SizedBox(height: AppSpacing.s12),
                Row(
                  children: [
                    Text(l10n.eventHost, style: context.text.bodySmall),
                    const SizedBox(width: AppSpacing.s8),
                    Expanded(
                      child: Text(
                        event.organizer,
                        style: context.text.label,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (event.organizerVerified) ...[
                      const SizedBox(width: AppSpacing.s8),
                      BOHTag(
                        l10n.eventVerifiedOrganizer,
                        variant: BOHTagVariant.verified,
                      ),
                    ],
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

class _IconLine extends StatelessWidget {
  const _IconLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(icon, size: AppSizes.iconSmall, color: c.primaryText),
        ),
        const SizedBox(width: AppSpacing.s8),
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

class _PassCard extends ConsumerWidget {
  const _PassCard({required this.event});

  final Event event;

  Future<void> _toggle(BuildContext context, WidgetRef ref) async {
    try {
      await ref
          .read(eventDetailProvider(event.id).notifier)
          .toggleRegistration();
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(context.l10n.error(error))));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BOHEyebrow(l10n.eventPassTitle),
                    const SizedBox(height: 2),
                    Text(l10n.eventPassSubtitle, style: context.text.cardTitle),
                  ],
                ),
              ),
              BOHTag(l10n.eventFreeTier),
            ],
          ),
          const SizedBox(height: AppSpacing.s16),
          AnimatedSwitcher(
            duration: AppMotion.base,
            child: event.isRegistered
                ? Column(
                    key: const ValueKey('registered'),
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsetsDirectional.fromSTEB(
                          AppSpacing.s12,
                          AppSpacing.s4,
                          AppSpacing.s4,
                          AppSpacing.s4,
                        ),
                        decoration: BoxDecoration(
                          color: c.success.withValues(alpha: 0.08),
                          borderRadius: AppRadii.smallAll,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              AppIcons.success,
                              size: AppSizes.iconMedium,
                              color: c.success,
                            ),
                            const SizedBox(width: AppSpacing.s8),
                            Expanded(
                              child: Semantics(
                                liveRegion: true,
                                child: Text(
                                  l10n.eventRegisteredPass(
                                    event.passCode ?? '—',
                                  ),
                                  style: context.text.label.copyWith(
                                    color: c.success,
                                  ),
                                ),
                              ),
                            ),
                            BOHButton(
                              label: l10n.eventCancelRegistration,
                              variant: BOHButtonVariant.text,
                              trailingIcon: null,
                              expand: false,
                              size: BOHButtonSize.small,
                              onPressed: () => _toggle(context, ref),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s12),
                      Row(
                        children: [
                          Expanded(
                            child: BOHButton(
                              label: l10n.eventViewPass,
                              leadingIcon: AppIcons.pass,
                              trailingIcon: null,
                              size: BOHButtonSize.small,
                              onPressed: () => _comingSoon(context),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.s8),
                          Expanded(
                            child: BOHButton(
                              label: l10n.eventAddToCalendar,
                              variant: BOHButtonVariant.secondary,
                              leadingIcon: AppIcons.calendar,
                              trailingIcon: null,
                              size: BOHButtonSize.small,
                              onPressed: () => _comingSoon(context),
                            ),
                          ),
                        ],
                      ),
                    ],
                  )
                : BOHButton(
                    key: const ValueKey('register'),
                    label: l10n.eventRegister,
                    leadingIcon: AppIcons.connect,
                    trailingIcon: null,
                    onPressed: () => _toggle(context, ref),
                  ),
          ),
          if (event.pointsReward > 0) ...[
            const SizedBox(height: AppSpacing.s12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(AppIcons.level, size: AppSizes.iconMedium, color: c.gold),
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: Text(
                    l10n.eventPointsNote(event.pointsReward),
                    style: context.text.bodySmall,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _WhyCard extends StatelessWidget {
  const _WhyCard({required this.event, required this.role});

  final Event event;
  final String? role;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final reasons = [
      if (role != null)
        (
          AppIcons.success,
          l10n.eventWhyCredential(AppDateFormats.isolate(role!)),
        ),
      if (event.networkPeers > 0)
        (AppIcons.people, l10n.eventWhyPeers(event.networkPeers)),
      if (event.topics.isNotEmpty)
        (
          AppIcons.tips,
          l10n.eventWhyTopics(
            event.topics.join(context.isArabic ? '، ' : ', '),
          ),
        ),
    ];

    return Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: c.primaryWash,
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: c.primaryTint),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                AppIcons.recommended,
                size: AppSizes.iconMedium,
                color: c.primaryText,
              ),
              const SizedBox(width: AppSpacing.s8),
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(
                    l10n.eventWhyMatters,
                    style: context.text.cardTitle,
                  ),
                ),
              ),
              if (event.matchScore > 0)
                BOHTag(
                  l10n.eventFit(event.matchScore),
                  variant: BOHTagVariant.solid,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          for (final (icon, text) in reasons)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Icon(
                      icon,
                      size: AppSizes.iconSmall,
                      color: c.primaryText,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s8),
                  Expanded(
                    child: Text(
                      text,
                      style: context.text.body.copyWith(color: c.textPrimary),
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

class _SpecsGrid extends StatelessWidget {
  const _SpecsGrid({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final time = AppDateFormats.time24(context);
    final specs = [
      (
        l10n.eventSpecDates,
        AppDateFormats.range(context, event.startsAt, event.endsAt),
        l10n.eventDays(event.durationDays),
      ),
      (
        l10n.eventSpecTiming,
        AppDateFormats.ltr(
          '${time.format(event.startsAt)} — ${time.format(event.endsAt)}',
        ),
        l10n.eventTimezone,
      ),
      (l10n.eventSpecFormat, l10n.eventInPerson, l10n.eventFormatDetail),
      (
        l10n.standingTitle,
        event.accredited ? l10n.eventRecognized : l10n.eventCommunityRecognized,
        l10n.eventStandingPoints(event.pointsReward),
      ),
    ];

    Widget cell((String, String, String) spec) {
      final c = context.colors;
      return Container(
        padding: const EdgeInsets.all(AppSpacing.s12),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: AppRadii.smallAll,
          border: Border.all(color: c.borderSoft),
        ),
        child: MergeSemantics(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(spec.$1, style: context.text.caption),
              const SizedBox(height: AppSpacing.s4),
              Text(spec.$2, style: context.text.label),
              Text(spec.$3, style: context.text.bodySmall),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        for (var row = 0; row < specs.length; row += 2) ...[
          if (row > 0) const SizedBox(height: AppSpacing.s8),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: cell(specs[row])),
                const SizedBox(width: AppSpacing.s8),
                Expanded(child: cell(specs[row + 1])),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _Speakers extends StatelessWidget {
  const _Speakers({required this.speakers});

  final List<EventSpeaker> speakers;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCarousel(
      itemWidthFactor: 0.46,
      maxItemWidth: 200,
      padding: EdgeInsets.zero,
      children: [
        for (final s in speakers)
          Builder(
            builder: (context) {
              final badge = s.host ? l10n.speakerHost : l10n.speakerKeynote;
              return BOHCard(
                padding: EdgeInsets.zero,
                semanticLabel:
                    '$badge: ${s.name}, ${s.role}, ${s.organization}',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(
                      height: 120,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if (s.photo != null)
                            BOHImage(
                              image: s.photo,
                              alignment: Alignment.topCenter,
                            )
                          else
                            ColoredBox(
                              color: c.primaryWash,
                              child: Center(
                                child: BOHAvatar(
                                  name: s.name,
                                  size: BOHAvatarSize.large,
                                ),
                              ),
                            ),
                          PositionedDirectional(
                            top: AppSpacing.s8,
                            end: AppSpacing.s8,
                            child: BOHTag(
                              badge,
                              variant: s.host
                                  ? BOHTagVariant.solid
                                  : BOHTagVariant.accent,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.s12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.name,
                            style: context.text.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            s.role,
                            style: context.text.caption.copyWith(
                              color: c.primaryText,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            s.organization,
                            style: context.text.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }
}

class _Agenda extends StatefulWidget {
  const _Agenda({required this.event});

  final Event event;

  @override
  State<_Agenda> createState() => _AgendaState();
}

class _AgendaState extends State<_Agenda> {
  int _day = 1;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final time = AppDateFormats.time24(context);
    final days = widget.event.durationDays.clamp(1, 5);
    final items = [
      for (final item in widget.event.agenda)
        if (item.day == _day) item,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHSectionHeader(title: l10n.eventAgenda),
        if (days > 1) ...[
          const SizedBox(height: AppSpacing.s8),
          BOHSegmentedControl<int>(
            segments: [for (var d = 1; d <= days; d++) (d, l10n.eventDay(d))],
            selected: _day,
            onChanged: (d) => setState(() => _day = d),
          ),
        ],
        const SizedBox(height: AppSpacing.s16),
        if (items.isEmpty)
          Text(l10n.comingSoonMessage, style: context.text.body)
        else
          for (final (i, item) in items.indexed)
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    width: 20,
                    child: Column(
                      children: [
                        const SizedBox(height: AppSpacing.s16),
                        Container(
                          width: item.keynote ? 14 : 10,
                          height: item.keynote ? 14 : 10,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: item.keynote ? c.primary : c.surface,
                            border: Border.all(color: c.primary, width: 1.5),
                          ),
                        ),
                        if (i < items.length - 1)
                          Expanded(
                            child: Container(width: 1, color: c.primaryTint),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s8),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.s12),
                        decoration: BoxDecoration(
                          color: item.keynote ? c.primaryWash : null,
                          borderRadius: AppRadii.smallAll,
                          border: item.keynote
                              ? Border.all(color: c.primaryTint)
                              : null,
                        ),
                        child: MergeSemantics(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    AppDateFormats.ltr(
                                      '${time.format(item.startsAt)} — ${time.format(item.endsAt)}',
                                    ),
                                    style: context.text.labelMedium.copyWith(
                                      color: c.primaryText,
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.s8),
                                  if (item.format != null)
                                    Flexible(
                                      child: Text(
                                        item.format!,
                                        style: context.text.caption,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  const Spacer(),
                                  if (item.keynote)
                                    BOHTag(
                                      l10n.speakerKeynote,
                                      variant: BOHTagVariant.gold,
                                      uppercase: true,
                                    ),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.s4),
                              Text(item.title, style: context.text.cardTitle),
                              const SizedBox(height: 2),
                              Text(
                                item.description,
                                style: context.text.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
      ],
    );
  }
}

class _AttendeesRow extends StatelessWidget {
  const _AttendeesRow({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return BOHCard(
      padding: const EdgeInsets.all(AppSpacing.s12),
      child: Row(
        children: [
          const BOHIconCircle(icon: AppIcons.people, size: 40),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: MergeSemantics(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.eventVerifiedAttendees(event.attendees),
                    style: context.text.label,
                  ),
                  if (event.networkPeers > 0)
                    Text(
                      l10n.eventWhyPeers(event.networkPeers),
                      style: context.text.caption,
                      maxLines: 2,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _VenueCard extends StatelessWidget {
  const _VenueCard({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return BOHCard(
      padding: const EdgeInsetsDirectional.fromSTEB(
        AppSpacing.s12,
        AppSpacing.s12,
        AppSpacing.s4,
        AppSpacing.s12,
      ),
      child: Row(
        children: [
          const BOHIconCircle(
            icon: AppIcons.location,
            size: 40,
            tone: BOHIconCircleTone.neutral,
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: MergeSemantics(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  BOHEyebrow(l10n.eventVenue),
                  Text(
                    '${event.venue}, ${event.city}',
                    style: context.text.label,
                  ),
                ],
              ),
            ),
          ),
          BOHButton(
            label: l10n.actionOpenMaps,
            variant: BOHButtonVariant.text,
            trailingIcon: AppIcons.externalLink,
            expand: false,
            onPressed: () => _comingSoon(context),
          ),
        ],
      ),
    );
  }
}
