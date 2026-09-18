import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Back Of House'**
  String get appName;

  /// No description provided for @brandMotto.
  ///
  /// In en, this message translates to:
  /// **'Backstage people. Real events.'**
  String get brandMotto;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navMenu.
  ///
  /// In en, this message translates to:
  /// **'Menu'**
  String get navMenu;

  /// No description provided for @actionViewAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get actionViewAll;

  /// No description provided for @actionReadMore.
  ///
  /// In en, this message translates to:
  /// **'Read More'**
  String get actionReadMore;

  /// No description provided for @actionRetry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get actionRetry;

  /// No description provided for @actionBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get actionBack;

  /// No description provided for @actionSearch.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get actionSearch;

  /// No description provided for @actionClearSearch.
  ///
  /// In en, this message translates to:
  /// **'Clear search'**
  String get actionClearSearch;

  /// No description provided for @actionShowPassword.
  ///
  /// In en, this message translates to:
  /// **'Show password'**
  String get actionShowPassword;

  /// No description provided for @actionHidePassword.
  ///
  /// In en, this message translates to:
  /// **'Hide password'**
  String get actionHidePassword;

  /// No description provided for @actionSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get actionSignOut;

  /// No description provided for @actionOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get actionOpen;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search people, companies, courses…'**
  String get searchHint;

  /// No description provided for @profileAvatarLabel.
  ///
  /// In en, this message translates to:
  /// **'Your profile'**
  String get profileAvatarLabel;

  /// No description provided for @notificationsLabel.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsLabel;

  /// No description provided for @stateLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get stateLoading;

  /// No description provided for @stateImageUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Image unavailable'**
  String get stateImageUnavailable;

  /// No description provided for @errorStateTitle.
  ///
  /// In en, this message translates to:
  /// **'Something went off cue'**
  String get errorStateTitle;

  /// No description provided for @errorStateMessage.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t load this right now. Check your connection and try again.'**
  String get errorStateMessage;

  /// No description provided for @emptyStateTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing on stage yet'**
  String get emptyStateTitle;

  /// No description provided for @emptyStateMessage.
  ///
  /// In en, this message translates to:
  /// **'When there\'s something to show, it will appear here.'**
  String get emptyStateMessage;

  /// No description provided for @comingSoonTitle.
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get comingSoonTitle;

  /// No description provided for @comingSoonMessage.
  ///
  /// In en, this message translates to:
  /// **'The crew is still setting up this stage.'**
  String get comingSoonMessage;

  /// No description provided for @timeJustNow.
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get timeJustNow;

  /// No description provided for @timeMinutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1m ago} other{{count}m ago}}'**
  String timeMinutesAgo(int count);

  /// No description provided for @timeHoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1h ago} other{{count}h ago}}'**
  String timeHoursAgo(int count);

  /// No description provided for @timeDaysAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1d ago} other{{count}d ago}}'**
  String timeDaysAgo(int count);

  /// No description provided for @readTimeMinutes.
  ///
  /// In en, this message translates to:
  /// **'{count} min read'**
  String readTimeMinutes(int count);

  /// No description provided for @slideCounter.
  ///
  /// In en, this message translates to:
  /// **'{current} / {total}'**
  String slideCounter(String current, String total);

  /// No description provided for @routeProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get routeProfile;

  /// No description provided for @routeCompanies.
  ///
  /// In en, this message translates to:
  /// **'Companies'**
  String get routeCompanies;

  /// No description provided for @routeCourses.
  ///
  /// In en, this message translates to:
  /// **'Courses'**
  String get routeCourses;

  /// No description provided for @routeNews.
  ///
  /// In en, this message translates to:
  /// **'News'**
  String get routeNews;

  /// No description provided for @routeEvents.
  ///
  /// In en, this message translates to:
  /// **'Events'**
  String get routeEvents;

  /// No description provided for @routeResetPassword.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get routeResetPassword;

  /// No description provided for @routeDetail.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get routeDetail;

  /// No description provided for @languageLabel.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageLabel;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageArabic.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get languageArabic;

  /// No description provided for @welcomeHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'I already have an account'**
  String get welcomeHaveAccount;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @signInCta.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get signInCta;

  /// No description provided for @noAccountPrompt.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get noAccountPrompt;

  /// No description provided for @agreePrefix.
  ///
  /// In en, this message translates to:
  /// **'I agree to the '**
  String get agreePrefix;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @agreeConjunction.
  ///
  /// In en, this message translates to:
  /// **' and '**
  String get agreeConjunction;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @signUpCta.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get signUpCta;

  /// No description provided for @haveAccountPrompt.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get haveAccountPrompt;

  /// No description provided for @logInLink.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get logInLink;

  /// No description provided for @mustAcceptTerms.
  ///
  /// In en, this message translates to:
  /// **'Please accept the Terms of Service and Privacy Policy.'**
  String get mustAcceptTerms;

  /// No description provided for @validationRequired.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get validationRequired;

  /// No description provided for @validationEmailRequired.
  ///
  /// In en, this message translates to:
  /// **'Email address is required'**
  String get validationEmailRequired;

  /// No description provided for @validationEmailInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email address'**
  String get validationEmailInvalid;

  /// No description provided for @validationNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Full name is required'**
  String get validationNameRequired;

  /// No description provided for @validationNameTooShort.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get validationNameTooShort;

  /// No description provided for @validationPhoneRequired.
  ///
  /// In en, this message translates to:
  /// **'Phone number is required'**
  String get validationPhoneRequired;

  /// No description provided for @validationPhoneInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid Saudi mobile number'**
  String get validationPhoneInvalid;

  /// No description provided for @validationPasswordRequired.
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get validationPasswordRequired;

  /// No description provided for @validationPasswordTooShort.
  ///
  /// In en, this message translates to:
  /// **'Use at least 8 characters'**
  String get validationPasswordTooShort;

  /// No description provided for @validationPasswordWeak.
  ///
  /// In en, this message translates to:
  /// **'Include at least one letter and one number'**
  String get validationPasswordWeak;

  /// No description provided for @validationConfirmRequired.
  ///
  /// In en, this message translates to:
  /// **'Confirm your password'**
  String get validationConfirmRequired;

  /// No description provided for @validationPasswordMismatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get validationPasswordMismatch;

  /// No description provided for @errorTimeout.
  ///
  /// In en, this message translates to:
  /// **'The connection timed out. Please try again.'**
  String get errorTimeout;

  /// No description provided for @errorNoConnection.
  ///
  /// In en, this message translates to:
  /// **'No internet connection. Check your network and try again.'**
  String get errorNoConnection;

  /// No description provided for @errorBadCertificate.
  ///
  /// In en, this message translates to:
  /// **'Could not establish a secure connection.'**
  String get errorBadCertificate;

  /// No description provided for @errorCancelled.
  ///
  /// In en, this message translates to:
  /// **'Request cancelled.'**
  String get errorCancelled;

  /// No description provided for @errorBadRequest.
  ///
  /// In en, this message translates to:
  /// **'That request could not be processed.'**
  String get errorBadRequest;

  /// No description provided for @errorSessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Your session has expired. Please log in again.'**
  String get errorSessionExpired;

  /// No description provided for @errorForbidden.
  ///
  /// In en, this message translates to:
  /// **'You do not have access to this.'**
  String get errorForbidden;

  /// No description provided for @errorNotFound.
  ///
  /// In en, this message translates to:
  /// **'We could not find what you were looking for.'**
  String get errorNotFound;

  /// No description provided for @errorValidation.
  ///
  /// In en, this message translates to:
  /// **'Please check the highlighted fields.'**
  String get errorValidation;

  /// No description provided for @errorTooManyRequests.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please wait a moment and try again.'**
  String get errorTooManyRequests;

  /// No description provided for @errorServer.
  ///
  /// In en, this message translates to:
  /// **'The server is having trouble. Please try again shortly.'**
  String get errorServer;

  /// No description provided for @errorUnknown.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get errorUnknown;

  /// No description provided for @errorInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'That email and password don\'t match an account.'**
  String get errorInvalidCredentials;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @themeLabel.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get themeLabel;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @welcomeEyebrow.
  ///
  /// In en, this message translates to:
  /// **'Welcome to'**
  String get welcomeEyebrow;

  /// No description provided for @welcomeTitleLead.
  ///
  /// In en, this message translates to:
  /// **'Back of House\n'**
  String get welcomeTitleLead;

  /// No description provided for @welcomeTitleAccent.
  ///
  /// In en, this message translates to:
  /// **'Community.'**
  String get welcomeTitleAccent;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Connect with Saudi Arabia\'s events industry.'**
  String get welcomeSubtitle;

  /// No description provided for @welcomeGetStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get welcomeGetStarted;

  /// No description provided for @signInTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get signInTitle;

  /// No description provided for @signInSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to your Back of House account and stay connected with the events community.'**
  String get signInSubtitle;

  /// No description provided for @fieldEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email address'**
  String get fieldEmailLabel;

  /// No description provided for @fieldEmailHint.
  ///
  /// In en, this message translates to:
  /// **'you@example.com'**
  String get fieldEmailHint;

  /// No description provided for @fieldPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get fieldPasswordLabel;

  /// No description provided for @fieldPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get fieldPasswordHint;

  /// No description provided for @fieldFullNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fieldFullNameLabel;

  /// No description provided for @fieldFullNameHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get fieldFullNameHint;

  /// No description provided for @fieldPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get fieldPhoneLabel;

  /// No description provided for @fieldPhoneHint.
  ///
  /// In en, this message translates to:
  /// **'+966 50 123 4567'**
  String get fieldPhoneHint;

  /// No description provided for @fieldNewPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Create a strong password'**
  String get fieldNewPasswordHint;

  /// No description provided for @fieldConfirmPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get fieldConfirmPasswordLabel;

  /// No description provided for @fieldConfirmPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Re-enter your password'**
  String get fieldConfirmPasswordHint;

  /// No description provided for @orDivider.
  ///
  /// In en, this message translates to:
  /// **'or'**
  String get orDivider;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @createAccountLink.
  ///
  /// In en, this message translates to:
  /// **'Create one'**
  String get createAccountLink;

  /// No description provided for @signUpTitle.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get signUpTitle;

  /// No description provided for @signUpSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Join Back of House and connect with professionals, companies, and opportunities in the events industry.'**
  String get signUpSubtitle;

  /// No description provided for @navDiscover.
  ///
  /// In en, this message translates to:
  /// **'Discover'**
  String get navDiscover;

  /// No description provided for @navRewards.
  ///
  /// In en, this message translates to:
  /// **'Rewards'**
  String get navRewards;

  /// No description provided for @upcomingEvents.
  ///
  /// In en, this message translates to:
  /// **'Upcoming Events'**
  String get upcomingEvents;

  /// No description provided for @notificationsUnreadCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{Notifications, 1 unread} other{Notifications, {count} unread}}'**
  String notificationsUnreadCount(int count);

  /// No description provided for @pointsYourPoints.
  ///
  /// In en, this message translates to:
  /// **'Your points'**
  String get pointsYourPoints;

  /// No description provided for @pointsTotal.
  ///
  /// In en, this message translates to:
  /// **'Total points'**
  String get pointsTotal;

  /// No description provided for @pointsUnit.
  ///
  /// In en, this message translates to:
  /// **'points'**
  String get pointsUnit;

  /// No description provided for @pointsAmount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 point} other{{count} points}}'**
  String pointsAmount(int count);

  /// No description provided for @pointsThisMonth.
  ///
  /// In en, this message translates to:
  /// **'+{count} this month'**
  String pointsThisMonth(int count);

  /// No description provided for @pointsUntilBenefit.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{You can unlock your next benefit} =1{1 point until your next benefit} other{{count} points until your next benefit}}'**
  String pointsUntilBenefit(int count);

  /// No description provided for @pointsToNextLevel.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{You have reached the next level} =1{1 point to reach the next level} other{{count} points to reach the next level}}'**
  String pointsToNextLevel(int count);

  /// No description provided for @pointsRemaining.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{You have 1 point left} other{You have {count} points left}}'**
  String pointsRemaining(int count);

  /// No description provided for @pointsOfTarget.
  ///
  /// In en, this message translates to:
  /// **'{current} of {target} points'**
  String pointsOfTarget(String current, String target);

  /// No description provided for @memberLevelLabel.
  ///
  /// In en, this message translates to:
  /// **'Your member level'**
  String get memberLevelLabel;

  /// No description provided for @levelNewcomer.
  ///
  /// In en, this message translates to:
  /// **'Newcomer'**
  String get levelNewcomer;

  /// No description provided for @levelActive.
  ///
  /// In en, this message translates to:
  /// **'Active Member'**
  String get levelActive;

  /// No description provided for @levelContributor.
  ///
  /// In en, this message translates to:
  /// **'Contributor'**
  String get levelContributor;

  /// No description provided for @levelLeader.
  ///
  /// In en, this message translates to:
  /// **'Industry Leader'**
  String get levelLeader;

  /// No description provided for @myPointsTitle.
  ///
  /// In en, this message translates to:
  /// **'My Points'**
  String get myPointsTitle;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @filterEarned.
  ///
  /// In en, this message translates to:
  /// **'Earned'**
  String get filterEarned;

  /// No description provided for @filterRedeemed.
  ///
  /// In en, this message translates to:
  /// **'Redeemed'**
  String get filterRedeemed;

  /// No description provided for @pointsHistoryTitle.
  ///
  /// In en, this message translates to:
  /// **'How you earned points'**
  String get pointsHistoryTitle;

  /// No description provided for @pointsHistoryEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No points activity yet'**
  String get pointsHistoryEmptyTitle;

  /// No description provided for @pointsHistoryEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Attend events and complete your profile to start earning.'**
  String get pointsHistoryEmptyMessage;

  /// No description provided for @activityAttendedWorkshop.
  ///
  /// In en, this message translates to:
  /// **'Attended workshop'**
  String get activityAttendedWorkshop;

  /// No description provided for @activityProfileCompletion.
  ///
  /// In en, this message translates to:
  /// **'Profile completion'**
  String get activityProfileCompletion;

  /// No description provided for @activityVerifiedIdentity.
  ///
  /// In en, this message translates to:
  /// **'Verified identity'**
  String get activityVerifiedIdentity;

  /// No description provided for @activityJoinedEvent.
  ///
  /// In en, this message translates to:
  /// **'Joined event'**
  String get activityJoinedEvent;

  /// No description provided for @activityFollowedCompany.
  ///
  /// In en, this message translates to:
  /// **'Followed companies'**
  String get activityFollowedCompany;

  /// No description provided for @activityRedeemedReward.
  ///
  /// In en, this message translates to:
  /// **'Redeemed reward'**
  String get activityRedeemedReward;

  /// No description provided for @rewardsTitle.
  ///
  /// In en, this message translates to:
  /// **'Rewards'**
  String get rewardsTitle;

  /// No description provided for @rewardsHeroTitle.
  ///
  /// In en, this message translates to:
  /// **'Use your points to unlock exclusive benefits'**
  String get rewardsHeroTitle;

  /// No description provided for @rewardsHeroBody.
  ///
  /// In en, this message translates to:
  /// **'Get discounts, access special events, and more, just for being part of our community.'**
  String get rewardsHeroBody;

  /// No description provided for @rewardsSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search rewards'**
  String get rewardsSearchHint;

  /// No description provided for @rewardsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No rewards here yet'**
  String get rewardsEmptyTitle;

  /// No description provided for @rewardsEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Try another category, or check back soon.'**
  String get rewardsEmptyMessage;

  /// No description provided for @rewardCategoryLearn.
  ///
  /// In en, this message translates to:
  /// **'Learn'**
  String get rewardCategoryLearn;

  /// No description provided for @rewardCategoryAttend.
  ///
  /// In en, this message translates to:
  /// **'Attend'**
  String get rewardCategoryAttend;

  /// No description provided for @rewardCategoryCareer.
  ///
  /// In en, this message translates to:
  /// **'Career'**
  String get rewardCategoryCareer;

  /// No description provided for @rewardCategoryCommunity.
  ///
  /// In en, this message translates to:
  /// **'Community'**
  String get rewardCategoryCommunity;

  /// No description provided for @availableRewards.
  ///
  /// In en, this message translates to:
  /// **'Available Rewards'**
  String get availableRewards;

  /// No description provided for @actionRedeem.
  ///
  /// In en, this message translates to:
  /// **'Redeem'**
  String get actionRedeem;

  /// No description provided for @rewardDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Reward Details'**
  String get rewardDetailsTitle;

  /// No description provided for @rewardWhatYouGet.
  ///
  /// In en, this message translates to:
  /// **'What you\'ll get'**
  String get rewardWhatYouGet;

  /// No description provided for @rewardHowToRedeem.
  ///
  /// In en, this message translates to:
  /// **'How to redeem'**
  String get rewardHowToRedeem;

  /// No description provided for @rewardRedeemFor.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{Redeem for 1 point} other{Redeem for {count} points}}'**
  String rewardRedeemFor(int count);

  /// No description provided for @rewardNeedMorePoints.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{You need 1 more point} other{You need {count} more points}}'**
  String rewardNeedMorePoints(int count);

  /// No description provided for @redeemConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Redeem this reward?'**
  String get redeemConfirmTitle;

  /// No description provided for @actionCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get actionCancel;

  /// No description provided for @redeemSuccessTitle.
  ///
  /// In en, this message translates to:
  /// **'Reward redeemed'**
  String get redeemSuccessTitle;

  /// No description provided for @redeemSuccessBody.
  ///
  /// In en, this message translates to:
  /// **'Use this code to claim your reward. We have also sent it to your email.'**
  String get redeemSuccessBody;

  /// No description provided for @actionCopyCode.
  ///
  /// In en, this message translates to:
  /// **'Copy code'**
  String get actionCopyCode;

  /// No description provided for @codeCopied.
  ///
  /// In en, this message translates to:
  /// **'Code copied'**
  String get codeCopied;

  /// No description provided for @actionDone.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get actionDone;

  /// No description provided for @errorInsufficientPoints.
  ///
  /// In en, this message translates to:
  /// **'You don\'t have enough points for this reward.'**
  String get errorInsufficientPoints;

  /// No description provided for @eventsTitle.
  ///
  /// In en, this message translates to:
  /// **'Events'**
  String get eventsTitle;

  /// No description provided for @eventsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Discover what\'s happening across the Kingdom\'s live event and technical production industry.'**
  String get eventsSubtitle;

  /// No description provided for @eventsSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search events'**
  String get eventsSearchHint;

  /// No description provided for @eventsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No events found'**
  String get eventsEmptyTitle;

  /// No description provided for @eventsEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Try a different search or category.'**
  String get eventsEmptyMessage;

  /// No description provided for @eventFilterConferences.
  ///
  /// In en, this message translates to:
  /// **'Conferences'**
  String get eventFilterConferences;

  /// No description provided for @eventFilterWorkshops.
  ///
  /// In en, this message translates to:
  /// **'Workshops'**
  String get eventFilterWorkshops;

  /// No description provided for @eventFilterNetworking.
  ///
  /// In en, this message translates to:
  /// **'Networking'**
  String get eventFilterNetworking;

  /// No description provided for @eventFilterExpos.
  ///
  /// In en, this message translates to:
  /// **'Expos'**
  String get eventFilterExpos;

  /// No description provided for @eventAttending.
  ///
  /// In en, this message translates to:
  /// **'{count}+ attending'**
  String eventAttending(int count);

  /// No description provided for @eventRegisteredTag.
  ///
  /// In en, this message translates to:
  /// **'Registered'**
  String get eventRegisteredTag;

  /// No description provided for @eventDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Event'**
  String get eventDetailsTitle;

  /// No description provided for @eventOrganizedBy.
  ///
  /// In en, this message translates to:
  /// **'Organized by'**
  String get eventOrganizedBy;

  /// No description provided for @eventAbout.
  ///
  /// In en, this message translates to:
  /// **'About this event'**
  String get eventAbout;

  /// No description provided for @eventRegister.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get eventRegister;

  /// No description provided for @eventCancelRegistration.
  ///
  /// In en, this message translates to:
  /// **'Cancel registration'**
  String get eventCancelRegistration;

  /// No description provided for @eventRegisteredMessage.
  ///
  /// In en, this message translates to:
  /// **'You\'re registered. We\'ll remind you before it starts.'**
  String get eventRegisteredMessage;

  /// No description provided for @actionShare.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get actionShare;

  /// No description provided for @notificationsMarkAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all as read'**
  String get notificationsMarkAllRead;

  /// No description provided for @notificationsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re all caught up'**
  String get notificationsEmptyTitle;

  /// No description provided for @notificationsEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'New updates about events, connections and rewards will appear here.'**
  String get notificationsEmptyMessage;

  /// No description provided for @notificationUnread.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get notificationUnread;

  /// No description provided for @discoverTitle.
  ///
  /// In en, this message translates to:
  /// **'Discover'**
  String get discoverTitle;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @profileEditProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get profileEditProfile;

  /// No description provided for @profileMyPointsHint.
  ///
  /// In en, this message translates to:
  /// **'Balance, history and rewards'**
  String get profileMyPointsHint;

  /// No description provided for @profileAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get profileAbout;

  /// No description provided for @profileExperience.
  ///
  /// In en, this message translates to:
  /// **'Experience'**
  String get profileExperience;

  /// No description provided for @profilePresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get profilePresent;

  /// No description provided for @profileSkills.
  ///
  /// In en, this message translates to:
  /// **'Skills'**
  String get profileSkills;

  /// No description provided for @availabilityAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available for projects'**
  String get availabilityAvailable;

  /// No description provided for @availabilityInProduction.
  ///
  /// In en, this message translates to:
  /// **'In production'**
  String get availabilityInProduction;

  /// No description provided for @availabilityFullyBooked.
  ///
  /// In en, this message translates to:
  /// **'Fully booked'**
  String get availabilityFullyBooked;

  /// No description provided for @matchPercent.
  ///
  /// In en, this message translates to:
  /// **'{count}% Match'**
  String matchPercent(int count);

  /// No description provided for @verifiedLabel.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get verifiedLabel;

  /// No description provided for @companyCompletedProjects.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 project delivered} other{{count} projects delivered}}'**
  String companyCompletedProjects(int count);

  /// No description provided for @actionFollow.
  ///
  /// In en, this message translates to:
  /// **'Follow'**
  String get actionFollow;

  /// No description provided for @actionFollowing.
  ///
  /// In en, this message translates to:
  /// **'Following'**
  String get actionFollowing;

  /// No description provided for @actionViewDetails.
  ///
  /// In en, this message translates to:
  /// **'View Details'**
  String get actionViewDetails;

  /// No description provided for @actionConnect.
  ///
  /// In en, this message translates to:
  /// **'Connect'**
  String get actionConnect;

  /// No description provided for @actionRequested.
  ///
  /// In en, this message translates to:
  /// **'Requested'**
  String get actionRequested;

  /// No description provided for @yearsExperience.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 yr exp} other{{count} yrs exp}}'**
  String yearsExperience(int count);

  /// No description provided for @breakingBriefing.
  ///
  /// In en, this message translates to:
  /// **'Breaking Briefing'**
  String get breakingBriefing;

  /// No description provided for @actionReadBriefing.
  ///
  /// In en, this message translates to:
  /// **'Read Briefing'**
  String get actionReadBriefing;

  /// No description provided for @postedAgo.
  ///
  /// In en, this message translates to:
  /// **'Posted {time}'**
  String postedAgo(String time);

  /// No description provided for @actionSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get actionSave;

  /// No description provided for @actionSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get actionSaved;

  /// No description provided for @actionViewAllCount.
  ///
  /// In en, this message translates to:
  /// **'View All ({count})'**
  String actionViewAllCount(int count);

  /// No description provided for @actionBrowseAll.
  ///
  /// In en, this message translates to:
  /// **'Browse All'**
  String get actionBrowseAll;

  /// No description provided for @pointsShort.
  ///
  /// In en, this message translates to:
  /// **'{count} pts'**
  String pointsShort(int count);

  /// No description provided for @verificationLevel.
  ///
  /// In en, this message translates to:
  /// **'Level {count}'**
  String verificationLevel(int count);

  /// No description provided for @geaVerified.
  ///
  /// In en, this message translates to:
  /// **'GEA Verified'**
  String get geaVerified;

  /// No description provided for @geaAccredited.
  ///
  /// In en, this message translates to:
  /// **'GEA Accredited'**
  String get geaAccredited;

  /// No description provided for @homeWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome, {name}'**
  String homeWelcome(String name);

  /// No description provided for @homeUpcomingIndustryEvents.
  ///
  /// In en, this message translates to:
  /// **'Upcoming Industry Events'**
  String get homeUpcomingIndustryEvents;

  /// No description provided for @actionViewCalendar.
  ///
  /// In en, this message translates to:
  /// **'View Calendar'**
  String get actionViewCalendar;

  /// No description provided for @homeRelevantOpportunities.
  ///
  /// In en, this message translates to:
  /// **'Relevant Opportunities'**
  String get homeRelevantOpportunities;

  /// No description provided for @standingTitle.
  ///
  /// In en, this message translates to:
  /// **'Professional Standing'**
  String get standingTitle;

  /// No description provided for @standingActive.
  ///
  /// In en, this message translates to:
  /// **'Active Status'**
  String get standingActive;

  /// No description provided for @standingCredential.
  ///
  /// In en, this message translates to:
  /// **'Credential'**
  String get standingCredential;

  /// No description provided for @standingVisibility.
  ///
  /// In en, this message translates to:
  /// **'Visibility'**
  String get standingVisibility;

  /// No description provided for @scoreOutOf100.
  ///
  /// In en, this message translates to:
  /// **'{count}/100'**
  String scoreOutOf100(int count);

  /// No description provided for @standingStrongSearch.
  ///
  /// In en, this message translates to:
  /// **'Strong Search'**
  String get standingStrongSearch;

  /// No description provided for @standingAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get standingAttendance;

  /// No description provided for @eventsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 Event} other{{count} Events}}'**
  String eventsCount(int count);

  /// No description provided for @standingNote.
  ///
  /// In en, this message translates to:
  /// **'Points reflect audited physical badge scans at certified industry summits.'**
  String get standingNote;

  /// No description provided for @standingAction.
  ///
  /// In en, this message translates to:
  /// **'View My Activity & Passes'**
  String get standingAction;

  /// No description provided for @discoverEyebrow.
  ///
  /// In en, this message translates to:
  /// **'Ecosystem Directory'**
  String get discoverEyebrow;

  /// No description provided for @discoverLiveFeed.
  ///
  /// In en, this message translates to:
  /// **'Live Feed'**
  String get discoverLiveFeed;

  /// No description provided for @discoverSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search the ecosystem'**
  String get discoverSearchHint;

  /// No description provided for @actionFilters.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get actionFilters;

  /// No description provided for @directoryCompaniesCount.
  ///
  /// In en, this message translates to:
  /// **'{count}+ verified agencies'**
  String directoryCompaniesCount(String count);

  /// No description provided for @directoryProfessionals.
  ///
  /// In en, this message translates to:
  /// **'Professionals'**
  String get directoryProfessionals;

  /// No description provided for @directoryProfessionalsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} specialists'**
  String directoryProfessionalsCount(String count);

  /// No description provided for @directoryEventsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} upcoming'**
  String directoryEventsCount(String count);

  /// No description provided for @directoryOpportunities.
  ///
  /// In en, this message translates to:
  /// **'Opportunities'**
  String get directoryOpportunities;

  /// No description provided for @directoryOpportunitiesCount.
  ///
  /// In en, this message translates to:
  /// **'{count} active roles'**
  String directoryOpportunitiesCount(String count);

  /// No description provided for @discoverRecommended.
  ///
  /// In en, this message translates to:
  /// **'Recommended for you'**
  String get discoverRecommended;

  /// No description provided for @discoverRecommendedSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Tailored to your credentials & network activity'**
  String get discoverRecommendedSubtitle;

  /// No description provided for @actionRsvp.
  ///
  /// In en, this message translates to:
  /// **'RSVP'**
  String get actionRsvp;

  /// No description provided for @actionApplyNow.
  ///
  /// In en, this message translates to:
  /// **'Apply Now'**
  String get actionApplyNow;

  /// No description provided for @discoverLatestBriefings.
  ///
  /// In en, this message translates to:
  /// **'Latest Briefings'**
  String get discoverLatestBriefings;

  /// No description provided for @eventsEyebrow.
  ///
  /// In en, this message translates to:
  /// **'Industry Calendar & Conferences'**
  String get eventsEyebrow;

  /// No description provided for @eventsVisionChip.
  ///
  /// In en, this message translates to:
  /// **'Vision 2030 Calendar'**
  String get eventsVisionChip;

  /// No description provided for @eventViewEvent.
  ///
  /// In en, this message translates to:
  /// **'View Event'**
  String get eventViewEvent;

  /// No description provided for @eventsScheduled.
  ///
  /// In en, this message translates to:
  /// **'{count} Scheduled'**
  String eventsScheduled(int count);

  /// No description provided for @eventsFeatured.
  ///
  /// In en, this message translates to:
  /// **'Flagship Summit'**
  String get eventsFeatured;

  /// No description provided for @eventPassTitle.
  ///
  /// In en, this message translates to:
  /// **'Accredited Delegate Pass'**
  String get eventPassTitle;

  /// No description provided for @eventPassSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Standard Industry Registration'**
  String get eventPassSubtitle;

  /// No description provided for @eventFreeTier.
  ///
  /// In en, this message translates to:
  /// **'Free'**
  String get eventFreeTier;

  /// No description provided for @eventRegisteredPass.
  ///
  /// In en, this message translates to:
  /// **'Registered · Pass #{code}'**
  String eventRegisteredPass(String code);

  /// No description provided for @eventViewPass.
  ///
  /// In en, this message translates to:
  /// **'View Digital Pass'**
  String get eventViewPass;

  /// No description provided for @eventAddToCalendar.
  ///
  /// In en, this message translates to:
  /// **'Add to Calendar'**
  String get eventAddToCalendar;

  /// No description provided for @eventPointsNote.
  ///
  /// In en, this message translates to:
  /// **'+{count} points and an official attendance record unlock when your credential is scanned at the entry gate.'**
  String eventPointsNote(int count);

  /// No description provided for @eventWhyMatters.
  ///
  /// In en, this message translates to:
  /// **'Why This Matters to You'**
  String get eventWhyMatters;

  /// No description provided for @eventFit.
  ///
  /// In en, this message translates to:
  /// **'{count}% Fit'**
  String eventFit(int count);

  /// No description provided for @eventWhyCredential.
  ///
  /// In en, this message translates to:
  /// **'Matches your verified credential as {role}.'**
  String eventWhyCredential(String role);

  /// No description provided for @eventWhyPeers.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 peer from your network is a confirmed attendee.} other{{count} peers from your network are confirmed attendees.}}'**
  String eventWhyPeers(int count);

  /// No description provided for @eventWhyTopics.
  ///
  /// In en, this message translates to:
  /// **'Covers {topics}.'**
  String eventWhyTopics(String topics);

  /// No description provided for @eventBrief.
  ///
  /// In en, this message translates to:
  /// **'Event Brief'**
  String get eventBrief;

  /// No description provided for @eventSpecs.
  ///
  /// In en, this message translates to:
  /// **'Technical Specifications'**
  String get eventSpecs;

  /// No description provided for @eventSpecDates.
  ///
  /// In en, this message translates to:
  /// **'Dates & Duration'**
  String get eventSpecDates;

  /// No description provided for @eventDays.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{Single day} other{{count} Consecutive Days}}'**
  String eventDays(int count);

  /// No description provided for @eventSpecTiming.
  ///
  /// In en, this message translates to:
  /// **'Session Timing'**
  String get eventSpecTiming;

  /// No description provided for @eventTimezone.
  ///
  /// In en, this message translates to:
  /// **'Arabia Standard Time'**
  String get eventTimezone;

  /// No description provided for @eventSpecFormat.
  ///
  /// In en, this message translates to:
  /// **'Delivery Format'**
  String get eventSpecFormat;

  /// No description provided for @eventInPerson.
  ///
  /// In en, this message translates to:
  /// **'In-Person Only'**
  String get eventInPerson;

  /// No description provided for @eventFormatDetail.
  ///
  /// In en, this message translates to:
  /// **'Main Hall + Workshops'**
  String get eventFormatDetail;

  /// No description provided for @eventRecognized.
  ///
  /// In en, this message translates to:
  /// **'GEA Recognized'**
  String get eventRecognized;

  /// No description provided for @eventCommunityRecognized.
  ///
  /// In en, this message translates to:
  /// **'Community Event'**
  String get eventCommunityRecognized;

  /// No description provided for @eventStandingPoints.
  ///
  /// In en, this message translates to:
  /// **'+{count} attendance points'**
  String eventStandingPoints(int count);

  /// No description provided for @eventKeynoteLeaders.
  ///
  /// In en, this message translates to:
  /// **'Keynote Leaders'**
  String get eventKeynoteLeaders;

  /// No description provided for @eventKeynoteSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Vetted technical & regulatory authorities'**
  String get eventKeynoteSubtitle;

  /// No description provided for @speakerHost.
  ///
  /// In en, this message translates to:
  /// **'Host'**
  String get speakerHost;

  /// No description provided for @speakerKeynote.
  ///
  /// In en, this message translates to:
  /// **'Keynote'**
  String get speakerKeynote;

  /// No description provided for @eventAgenda.
  ///
  /// In en, this message translates to:
  /// **'Curated Agenda'**
  String get eventAgenda;

  /// No description provided for @eventDay.
  ///
  /// In en, this message translates to:
  /// **'Day {count}'**
  String eventDay(int count);

  /// No description provided for @eventVerifiedAttendees.
  ///
  /// In en, this message translates to:
  /// **'+{count} Verified Attendees'**
  String eventVerifiedAttendees(int count);

  /// No description provided for @eventVenue.
  ///
  /// In en, this message translates to:
  /// **'Venue Coordinates'**
  String get eventVenue;

  /// No description provided for @actionOpenMaps.
  ///
  /// In en, this message translates to:
  /// **'Open Maps'**
  String get actionOpenMaps;

  /// No description provided for @eventVerifiedOrganizer.
  ///
  /// In en, this message translates to:
  /// **'Verified Organizer'**
  String get eventVerifiedOrganizer;

  /// No description provided for @eventHost.
  ///
  /// In en, this message translates to:
  /// **'Host:'**
  String get eventHost;

  /// No description provided for @actionDownload.
  ///
  /// In en, this message translates to:
  /// **'Download'**
  String get actionDownload;

  /// No description provided for @notificationsInbox.
  ///
  /// In en, this message translates to:
  /// **'Inbox'**
  String get notificationsInbox;

  /// No description provided for @notificationsUnread.
  ///
  /// In en, this message translates to:
  /// **'{count} unread'**
  String notificationsUnread(int count);

  /// No description provided for @notificationsAllCount.
  ///
  /// In en, this message translates to:
  /// **'All ({count})'**
  String notificationsAllCount(int count);

  /// No description provided for @notificationCategoryOpportunities.
  ///
  /// In en, this message translates to:
  /// **'Opportunities'**
  String get notificationCategoryOpportunities;

  /// No description provided for @notificationCategoryEvents.
  ///
  /// In en, this message translates to:
  /// **'Events'**
  String get notificationCategoryEvents;

  /// No description provided for @notificationCategoryCredentials.
  ///
  /// In en, this message translates to:
  /// **'Credentials'**
  String get notificationCategoryCredentials;

  /// No description provided for @notificationsToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get notificationsToday;

  /// No description provided for @notificationsEarlier.
  ///
  /// In en, this message translates to:
  /// **'Earlier This Week'**
  String get notificationsEarlier;

  /// No description provided for @notificationsTimezone.
  ///
  /// In en, this message translates to:
  /// **'Riyadh (GMT+3)'**
  String get notificationsTimezone;

  /// No description provided for @notificationActionApplication.
  ///
  /// In en, this message translates to:
  /// **'View Application Status'**
  String get notificationActionApplication;

  /// No description provided for @notificationActionEvent.
  ///
  /// In en, this message translates to:
  /// **'Access Delegate Pass'**
  String get notificationActionEvent;

  /// No description provided for @notificationActionCredential.
  ///
  /// In en, this message translates to:
  /// **'View Credential Dossier'**
  String get notificationActionCredential;

  /// No description provided for @notificationActionLedger.
  ///
  /// In en, this message translates to:
  /// **'View Points Ledger'**
  String get notificationActionLedger;

  /// No description provided for @notificationPointsLogged.
  ///
  /// In en, this message translates to:
  /// **'+{count} Points Logged'**
  String notificationPointsLogged(int count);

  /// No description provided for @notificationsCategoryEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No notifications here'**
  String get notificationsCategoryEmptyTitle;

  /// No description provided for @notificationsCategoryEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'There are no updates in this category right now. New activity will appear automatically.'**
  String get notificationsCategoryEmptyMessage;

  /// No description provided for @notificationsFooter.
  ///
  /// In en, this message translates to:
  /// **'Notifications reflect verified institutional and ecosystem events only.'**
  String get notificationsFooter;

  /// No description provided for @profileVisibilityScore.
  ///
  /// In en, this message translates to:
  /// **'Visibility Score'**
  String get profileVisibilityScore;

  /// No description provided for @profileVisibilityHint.
  ///
  /// In en, this message translates to:
  /// **'Profile completeness & engagement rank'**
  String get profileVisibilityHint;

  /// No description provided for @profileVerification.
  ///
  /// In en, this message translates to:
  /// **'Verification'**
  String get profileVerification;

  /// No description provided for @profileVerificationHint.
  ///
  /// In en, this message translates to:
  /// **'National ID & credential verified'**
  String get profileVerificationHint;

  /// No description provided for @profileExecutiveSummary.
  ///
  /// In en, this message translates to:
  /// **'Executive Summary'**
  String get profileExecutiveSummary;

  /// No description provided for @profileExperienceRecord.
  ///
  /// In en, this message translates to:
  /// **'Experience Record'**
  String get profileExperienceRecord;

  /// No description provided for @profileYearsExp.
  ///
  /// In en, this message translates to:
  /// **'{count}+ Yrs Exp'**
  String profileYearsExp(int count);

  /// No description provided for @profileSkillsTitle.
  ///
  /// In en, this message translates to:
  /// **'Technical & Operational Skills'**
  String get profileSkillsTitle;

  /// No description provided for @verifiedCount.
  ///
  /// In en, this message translates to:
  /// **'{count} Verified'**
  String verifiedCount(int count);

  /// No description provided for @profileBadges.
  ///
  /// In en, this message translates to:
  /// **'Badges & Recognition'**
  String get profileBadges;

  /// No description provided for @navNews.
  ///
  /// In en, this message translates to:
  /// **'News'**
  String get navNews;

  /// No description provided for @newsEyebrow.
  ///
  /// In en, this message translates to:
  /// **'Official Executive Journal'**
  String get newsEyebrow;

  /// No description provided for @newsTitle.
  ///
  /// In en, this message translates to:
  /// **'News & Insights'**
  String get newsTitle;

  /// No description provided for @newsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Authoritative technical briefings, regulatory updates, and market intelligence published by Back Of House.'**
  String get newsSubtitle;

  /// No description provided for @newsSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search articles, reports, briefings…'**
  String get newsSearchHint;

  /// No description provided for @newsFilterForYou.
  ///
  /// In en, this message translates to:
  /// **'For You'**
  String get newsFilterForYou;

  /// No description provided for @newsFilterLatest.
  ///
  /// In en, this message translates to:
  /// **'Latest'**
  String get newsFilterLatest;

  /// No description provided for @newsTopicTechnical.
  ///
  /// In en, this message translates to:
  /// **'Technical Briefings'**
  String get newsTopicTechnical;

  /// No description provided for @newsTopicRegulatory.
  ///
  /// In en, this message translates to:
  /// **'Regulatory & Safety'**
  String get newsTopicRegulatory;

  /// No description provided for @newsTopicMarket.
  ///
  /// In en, this message translates to:
  /// **'Market Reports'**
  String get newsTopicMarket;

  /// No description provided for @newsCurated.
  ///
  /// In en, this message translates to:
  /// **'Curated Intelligence'**
  String get newsCurated;

  /// No description provided for @newsCuratedSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Validated technical dossiers & market studies'**
  String get newsCuratedSubtitle;

  /// No description provided for @newsPeerReviewed.
  ///
  /// In en, this message translates to:
  /// **'Peer Reviewed'**
  String get newsPeerReviewed;

  /// No description provided for @actionReadFullBriefing.
  ///
  /// In en, this message translates to:
  /// **'Read Full Briefing'**
  String get actionReadFullBriefing;

  /// No description provided for @newsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No briefings found'**
  String get newsEmptyTitle;

  /// No description provided for @newsEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Try another topic or search term.'**
  String get newsEmptyMessage;

  /// No description provided for @newsStandardsTitle.
  ///
  /// In en, this message translates to:
  /// **'Back Of House Editorial Standards'**
  String get newsStandardsTitle;

  /// No description provided for @newsStandardsBody.
  ///
  /// In en, this message translates to:
  /// **'Every briefing is written or reviewed by the Back Of House editorial desk and checked against the Kingdom\'s industry and event safety standards.'**
  String get newsStandardsBody;

  /// No description provided for @articleDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Briefing'**
  String get articleDetailsTitle;

  /// No description provided for @articleDirectives.
  ///
  /// In en, this message translates to:
  /// **'Core Operational Directives'**
  String get articleDirectives;

  /// No description provided for @articleRelated.
  ///
  /// In en, this message translates to:
  /// **'Related Briefings'**
  String get articleRelated;

  /// No description provided for @articlePublished.
  ///
  /// In en, this message translates to:
  /// **'Published {date}'**
  String articlePublished(String date);

  /// No description provided for @articleSavedMessage.
  ///
  /// In en, this message translates to:
  /// **'Briefing saved'**
  String get articleSavedMessage;

  /// No description provided for @articleRemovedMessage.
  ///
  /// In en, this message translates to:
  /// **'Removed from saved'**
  String get articleRemovedMessage;

  /// No description provided for @notificationCategoryNews.
  ///
  /// In en, this message translates to:
  /// **'News'**
  String get notificationCategoryNews;

  /// No description provided for @accountTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'I am'**
  String get accountTypeLabel;

  /// No description provided for @accountIndividual.
  ///
  /// In en, this message translates to:
  /// **'Individual'**
  String get accountIndividual;

  /// No description provided for @accountCompany.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get accountCompany;

  /// No description provided for @fieldCompanyNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Company name'**
  String get fieldCompanyNameLabel;

  /// No description provided for @fieldCompanyNameHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Midan Events'**
  String get fieldCompanyNameHint;

  /// No description provided for @fieldCompanyNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your company\'s name'**
  String get fieldCompanyNameRequired;

  /// No description provided for @companyTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Company type'**
  String get companyTypeLabel;

  /// No description provided for @companyTypeRequired.
  ///
  /// In en, this message translates to:
  /// **'Choose a company type'**
  String get companyTypeRequired;

  /// No description provided for @companyTypeEventOrganizer.
  ///
  /// In en, this message translates to:
  /// **'Event Organizer'**
  String get companyTypeEventOrganizer;

  /// No description provided for @companyTypeSupplier.
  ///
  /// In en, this message translates to:
  /// **'Supplier'**
  String get companyTypeSupplier;

  /// No description provided for @companyTypeVenue.
  ///
  /// In en, this message translates to:
  /// **'Venue'**
  String get companyTypeVenue;

  /// No description provided for @companyTypeProduction.
  ///
  /// In en, this message translates to:
  /// **'Production'**
  String get companyTypeProduction;

  /// No description provided for @companyTypeAgency.
  ///
  /// In en, this message translates to:
  /// **'Agency'**
  String get companyTypeAgency;

  /// No description provided for @companyTypeServiceProvider.
  ///
  /// In en, this message translates to:
  /// **'Service Provider'**
  String get companyTypeServiceProvider;

  /// No description provided for @companyTypeOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get companyTypeOther;

  /// No description provided for @profileStatusStudent.
  ///
  /// In en, this message translates to:
  /// **'Student'**
  String get profileStatusStudent;

  /// No description provided for @homeCompaniesToWatch.
  ///
  /// In en, this message translates to:
  /// **'Companies to Watch'**
  String get homeCompaniesToWatch;

  /// No description provided for @discoverRecommendedGathering.
  ///
  /// In en, this message translates to:
  /// **'Recommended Gathering'**
  String get discoverRecommendedGathering;

  /// No description provided for @eventSpeakersCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 speaker} other{{count} speakers}}'**
  String eventSpeakersCount(int count);

  /// No description provided for @profileSelectedProjects.
  ///
  /// In en, this message translates to:
  /// **'Selected Projects'**
  String get profileSelectedProjects;

  /// No description provided for @companyOpenOpportunities.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No open opportunities} =1{1 open opportunity} other{{count} open opportunities}}'**
  String companyOpenOpportunities(int count);

  /// No description provided for @opportunityTypeJob.
  ///
  /// In en, this message translates to:
  /// **'Job'**
  String get opportunityTypeJob;

  /// No description provided for @opportunityTypeProject.
  ///
  /// In en, this message translates to:
  /// **'Project'**
  String get opportunityTypeProject;

  /// No description provided for @opportunityTypeCoOp.
  ///
  /// In en, this message translates to:
  /// **'Co-op Training'**
  String get opportunityTypeCoOp;

  /// No description provided for @opportunityTypeVolunteering.
  ///
  /// In en, this message translates to:
  /// **'Volunteering'**
  String get opportunityTypeVolunteering;

  /// No description provided for @opportunityTypeSupplierRequest.
  ///
  /// In en, this message translates to:
  /// **'Supplier Request'**
  String get opportunityTypeSupplierRequest;

  /// No description provided for @employmentFullTime.
  ///
  /// In en, this message translates to:
  /// **'Full-time'**
  String get employmentFullTime;

  /// No description provided for @employmentPartTime.
  ///
  /// In en, this message translates to:
  /// **'Part-time'**
  String get employmentPartTime;

  /// No description provided for @employmentContract.
  ///
  /// In en, this message translates to:
  /// **'Contract'**
  String get employmentContract;

  /// No description provided for @employmentFreelance.
  ///
  /// In en, this message translates to:
  /// **'Freelance'**
  String get employmentFreelance;

  /// No description provided for @opportunitiesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Jobs, projects, co-op training and volunteering that match your profile.'**
  String get opportunitiesSubtitle;

  /// No description provided for @opportunitiesSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search roles, companies, cities…'**
  String get opportunitiesSearchHint;

  /// No description provided for @opportunitiesRecommended.
  ///
  /// In en, this message translates to:
  /// **'Recommended for You'**
  String get opportunitiesRecommended;

  /// No description provided for @opportunitiesOpen.
  ///
  /// In en, this message translates to:
  /// **'Open Opportunities'**
  String get opportunitiesOpen;

  /// No description provided for @opportunitiesEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No opportunities found'**
  String get opportunitiesEmptyTitle;

  /// No description provided for @opportunitiesEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Try another type or search term.'**
  String get opportunitiesEmptyMessage;

  /// No description provided for @opportunityApplicants.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No applicants yet} =1{1 applicant} other{{count} applicants}}'**
  String opportunityApplicants(int count);

  /// No description provided for @opportunityClosesOn.
  ///
  /// In en, this message translates to:
  /// **'Closes {date}'**
  String opportunityClosesOn(String date);

  /// No description provided for @opportunityWhyMatch.
  ///
  /// In en, this message translates to:
  /// **'Why it matches'**
  String get opportunityWhyMatch;

  /// No description provided for @opportunityOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get opportunityOverview;

  /// No description provided for @opportunityResponsibilities.
  ///
  /// In en, this message translates to:
  /// **'Responsibilities'**
  String get opportunityResponsibilities;

  /// No description provided for @opportunityRequirements.
  ///
  /// In en, this message translates to:
  /// **'Requirements'**
  String get opportunityRequirements;

  /// No description provided for @opportunitySkills.
  ///
  /// In en, this message translates to:
  /// **'Skills'**
  String get opportunitySkills;

  /// No description provided for @opportunityPostedBy.
  ///
  /// In en, this message translates to:
  /// **'Posted by'**
  String get opportunityPostedBy;

  /// No description provided for @actionViewCompany.
  ///
  /// In en, this message translates to:
  /// **'View Company Profile'**
  String get actionViewCompany;

  /// No description provided for @opportunityUnpaid.
  ///
  /// In en, this message translates to:
  /// **'Unpaid'**
  String get opportunityUnpaid;

  /// No description provided for @opportunityYourApplication.
  ///
  /// In en, this message translates to:
  /// **'Your application'**
  String get opportunityYourApplication;

  /// No description provided for @opportunityClosed.
  ///
  /// In en, this message translates to:
  /// **'This opportunity is closed.'**
  String get opportunityClosed;

  /// No description provided for @actionViewApplication.
  ///
  /// In en, this message translates to:
  /// **'View Application'**
  String get actionViewApplication;

  /// No description provided for @applyTitle.
  ///
  /// In en, this message translates to:
  /// **'Apply'**
  String get applyTitle;

  /// No description provided for @applyStepOf.
  ///
  /// In en, this message translates to:
  /// **'Step {step} of {total}'**
  String applyStepOf(int step, int total);

  /// No description provided for @applyStepProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile & Experience'**
  String get applyStepProfile;

  /// No description provided for @applyStepReview.
  ///
  /// In en, this message translates to:
  /// **'Review & Submit'**
  String get applyStepReview;

  /// No description provided for @applyExperienceTitle.
  ///
  /// In en, this message translates to:
  /// **'Relevant Experience'**
  String get applyExperienceTitle;

  /// No description provided for @applyExperienceSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose the roles to include with this application.'**
  String get applyExperienceSubtitle;

  /// No description provided for @applySelectedCount.
  ///
  /// In en, this message translates to:
  /// **'{count} selected'**
  String applySelectedCount(int count);

  /// No description provided for @applySkillsTitle.
  ///
  /// In en, this message translates to:
  /// **'Your Skills'**
  String get applySkillsTitle;

  /// No description provided for @actionContinue.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get actionContinue;

  /// No description provided for @applyStatementTitle.
  ///
  /// In en, this message translates to:
  /// **'Message to the company'**
  String get applyStatementTitle;

  /// No description provided for @applyStatementOptional.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get applyStatementOptional;

  /// No description provided for @applyStatementHint.
  ///
  /// In en, this message translates to:
  /// **'Why you\'re a good fit for this opportunity'**
  String get applyStatementHint;

  /// No description provided for @applyStatementIncluded.
  ///
  /// In en, this message translates to:
  /// **'Included'**
  String get applyStatementIncluded;

  /// No description provided for @applyStatementNotIncluded.
  ///
  /// In en, this message translates to:
  /// **'Not included'**
  String get applyStatementNotIncluded;

  /// No description provided for @applyChecklistTitle.
  ///
  /// In en, this message translates to:
  /// **'What {company} receives'**
  String applyChecklistTitle(String company);

  /// No description provided for @applyChecklistProfile.
  ///
  /// In en, this message translates to:
  /// **'Your profile and verification status'**
  String get applyChecklistProfile;

  /// No description provided for @applyChecklistExperience.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 experience entry} other{{count} experience entries}}'**
  String applyChecklistExperience(int count);

  /// No description provided for @applyPrivacyNote.
  ///
  /// In en, this message translates to:
  /// **'{company} sees your professional profile. Your ID number is never shared.'**
  String applyPrivacyNote(String company);

  /// No description provided for @applyDecisionNote.
  ///
  /// In en, this message translates to:
  /// **'{company} reviews applications and makes the final decision.'**
  String applyDecisionNote(String company);

  /// No description provided for @actionSubmitApplication.
  ///
  /// In en, this message translates to:
  /// **'Submit Application'**
  String get actionSubmitApplication;

  /// No description provided for @applySubmittedMessage.
  ///
  /// In en, this message translates to:
  /// **'Application submitted'**
  String get applySubmittedMessage;

  /// No description provided for @applyNotAvailable.
  ///
  /// In en, this message translates to:
  /// **'You can\'t apply to this opportunity.'**
  String get applyNotAvailable;

  /// No description provided for @applyAlreadyApplied.
  ///
  /// In en, this message translates to:
  /// **'You\'ve already applied to this opportunity.'**
  String get applyAlreadyApplied;

  /// No description provided for @applicationsTitle.
  ///
  /// In en, this message translates to:
  /// **'My Applications'**
  String get applicationsTitle;

  /// No description provided for @applicationsEntryHint.
  ///
  /// In en, this message translates to:
  /// **'Track where each application stands'**
  String get applicationsEntryHint;

  /// No description provided for @applicationsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Each company reviews its applications and makes the decision. You can follow every step here.'**
  String get applicationsSubtitle;

  /// No description provided for @applicationsActive.
  ///
  /// In en, this message translates to:
  /// **'Active ({count})'**
  String applicationsActive(int count);

  /// No description provided for @applicationsPast.
  ///
  /// In en, this message translates to:
  /// **'Past ({count})'**
  String applicationsPast(int count);

  /// No description provided for @applicationsEmptyActiveTitle.
  ///
  /// In en, this message translates to:
  /// **'No active applications'**
  String get applicationsEmptyActiveTitle;

  /// No description provided for @applicationsEmptyActiveMessage.
  ///
  /// In en, this message translates to:
  /// **'Browse opportunities and apply to the ones that fit your profile.'**
  String get applicationsEmptyActiveMessage;

  /// No description provided for @applicationsEmptyPastTitle.
  ///
  /// In en, this message translates to:
  /// **'No past applications'**
  String get applicationsEmptyPastTitle;

  /// No description provided for @applicationsEmptyPastMessage.
  ///
  /// In en, this message translates to:
  /// **'Applications with a decision appear here.'**
  String get applicationsEmptyPastMessage;

  /// No description provided for @actionBrowseOpportunities.
  ///
  /// In en, this message translates to:
  /// **'Browse Opportunities'**
  String get actionBrowseOpportunities;

  /// No description provided for @applicationAppliedOn.
  ///
  /// In en, this message translates to:
  /// **'Applied {date}'**
  String applicationAppliedOn(String date);

  /// No description provided for @applicationReference.
  ///
  /// In en, this message translates to:
  /// **'Ref. {code}'**
  String applicationReference(String code);

  /// No description provided for @applicationStageOf.
  ///
  /// In en, this message translates to:
  /// **'Step {step} of {total}'**
  String applicationStageOf(int step, int total);

  /// No description provided for @applicationStatusSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted'**
  String get applicationStatusSubmitted;

  /// No description provided for @applicationStatusReviewed.
  ///
  /// In en, this message translates to:
  /// **'Reviewed'**
  String get applicationStatusReviewed;

  /// No description provided for @applicationStatusShortlisted.
  ///
  /// In en, this message translates to:
  /// **'Shortlisted'**
  String get applicationStatusShortlisted;

  /// No description provided for @applicationStatusContact.
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get applicationStatusContact;

  /// No description provided for @applicationStatusAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get applicationStatusAccepted;

  /// No description provided for @applicationStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Not selected'**
  String get applicationStatusRejected;

  /// No description provided for @applicationStatusWithdrawn.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn'**
  String get applicationStatusWithdrawn;

  /// No description provided for @applicationStageDecision.
  ///
  /// In en, this message translates to:
  /// **'Decision'**
  String get applicationStageDecision;

  /// No description provided for @actionWithdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw'**
  String get actionWithdraw;

  /// No description provided for @actionViewOpportunity.
  ///
  /// In en, this message translates to:
  /// **'View Opportunity'**
  String get actionViewOpportunity;

  /// No description provided for @applicationWithdrawTitle.
  ///
  /// In en, this message translates to:
  /// **'Withdraw this application?'**
  String get applicationWithdrawTitle;

  /// No description provided for @applicationWithdrawBody.
  ///
  /// In en, this message translates to:
  /// **'{company} will stop reviewing it. You can apply again while the opportunity is open.'**
  String applicationWithdrawBody(String company);

  /// No description provided for @applicationWithdrawnMessage.
  ///
  /// In en, this message translates to:
  /// **'Application withdrawn'**
  String get applicationWithdrawnMessage;

  /// No description provided for @applicationsFooter.
  ///
  /// In en, this message translates to:
  /// **'Back Of House connects you with companies. Hiring decisions are made by each company.'**
  String get applicationsFooter;

  /// No description provided for @companyNavDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get companyNavDashboard;

  /// No description provided for @companyNavPortfolio.
  ///
  /// In en, this message translates to:
  /// **'Portfolio'**
  String get companyNavPortfolio;

  /// No description provided for @companyWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Your workspace'**
  String get companyWorkspace;

  /// No description provided for @companyListingsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No listings yet} =1{1 listing} other{{count} listings}}'**
  String companyListingsCount(int count);

  /// No description provided for @companyProjectsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No projects yet} =1{1 project} other{{count} projects}}'**
  String companyProjectsCount(int count);

  /// No description provided for @companyCreateOpportunityShort.
  ///
  /// In en, this message translates to:
  /// **'Start a draft for review'**
  String get companyCreateOpportunityShort;

  /// No description provided for @applyIndividualsOnly.
  ///
  /// In en, this message translates to:
  /// **'Only individual accounts can apply to this opportunity.'**
  String get applyIndividualsOnly;

  /// No description provided for @applyStudentsOnly.
  ///
  /// In en, this message translates to:
  /// **'Co-op training is open to individuals with student status.'**
  String get applyStudentsOnly;

  /// No description provided for @applyProjectsTitle.
  ///
  /// In en, this message translates to:
  /// **'Portfolio Projects'**
  String get applyProjectsTitle;

  /// No description provided for @applyProjectsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose the projects to include with this application.'**
  String get applyProjectsSubtitle;

  /// No description provided for @applyChecklistProjects.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No projects} =1{1 project} other{{count} projects}}'**
  String applyChecklistProjects(int count);

  /// No description provided for @notificationApplicationTitle.
  ///
  /// In en, this message translates to:
  /// **'{status, select, SUBMITTED{Application submitted} REVIEWED{Application reviewed} SHORTLISTED{Application shortlisted} CONTACT{Company contact stage} ACCEPTED{Application accepted} REJECTED{Application not selected} WITHDRAWN{Application withdrawn} other{Application updated}}'**
  String notificationApplicationTitle(String status);

  /// No description provided for @notificationApplicationBody.
  ///
  /// In en, this message translates to:
  /// **'{status, select, SUBMITTED{Your application for {title} has been submitted.} REVIEWED{Your application for {title} has been reviewed.} SHORTLISTED{Your application for {title} has been shortlisted.} CONTACT{Your application for {title} has moved to the contact stage.} ACCEPTED{Your application for {title} has been accepted.} REJECTED{Your application for {title} was not selected.} WITHDRAWN{You withdrew your application for {title}.} other{Your application for {title} was updated.}}'**
  String notificationApplicationBody(String status, String title);

  /// No description provided for @actionDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get actionDelete;

  /// No description provided for @actionEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get actionEdit;

  /// No description provided for @fieldCategoryLabel.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get fieldCategoryLabel;

  /// No description provided for @fieldCityLabel.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get fieldCityLabel;

  /// No description provided for @fieldDescriptionLabel.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get fieldDescriptionLabel;

  /// No description provided for @fieldLocationLabel.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get fieldLocationLabel;

  /// No description provided for @fieldOnePerLine.
  ///
  /// In en, this message translates to:
  /// **'One per line'**
  String get fieldOnePerLine;

  /// No description provided for @fieldOptional.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get fieldOptional;

  /// No description provided for @fieldRequired.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get fieldRequired;

  /// No description provided for @fieldTitleLabel.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get fieldTitleLabel;

  /// No description provided for @fieldTooLong.
  ///
  /// In en, this message translates to:
  /// **'Use {max} characters or fewer'**
  String fieldTooLong(int max);

  /// No description provided for @opportunityStatusDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get opportunityStatusDraft;

  /// No description provided for @opportunityStatusInReview.
  ///
  /// In en, this message translates to:
  /// **'In review'**
  String get opportunityStatusInReview;

  /// No description provided for @opportunityStatusPublished.
  ///
  /// In en, this message translates to:
  /// **'Published'**
  String get opportunityStatusPublished;

  /// No description provided for @opportunityStatusPaused.
  ///
  /// In en, this message translates to:
  /// **'Paused'**
  String get opportunityStatusPaused;

  /// No description provided for @opportunityStatusClosed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get opportunityStatusClosed;

  /// No description provided for @opportunityStatusArchived.
  ///
  /// In en, this message translates to:
  /// **'Archived'**
  String get opportunityStatusArchived;

  /// No description provided for @companyNavSupplierRequests.
  ///
  /// In en, this message translates to:
  /// **'Supplier Requests'**
  String get companyNavSupplierRequests;

  /// No description provided for @companyNavSupplierRequestsShort.
  ///
  /// In en, this message translates to:
  /// **'Requests'**
  String get companyNavSupplierRequestsShort;

  /// No description provided for @companyNotVerified.
  ///
  /// In en, this message translates to:
  /// **'Not verified yet'**
  String get companyNotVerified;

  /// No description provided for @companyEditProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit company profile'**
  String get companyEditProfile;

  /// No description provided for @companyProfileIncomplete.
  ///
  /// In en, this message translates to:
  /// **'Add an about section and city so buyers and candidates understand what you do.'**
  String get companyProfileIncomplete;

  /// No description provided for @companyAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get companyAbout;

  /// No description provided for @companyAboutHint.
  ///
  /// In en, this message translates to:
  /// **'What your company delivers and for whom'**
  String get companyAboutHint;

  /// No description provided for @companySpecialization.
  ///
  /// In en, this message translates to:
  /// **'Specialization'**
  String get companySpecialization;

  /// No description provided for @companySpecializationHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Staging & Rigging'**
  String get companySpecializationHint;

  /// No description provided for @companyServices.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get companyServices;

  /// No description provided for @companyIndustries.
  ///
  /// In en, this message translates to:
  /// **'Industries'**
  String get companyIndustries;

  /// No description provided for @companyContact.
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get companyContact;

  /// No description provided for @companyContactEmpty.
  ///
  /// In en, this message translates to:
  /// **'No contact details added yet.'**
  String get companyContactEmpty;

  /// No description provided for @companyWebsite.
  ///
  /// In en, this message translates to:
  /// **'Website'**
  String get companyWebsite;

  /// No description provided for @companyCapabilities.
  ///
  /// In en, this message translates to:
  /// **'Company tools'**
  String get companyCapabilities;

  /// No description provided for @companyCanCreateSupplierRequests.
  ///
  /// In en, this message translates to:
  /// **'Your company can post supplier requests.'**
  String get companyCanCreateSupplierRequests;

  /// No description provided for @companyCannotCreateSupplierRequests.
  ///
  /// In en, this message translates to:
  /// **'Your company can respond to supplier requests that invite its type.'**
  String get companyCannotCreateSupplierRequests;

  /// No description provided for @companyProfileSaved.
  ///
  /// In en, this message translates to:
  /// **'Company profile saved'**
  String get companyProfileSaved;

  /// No description provided for @companyIdentityNote.
  ///
  /// In en, this message translates to:
  /// **'{name} and its company type are part of your registered identity. Contact Back Of House to change them.'**
  String companyIdentityNote(String name);

  /// No description provided for @companyAddProject.
  ///
  /// In en, this message translates to:
  /// **'Add project'**
  String get companyAddProject;

  /// No description provided for @companyEditProject.
  ///
  /// In en, this message translates to:
  /// **'Edit project'**
  String get companyEditProject;

  /// No description provided for @companyPortfolioSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Work your company has delivered. Attach it to supplier responses as evidence.'**
  String get companyPortfolioSubtitle;

  /// No description provided for @companyPortfolioEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No projects yet'**
  String get companyPortfolioEmptyTitle;

  /// No description provided for @companyPortfolioEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Add past projects to show buyers what your company can deliver.'**
  String get companyPortfolioEmptyMessage;

  /// No description provided for @companyProjectDeleteTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete this project?'**
  String get companyProjectDeleteTitle;

  /// No description provided for @companyProjectDeleteBody.
  ///
  /// In en, this message translates to:
  /// **'\"{title}\" will be removed from your portfolio.'**
  String companyProjectDeleteBody(String title);

  /// No description provided for @companyProjectDeleted.
  ///
  /// In en, this message translates to:
  /// **'Project deleted'**
  String get companyProjectDeleted;

  /// No description provided for @companyProjectSaved.
  ///
  /// In en, this message translates to:
  /// **'Project saved'**
  String get companyProjectSaved;

  /// No description provided for @companyProjectClientConfidential.
  ///
  /// In en, this message translates to:
  /// **'Client confidential'**
  String get companyProjectClientConfidential;

  /// No description provided for @companyProjectCategoryHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Technical Production'**
  String get companyProjectCategoryHint;

  /// No description provided for @companyProjectStart.
  ///
  /// In en, this message translates to:
  /// **'Start: {date}'**
  String companyProjectStart(String date);

  /// No description provided for @companyProjectEnd.
  ///
  /// In en, this message translates to:
  /// **'End: {date}'**
  String companyProjectEnd(String date);

  /// No description provided for @companyProjectAddEnd.
  ///
  /// In en, this message translates to:
  /// **'Add end date'**
  String get companyProjectAddEnd;

  /// No description provided for @companyProjectEndsBeforeStart.
  ///
  /// In en, this message translates to:
  /// **'The end date must be after the start date.'**
  String get companyProjectEndsBeforeStart;

  /// No description provided for @companyProjectServices.
  ///
  /// In en, this message translates to:
  /// **'Services provided'**
  String get companyProjectServices;

  /// No description provided for @companyProjectClient.
  ///
  /// In en, this message translates to:
  /// **'Client name'**
  String get companyProjectClient;

  /// No description provided for @companyProjectClientHint.
  ///
  /// In en, this message translates to:
  /// **'Optional — leave blank if confidential'**
  String get companyProjectClientHint;

  /// No description provided for @companyMyOpportunities.
  ///
  /// In en, this message translates to:
  /// **'My Opportunities'**
  String get companyMyOpportunities;

  /// No description provided for @companyOpportunitiesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Drafts, listings in review and published opportunities.'**
  String get companyOpportunitiesSubtitle;

  /// No description provided for @companyReviewNote.
  ///
  /// In en, this message translates to:
  /// **'Back Of House reviews every listing before it is published, whether or not your company is verified.'**
  String get companyReviewNote;

  /// No description provided for @companyOpportunitiesEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing here yet'**
  String get companyOpportunitiesEmptyTitle;

  /// No description provided for @companyOpportunitiesEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Create a draft, then submit it for review.'**
  String get companyOpportunitiesEmptyMessage;

  /// No description provided for @companyCreateOpportunity.
  ///
  /// In en, this message translates to:
  /// **'Create opportunity'**
  String get companyCreateOpportunity;

  /// No description provided for @companyCreateOpportunityHint.
  ///
  /// In en, this message translates to:
  /// **'Jobs, projects, co-op, volunteering and supplier requests'**
  String get companyCreateOpportunityHint;

  /// No description provided for @companyEditOpportunity.
  ///
  /// In en, this message translates to:
  /// **'Edit draft'**
  String get companyEditOpportunity;

  /// No description provided for @companyUntitled.
  ///
  /// In en, this message translates to:
  /// **'Untitled draft'**
  String get companyUntitled;

  /// No description provided for @companyOnlyDraftsEditable.
  ///
  /// In en, this message translates to:
  /// **'Published listings are not edited directly. Propose changes instead, and Back Of House reviews the update.'**
  String get companyOnlyDraftsEditable;

  /// No description provided for @companyDraftSaved.
  ///
  /// In en, this message translates to:
  /// **'Draft saved'**
  String get companyDraftSaved;

  /// No description provided for @companyDraftNote.
  ///
  /// In en, this message translates to:
  /// **'Saved as a draft. Nothing is public until Back Of House approves it.'**
  String get companyDraftNote;

  /// No description provided for @companySaveDraft.
  ///
  /// In en, this message translates to:
  /// **'Save draft'**
  String get companySaveDraft;

  /// No description provided for @companyOpportunityType.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get companyOpportunityType;

  /// No description provided for @companyOpportunitySummary.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get companyOpportunitySummary;

  /// No description provided for @companyOpportunitySummaryHint.
  ///
  /// In en, this message translates to:
  /// **'One line shown on cards'**
  String get companyOpportunitySummaryHint;

  /// No description provided for @companyEmploymentType.
  ///
  /// In en, this message translates to:
  /// **'Employment type'**
  String get companyEmploymentType;

  /// No description provided for @companySupplierTypes.
  ///
  /// In en, this message translates to:
  /// **'Invited supplier types'**
  String get companySupplierTypes;

  /// No description provided for @companySupplierTypesHint.
  ///
  /// In en, this message translates to:
  /// **'Only companies of these types will see and can respond to this request.'**
  String get companySupplierTypesHint;

  /// No description provided for @companySupplierTypesRequired.
  ///
  /// In en, this message translates to:
  /// **'Choose at least one supplier type'**
  String get companySupplierTypesRequired;

  /// No description provided for @companyCompensation.
  ///
  /// In en, this message translates to:
  /// **'Compensation'**
  String get companyCompensation;

  /// No description provided for @companyBudget.
  ///
  /// In en, this message translates to:
  /// **'Budget'**
  String get companyBudget;

  /// No description provided for @companyDuration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get companyDuration;

  /// No description provided for @companyStatusNoteDraft.
  ///
  /// In en, this message translates to:
  /// **'This draft is private. Submit it for review when it is ready.'**
  String get companyStatusNoteDraft;

  /// No description provided for @companyStatusNoteInReview.
  ///
  /// In en, this message translates to:
  /// **'Back Of House is reviewing this listing. You can pull it back to edit it.'**
  String get companyStatusNoteInReview;

  /// No description provided for @companyStatusNotePublished.
  ///
  /// In en, this message translates to:
  /// **'This listing is live. To change it, propose an update; the published version stays up until it is approved.'**
  String get companyStatusNotePublished;

  /// No description provided for @companyStatusNoteClosed.
  ///
  /// In en, this message translates to:
  /// **'This listing is closed.'**
  String get companyStatusNoteClosed;

  /// No description provided for @companySubmitForReview.
  ///
  /// In en, this message translates to:
  /// **'Submit for review'**
  String get companySubmitForReview;

  /// No description provided for @companySubmittedForReview.
  ///
  /// In en, this message translates to:
  /// **'Submitted for review'**
  String get companySubmittedForReview;

  /// No description provided for @companyDraftIncomplete.
  ///
  /// In en, this message translates to:
  /// **'Complete the required fields before submitting.'**
  String get companyDraftIncomplete;

  /// No description provided for @companyReturnToDraft.
  ///
  /// In en, this message translates to:
  /// **'Pull back to draft'**
  String get companyReturnToDraft;

  /// No description provided for @companyReturnedToDraft.
  ///
  /// In en, this message translates to:
  /// **'Moved back to draft'**
  String get companyReturnedToDraft;

  /// No description provided for @companySimulateApproval.
  ///
  /// In en, this message translates to:
  /// **'Simulate approval (dev)'**
  String get companySimulateApproval;

  /// No description provided for @companyPublished.
  ///
  /// In en, this message translates to:
  /// **'Published'**
  String get companyPublished;

  /// No description provided for @companyCloseOpportunity.
  ///
  /// In en, this message translates to:
  /// **'Close listing'**
  String get companyCloseOpportunity;

  /// No description provided for @companyCloseTitle.
  ///
  /// In en, this message translates to:
  /// **'Close this listing?'**
  String get companyCloseTitle;

  /// No description provided for @companyCloseBody.
  ///
  /// In en, this message translates to:
  /// **'It will stop accepting applications. Closing is final: a closed listing cannot be reopened. Existing applicants stay available to review.'**
  String get companyCloseBody;

  /// No description provided for @companyClosed.
  ///
  /// In en, this message translates to:
  /// **'Listing closed'**
  String get companyClosed;

  /// No description provided for @companyLiveOpportunities.
  ///
  /// In en, this message translates to:
  /// **'Live opportunities'**
  String get companyLiveOpportunities;

  /// No description provided for @companyNoLiveOpportunities.
  ///
  /// In en, this message translates to:
  /// **'No published listings yet. Drafts appear under Opportunities.'**
  String get companyNoLiveOpportunities;

  /// No description provided for @companyReviewApplicants.
  ///
  /// In en, this message translates to:
  /// **'Review applicants'**
  String get companyReviewApplicants;

  /// No description provided for @companyApplicants.
  ///
  /// In en, this message translates to:
  /// **'Applicants'**
  String get companyApplicants;

  /// No description provided for @companyApplicant.
  ///
  /// In en, this message translates to:
  /// **'Applicant'**
  String get companyApplicant;

  /// No description provided for @companyApplicantsEmpty.
  ///
  /// In en, this message translates to:
  /// **'No applicants at this stage'**
  String get companyApplicantsEmpty;

  /// No description provided for @companyApplicantContact.
  ///
  /// In en, this message translates to:
  /// **'Contact details'**
  String get companyApplicantContact;

  /// No description provided for @companyContactHidden.
  ///
  /// In en, this message translates to:
  /// **'Contact details are shared only from the contact stage, and only what the applicant chose to share.'**
  String get companyContactHidden;

  /// No description provided for @companyContactNotShared.
  ///
  /// In en, this message translates to:
  /// **'The applicant has not shared contact details. Contact sharing is off by default.'**
  String get companyContactNotShared;

  /// No description provided for @companyContactOutsideApp.
  ///
  /// In en, this message translates to:
  /// **'Contact happens outside Back Of House.'**
  String get companyContactOutsideApp;

  /// No description provided for @companyNoneIncluded.
  ///
  /// In en, this message translates to:
  /// **'None included'**
  String get companyNoneIncluded;

  /// No description provided for @companyDecisionNote.
  ///
  /// In en, this message translates to:
  /// **'Your company makes the decision. Decisions are final once recorded.'**
  String get companyDecisionNote;

  /// No description provided for @companyMarkReviewed.
  ///
  /// In en, this message translates to:
  /// **'Mark reviewed'**
  String get companyMarkReviewed;

  /// No description provided for @companyShortlist.
  ///
  /// In en, this message translates to:
  /// **'Shortlist'**
  String get companyShortlist;

  /// No description provided for @companyMoveToContact.
  ///
  /// In en, this message translates to:
  /// **'Move to contact'**
  String get companyMoveToContact;

  /// No description provided for @companyAcceptApplicant.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get companyAcceptApplicant;

  /// No description provided for @companyRejectApplicant.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get companyRejectApplicant;

  /// No description provided for @companyAcceptTitle.
  ///
  /// In en, this message translates to:
  /// **'Accept this applicant?'**
  String get companyAcceptTitle;

  /// No description provided for @companyRejectTitle.
  ///
  /// In en, this message translates to:
  /// **'Reject?'**
  String get companyRejectTitle;

  /// No description provided for @companyDecisionFinal.
  ///
  /// In en, this message translates to:
  /// **'This decision for {name} is final and cannot be undone.'**
  String companyDecisionFinal(String name);

  /// No description provided for @companyStatusUpdated.
  ///
  /// In en, this message translates to:
  /// **'Moved to {status}'**
  String companyStatusUpdated(String status);

  /// No description provided for @supplierRequestsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Requests from buyers that invite your company type.'**
  String get supplierRequestsSubtitle;

  /// No description provided for @supplierCreateRequest.
  ///
  /// In en, this message translates to:
  /// **'Create supplier request'**
  String get supplierCreateRequest;

  /// No description provided for @supplierTabInvited.
  ///
  /// In en, this message translates to:
  /// **'Invited'**
  String get supplierTabInvited;

  /// No description provided for @supplierTabMyResponses.
  ///
  /// In en, this message translates to:
  /// **'My responses'**
  String get supplierTabMyResponses;

  /// No description provided for @supplierInvitedEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No open requests'**
  String get supplierInvitedEmptyTitle;

  /// No description provided for @supplierInvitedEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Requests that invite your company type will appear here.'**
  String get supplierInvitedEmptyMessage;

  /// No description provided for @supplierInvitedCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No open requests for your type} =1{1 open request for your type} other{{count} open requests for your type}}'**
  String supplierInvitedCount(int count);

  /// No description provided for @supplierResponsesEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No responses yet'**
  String get supplierResponsesEmptyTitle;

  /// No description provided for @supplierResponsesEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Responses you send to supplier requests appear here.'**
  String get supplierResponsesEmptyMessage;

  /// No description provided for @supplierForBuyer.
  ///
  /// In en, this message translates to:
  /// **'For {buyer}'**
  String supplierForBuyer(String buyer);

  /// No description provided for @supplierNotInvited.
  ///
  /// In en, this message translates to:
  /// **'This request does not invite your company type.'**
  String get supplierNotInvited;

  /// No description provided for @supplierOwnRequest.
  ///
  /// In en, this message translates to:
  /// **'This is your own request.'**
  String get supplierOwnRequest;

  /// No description provided for @supplierAlreadyResponded.
  ///
  /// In en, this message translates to:
  /// **'Your company has already responded.'**
  String get supplierAlreadyResponded;

  /// No description provided for @supplierResponsesReceived.
  ///
  /// In en, this message translates to:
  /// **'Responses received'**
  String get supplierResponsesReceived;

  /// No description provided for @supplierNoResponsesYet.
  ///
  /// In en, this message translates to:
  /// **'No responses yet.'**
  String get supplierNoResponsesYet;

  /// No description provided for @supplierViewMyResponse.
  ///
  /// In en, this message translates to:
  /// **'View my response'**
  String get supplierViewMyResponse;

  /// No description provided for @supplierRespond.
  ///
  /// In en, this message translates to:
  /// **'Respond'**
  String get supplierRespond;

  /// No description provided for @supplierReviewResponses.
  ///
  /// In en, this message translates to:
  /// **'Review supplier responses'**
  String get supplierReviewResponses;

  /// No description provided for @supplierResponsesCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No responses yet} =1{1 response} other{{count} responses}}'**
  String supplierResponsesCount(int count);

  /// No description provided for @supplierResponseSent.
  ///
  /// In en, this message translates to:
  /// **'Response sent'**
  String get supplierResponseSent;

  /// No description provided for @supplierSendResponse.
  ///
  /// In en, this message translates to:
  /// **'Send response'**
  String get supplierSendResponse;

  /// No description provided for @supplierMessage.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get supplierMessage;

  /// No description provided for @supplierMessageHint.
  ///
  /// In en, this message translates to:
  /// **'What you can supply, availability and anything the buyer should know'**
  String get supplierMessageHint;

  /// No description provided for @supplierProposedPrice.
  ///
  /// In en, this message translates to:
  /// **'Proposed price'**
  String get supplierProposedPrice;

  /// No description provided for @supplierEvidence.
  ///
  /// In en, this message translates to:
  /// **'Relevant projects'**
  String get supplierEvidence;

  /// No description provided for @supplierEvidenceSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Optional: attach company projects as evidence.'**
  String get supplierEvidenceSubtitle;

  /// No description provided for @supplierNoProjects.
  ///
  /// In en, this message translates to:
  /// **'Add projects to your portfolio to attach them here.'**
  String get supplierNoProjects;

  /// No description provided for @supplierNoAttachments.
  ///
  /// In en, this message translates to:
  /// **'File attachments are not supported yet.'**
  String get supplierNoAttachments;

  /// No description provided for @supplierResponse.
  ///
  /// In en, this message translates to:
  /// **'Supplier response'**
  String get supplierResponse;

  /// No description provided for @supplierSentOn.
  ///
  /// In en, this message translates to:
  /// **'Sent {date}'**
  String supplierSentOn(String date);

  /// No description provided for @supplierRespondingCompany.
  ///
  /// In en, this message translates to:
  /// **'Responding company'**
  String get supplierRespondingCompany;

  /// No description provided for @supplierResponseSelected.
  ///
  /// In en, this message translates to:
  /// **'Selected'**
  String get supplierResponseSelected;

  /// No description provided for @supplierSelect.
  ///
  /// In en, this message translates to:
  /// **'Select'**
  String get supplierSelect;

  /// No description provided for @supplierSelectTitle.
  ///
  /// In en, this message translates to:
  /// **'Select this supplier?'**
  String get supplierSelectTitle;

  /// No description provided for @opportunityStatusChangesRequested.
  ///
  /// In en, this message translates to:
  /// **'Changes requested'**
  String get opportunityStatusChangesRequested;

  /// No description provided for @companyReviewerNote.
  ///
  /// In en, this message translates to:
  /// **'What to change'**
  String get companyReviewerNote;

  /// No description provided for @companyStatusNoteChangesRequested.
  ///
  /// In en, this message translates to:
  /// **'Back Of House asked for changes. Update the listing and send it back for review.'**
  String get companyStatusNoteChangesRequested;

  /// No description provided for @companyProposeChanges.
  ///
  /// In en, this message translates to:
  /// **'Propose changes'**
  String get companyProposeChanges;

  /// No description provided for @companyPendingUpdate.
  ///
  /// In en, this message translates to:
  /// **'Pending update'**
  String get companyPendingUpdate;

  /// No description provided for @companyUpdateNoteDraft.
  ///
  /// In en, this message translates to:
  /// **'This update is not live. The published version stays up until Back Of House approves it.'**
  String get companyUpdateNoteDraft;

  /// No description provided for @companyUpdateNoteInReview.
  ///
  /// In en, this message translates to:
  /// **'Back Of House is reviewing this update. The published version stays live.'**
  String get companyUpdateNoteInReview;

  /// No description provided for @companyUpdateNoteChangesRequested.
  ///
  /// In en, this message translates to:
  /// **'Changes were requested on this update. The published version is unchanged.'**
  String get companyUpdateNoteChangesRequested;

  /// No description provided for @companyEditUpdate.
  ///
  /// In en, this message translates to:
  /// **'Edit update'**
  String get companyEditUpdate;

  /// No description provided for @companySaveUpdate.
  ///
  /// In en, this message translates to:
  /// **'Save update'**
  String get companySaveUpdate;

  /// No description provided for @companySubmitUpdate.
  ///
  /// In en, this message translates to:
  /// **'Submit update for review'**
  String get companySubmitUpdate;

  /// No description provided for @companyUpdateStarted.
  ///
  /// In en, this message translates to:
  /// **'Update started'**
  String get companyUpdateStarted;

  /// No description provided for @companyUpdateSaved.
  ///
  /// In en, this message translates to:
  /// **'Update saved'**
  String get companyUpdateSaved;

  /// No description provided for @companyUpdateSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Update sent for review'**
  String get companyUpdateSubmitted;

  /// No description provided for @companySimulateChangesRequested.
  ///
  /// In en, this message translates to:
  /// **'Simulate changes requested (dev)'**
  String get companySimulateChangesRequested;

  /// No description provided for @companySimulateNote.
  ///
  /// In en, this message translates to:
  /// **'Add more detail to the description and the requirements.'**
  String get companySimulateNote;

  /// No description provided for @companyChangesRequestedRecorded.
  ///
  /// In en, this message translates to:
  /// **'Changes requested'**
  String get companyChangesRequestedRecorded;

  /// No description provided for @companyVerificationReadOnly.
  ///
  /// In en, this message translates to:
  /// **'Verification is handled by Back Of House outside the app. It does not affect publishing: every listing is reviewed.'**
  String get companyVerificationReadOnly;

  /// No description provided for @supplierSelectBody.
  ///
  /// In en, this message translates to:
  /// **'{name} is selected. Every other open response is rejected and the request closes. This cannot be undone.'**
  String supplierSelectBody(String name);

  /// No description provided for @articleLike.
  ///
  /// In en, this message translates to:
  /// **'Like'**
  String get articleLike;

  /// No description provided for @articleLiked.
  ///
  /// In en, this message translates to:
  /// **'Liked'**
  String get articleLiked;

  /// No description provided for @articleLikeCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No likes yet} =1{1 like} other{{count} likes}}'**
  String articleLikeCount(int count);

  /// No description provided for @articleComments.
  ///
  /// In en, this message translates to:
  /// **'Comments'**
  String get articleComments;

  /// No description provided for @articleCommentsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No comments yet} =1{1 comment} other{{count} comments}}'**
  String articleCommentsCount(int count);

  /// No description provided for @articleCommentHint.
  ///
  /// In en, this message translates to:
  /// **'Add a comment…'**
  String get articleCommentHint;

  /// No description provided for @articleCommentPost.
  ///
  /// In en, this message translates to:
  /// **'Post comment'**
  String get articleCommentPost;

  /// No description provided for @articleCommentsEmpty.
  ///
  /// In en, this message translates to:
  /// **'No comments yet. Be the first to share your view.'**
  String get articleCommentsEmpty;

  /// No description provided for @articleCommentsMembersOnly.
  ///
  /// In en, this message translates to:
  /// **'Likes and comments are for individual members.'**
  String get articleCommentsMembersOnly;

  /// No description provided for @articleCommentsMore.
  ///
  /// In en, this message translates to:
  /// **'Show more comments'**
  String get articleCommentsMore;

  /// No description provided for @articleCommentsError.
  ///
  /// In en, this message translates to:
  /// **'Comments couldn\'t load.'**
  String get articleCommentsError;

  /// No description provided for @articleCommentDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete comment'**
  String get articleCommentDelete;

  /// No description provided for @articleCommentDeleteTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete this comment?'**
  String get articleCommentDeleteTitle;

  /// No description provided for @articleCommentDeleteBody.
  ///
  /// In en, this message translates to:
  /// **'It will be removed from this article.'**
  String get articleCommentDeleteBody;

  /// No description provided for @articleCommentDeleted.
  ///
  /// In en, this message translates to:
  /// **'Comment deleted'**
  String get articleCommentDeleted;

  /// No description provided for @articleCommentYou.
  ///
  /// In en, this message translates to:
  /// **'You'**
  String get articleCommentYou;

  /// No description provided for @companyDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get companyDetailsTitle;

  /// No description provided for @companyDetailsOpportunities.
  ///
  /// In en, this message translates to:
  /// **'Open opportunities'**
  String get companyDetailsOpportunities;

  /// No description provided for @companyDetailsNoOpportunities.
  ///
  /// In en, this message translates to:
  /// **'No open opportunities right now.'**
  String get companyDetailsNoOpportunities;

  /// No description provided for @companyDetailsNoProjects.
  ///
  /// In en, this message translates to:
  /// **'No projects shared yet.'**
  String get companyDetailsNoProjects;

  /// No description provided for @companyDetailsOpportunitiesStat.
  ///
  /// In en, this message translates to:
  /// **'Open roles'**
  String get companyDetailsOpportunitiesStat;

  /// No description provided for @companyDetailsProjectsStat.
  ///
  /// In en, this message translates to:
  /// **'Projects'**
  String get companyDetailsProjectsStat;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
