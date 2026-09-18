import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/application.dart';
import '../controllers/applications_providers.dart';
import '../widgets/application_widgets.dart';

enum _Tab { active, past }

/// The individual's applications and where each one stands. The company
/// makes every decision; this screen only reports it.
class MyApplicationsScreen extends ConsumerStatefulWidget {
  const MyApplicationsScreen({super.key});

  @override
  ConsumerState<MyApplicationsScreen> createState() =>
      _MyApplicationsScreenState();
}

class _MyApplicationsScreenState extends ConsumerState<MyApplicationsScreen> {
  _Tab _tab = _Tab.active;

  Future<void> _withdraw(Application application) async {
    final l10n = context.l10n;
    final confirmed = await showBOHSheet<bool>(
      context,
      builder: (sheetContext) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.applicationWithdrawTitle, style: sheetContext.text.h2),
          const SizedBox(height: AppSpacing.s8),
          Text(
            l10n.applicationWithdrawBody(application.company.name),
            style: sheetContext.text.body,
          ),
          const SizedBox(height: AppSpacing.s20),
          BOHButton(
            label: l10n.actionWithdraw,
            trailingIcon: null,
            onPressed: () => Navigator.of(sheetContext).pop(true),
          ),
          const SizedBox(height: AppSpacing.s8),
          BOHButton(
            label: l10n.actionCancel,
            variant: BOHButtonVariant.ghost,
            trailingIcon: null,
            onPressed: () => Navigator.of(sheetContext).pop(false),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    String message;
    try {
      await ref.read(myApplicationsProvider.notifier).withdraw(application);
      message = l10n.applicationWithdrawnMessage;
    } catch (error) {
      message = l10n.error(error);
    }
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final applications = ref.watch(myApplicationsProvider);

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.applicationsTitle),
      body: switch (applications) {
        AsyncData(:final value) => _List(
          all: value,
          tab: _tab,
          onTab: (t) => setState(() => _tab = t),
          onWithdraw: _withdraw,
        ),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(myApplicationsProvider),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _List extends ConsumerWidget {
  const _List({
    required this.all,
    required this.tab,
    required this.onTab,
    required this.onWithdraw,
  });

  final List<Application> all;
  final _Tab tab;
  final ValueChanged<_Tab> onTab;
  final ValueChanged<Application> onWithdraw;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final active = [
      for (final a in all)
        if (a.status.isActive) a,
    ];
    final past = [
      for (final a in all)
        if (!a.status.isActive) a,
    ];
    final visible = tab == _Tab.active ? active : past;

    return BOHRefresh(
      onRefresh: () => ref.refresh(myApplicationsProvider.future),
      child: ListView(
        padding: BOHScaffold.screenPadding.add(
          EdgeInsets.only(
            top: AppSpacing.s8,
            bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
          ),
        ),
        children: [
          BOHPageHeader(
            title: l10n.applicationsTitle,
            subtitle: l10n.applicationsSubtitle,
          ),
          const SizedBox(height: AppSpacing.s16),
          BOHSegmentedControl<_Tab>(
            segments: [
              (_Tab.active, l10n.applicationsActive(active.length)),
              (_Tab.past, l10n.applicationsPast(past.length)),
            ],
            selected: tab,
            onChanged: onTab,
          ),
          const SizedBox(height: AppSpacing.s16),
          if (visible.isEmpty)
            SizedBox(
              height: 320,
              child: BOHEmptyState(
                icon: AppIcons.job,
                title: tab == _Tab.active
                    ? l10n.applicationsEmptyActiveTitle
                    : l10n.applicationsEmptyPastTitle,
                message: tab == _Tab.active
                    ? l10n.applicationsEmptyActiveMessage
                    : l10n.applicationsEmptyPastMessage,
                actionLabel: tab == _Tab.active
                    ? l10n.actionBrowseOpportunities
                    : null,
                onAction: tab == _Tab.active
                    ? () => context.push(AppRoutes.opportunities)
                    : null,
              ),
            )
          else
            for (final (i, a) in visible.indexed)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                child: BOHFadeSlide(
                  delay: BOHFadeSlide.stagger(i),
                  child: ApplicationCard(
                    application: a,
                    onOpen: () =>
                        context.push(AppRoutes.opportunity(a.opportunityId)),
                    onWithdraw: a.status.isActive ? () => onWithdraw(a) : null,
                  ),
                ),
              ),
          const SizedBox(height: AppSpacing.s8),
          BOHInfoNote(l10n.applicationsFooter, icon: AppIcons.shield),
        ],
      ),
    );
  }
}
