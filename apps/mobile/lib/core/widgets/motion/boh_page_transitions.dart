import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';

/// Route transition: the incoming page fades up like a stage light while
/// drifting a few percent in from the reading direction.
///
/// Used on Android. iOS keeps the Cupertino transition so the edge
/// swipe-back gesture — a platform expectation — keeps working.
class BOHPageTransitionsBuilder extends PageTransitionsBuilder {
  const BOHPageTransitionsBuilder();

  @override
  Duration get transitionDuration => AppMotion.slow;

  @override
  Duration get reverseTransitionDuration => AppMotion.base;

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    if (MediaQuery.disableAnimationsOf(context)) return child;

    final direction = Directionality.of(context) == TextDirection.rtl
        ? -1.0
        : 1.0;
    final curved = CurvedAnimation(
      parent: animation,
      curve: AppMotion.emphasized,
      reverseCurve: AppMotion.standard,
    );

    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: Offset(AppMotion.entranceOffset * direction, 0),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      ),
    );
  }
}
