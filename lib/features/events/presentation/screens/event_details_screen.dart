import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/event.dart';
import '../controllers/events_providers.dart';
import '../widgets/event_widgets.dart';

void _comingSoon(BuildContext context) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(context.l10n.comingSoonMessage)));
}

enum _Tab { about, agenda, speakers }

/// An event: photo, when and where, who's going, then About / Agenda /
/// Speakers, with registration in the footer.
class EventDetailsScreen extends ConsumerWidget {
  const EventDetailsScreen({super.key, required this.eventId});

  final String eventId;

  Future<void> _toggle(BuildContext context, WidgetRef ref, Event event) async {
    final registering = !event.isRegistered;
    try {
      await ref
          .read(eventDetailProvider(event.id).notifier)
          .toggleRegistration();
      if (registering && context.mounted) {
        await context.push(AppRoutes.eventRegistered(event.id));
      }
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
    final event = ref.watch(eventDetailProvider(eventId));

    return switch (event) {
      AsyncData(:final value) => BOHScaffold(
        bottomNavigationBar: _Footer(
          event: value,
          onRegister: () => _toggle(context, ref, value),
        ),
        body: BOHPhotoPage(
          image: value.image,
          leading: BOHIconButton(
            icon: AppIcons.arrowBack,
            semanticLabel: l10n.actionBack,
            variant: BOHIconButtonVariant.photo,
            onPressed: () => context.pop(),
          ),
          actions: [
            BOHIconButton(
              icon: AppIcons.share,
              iconSize: 19,
              semanticLabel: l10n.actionShare,
              variant: BOHIconButtonVariant.photo,
              onPressed: () => _comingSoon(context),
            ),
            BOHIconButton(
              icon: AppIcons.bookmark,
              iconSize: 19,
              semanticLabel: l10n.eventSaveLabel,
              variant: BOHIconButtonVariant.photo,
              onPressed: () => _comingSoon(context),
            ),
          ],
          body: _Body(event: value),
        ),
      ),
      AsyncError(:final error) => BOHScaffold(
        appBar: BOHAppBar(title: l10n.eventDetailsTitle),
        body: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(eventDetailProvider(eventId)),
        ),
      ),
      _ => BOHScaffold(
        appBar: BOHAppBar(title: l10n.eventDetailsTitle),
        body: const BOHLoadingState(),
      ),
    };
  }
}

class _Body extends StatefulWidget {
  const _Body({required this.event});

  final Event event;

  @override
  State<_Body> createState() => _BodyState();
}

class _BodyState extends State<_Body> {
  _Tab _tab = _Tab.about;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final e = widget.event;
    final weekday = AppDateFormats.weekdayShort(context);
    final monthDay = AppDateFormats.monthDayShort(context);
    final time = AppDateFormats.time(context);
    final sameDay = e.durationDays == 1;
    final dates = sameDay
        ? '${weekday.format(e.startsAt)}, ${monthDay.format(e.startsAt)}'
        : '${weekday.format(e.startsAt)}, ${monthDay.format(e.startsAt)} – '
              '${weekday.format(e.endsAt)}, ${monthDay.format(e.endsAt)}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenHorizontal,
        AppSpacing.s20,
        AppSpacing.screenHorizontal,
        AppSpacing.s16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [EventTypeTag(e.type, large: true)]),
          const SizedBox(height: AppSpacing.s8),
          Semantics(header: true, child: Text(e.title, style: context.text.h1)),
          if (e.topics.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s4),
            Text(
              e.topics.take(3).join(' · '),
              style: context.text.label.copyWith(
                color: c.primaryText,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.s16),
          BOHCard(
            child: Column(
              children: [
                BOHInfoRow(
                  icon: AppIcons.calendar,
                  title: dates,
                  subtitle: AppDateFormats.ltr(
                    '${time.format(e.startsAt)} – ${time.format(e.endsAt)}',
                  ),
                ),
                const SizedBox(height: AppSpacing.s10),
                BOHInfoRow(
                  icon: AppIcons.location,
                  title: e.venue,
                  subtitle: e.city,
                  trailing: BOHLinkButton(
                    label: l10n.eventMap,
                    arrow: false,
                    onTap: () => _comingSoon(context),
                  ),
                ),
                const SizedBox(height: AppSpacing.s10),
                BOHInfoRow(
                  icon: AppIcons.people,
                  title: l10n.eventAttendingLabel(
                    l10n.formatCompact(e.attendees),
                  ),
                  subtitle: e.networkPeers > 0
                      ? l10n.eventPeopleYouKnow(e.networkPeers)
                      : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),
          Semantics(
            label: l10n.eventSections,
            child: BOHSegmentedControl<_Tab>(
              segments: [
                (_Tab.about, l10n.eventAboutTab),
                (_Tab.agenda, l10n.eventAgendaTab),
                (_Tab.speakers, l10n.eventSpeakersTab),
              ],
              selected: _tab,
              onChanged: (t) => setState(() => _tab = t),
            ),
          ),
          const SizedBox(height: AppSpacing.s16),
          switch (_tab) {
            _Tab.about => _About(event: e),
            _Tab.agenda => _Agenda(event: e),
            _Tab.speakers => _Speakers(speakers: e.speakers),
          },
        ],
      ),
    );
  }
}

class _About extends StatelessWidget {
  const _About({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final p in event.description.split('\n\n')) ...[
          Text(
            p,
            style: context.text.bodyLarge.copyWith(
              height: 22 / 14,
              color: context.colors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.s10),
        ],
        const SizedBox(height: AppSpacing.s4),
        // Points follow verified attendance only; registering earns none.
        BOHBanner(l10n.eventPointsOnAttendance, tone: BOHBannerTone.warning),
        const SizedBox(height: AppSpacing.s12),
        BOHInfoRow(
          icon: AppIcons.companies,
          title: event.organizer,
          subtitle: l10n.eventOrganizedBy,
          trailing: event.organizerVerified
              ? BOHGlyph(
                  BOHGlyphType.verified,
                  size: 18,
                  semanticLabel: l10n.eventVerifiedOrganizer,
                )
              : null,
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
    final date = widget.event.startsAt.add(Duration(days: _day - 1));
    final items = [
      for (final item in widget.event.agenda)
        if (item.day == _day) item,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (days > 1) ...[
          Wrap(
            spacing: AppSpacing.s8,
            children: [
              for (var d = 1; d <= days; d++)
                BOHCategoryChip(
                  label: l10n.eventDay(d),
                  selected: _day == d,
                  onSelected: () => setState(() => _day = d),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.s8),
        ],
        BOHEyebrow(
          l10n.eventAgendaDay(
            _day,
            '${AppDateFormats.weekdayShort(context).format(date)}, '
            '${AppDateFormats.monthDayShort(context).format(date)}',
          ),
          fontSize: 12,
        ),
        const SizedBox(height: AppSpacing.s4),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s12),
            child: Text(l10n.comingSoonMessage, style: context.text.body),
          )
        else
          for (final item in items)
            MergeSemantics(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.s10),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: c.border)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 48,
                      child: Text(
                        time.format(item.startsAt),
                        textDirection: TextDirection.ltr,
                        style: context.text.number(13, color: c.primaryText),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.s14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title, style: context.text.itemTitle),
                          if (item.format != null)
                            Text(item.format!, style: context.text.bodySmall),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
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
    if (speakers.isEmpty) {
      return Text(l10n.comingSoonMessage, style: context.text.body);
    }
    return BOHGroupedList(
      children: [
        for (final s in speakers)
          BOHListTile(
            leading: BOHAvatar(name: s.name, image: s.photo, dimension: 44),
            title: s.name,
            subtitle: '${s.role} · ${s.organization}',
            trailing: s.host
                ? BOHTag(l10n.speakerHost, variant: BOHTagVariant.soft)
                : null,
          ),
      ],
    );
  }
}

/// "Entry · Free" and Register; once registered, the pass and a way to
/// cancel.
class _Footer extends StatelessWidget {
  const _Footer({required this.event, required this.onRegister});

  final Event event;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    return BOHActionBar(
      leading: MergeSemantics(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.eventEntry,
              style: context.text.caption.copyWith(fontWeight: FontWeight.w600),
            ),
            Text(l10n.eventFreeTier, style: context.text.number(18)),
          ],
        ),
      ),
      helper: event.isRegistered
          ? l10n.eventRegisteredPass(event.passCode ?? '—')
          : null,
      child: event.isRegistered
          ? Row(
              children: [
                Expanded(
                  child: BOHButton(
                    label: l10n.eventViewPass,
                    leadingIcon: AppIcons.pass,
                    trailingIcon: null,
                    onPressed: () =>
                        context.push(AppRoutes.eventRegistered(event.id)),
                  ),
                ),
                const SizedBox(width: AppSpacing.s4),
                BOHIconButton(
                  icon: AppIcons.close,
                  semanticLabel: l10n.eventCancelRegistration,
                  variant: BOHIconButtonVariant.outlined,
                  color: c.error,
                  onPressed: onRegister,
                ),
              ],
            )
          : BOHButton(label: l10n.eventRegister, onPressed: onRegister),
    );
  }
}
