import 'package:flutter/foundation.dart';

import '../constants/app_assets.dart';

/// A reference to an image, produced by the data layer and rendered by
/// `BOHImage`. Widgets receive one of these — never a raw URL or asset path —
/// so the source (CDN, bundled fallback, future signed URLs) can change
/// without touching UI code.
@immutable
sealed class AppImage {
  const AppImage();

  /// Remote image, cached on disk.
  const factory AppImage.network(String url) = NetworkAppImage;

  /// Image shipped in the app bundle.
  const factory AppImage.asset(String path) = AssetAppImage;

  /// Parses an optional URL from an API payload.
  static AppImage? fromUrl(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    return AppImage.network(url.trim());
  }

  /// Editorial fallback used when content ships without artwork.
  static const AppImage placeholder = AppImage.asset(AppAssets.heroCrew);
}

final class NetworkAppImage extends AppImage {
  const NetworkAppImage(this.url);

  final String url;

  @override
  bool operator ==(Object other) =>
      other is NetworkAppImage && other.url == url;

  @override
  int get hashCode => url.hashCode;
}

final class AssetAppImage extends AppImage {
  const AssetAppImage(this.path);

  final String path;

  @override
  bool operator ==(Object other) =>
      other is AssetAppImage && other.path == path;

  @override
  int get hashCode => path.hashCode;
}
