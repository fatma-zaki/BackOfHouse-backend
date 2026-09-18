import 'package:flutter/widgets.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';

/// Quiet inline notice with an info icon — terms, caveats, hints.
class BOHInfoNote extends StatelessWidget {
  const BOHInfoNote(this.message, {super.key, this.icon = AppIcons.info});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s16),
      decoration: BoxDecoration(
        color: c.surfaceElevated,
        borderRadius: AppRadii.mediumAll,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: AppSizes.iconMedium, color: c.textSecondary),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Text(
              message,
              style: context.text.bodySmall.copyWith(color: c.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
