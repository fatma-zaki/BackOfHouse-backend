import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/widgets/motion/boh_page_transitions.dart';
import 'app_colors.dart';
import 'app_radii.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

/// Light (default) and dark themes, built from the same recipe.
///
/// BOH components style themselves from `context.colors`; this file mainly
/// keeps framework widgets that slip through (dialogs, sheets, snackbars,
/// selection handles) on-system. Ripples and surface tints are removed
/// globally; pressed feedback comes from `BOHPressable`.
abstract final class AppTheme {
  static ThemeData get light => _build(AppColors.light);
  static ThemeData get dark => _build(AppColors.dark);

  static SystemUiOverlayStyle overlayFor(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final c = isDark ? AppColors.dark : AppColors.light;
    return SystemUiOverlayStyle(
      statusBarColor: AppColors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: brightness,
      systemNavigationBarColor: c.surface,
      systemNavigationBarIconBrightness: isDark
          ? Brightness.light
          : Brightness.dark,
    );
  }

  static ThemeData _build(AppColors c) {
    final text = AppTextStyles(c);

    final colorScheme = ColorScheme(
      brightness: c.brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: c.primaryTint,
      onPrimaryContainer: c.primaryText,
      secondary: c.primaryText,
      onSecondary: c.onPrimary,
      tertiary: c.gold,
      onTertiary: c.onPrimary,
      error: c.error,
      onError: c.onPrimary,
      surface: c.surface,
      onSurface: c.textPrimary,
      onSurfaceVariant: c.textSecondary,
      surfaceContainerLowest: c.background,
      surfaceContainerLow: c.backgroundSecondary,
      surfaceContainer: c.surface,
      surfaceContainerHigh: c.surfaceElevated,
      surfaceContainerHighest: c.surfaceElevated,
      outline: c.border,
      outlineVariant: c.borderSoft,
      shadow: c.shadow,
      scrim: AppColors.photoInk.withValues(alpha: 0.6),
      surfaceTint: AppColors.transparent,
      inverseSurface: c.inverse,
      onInverseSurface: c.onInverse,
      inversePrimary: c.primaryTint,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: c.brightness,
      colorScheme: colorScheme,
      extensions: [c],
      fontFamily: AppTypography.fontFamily,
      fontFamilyFallback: AppTypography.fontFamilyFallback,
      textTheme: text.material,
      primaryTextTheme: text.material,
      scaffoldBackgroundColor: c.background,
      canvasColor: c.background,
      dividerColor: c.borderSoft,
      disabledColor: c.textDisabled,
      hintColor: c.textMuted,

      // No ink ripples or hover washes anywhere.
      splashFactory: NoSplash.splashFactory,
      splashColor: AppColors.transparent,
      highlightColor: AppColors.transparent,
      hoverColor: AppColors.transparent,
      focusColor: c.primaryWash,

      materialTapTargetSize: MaterialTapTargetSize.padded,
      iconTheme: IconThemeData(
        color: c.textSecondary,
        size: AppSizes.iconLarge,
      ),

      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: BOHPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),

      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.transparent,
        surfaceTintColor: AppColors.transparent,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: overlayFor(c.brightness),
        titleTextStyle: text.appBarTitle,
      ),

      textSelectionTheme: TextSelectionThemeData(
        cursorColor: c.primary,
        selectionColor: c.primary.withValues(alpha: 0.25),
        selectionHandleColor: c.primary,
      ),

      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStatePropertyAll(c.border),
        radius: const Radius.circular(AppRadii.pill),
        thickness: const WidgetStatePropertyAll(3),
      ),

      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.primary,
        linearTrackColor: c.borderSoft,
        circularTrackColor: AppColors.transparent,
      ),

      dividerTheme: DividerThemeData(
        color: c.borderSoft,
        thickness: AppSizes.hairline,
        space: AppSizes.hairline,
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: AppColors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadii.largeAll,
          side: BorderSide(color: c.border),
        ),
        titleTextStyle: text.h3,
        contentTextStyle: text.body,
      ),

      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: AppColors.transparent,
        modalBackgroundColor: c.surface,
        elevation: 0,
        showDragHandle: true,
        dragHandleColor: c.border,
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.sheetTop),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.inverse,
        contentTextStyle: text.body.copyWith(color: c.onInverse),
        actionTextColor: c.isDark ? c.primary : c.primaryTint,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        insetPadding: const EdgeInsets.all(AppSpacing.screenHorizontal),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.inputAll),
      ),

      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.textPrimary,
          borderRadius: AppRadii.smallAll,
        ),
        textStyle: text.bodySmall.copyWith(color: c.surface),
      ),

      // Raw TextFields outside BOHTextField inherit the same resting look.
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        border: OutlineInputBorder(
          borderRadius: AppRadii.inputAll,
          borderSide: BorderSide(color: c.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadii.inputAll,
          borderSide: BorderSide(color: c.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadii.inputAll,
          borderSide: BorderSide(color: c.primary),
        ),
      ),
    );
  }
}
