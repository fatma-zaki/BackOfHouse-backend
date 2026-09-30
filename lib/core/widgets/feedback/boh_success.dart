import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../buttons/boh_button.dart';
import '../media/boh_image.dart';
import 'boh_banner.dart';

/// Big violet check with a soft halo, a title and a short message —
/// "You're registered".
class BOHSuccessHero extends StatelessWidget {
  const BOHSuccessHero({super.key, required this.title, this.message});

  final String title;
  final String? message;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      children: [
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            color: c.primary,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: c.primaryTint, spreadRadius: 10),
              BoxShadow(
                color: c.violetShadow(0.45),
                blurRadius: 40,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Icon(AppIcons.check, size: 40, color: c.onPrimary),
        ),
        const SizedBox(height: AppSpacing.s24),
        Semantics(
          header: true,
          liveRegion: true,
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: context.text.titleXL,
          ),
        ),
        if (message != null) ...[
          const SizedBox(height: AppSpacing.s8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 290),
            child: Text(
              message!,
              textAlign: TextAlign.center,
              style: context.text.body,
            ),
          ),
        ],
      ],
    );
  }
}

/// Ticket-style card: photo with an optional tag, body, a dashed tear line
/// and a footer (event pass).
class BOHTicketCard extends StatelessWidget {
  const BOHTicketCard({
    super.key,
    required this.image,
    required this.body,
    this.imageHeight = 110,
    this.imageOverlay,
    this.footer,
  });

  final AppImage? image;
  final double imageHeight;
  final Widget? imageOverlay;
  final Widget body;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.heroAll,
        border: Border.all(color: c.border),
        boxShadow: AppShadows.card(c),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: imageHeight,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: image),
                if (imageOverlay != null)
                  PositionedDirectional(
                    top: 12,
                    start: 12,
                    child: imageOverlay!,
                  ),
              ],
            ),
          ),
          Padding(padding: const EdgeInsets.all(AppSpacing.s16), child: body),
          if (footer != null) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
              child: CustomPaint(
                size: const Size(double.infinity, 2),
                painter: _DashedLinePainter(c.border),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.s16),
              child: footer,
            ),
          ],
        ],
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2;
    var x = 0.0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, 1), Offset(x + 6, 1), paint);
      x += 10;
    }
  }

  @override
  bool shouldRepaint(_DashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Redemption code in a dashed violet box with a copy button. The code is
/// always left-to-right.
class BOHCodeBox extends StatelessWidget {
  const BOHCodeBox({
    super.key,
    required this.code,
    required this.copyLabel,
    this.onCopied,
  });

  final String code;
  final String copyLabel;

  /// Called after the code is on the clipboard (e.g. show a snackbar).
  final VoidCallback? onCopied;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return CustomPaint(
      foregroundPainter: BOHDashedBorderPainter(
        color: c.primary,
        radius: AppRadii.medium,
        strokeWidth: 2,
        dash: 6,
        gap: 4,
      ),
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 8, 8),
        decoration: BoxDecoration(
          color: c.primaryTint,
          borderRadius: AppRadii.mediumAll,
        ),
        child: Row(
          children: [
            Expanded(
              child: Directionality(
                textDirection: TextDirection.ltr,
                // A code never wraps: long ones shrink to fit.
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: AlignmentDirectional.centerStart,
                  child: SelectableText(
                    code,
                    maxLines: 1,
                    style: context.text
                        .number(20, color: c.primaryText)
                        .copyWith(letterSpacing: 2),
                  ),
                ),
              ),
            ),
            BOHButton(
              label: copyLabel,
              size: BOHButtonSize.compact,
              leadingIcon: AppIcons.copy,
              trailingIcon: null,
              expand: false,
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: code));
                onCopied?.call();
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// QR placeholder tile for passes: white in both modes so scanners read it.
class BOHQrTile extends StatelessWidget {
  const BOHQrTile({super.key, this.size = 64});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: AppColors.onPhoto,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.light.border),
      ),
      child: const Icon(AppIcons.pass, color: AppColors.photoInk),
    );
  }
}
