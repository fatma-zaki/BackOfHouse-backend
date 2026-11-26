import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../../media/app_image.dart';
import '../feedback/boh_shimmer.dart';

/// Gradient laid over photography so text on top stays legible.
enum BOHImageScrim {
  none,

  /// Clear top fading to near-black at the bottom — text under the fold.
  bottom,

  /// Even darkening across the frame (40% → 70%) — text anywhere.
  full,
}

/// Renders an [AppImage] with disk caching, a skeleton while loading, a
/// quiet fallback on failure, rounded clipping and an optional scrim.
///
/// Images are decoded at their laid-out size, not the source size, which
/// keeps memory flat when a list scrolls past large photography.
class BOHImage extends StatelessWidget {
  const BOHImage({
    super.key,
    required this.image,
    this.width,
    this.height,
    this.aspectRatio,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.center,
    this.borderRadius = BorderRadius.zero,
    this.scrim = BOHImageScrim.none,
    this.semanticLabel,
  });

  /// `null` renders the fallback frame.
  final AppImage? image;
  final double? width;
  final double? height;
  final double? aspectRatio;
  final BoxFit fit;
  final Alignment alignment;
  final BorderRadius borderRadius;
  final BOHImageScrim scrim;

  /// Describe meaningful images; leave `null` for decorative ones.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    Widget frame = LayoutBuilder(
      builder: (context, constraints) {
        final dpr = MediaQuery.devicePixelRatioOf(context);
        final logicalWidth = constraints.hasBoundedWidth
            ? constraints.maxWidth
            : (width ?? MediaQuery.sizeOf(context).width);
        final cacheWidth = (logicalWidth * dpr).round();

        return Stack(
          fit: StackFit.expand,
          children: [
            _source(context, cacheWidth),
            if (scrim != BOHImageScrim.none) _Scrim(scrim),
          ],
        );
      },
    );

    frame = ClipRRect(borderRadius: borderRadius, child: frame);

    if (aspectRatio != null) {
      frame = AspectRatio(aspectRatio: aspectRatio!, child: frame);
    }
    if (width != null || height != null) {
      frame = SizedBox(width: width, height: height, child: frame);
    }

    return Semantics(
      image: semanticLabel != null,
      label: semanticLabel,
      excludeSemantics: true,
      child: frame,
    );
  }

  Widget _source(BuildContext context, int cacheWidth) {
    return switch (image) {
      null => const _Fallback(),
      NetworkAppImage(:final url) => CachedNetworkImage(
        imageUrl: url,
        fit: fit,
        alignment: alignment,
        memCacheWidth: cacheWidth,
        fadeInDuration: context.reduceMotion ? Duration.zero : AppMotion.base,
        fadeOutDuration: AppMotion.fast,
        placeholder: (_, _) => const BOHShimmer(child: BOHSkeleton()),
        errorWidget: (_, _, _) => const _Fallback(),
      ),
      AssetAppImage(:final path) => Image.asset(
        path,
        fit: fit,
        alignment: alignment,
        cacheWidth: cacheWidth,
        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || context.reduceMotion) return child;
          return AnimatedOpacity(
            opacity: frame == null ? 0 : 1,
            duration: AppMotion.base,
            curve: AppMotion.standard,
            child: child,
          );
        },
        errorBuilder: (_, _, _) => const _Fallback(),
      ),
    };
  }
}

class _Scrim extends StatelessWidget {
  const _Scrim(this.kind);

  final BOHImageScrim kind;

  @override
  Widget build(BuildContext context) {
    const ink = AppColors.photoInk;
    final gradient = switch (kind) {
      BOHImageScrim.bottom => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          ink.withValues(alpha: 0),
          ink.withValues(alpha: 0.6),
          ink.withValues(alpha: 0.95),
        ],
        stops: const [0.35, 0.72, 1],
      ),
      _ => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [ink.withValues(alpha: 0.4), ink.withValues(alpha: 0.7)],
      ),
    };
    return DecoratedBox(decoration: BoxDecoration(gradient: gradient));
  }
}

class _Fallback extends StatelessWidget {
  const _Fallback();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return ColoredBox(
      color: c.surfaceElevated,
      child: Center(
        child: Tooltip(
          message: context.l10n.stateImageUnavailable,
          child: Icon(
            AppIcons.imageUnavailable,
            size: AppSizes.iconLarge,
            color: c.textDisabled,
          ),
        ),
      ),
    );
  }
}
