import 'package:flutter/widgets.dart';

/// One destination of a navigation shell: the drawer and the bottom bar
/// both render these.
@immutable
class BOHNavItem {
  const BOHNavItem({
    required this.icon,
    required this.label,
    this.showBadge = false,
  });

  final IconData icon;
  final String label;

  /// Unread dot. The label is announced alongside, so it is never the only
  /// signal.
  final bool showBadge;
}
