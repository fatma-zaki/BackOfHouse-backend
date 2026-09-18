import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../controllers/auth_controller.dart';

/// Shows a localized snackbar whenever an auth call fails. Call from build.
void listenForAuthErrors(WidgetRef ref, BuildContext context) {
  ref.listen(authControllerProvider, (previous, next) {
    if (next.isLoading || !next.hasError) return;
    if (previous?.error == next.error) return;
    showAuthMessage(context, context.l10n.error(next.error!));
  });
}

void showAuthMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Placeholder feedback for sign-in providers that are not wired yet.
void showComingSoon(BuildContext context) {
  showAuthMessage(context, context.l10n.comingSoonMessage);
}
