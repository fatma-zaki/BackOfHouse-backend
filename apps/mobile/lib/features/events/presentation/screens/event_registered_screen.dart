import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/event.dart';
import '../controllers/events_providers.dart';
import '../widgets/event_widgets.dart';

/// Confirmation after registering: the event ticket with its pass code.
/// Registering earns no points — they follow verified attendance.
class EventRegisteredScreen extends ConsumerWidget {
  const EventRegisteredScreen({super.key, required this.eventId});

  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final event = ref.watch(eventDetailProvider(eventId));

    return BOHScaffold(
      appBar: BOHAppBar(
        showBack: true,
        closeIcon: true,
        onBack: () => context.pop(),
      ),
      bottomNavigationBar: BOHActionBar(
        plain: true,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            BOHButton(
              label: l10n.eventAddToCalendar,
              leadingIcon: AppIcons.calendarAdd,
              trailingIcon: null,
              onPressed: () => ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(SnackBar(content: Text(l10n.comingSoonMessage))),
            ),
            const SizedBox(height: AppSpacing.s10),
            BOHButton(
              label: l10n.eventExploreMore,
              variant: BOHButtonVariant.secondary,
              trailingIcon: null,
              onPressed: () => context.go(AppRoutes.discover),
            ),
          ],
        ),
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

class _Body extends StatelessWidget {
  const _Body({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final text = context.text;
    final date = AppDateFormats.range(context, event.startsAt, event.endsAt);

    Widget field(String label, String value) => Expanded(
      child: MergeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BOHEyebrow(label),
            const SizedBox(height: 2),
            Text(value, style: text.label, maxLines: 2),
          ],
        ),
      ),
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.formHorizontal,
        AppSpacing.s16,
        AppSpacing.formHorizontal,
        AppSpacing.s24,
      ),
      children: [
        BOHSuccessHero(
          title: l10n.eventRegisteredTitle,
          message: l10n.eventRegisteredBody,
        ),
        const SizedBox(height: AppSpacing.s24),
        BOHTicketCard(
          image: event.image,
          imageOverlay: BOHTag(
            EventTypeL10n(event.type).label(l10n),
            variant: BOHTagVariant.solid,
            large: true,
          ),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                event.title,
                style: text.h3.copyWith(fontSize: 17, height: 22 / 17),
              ),
              const SizedBox(height: AppSpacing.s12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  field(l10n.eventDateLabel, date),
                  const SizedBox(width: AppSpacing.s12),
                  field(l10n.eventVenueLabel, event.venue),
                ],
              ),
            ],
          ),
          footer: Row(
            children: [
              const BOHQrTile(),
              const SizedBox(width: AppSpacing.s14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.eventPassHeading, style: text.label),
                    Text(
                      l10n.eventPassHint,
                      style: text.caption.copyWith(height: 16 / 11),
                    ),
                    if (event.passCode case final code?)
                      Text(
                        AppDateFormats.ltr(code),
                        style: text.number(
                          12,
                          color: context.colors.primaryText,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s16),
        BOHBanner(l10n.eventPointsOnAttendance, tone: BOHBannerTone.warning),
      ],
    );
  }
}
