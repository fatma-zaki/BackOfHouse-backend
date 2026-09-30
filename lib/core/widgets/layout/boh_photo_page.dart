import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../media/boh_image.dart';

/// Scrolling page under a full-bleed photo: a dark scrim at the top keeps
/// overlay buttons legible, and the content sheet overlaps the photo with
/// a rounded top edge. Event details, news article, company profile.
class BOHPhotoPage extends StatelessWidget {
  const BOHPhotoPage({
    super.key,
    required this.image,
    required this.body,
    this.height = 290,
    this.overlap = 28,
    this.roundedSheet = true,
    this.leading,
    this.actions = const [],
    this.overPhoto,
    this.bottomPadding = AppSpacing.s24,
    this.controller,
  });

  final AppImage? image;
  final Widget body;
  final double height;

  /// How far the sheet rises over the photo.
  final double overlap;

  /// Rounded top edge on the sheet (the company profile uses a square one).
  final bool roundedSheet;

  /// Overlay button at the top start, usually a photo back button.
  final Widget? leading;

  /// Overlay buttons at the top end (share, save).
  final List<Widget> actions;

  /// Extra content anchored to the sheet's top edge, e.g. an overlapping
  /// company logo. Positioned at the start inset.
  final Widget? overPhoto;
  final double bottomPadding;
  final ScrollController? controller;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final top = MediaQuery.paddingOf(context).top;

    return Stack(
      children: [
        SingleChildScrollView(
          controller: controller,
          padding: EdgeInsets.only(bottom: bottomPadding),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: height,
                child: BOHImage(image: image),
              ),
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: 130 + top,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        AppColors.photoInk.withValues(alpha: 0.55),
                        AppColors.photoInk.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(height: height - overlap),
                  Container(
                    decoration: BoxDecoration(
                      color: c.background,
                      borderRadius: roundedSheet
                          ? AppRadii.photoSheetTop
                          : null,
                    ),
                    child: body,
                  ),
                ],
              ),
              if (overPhoto != null)
                PositionedDirectional(
                  top: height - overlap,
                  start: AppSpacing.s16,
                  child: FractionalTranslation(
                    translation: const Offset(0, -0.5),
                    child: overPhoto,
                  ),
                ),
            ],
          ),
        ),
        // Overlay buttons stay put while the page scrolls.
        PositionedDirectional(
          top: top + 8,
          start: AppSpacing.s16,
          end: AppSpacing.s16,
          child: Row(
            children: [
              ?leading,
              const Spacer(),
              for (var i = 0; i < actions.length; i++) ...[
                if (i > 0) const SizedBox(width: AppSpacing.s8),
                actions[i],
              ],
            ],
          ),
        ),
      ],
    );
  }
}
