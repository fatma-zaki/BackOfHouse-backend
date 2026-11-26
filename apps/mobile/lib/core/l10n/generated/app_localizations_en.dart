// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Back Of House';

  @override
  String get brandMotto => 'Backstage people. Real events.';

  @override
  String get navHome => 'Home';

  @override
  String get navMenu => 'Menu';

  @override
  String get actionViewAll => 'View All';

  @override
  String get actionReadMore => 'Read More';

  @override
  String get actionRetry => 'Try again';

  @override
  String get appTagline => 'SAUDI ARABIA’S\nEVENTS COMMUNITY';

  @override
  String get actionClose => 'Close';

  @override
  String get actionBack => 'Back';

  @override
  String get actionSearch => 'Search';

  @override
  String get actionClearSearch => 'Clear search';

  @override
  String get actionShowPassword => 'Show password';

  @override
  String get actionHidePassword => 'Hide password';

  @override
  String get actionSignOut => 'Sign out';

  @override
  String get actionOpen => 'Open';

  @override
  String get searchHint => 'Search people, companies, courses…';

  @override
  String get profileAvatarLabel => 'Your profile';

  @override
  String get notificationsLabel => 'Notifications';

  @override
  String get stateLoading => 'Loading…';

  @override
  String get stateImageUnavailable => 'Image unavailable';

  @override
  String get errorStateTitle => 'Something went off cue';

  @override
  String get errorStateMessage =>
      'We couldn\'t load this right now. Check your connection and try again.';

  @override
  String get emptyStateTitle => 'Nothing on stage yet';

  @override
  String get emptyStateMessage =>
      'When there\'s something to show, it will appear here.';

  @override
  String get comingSoonTitle => 'Coming soon';

  @override
  String get comingSoonMessage => 'The crew is still setting up this stage.';

  @override
  String get timeJustNow => 'Just now';

  @override
  String timeMinutesAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '${count}m ago',
      one: '1m ago',
    );
    return '$_temp0';
  }

  @override
  String timeHoursAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '${count}h ago',
      one: '1h ago',
    );
    return '$_temp0';
  }

  @override
  String timeDaysAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '${count}d ago',
      one: '1d ago',
    );
    return '$_temp0';
  }

  @override
  String readTimeMinutes(int count) {
    return '$count min read';
  }

  @override
  String slideCounter(String current, String total) {
    return '$current / $total';
  }

  @override
  String get routeProfile => 'Profile';

  @override
  String get routeCompanies => 'Companies';

  @override
  String get routeCourses => 'Courses';

  @override
  String get routeNews => 'News';

  @override
  String get routeEvents => 'Events';

  @override
  String get routeResetPassword => 'Reset password';

  @override
  String get routeDetail => 'Details';

  @override
  String get languageLabel => 'Language';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageArabic => 'العربية';

  @override
  String get welcomeHaveAccount => 'Sign in';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get signInCta => 'Sign in';

  @override
  String get noAccountPrompt => 'New to Back of House?';

  @override
  String get agreePrefix => 'I agree to the ';

  @override
  String get termsOfService => 'Terms of Service';

  @override
  String get agreeConjunction => ' and ';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get signUpCta => 'Continue';

  @override
  String get haveAccountPrompt => 'Already have an account?';

  @override
  String get logInLink => 'Sign in';

  @override
  String get mustAcceptTerms =>
      'Please accept the Terms of Service and Privacy Policy.';

  @override
  String get validationRequired => 'This field is required';

  @override
  String get validationEmailRequired => 'Email address is required';

  @override
  String get validationEmailInvalid => 'Enter a valid email address';

  @override
  String get validationNameRequired => 'Full name is required';

  @override
  String get validationNameTooShort => 'Enter your full name';

  @override
  String get validationPhoneRequired => 'Phone number is required';

  @override
  String get validationPhoneInvalid => 'Enter a valid Saudi mobile number';

  @override
  String get validationPasswordRequired => 'Password is required';

  @override
  String get validationPasswordTooShort => 'Use at least 8 characters';

  @override
  String get validationPasswordWeak =>
      'Include at least one letter and one number';

  @override
  String get validationConfirmRequired => 'Confirm your password';

  @override
  String get validationPasswordMismatch => 'Passwords do not match';

  @override
  String get errorTimeout => 'The connection timed out. Please try again.';

  @override
  String get errorNoConnection =>
      'No internet connection. Check your network and try again.';

  @override
  String get errorBadCertificate => 'Could not establish a secure connection.';

  @override
  String get errorCancelled => 'Request cancelled.';

  @override
  String get errorBadRequest => 'That request could not be processed.';

  @override
  String get errorSessionExpired =>
      'Your session has expired. Please log in again.';

  @override
  String get errorForbidden => 'You do not have access to this.';

  @override
  String get errorNotFound => 'We could not find what you were looking for.';

  @override
  String get errorValidation => 'Please check the highlighted fields.';

  @override
  String get errorTooManyRequests =>
      'Too many attempts. Please wait a moment and try again.';

  @override
  String get errorServer =>
      'The server is having trouble. Please try again shortly.';

  @override
  String get errorUnknown => 'Something went wrong. Please try again.';

  @override
  String get errorInvalidCredentials =>
      'That email and password don\'t match an account.';

  @override
  String get navProfile => 'Profile';

  @override
  String get themeLabel => 'Appearance';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get welcomeEyebrow => 'Saudi Arabia’s events community';

  @override
  String get welcomeTitleLead => 'We build the community behind ';

  @override
  String get welcomeTitleAccent => 'every experience.';

  @override
  String get welcomeSubtitle =>
      'Connect with the professionals, companies and emerging talent shaping the events industry.';

  @override
  String get welcomeGetStarted => 'Create account';

  @override
  String get signInTitle => 'Welcome ';

  @override
  String get signInSubtitle => 'Sign in to pick up where you left off.';

  @override
  String get fieldEmailLabel => 'Email';

  @override
  String get fieldEmailHint => 'you@example.com';

  @override
  String get fieldPasswordLabel => 'Password';

  @override
  String get fieldPasswordHint => 'Enter your password';

  @override
  String get fieldFullNameLabel => 'Full name';

  @override
  String get fieldFullNameHint => 'Enter your full name';

  @override
  String get fieldPhoneLabel => 'Phone';

  @override
  String get fieldPhoneHint => '+966 5X XXX XXXX';

  @override
  String get fieldNewPasswordHint => 'Create a strong password';

  @override
  String get fieldConfirmPasswordLabel => 'Confirm password';

  @override
  String get fieldConfirmPasswordHint => 'Re-enter your password';

  @override
  String get orDivider => 'or';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get createAccountLink => 'Create account';

  @override
  String get signUpTitle => 'Create your account';

  @override
  String get signUpSubtitle =>
      'Join Saudi Arabia’s events community in under a minute.';

  @override
  String get navDiscover => 'Discover';

  @override
  String get navRewards => 'Rewards';

  @override
  String get upcomingEvents => 'Upcoming Events';

  @override
  String notificationsUnreadCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'Notifications, $count unread',
      one: 'Notifications, 1 unread',
    );
    return '$_temp0';
  }

  @override
  String get pointsYourPoints => 'Your points';

  @override
  String get pointsTotal => 'Total points';

  @override
  String get pointsUnit => 'points';

  @override
  String pointsAmount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count points',
      one: '1 point',
    );
    return '$_temp0';
  }

  @override
  String pointsThisMonth(int count) {
    return '+$count this month';
  }

  @override
  String pointsUntilBenefit(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count points until your next benefit',
      one: '1 point until your next benefit',
      zero: 'You can unlock your next benefit',
    );
    return '$_temp0';
  }

  @override
  String pointsToNextLevel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count points to reach the next level',
      one: '1 point to reach the next level',
      zero: 'You have reached the next level',
    );
    return '$_temp0';
  }

  @override
  String pointsRemaining(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'You have $count points left',
      one: 'You have 1 point left',
    );
    return '$_temp0';
  }

  @override
  String pointsOfTarget(String current, String target) {
    return '$current of $target points';
  }

  @override
  String get memberLevelLabel => 'Your member level';

  @override
  String get levelNewcomer => 'Newcomer';

  @override
  String get levelActive => 'Active Member';

  @override
  String get levelContributor => 'Contributor';

  @override
  String get levelLeader => 'Industry Leader';

  @override
  String get myPointsTitle => 'Points history';

  @override
  String get filterAll => 'All';

  @override
  String get filterEarned => 'Earned';

  @override
  String get filterRedeemed => 'Spent';

  @override
  String get pointsHistoryTitle => 'How you earned points';

  @override
  String get pointsHistoryEmptyTitle => 'No points activity yet';

  @override
  String get pointsHistoryEmptyMessage =>
      'Attend events and complete your profile to start earning.';

  @override
  String get activityAttendedWorkshop => 'Workshop attended';

  @override
  String get activityProfileCompletion => 'Profile completed';

  @override
  String get activityVerifiedIdentity => 'Verified identity';

  @override
  String get activityAttendanceVerified => 'Attendance verified';

  @override
  String get activityVolunteerShift => 'Volunteer shift completed';

  @override
  String get activityFollowedCompany => 'Followed companies';

  @override
  String get activityRedeemedReward => 'Reward redeemed';

  @override
  String get rewardsTitle => 'Rewards';

  @override
  String get rewardsHistory => 'History';

  @override
  String get pointsToSpend => 'Points to spend';

  @override
  String get rewardsHighlightTag => 'Profile Highlight';

  @override
  String get rewardsHighlightNote =>
      'Highlight doesn’t change your verification status.';

  @override
  String get rewardsCatalog => 'Catalog';

  @override
  String get pointsShortUnit => 'pts';

  @override
  String get rewardsHeroTitle => 'Use your points to unlock exclusive benefits';

  @override
  String get rewardsHeroBody =>
      'Get discounts, access special events, and more, just for being part of our community.';

  @override
  String get rewardsSearchHint => 'Search rewards';

  @override
  String get rewardsEmptyTitle => 'No rewards here yet';

  @override
  String get rewardsEmptyMessage => 'Try another category, or check back soon.';

  @override
  String get rewardCategoryLearn => 'Learn';

  @override
  String get rewardCategoryAttend => 'Attend';

  @override
  String get rewardCategoryCareer => 'Career';

  @override
  String get rewardCategoryCommunity => 'Community';

  @override
  String get availableRewards => 'Available Rewards';

  @override
  String get actionRedeem => 'Redeem';

  @override
  String get rewardDetailsTitle => 'Reward Details';

  @override
  String get rewardWhatYouGet => 'What you\'ll get';

  @override
  String get rewardHowToRedeem => 'How to redeem';

  @override
  String rewardRedeemFor(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'Redeem for $count pts',
      one: 'Redeem for 1 pt',
    );
    return '$_temp0';
  }

  @override
  String rewardNeedMorePoints(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'You need $count more points',
      one: 'You need 1 more point',
    );
    return '$_temp0';
  }

  @override
  String get redeemConfirmTitle => 'Redeem this reward?';

  @override
  String get actionCancel => 'Cancel';

  @override
  String get redeemSuccessTitle => 'Reward redeemed';

  @override
  String get redeemSuccessBody =>
      'Use this code to claim your reward. We have also sent it to your email.';

  @override
  String get actionCopyCode => 'Copy code';

  @override
  String get codeCopied => 'Code copied';

  @override
  String get actionDone => 'Done';

  @override
  String get errorInsufficientPoints =>
      'You don\'t have enough points for this reward.';

  @override
  String get eventsTitle => 'Events';

  @override
  String get eventsSubtitle =>
      'Discover what\'s happening across the Kingdom\'s live event and technical production industry.';

  @override
  String get eventsSearchHint => 'Search events';

  @override
  String get eventsEmptyTitle => 'No events match your search';

  @override
  String get eventsEmptyMessage =>
      'Try fewer filters or a broader word. Here are a few popular searches:';

  @override
  String get eventFilterConferences => 'Conferences';

  @override
  String get eventFilterWorkshops => 'Workshops';

  @override
  String get eventFilterNetworking => 'Networking';

  @override
  String get eventFilterExpos => 'Exhibitions';

  @override
  String get eventTypeConference => 'Conference';

  @override
  String get eventTypeWorkshop => 'Workshop';

  @override
  String get eventTypeNetworking => 'Networking';

  @override
  String get eventTypeExpo => 'Exhibition';

  @override
  String get eventFlagshipTag => 'Flagship';

  @override
  String eventAttending(int count) {
    return '$count+ attending';
  }

  @override
  String get eventRegisteredTag => 'Registered';

  @override
  String get eventDetailsTitle => 'Event';

  @override
  String get eventOrganizedBy => 'Organized by';

  @override
  String get eventAbout => 'About this event';

  @override
  String get eventRegister => 'Register';

  @override
  String get eventCancelRegistration => 'Cancel registration';

  @override
  String get eventRegisteredMessage =>
      'You\'re registered. We\'ll remind you before it starts.';

  @override
  String get actionShare => 'Share';

  @override
  String get notificationsMarkAllRead => 'Mark all read';

  @override
  String get notificationsEmptyTitle => 'You\'re all caught up';

  @override
  String get notificationsEmptyMessage =>
      'New updates about events, connections and rewards will appear here.';

  @override
  String get notificationUnread => 'New';

  @override
  String get discoverTitle => 'Discover';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get profileEditProfile => 'Edit profile';

  @override
  String get profileMyPointsHint => 'Balance, history and rewards';

  @override
  String get profileAbout => 'About';

  @override
  String get profileExperience => 'Experience';

  @override
  String get profilePresent => 'Present';

  @override
  String get profileSkills => 'Skills';

  @override
  String get availabilityAvailable => 'Available for projects';

  @override
  String get availabilityInProduction => 'In production';

  @override
  String get availabilityFullyBooked => 'Fully booked';

  @override
  String matchPercent(int count) {
    return '$count% Match';
  }

  @override
  String get verifiedLabel => 'Verified';

  @override
  String companyCompletedProjects(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count projects delivered',
      one: '1 project delivered',
    );
    return '$_temp0';
  }

  @override
  String get actionFollow => 'Follow';

  @override
  String get actionFollowing => 'Following';

  @override
  String get actionViewDetails => 'View details';

  @override
  String get actionConnect => 'Connect';

  @override
  String get actionRequested => 'Requested';

  @override
  String yearsExperience(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count yrs exp',
      one: '1 yr exp',
    );
    return '$_temp0';
  }

  @override
  String get breakingBriefing => 'Breaking Briefing';

  @override
  String get actionReadBriefing => 'Read Briefing';

  @override
  String postedAgo(String time) {
    return 'Posted $time';
  }

  @override
  String get actionSave => 'Save';

  @override
  String get actionSaved => 'Saved';

  @override
  String actionViewAllCount(int count) {
    return 'View All ($count)';
  }

  @override
  String get actionBrowseAll => 'Browse All';

  @override
  String pointsShort(int count) {
    return '$count pts';
  }

  @override
  String verificationLevel(int count) {
    return 'Verification level $count';
  }

  @override
  String get geaVerified => 'GEA Verified';

  @override
  String get geaAccredited => 'GEA Accredited';

  @override
  String homeWelcome(String name) {
    return 'Welcome, $name';
  }

  @override
  String get homeUpcomingIndustryEvents => 'Upcoming Industry Events';

  @override
  String get actionViewCalendar => 'View Calendar';

  @override
  String get homeRelevantOpportunities => 'Relevant Opportunities';

  @override
  String get standingTitle => 'Professional Standing';

  @override
  String get standingActive => 'Active Status';

  @override
  String get standingCredential => 'Credential';

  @override
  String get standingVisibility => 'Visibility';

  @override
  String scoreOutOf100(int count) {
    return '$count/100';
  }

  @override
  String get standingStrongSearch => 'Strong Search';

  @override
  String get standingAttendance => 'Attendance';

  @override
  String eventsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Events',
      one: '1 Event',
    );
    return '$_temp0';
  }

  @override
  String get standingNote =>
      'Points reflect audited physical badge scans at certified industry summits.';

  @override
  String get standingAction => 'View My Activity & Passes';

  @override
  String get discoverEyebrow => 'Ecosystem Directory';

  @override
  String get discoverLiveFeed => 'Live Feed';

  @override
  String get discoverSearchHint => 'Search events, topics, or locations';

  @override
  String get actionFilters => 'Filters';

  @override
  String directoryCompaniesCount(String count) {
    return '$count+ verified agencies';
  }

  @override
  String get directoryProfessionals => 'Professionals';

  @override
  String directoryProfessionalsCount(String count) {
    return '$count specialists';
  }

  @override
  String directoryEventsCount(String count) {
    return '$count upcoming';
  }

  @override
  String get directoryOpportunities => 'Opportunities';

  @override
  String directoryOpportunitiesCount(String count) {
    return '$count active roles';
  }

  @override
  String get discoverRecommended => 'Recommended for you';

  @override
  String get discoverRecommendedSubtitle =>
      'Tailored to your credentials & network activity';

  @override
  String get actionRsvp => 'RSVP';

  @override
  String get actionApplyNow => 'Apply now';

  @override
  String get discoverLatestBriefings => 'Latest Briefings';

  @override
  String get eventsEyebrow => 'Industry Calendar & Conferences';

  @override
  String get eventsVisionChip => 'Vision 2030 Calendar';

  @override
  String get eventViewEvent => 'View Event';

  @override
  String eventsScheduled(int count) {
    return '$count Scheduled';
  }

  @override
  String get eventsFeatured => 'Flagship Summit';

  @override
  String get eventPassTitle => 'Accredited Delegate Pass';

  @override
  String get eventPassSubtitle => 'Standard Industry Registration';

  @override
  String get eventFreeTier => 'Free';

  @override
  String eventRegisteredPass(String code) {
    return 'Registered · Pass #$code';
  }

  @override
  String get eventViewPass => 'View pass';

  @override
  String get eventAddToCalendar => 'Add to calendar';

  @override
  String eventPointsNote(int count) {
    return '+$count points and an official attendance record unlock when your credential is scanned at the entry gate.';
  }

  @override
  String get eventWhyMatters => 'Why This Matters to You';

  @override
  String eventFit(int count) {
    return '$count% Fit';
  }

  @override
  String eventWhyCredential(String role) {
    return 'Matches your verified credential as $role.';
  }

  @override
  String eventWhyPeers(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count peers from your network are confirmed attendees.',
      one: '1 peer from your network is a confirmed attendee.',
    );
    return '$_temp0';
  }

  @override
  String eventWhyTopics(String topics) {
    return 'Covers $topics.';
  }

  @override
  String get eventBrief => 'Event Brief';

  @override
  String get eventSpecs => 'Technical Specifications';

  @override
  String get eventSpecDates => 'Dates & Duration';

  @override
  String eventDays(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Consecutive Days',
      one: 'Single day',
    );
    return '$_temp0';
  }

  @override
  String get eventSpecTiming => 'Session Timing';

  @override
  String get eventTimezone => 'Arabia Standard Time';

  @override
  String get eventSpecFormat => 'Delivery Format';

  @override
  String get eventInPerson => 'In-Person Only';

  @override
  String get eventFormatDetail => 'Main Hall + Workshops';

  @override
  String get eventRecognized => 'GEA Recognized';

  @override
  String get eventCommunityRecognized => 'Community Event';

  @override
  String eventStandingPoints(int count) {
    return '+$count attendance points';
  }

  @override
  String get eventKeynoteLeaders => 'Keynote Leaders';

  @override
  String get eventKeynoteSubtitle =>
      'Vetted technical & regulatory authorities';

  @override
  String get speakerHost => 'Host';

  @override
  String get speakerKeynote => 'Keynote';

  @override
  String get eventAgenda => 'Curated Agenda';

  @override
  String eventDay(int count) {
    return 'Day $count';
  }

  @override
  String eventVerifiedAttendees(int count) {
    return '+$count Verified Attendees';
  }

  @override
  String get eventVenue => 'Venue Coordinates';

  @override
  String get actionOpenMaps => 'Open Maps';

  @override
  String get eventVerifiedOrganizer => 'Verified Organizer';

  @override
  String get eventHost => 'Host:';

  @override
  String get actionDownload => 'Download';

  @override
  String get notificationsInbox => 'Inbox';

  @override
  String notificationsUnread(int count) {
    return '$count unread';
  }

  @override
  String notificationsAllCount(int count) {
    return 'All ($count)';
  }

  @override
  String get notificationCategoryOpportunities => 'Applications';

  @override
  String get notificationCategoryEvents => 'Events';

  @override
  String get notificationCategoryCredentials => 'Credentials';

  @override
  String get notificationsToday => 'Today';

  @override
  String get notificationsEarlier => 'Earlier';

  @override
  String get notificationsTimezone => 'Riyadh (GMT+3)';

  @override
  String get notificationActionApplication => 'View Application Status';

  @override
  String get notificationActionEvent => 'Access Delegate Pass';

  @override
  String get notificationActionCredential => 'View Credential Dossier';

  @override
  String get notificationActionLedger => 'View Points Ledger';

  @override
  String notificationPointsLogged(int count) {
    return '+$count Points Logged';
  }

  @override
  String get notificationsCategoryEmptyTitle => 'No notifications here';

  @override
  String get notificationsCategoryEmptyMessage =>
      'There are no updates in this category right now. New activity will appear automatically.';

  @override
  String get notificationsFooter =>
      'Notifications reflect verified institutional and ecosystem events only.';

  @override
  String get profileVisibilityScore => 'Visibility Score';

  @override
  String get profileVisibilityHint => 'Profile completeness & engagement rank';

  @override
  String get profileVerification => 'Verification';

  @override
  String get profileVerificationHint => 'National ID & credential verified';

  @override
  String get profileExecutiveSummary => 'Executive Summary';

  @override
  String get profileExperienceRecord => 'Experience Record';

  @override
  String profileYearsExp(int count) {
    return '$count+ Yrs Exp';
  }

  @override
  String get profileSkillsTitle => 'Technical & Operational Skills';

  @override
  String verifiedCount(int count) {
    return '$count Verified';
  }

  @override
  String get profileBadges => 'Badges & Recognition';

  @override
  String get navNews => 'News';

  @override
  String get newsEyebrow => 'Official Executive Journal';

  @override
  String get newsTitle => 'News & Insights';

  @override
  String get newsSubtitle =>
      'Authoritative technical briefings, regulatory updates, and market intelligence published by Back Of House.';

  @override
  String get newsSearchHint => 'Search articles, reports, briefings…';

  @override
  String get newsFilterForYou => 'For you';

  @override
  String get newsAllDesks => 'All desks';

  @override
  String get newsDeskTechnical => 'Technical';

  @override
  String get newsDeskRegulatory => 'Regulatory';

  @override
  String get newsDeskMarket => 'Market';

  @override
  String get newsBriefings => 'Briefings';

  @override
  String get newsLatestEyebrow => 'Latest news';

  @override
  String get newsOrderLabel => 'Order';

  @override
  String get newsSavedArticles => 'Saved articles';

  @override
  String get newsFilterLatest => 'Latest';

  @override
  String get newsTopicTechnical => 'Technical Briefings';

  @override
  String get newsTopicRegulatory => 'Regulatory & Safety';

  @override
  String get newsTopicMarket => 'Market Reports';

  @override
  String get newsCurated => 'Curated Intelligence';

  @override
  String get newsCuratedSubtitle =>
      'Validated technical dossiers & market studies';

  @override
  String get newsPeerReviewed => 'Peer Reviewed';

  @override
  String get actionReadFullBriefing => 'Read Full Briefing';

  @override
  String get newsEmptyTitle => 'No briefings found';

  @override
  String get newsEmptyMessage => 'Try another topic or search term.';

  @override
  String get newsStandardsTitle => 'Back Of House Editorial Standards';

  @override
  String get newsStandardsBody =>
      'Every briefing is written or reviewed by the Back Of House editorial desk and checked against the Kingdom\'s industry and event safety standards.';

  @override
  String get articleDetailsTitle => 'Briefing';

  @override
  String get articleDirectives => 'Core Operational Directives';

  @override
  String get articleRelated => 'Related Briefings';

  @override
  String articlePublished(String date) {
    return 'Published $date';
  }

  @override
  String get articleSavedMessage => 'Briefing saved';

  @override
  String get articleRemovedMessage => 'Removed from saved';

  @override
  String get notificationCategoryNews => 'News';

  @override
  String get accountTypeLabel => 'Account type';

  @override
  String get accountIndividual => 'Individual';

  @override
  String get accountCompany => 'Company';

  @override
  String get fieldCompanyNameLabel => 'Company name';

  @override
  String get fieldCompanyNameHint => 'e.g. Midan Events';

  @override
  String get fieldCompanyNameRequired => 'Enter your company\'s name';

  @override
  String get companyTypeLabel => 'Company type';

  @override
  String get companyTypeRequired => 'Choose a company type';

  @override
  String get companyTypeEventOrganizer => 'Event Organizer';

  @override
  String get companyTypeSupplier => 'Supplier';

  @override
  String get companyTypeVenue => 'Venue';

  @override
  String get companyTypeProduction => 'Production';

  @override
  String get companyTypeAgency => 'Agency';

  @override
  String get companyTypeServiceProvider => 'Service Provider';

  @override
  String get companyTypeOther => 'Other';

  @override
  String get profileStatusStudent => 'Student';

  @override
  String get homeCompaniesToWatch => 'Companies to Watch';

  @override
  String get discoverRecommendedGathering => 'Recommended Gathering';

  @override
  String eventSpeakersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count speakers',
      one: '1 speaker',
    );
    return '$_temp0';
  }

  @override
  String get profileSelectedProjects => 'Selected Projects';

  @override
  String companyOpenOpportunities(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count open opportunities',
      one: '1 open opportunity',
      zero: 'No open opportunities',
    );
    return '$_temp0';
  }

  @override
  String get opportunityTypeJob => 'Job';

  @override
  String get opportunityTypeProject => 'Project';

  @override
  String get opportunityTypeCoOp => 'Co-op';

  @override
  String get opportunityTypeVolunteering => 'Volunteer';

  @override
  String get opportunityTypeSupplierRequest => 'Supplier Request';

  @override
  String get employmentFullTime => 'Full-time';

  @override
  String get employmentPartTime => 'Part-time';

  @override
  String get employmentContract => 'Contract';

  @override
  String get employmentFreelance => 'Freelance';

  @override
  String get opportunitiesSubtitle =>
      'Jobs, projects, co-op training and volunteering that match your profile.';

  @override
  String get opportunitiesSearchHint => 'Search roles, companies, cities…';

  @override
  String get opportunitiesRecommended => 'Recommended for You';

  @override
  String get opportunitiesOpen => 'Open Opportunities';

  @override
  String get opportunitiesEmptyTitle => 'No opportunities found';

  @override
  String get opportunitiesEmptyMessage => 'Try another type or search term.';

  @override
  String opportunityApplicants(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count applicants',
      one: '1 applicant',
      zero: 'No applicants yet',
    );
    return '$_temp0';
  }

  @override
  String opportunityClosesOn(String date) {
    return 'Closes $date';
  }

  @override
  String get opportunityWhyMatch => 'Why it matches';

  @override
  String get opportunityOverview => 'About the role';

  @override
  String get opportunityResponsibilities => 'Responsibilities';

  @override
  String get opportunityRequirements => 'What we’re looking for';

  @override
  String get opportunitySkills => 'Skills';

  @override
  String get opportunityPostedBy => 'Posted by';

  @override
  String get actionViewCompany => 'View Company Profile';

  @override
  String get opportunityUnpaid => 'Unpaid';

  @override
  String get opportunityYourApplication => 'Your application';

  @override
  String get opportunityClosed => 'This opportunity is closed.';

  @override
  String get actionViewApplication => 'View Application';

  @override
  String get applyTitle => 'Apply';

  @override
  String applyStepOf(int step, int total) {
    return 'Step $step of $total';
  }

  @override
  String get applyStepProfile => 'Profile & Experience';

  @override
  String get applyStepReview => 'Review & Submit';

  @override
  String get applyExperienceTitle => 'Experience to share';

  @override
  String get applyExperienceSubtitle =>
      'Choose the roles to include with this application.';

  @override
  String applySelectedCount(int count) {
    return '$count selected';
  }

  @override
  String get applySkillsTitle => 'Your Skills';

  @override
  String get actionContinue => 'Continue';

  @override
  String get applyStatementTitle => 'Message to the company';

  @override
  String get applyStatementOptional => 'Optional';

  @override
  String get applyStatementHint =>
      'Why you\'re a good fit for this opportunity';

  @override
  String get applyStatementIncluded => 'Included';

  @override
  String get applyStatementNotIncluded => 'Not included';

  @override
  String applyChecklistTitle(String company) {
    return 'What $company receives';
  }

  @override
  String get applyChecklistProfile => 'Your profile and verification status';

  @override
  String applyChecklistExperience(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count experience entries',
      one: '1 experience entry',
    );
    return '$_temp0';
  }

  @override
  String applyPrivacyNote(String company) {
    return 'Your email and phone stay private. $company only sees the contact details you choose to share, once your application reaches Contact.';
  }

  @override
  String applyDecisionNote(String company) {
    return '$company reviews applications and makes the final decision.';
  }

  @override
  String get actionSubmitApplication => 'Submit application';

  @override
  String get applySubmittedMessage => 'Application submitted';

  @override
  String get applyNotAvailable => 'You can\'t apply to this opportunity.';

  @override
  String get applyAlreadyApplied =>
      'You\'ve already applied to this opportunity.';

  @override
  String get applicationsTitle => 'My applications';

  @override
  String get applicationsEntryHint => 'Track where each application stands';

  @override
  String get applicationsSubtitle =>
      'Each company reviews its applications and makes the decision. You can follow every step here.';

  @override
  String applicationsActive(int count) {
    return 'Active · $count';
  }

  @override
  String applicationsPast(int count) {
    return 'Closed · $count';
  }

  @override
  String get applicationsEmptyActiveTitle => 'No active applications';

  @override
  String get applicationsEmptyActiveMessage =>
      'Browse opportunities and apply to the ones that fit your profile.';

  @override
  String get applicationsEmptyPastTitle => 'No past applications';

  @override
  String get applicationsEmptyPastMessage =>
      'Applications with a decision appear here.';

  @override
  String get actionBrowseOpportunities => 'Browse Opportunities';

  @override
  String applicationAppliedOn(String date) {
    return 'Applied $date';
  }

  @override
  String applicationReference(String code) {
    return 'Ref. $code';
  }

  @override
  String applicationStageOf(int step, int total) {
    return 'Step $step of $total';
  }

  @override
  String get applicationStatusSubmitted => 'Submitted';

  @override
  String get applicationStatusReviewed => 'Reviewed';

  @override
  String get applicationStatusShortlisted => 'Shortlisted';

  @override
  String get applicationStatusContact => 'Contact';

  @override
  String get applicationStatusAccepted => 'Accepted';

  @override
  String get applicationStatusRejected => 'Not selected';

  @override
  String get applicationStatusWithdrawn => 'Withdrawn';

  @override
  String get applicationStageDecision => 'Decision';

  @override
  String get actionWithdraw => 'Withdraw';

  @override
  String get actionViewOpportunity => 'View Opportunity';

  @override
  String get applicationWithdrawTitle => 'Withdraw this application?';

  @override
  String applicationWithdrawBody(String company) {
    return '$company will stop reviewing it. You can apply again while the opportunity is open.';
  }

  @override
  String get applicationWithdrawnMessage => 'Application withdrawn';

  @override
  String get applicationsFooter =>
      'Back Of House connects you with companies. Hiring decisions are made by each company.';

  @override
  String get companyNavListings => 'Listings';

  @override
  String get companyNavSuppliers => 'Suppliers';

  @override
  String get companyNavDashboard => 'Dashboard';

  @override
  String get companyNavPortfolio => 'Portfolio';

  @override
  String get companyWorkspace => 'Your workspace';

  @override
  String companyListingsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count listings',
      one: '1 listing',
      zero: 'No listings yet',
    );
    return '$_temp0';
  }

  @override
  String companyProjectsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count projects',
      one: '1 project',
      zero: 'No projects yet',
    );
    return '$_temp0';
  }

  @override
  String get companyCreateOpportunityShort => 'Start a draft for review';

  @override
  String get applyIndividualsOnly =>
      'Only individual accounts can apply to this opportunity.';

  @override
  String get applyStudentsOnly =>
      'Co-op training is open to individuals with student status.';

  @override
  String get applyProjectsTitle => 'Projects';

  @override
  String get applyProjectsSubtitle =>
      'Choose the projects to include with this application.';

  @override
  String applyChecklistProjects(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count projects',
      one: '1 project',
      zero: 'No projects',
    );
    return '$_temp0';
  }

  @override
  String notificationApplicationTitle(String status) {
    String _temp0 = intl.Intl.selectLogic(status, {
      'SUBMITTED': 'Application submitted',
      'REVIEWED': 'Application reviewed',
      'SHORTLISTED': 'Application shortlisted',
      'CONTACT': 'Company contact stage',
      'ACCEPTED': 'Application accepted',
      'REJECTED': 'Application not selected',
      'WITHDRAWN': 'Application withdrawn',
      'other': 'Application updated',
    });
    return '$_temp0';
  }

  @override
  String notificationApplicationBody(String status, String title) {
    String _temp0 = intl.Intl.selectLogic(status, {
      'SUBMITTED': 'Your application for $title has been submitted.',
      'REVIEWED': 'Your application for $title has been reviewed.',
      'SHORTLISTED': 'Your application for $title has been shortlisted.',
      'CONTACT': 'Your application for $title has moved to the contact stage.',
      'ACCEPTED': 'Your application for $title has been accepted.',
      'REJECTED': 'Your application for $title was not selected.',
      'WITHDRAWN': 'You withdrew your application for $title.',
      'other': 'Your application for $title was updated.',
    });
    return '$_temp0';
  }

  @override
  String get actionDelete => 'Delete';

  @override
  String get actionEdit => 'Edit';

  @override
  String get fieldCategoryLabel => 'Category';

  @override
  String get fieldCityLabel => 'City';

  @override
  String get fieldDescriptionLabel => 'Description';

  @override
  String get fieldLocationLabel => 'Location';

  @override
  String get fieldOnePerLine => 'One per line';

  @override
  String get fieldOptional => 'Optional';

  @override
  String get fieldRequired => 'This field is required';

  @override
  String get fieldTitleLabel => 'Title';

  @override
  String fieldTooLong(int max) {
    return 'Use $max characters or fewer';
  }

  @override
  String get opportunityStatusDraft => 'Draft';

  @override
  String get opportunityStatusInReview => 'In review';

  @override
  String get opportunityStatusPublished => 'Live';

  @override
  String get opportunityStatusPaused => 'Paused';

  @override
  String get opportunityStatusClosed => 'Closed';

  @override
  String get opportunityStatusArchived => 'Archived';

  @override
  String get companyNavSupplierRequests => 'Supplier Requests';

  @override
  String get companyNavSupplierRequestsShort => 'Requests';

  @override
  String get companyNotVerified => 'Not verified yet';

  @override
  String get companyEditProfile => 'Edit company profile';

  @override
  String get companyProfileIncomplete =>
      'Add an about section and city so buyers and candidates understand what you do.';

  @override
  String get companyAbout => 'About';

  @override
  String get companyAboutHint => 'What your company delivers and for whom';

  @override
  String get companySpecialization => 'Specialization';

  @override
  String get companySpecializationHint => 'e.g. Staging & Rigging';

  @override
  String get companyServices => 'Services';

  @override
  String get companyIndustries => 'Industries';

  @override
  String get companyContact => 'Contact';

  @override
  String get companyContactEmpty => 'No contact details added yet.';

  @override
  String get companyWebsite => 'Website';

  @override
  String get companyCapabilities => 'Company tools';

  @override
  String get companyCanCreateSupplierRequests =>
      'Your company can post supplier requests.';

  @override
  String get companyCannotCreateSupplierRequests =>
      'Your company can respond to supplier requests that invite its type.';

  @override
  String get companyProfileSaved => 'Company profile saved';

  @override
  String companyIdentityNote(String name) {
    return '$name and its company type are part of your registered identity. Contact Back Of House to change them.';
  }

  @override
  String get companyAddProject => 'Add project';

  @override
  String get companyEditProject => 'Edit project';

  @override
  String get companyPortfolioSubtitle =>
      'Work your company has delivered. Attach it to supplier responses as evidence.';

  @override
  String get companyPortfolioEmptyTitle => 'No projects yet';

  @override
  String get companyPortfolioEmptyMessage =>
      'Add past projects to show buyers what your company can deliver.';

  @override
  String get companyProjectDeleteTitle => 'Delete this project?';

  @override
  String companyProjectDeleteBody(String title) {
    return '\"$title\" will be removed from your portfolio.';
  }

  @override
  String get companyProjectDeleted => 'Project deleted';

  @override
  String get companyProjectSaved => 'Project saved';

  @override
  String get companyProjectClientConfidential => 'Client confidential';

  @override
  String get companyProjectCategoryHint => 'e.g. Technical Production';

  @override
  String companyProjectStart(String date) {
    return 'Start: $date';
  }

  @override
  String companyProjectEnd(String date) {
    return 'End: $date';
  }

  @override
  String get companyProjectAddEnd => 'Add end date';

  @override
  String get companyProjectEndsBeforeStart =>
      'The end date must be after the start date.';

  @override
  String get companyProjectServices => 'Services provided';

  @override
  String get companyProjectClient => 'Client name';

  @override
  String get companyProjectClientHint =>
      'Optional — leave blank if confidential';

  @override
  String get companyMyOpportunities => 'My Opportunities';

  @override
  String get companyOpportunitiesSubtitle =>
      'Drafts, listings in review and published opportunities.';

  @override
  String get companyReviewNote =>
      'Every listing is reviewed by Back of House before it goes live.';

  @override
  String get companyOpportunitiesEmptyTitle => 'Nothing here yet';

  @override
  String get companyOpportunitiesEmptyMessage =>
      'Create a draft, then submit it for review.';

  @override
  String get companyCreateOpportunity => 'Create opportunity';

  @override
  String get companyCreateOpportunityHint =>
      'Jobs, projects, co-op, volunteering and supplier requests';

  @override
  String get companyEditOpportunity => 'Edit draft';

  @override
  String get companyUntitled => 'Untitled draft';

  @override
  String get companyOnlyDraftsEditable =>
      'Published listings are not edited directly. Propose changes instead, and Back Of House reviews the update.';

  @override
  String get companyDraftSaved => 'Draft saved';

  @override
  String get companyDraftNote =>
      'Saved as a draft. Nothing is public until Back Of House approves it.';

  @override
  String get companySaveDraft => 'Save draft';

  @override
  String get companyOpportunityType => 'Type';

  @override
  String get companyOpportunitySummary => 'Summary';

  @override
  String get companyOpportunitySummaryHint => 'One line shown on cards';

  @override
  String get companyEmploymentType => 'Employment type';

  @override
  String get companySupplierTypes => 'Invited supplier types';

  @override
  String get companySupplierTypesHint =>
      'Only companies of these types will see and can respond to this request.';

  @override
  String get companySupplierTypesRequired =>
      'Choose at least one supplier type';

  @override
  String get companyCompensation => 'Compensation';

  @override
  String get companyBudget => 'Budget';

  @override
  String get companyDuration => 'Duration';

  @override
  String get companyStatusNoteDraft =>
      'This draft is private. Submit it for review when it is ready.';

  @override
  String get companyStatusNoteInReview =>
      'Back Of House is reviewing this listing. You can pull it back to edit it.';

  @override
  String get companyStatusNotePublished =>
      'This listing is live. To change it, propose an update; the published version stays up until it is approved.';

  @override
  String get companyStatusNoteClosed => 'This listing is closed.';

  @override
  String get companySubmitForReview => 'Submit for review';

  @override
  String get companySubmittedForReview => 'Submitted for review';

  @override
  String get companyDraftIncomplete =>
      'Complete the required fields before submitting.';

  @override
  String get companyReturnToDraft => 'Pull back to draft';

  @override
  String get companyReturnedToDraft => 'Moved back to draft';

  @override
  String get companySimulateApproval => 'Simulate approval (dev)';

  @override
  String get companyPublished => 'Published';

  @override
  String get companyCloseOpportunity => 'Close listing';

  @override
  String get companyCloseTitle => 'Close this listing?';

  @override
  String get companyCloseBody =>
      'It will stop accepting applications. Closing is final: a closed listing cannot be reopened. Existing applicants stay available to review.';

  @override
  String get companyClosed => 'Listing closed';

  @override
  String get companyLiveOpportunities => 'Live opportunities';

  @override
  String get companyNoLiveOpportunities =>
      'No published listings yet. Drafts appear under Opportunities.';

  @override
  String get companyReviewApplicants => 'Review applicants';

  @override
  String get companyApplicants => 'Applicants';

  @override
  String get companyApplicant => 'Applicant';

  @override
  String get companyApplicantsEmpty => 'No applicants at this stage';

  @override
  String get companyApplicantContact => 'Contact details';

  @override
  String get companyContactHidden =>
      'Contact details are shared only from the contact stage, and only what the applicant chose to share.';

  @override
  String get companyContactNotShared =>
      'The applicant has not shared contact details. Contact sharing is off by default.';

  @override
  String get companyContactOutsideApp =>
      'Contact happens outside Back Of House.';

  @override
  String get companyNoneIncluded => 'None included';

  @override
  String get companyDecisionNote =>
      'Your company makes the decision. Decisions are final once recorded.';

  @override
  String get companyMarkReviewed => 'Mark reviewed';

  @override
  String get companyShortlist => 'Shortlist';

  @override
  String get companyMoveToContact => 'Move to contact';

  @override
  String get companyAcceptApplicant => 'Accept';

  @override
  String get companyRejectApplicant => 'Not selected';

  @override
  String get companyAcceptTitle => 'Accept this applicant?';

  @override
  String get companyRejectTitle => 'Reject?';

  @override
  String companyDecisionFinal(String name) {
    return 'This decision for $name is final and cannot be undone.';
  }

  @override
  String companyStatusUpdated(String status) {
    return 'Moved to $status';
  }

  @override
  String get supplierRequestsSubtitle =>
      'Requests from buyers that invite your company type.';

  @override
  String get supplierCreateRequest => 'Create supplier request';

  @override
  String get supplierTabInvited => 'Invited';

  @override
  String get supplierTabMyResponses => 'My responses';

  @override
  String get supplierInvitedEmptyTitle => 'No open requests';

  @override
  String get supplierInvitedEmptyMessage =>
      'Requests that invite your company type will appear here.';

  @override
  String supplierInvitedCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count open requests for your type',
      one: '1 open request for your type',
      zero: 'No open requests for your type',
    );
    return '$_temp0';
  }

  @override
  String get supplierResponsesEmptyTitle => 'No responses yet';

  @override
  String get supplierResponsesEmptyMessage =>
      'Responses you send to supplier requests appear here.';

  @override
  String supplierForBuyer(String buyer) {
    return 'For $buyer';
  }

  @override
  String get supplierNotInvited =>
      'This request does not invite your company type.';

  @override
  String get supplierOwnRequest => 'This is your own request.';

  @override
  String get supplierAlreadyResponded => 'Your company has already responded.';

  @override
  String get supplierResponsesReceived => 'Responses received';

  @override
  String get supplierNoResponsesYet => 'No responses yet.';

  @override
  String get supplierViewMyResponse => 'View my response';

  @override
  String get supplierRespond => 'Respond';

  @override
  String get supplierReviewResponses => 'Review supplier responses';

  @override
  String supplierResponsesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count responses',
      one: '1 response',
      zero: 'No responses yet',
    );
    return '$_temp0';
  }

  @override
  String get supplierResponseSent => 'Response sent';

  @override
  String get supplierSendResponse => 'Send response';

  @override
  String get supplierMessage => 'Message';

  @override
  String get supplierMessageHint =>
      'What you can supply, availability and anything the buyer should know';

  @override
  String get supplierProposedPrice => 'Proposed price';

  @override
  String get supplierEvidence => 'Relevant projects';

  @override
  String get supplierEvidenceSubtitle =>
      'Optional: attach company projects as evidence.';

  @override
  String get supplierNoProjects =>
      'Add projects to your portfolio to attach them here.';

  @override
  String get supplierNoAttachments => 'File attachments are not supported yet.';

  @override
  String get supplierResponse => 'Supplier response';

  @override
  String supplierSentOn(String date) {
    return 'Sent $date';
  }

  @override
  String get supplierRespondingCompany => 'Responding company';

  @override
  String get supplierResponseSelected => 'Selected';

  @override
  String get supplierSelect => 'Select';

  @override
  String get supplierSelectTitle => 'Select this supplier?';

  @override
  String get opportunityStatusChangesRequested => 'Changes requested';

  @override
  String get companyReviewerNote => 'What to change';

  @override
  String get companyStatusNoteChangesRequested =>
      'Back Of House asked for changes. Update the listing and send it back for review.';

  @override
  String get companyProposeChanges => 'Propose changes';

  @override
  String get companyPendingUpdate => 'Pending update';

  @override
  String get companyUpdateNoteDraft =>
      'This update is not live. The published version stays up until Back Of House approves it.';

  @override
  String get companyUpdateNoteInReview =>
      'Back Of House is reviewing this update. The published version stays live.';

  @override
  String get companyUpdateNoteChangesRequested =>
      'Changes were requested on this update. The published version is unchanged.';

  @override
  String get companyEditUpdate => 'Edit update';

  @override
  String get companySaveUpdate => 'Save update';

  @override
  String get companySubmitUpdate => 'Submit update for review';

  @override
  String get companyUpdateStarted => 'Update started';

  @override
  String get companyUpdateSaved => 'Update saved';

  @override
  String get companyUpdateSubmitted => 'Update sent for review';

  @override
  String get companySimulateChangesRequested =>
      'Simulate changes requested (dev)';

  @override
  String get companySimulateNote =>
      'Add more detail to the description and the requirements.';

  @override
  String get companyChangesRequestedRecorded => 'Changes requested';

  @override
  String get companyVerificationReadOnly =>
      'Verification is handled by Back Of House outside the app. It does not affect publishing: every listing is reviewed.';

  @override
  String supplierSelectBody(String name) {
    return '$name is selected. Every other open response is rejected and the request closes. This cannot be undone.';
  }

  @override
  String get articleLike => 'Like';

  @override
  String get articleLiked => 'Liked';

  @override
  String articleLikeCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count likes',
      one: '1 like',
      zero: 'No likes yet',
    );
    return '$_temp0';
  }

  @override
  String get articleComments => 'Comments';

  @override
  String articleCommentsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count comments',
      one: '1 comment',
      zero: 'No comments yet',
    );
    return '$_temp0';
  }

  @override
  String get articleCommentHint => 'Add a comment…';

  @override
  String get articleCommentPost => 'Post comment';

  @override
  String get articleCommentsEmpty =>
      'No comments yet. Be the first to share your view.';

  @override
  String get articleCommentsMembersOnly =>
      'Likes and comments are for individual members.';

  @override
  String get articleCommentsMore => 'Show more comments';

  @override
  String get articleCommentsError => 'Comments couldn\'t load.';

  @override
  String get articleCommentDelete => 'Delete comment';

  @override
  String get articleCommentDeleteTitle => 'Delete this comment?';

  @override
  String get articleCommentDeleteBody =>
      'It will be removed from this article.';

  @override
  String get articleCommentDeleted => 'Comment deleted';

  @override
  String get articleCommentYou => 'You';

  @override
  String get companyDetailsTitle => 'Company';

  @override
  String get companyDetailsOpportunities => 'Open opportunities';

  @override
  String get companyDetailsNoOpportunities =>
      'No open opportunities right now.';

  @override
  String get companyDetailsNoProjects => 'No projects shared yet.';

  @override
  String get companyDetailsOpportunitiesStat => 'Open roles';

  @override
  String get companyDetailsProjectsStat => 'Projects';

  @override
  String get welcomeTermsLead => 'By continuing you agree to our ';

  @override
  String get welcomeTermsLink => 'Terms & Privacy';

  @override
  String get signInTitleAccent => 'back.';

  @override
  String get continueWithPhone => 'Continue with a phone code';

  @override
  String get validationCodeInvalid => 'Enter the 6-digit code.';

  @override
  String get errorInvalidCode =>
      'That code is wrong or has expired. Try again or send a new one.';

  @override
  String get phoneSignInTitle => 'Sign in with ';

  @override
  String get phoneSignInTitleAccent => 'your phone.';

  @override
  String get phoneSignInSubtitle =>
      'We’ll text you a 6-digit code. No password needed.';

  @override
  String get phoneSendCode => 'Send code';

  @override
  String get phoneCodeTitle => 'Enter the code';

  @override
  String phoneCodeSubtitle(String phone) {
    return 'We sent a 6-digit code to $phone.';
  }

  @override
  String get phoneCodeLabel => 'Code';

  @override
  String get phoneVerifyCta => 'Verify and sign in';

  @override
  String get phoneResendCode => 'Send a new code';

  @override
  String get phoneChangeNumber => 'Change number';

  @override
  String get phoneCodeSent => 'A new code is on its way.';

  @override
  String pointsLevel(int level) {
    return 'Level $level';
  }

  @override
  String pointsToLevel(int count, int level) {
    return '$count pts to Level $level';
  }

  @override
  String get pointsTopLevel => 'Top level reached';

  @override
  String get homeGreetingMorning => 'Good morning, ';

  @override
  String get homeGreetingAfternoon => 'Good afternoon, ';

  @override
  String get homeGreetingEvening => 'Good evening, ';

  @override
  String get homeFlagshipEvent => 'Flagship event';

  @override
  String get homeOpportunitiesForYou => 'Opportunities for you';

  @override
  String get actionOpenRewards => 'Open rewards';

  @override
  String get accountIndividualHint => 'Professionals, freelancers and students';

  @override
  String get accountCompanyHint => 'Organizers, agencies, venues and suppliers';

  @override
  String get signUpStudentTitle => 'I’m currently a student';

  @override
  String get signUpStudentHint => 'Unlocks co-op and training opportunities.';

  @override
  String get discoverSections => 'Discover sections';

  @override
  String get discoverUpcomingEvents => 'Upcoming Events';

  @override
  String get discoverCalendar => 'Calendar';

  @override
  String get actionClearFilters => 'Clear filters';

  @override
  String actionRemoveFilter(String name) {
    return 'Remove filter $name';
  }

  @override
  String get searchSuggestionLightShows => 'Light shows';

  @override
  String get searchSuggestionConcerts => 'Concerts';

  @override
  String get searchSuggestionRiyadh => 'Riyadh';

  @override
  String get pointsBalanceLabel => 'Balance';

  @override
  String get profileGetVerified => 'Get verified';

  @override
  String get profileNotVerified => 'Not verified';

  @override
  String get profileStatusProfessional => 'Professional';

  @override
  String get profileEventsAttended => 'Events attended';

  @override
  String get profileVisibilityShort => 'Visibility';

  @override
  String get profileYearsShort => 'Years exp.';

  @override
  String get profileMyApplications => 'My Applications';

  @override
  String get profileAddPhoto => 'Change photo';

  @override
  String get eventAboutTab => 'About';

  @override
  String get eventAgendaTab => 'Agenda';

  @override
  String get eventSpeakersTab => 'Speakers';

  @override
  String get eventSections => 'Event sections';

  @override
  String eventAttendingLabel(String count) {
    return '$count+ attending';
  }

  @override
  String eventPeopleYouKnow(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count people you know',
      one: '1 person you know',
    );
    return '$_temp0';
  }

  @override
  String get eventEntry => 'Entry';

  @override
  String get eventMap => 'Map';

  @override
  String get eventSaveLabel => 'Save event';

  @override
  String eventAgendaDay(int day, String date) {
    return 'Day $day · $date';
  }

  @override
  String get eventRegisteredTitle => 'You’re registered!';

  @override
  String get eventRegisteredBody =>
      'We’ve saved your spot. You’ll get a reminder before the event starts.';

  @override
  String get eventDateLabel => 'Date';

  @override
  String get eventVenueLabel => 'Venue';

  @override
  String get eventPassHeading => 'Your event pass';

  @override
  String get eventPassHint => 'Show this code at the entrance to check in.';

  @override
  String get eventPointsOnAttendance =>
      'Earn points when your attendance is verified at the event.';

  @override
  String get eventExploreMore => 'Explore more events';

  @override
  String get opportunityDetailTitle => 'Opportunity';

  @override
  String get opportunityEligible => 'You’re eligible to apply';

  @override
  String get opportunityApplyHint =>
      'You’ll share your experience, projects and a short message.';

  @override
  String get applyExperienceRequired => 'Choose at least one';

  @override
  String get applyExperienceMissing =>
      'Choose at least one experience to share.';

  @override
  String get companyWorkspaceSubtitle => 'Company workspace';

  @override
  String get companyWelcomeBack => 'Welcome back';

  @override
  String get companyNewListing => 'New listing';

  @override
  String get companyStatLiveListings => 'Live listings';

  @override
  String get companyStatNewApplicants => 'New applicants';

  @override
  String companyStatThisWeek(int count) {
    return '+$count this week';
  }

  @override
  String get companyStatSupplierInvites => 'Supplier invites';

  @override
  String get companyStatProfileViews => 'Profile views';

  @override
  String companyStatChange(String sign, int count) {
    return '$sign$count%';
  }

  @override
  String companyChangesRequestedTitle(String title) {
    return 'Changes requested on “$title”';
  }

  @override
  String get companyEditListing => 'Edit listing';

  @override
  String get companyRecentApplicants => 'Recent applicants';

  @override
  String get companyNoApplicantsYet =>
      'No applicants yet. Once a listing is live, applications appear here.';

  @override
  String get companyListingsTitle => 'Opportunities';

  @override
  String filterAllCount(int count) {
    return 'All · $count';
  }

  @override
  String get companyFilterChanges => 'Changes';

  @override
  String get companyFilterDrafts => 'Drafts';

  @override
  String get companyListingNotLive => 'Not live yet';

  @override
  String get companyListingApplicants => 'Applicants';

  @override
  String get companyListingEdit => 'Edit';

  @override
  String get companyListingView => 'View';

  @override
  String get companyListingContinue => 'Continue';

  @override
  String get companyListingType => 'Listing type';

  @override
  String get companyClosesOn => 'Closes on';

  @override
  String get companyClosesOnPick => 'Optional — pick a date';

  @override
  String get companyClosesInPast => 'Choose a date after today.';

  @override
  String get companyClearDate => 'Clear date';

  @override
  String get companyWorkSetup => 'Work setup';

  @override
  String get workSetupOnSite => 'On-site';

  @override
  String get workSetupHybrid => 'Hybrid';

  @override
  String get workSetupRemote => 'Remote';

  @override
  String get companyReviewInfo =>
      'Back of House reviews every listing before it goes live. You’ll be notified when it’s approved or if changes are needed.';

  @override
  String companyApplicantsSubtitle(int count, String status) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count applicants',
      one: '1 applicant',
    );
    return '$_temp0 · $status';
  }

  @override
  String stageFilterCount(String label, int count) {
    return '$label · $count';
  }

  @override
  String applicantExperienceCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count experiences',
      one: '1 experience',
    );
    return '$_temp0';
  }

  @override
  String applicantProjectCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count projects',
      one: '1 project',
    );
    return '$_temp0';
  }

  @override
  String get applicantContactShared => 'Contact shared';

  @override
  String get companyViewApplication => 'View application';

  @override
  String get companyApplicationFor => 'Application for';

  @override
  String get companyMessageTitle => 'Message';

  @override
  String get companyExperienceShared => 'Experience shared';

  @override
  String get companyProjectsShared => 'Projects shared';

  @override
  String applicantStatusApplied(String status, String time) {
    return '$status · Applied $time';
  }

  @override
  String get supplierYourResponse => 'Your response';

  @override
  String supplierRespondBy(String date) {
    return 'Respond by $date';
  }

  @override
  String get supplierBudget => 'Budget';

  @override
  String get supplierRespondByLabel => 'Respond by';

  @override
  String get supplierYourPrice => 'Your price';

  @override
  String get supplierSetupTime => 'Setup time';

  @override
  String get supplierSetupTimeHint => 'e.g. 2 days';

  @override
  String get supplierAttachProjects => 'Attach projects';

  @override
  String supplierSelectedCount(int count) {
    return '$count selected';
  }

  @override
  String supplierPrivateNote(String buyer) {
    return 'Only $buyer can see your response and price.';
  }

  @override
  String get supplierRequestsTitle => 'Supplier requests';

  @override
  String supplierTabInvitedCount(int count) {
    return 'Invited · $count';
  }

  @override
  String supplierTabResponsesCount(int count) {
    return 'My responses · $count';
  }

  @override
  String get supplierTabMyRequests => 'My requests';

  @override
  String supplierOpenToYourType(String time) {
    return 'Open to your company type · $time';
  }

  @override
  String supplierYouResponded(String date) {
    return 'You responded · $date';
  }

  @override
  String get supplierBadgeOpen => 'Open';

  @override
  String get supplierMyRequestsEmpty => 'Your supplier requests appear here.';

  @override
  String get companyVerifiedByBoh => 'Verified by Back of House';

  @override
  String get companyStatProjects => 'Projects';

  @override
  String get companyStatFollowers => 'Followers';

  @override
  String get companiesSearchHint => 'Search companies, services, cities';

  @override
  String get companiesFilterOrganizers => 'Organizers';

  @override
  String get companiesFilterVenues => 'Venues';

  @override
  String get companiesFilterSuppliers => 'Suppliers';

  @override
  String get companiesFilterAgencies => 'Agencies';

  @override
  String get companiesEditorsPick => 'Editor’s pick';

  @override
  String get companiesEmpty => 'No companies match your search';

  @override
  String get professionalsSearchHint => 'Search by name, skill or city';

  @override
  String get professionalsFilterProducers => 'Producers';

  @override
  String get professionalsFilterDesigners => 'Designers';

  @override
  String get professionalsFilterTechnical => 'Technical';

  @override
  String get professionalsFilterStudents => 'Students';

  @override
  String get professionalsHighlighted => 'Highlighted';

  @override
  String get professionalsEmpty => 'No professionals match your search';

  @override
  String get actionConnected => 'Connected';

  @override
  String get editProfileIAm => 'I’m a';

  @override
  String get editProfileHeadline => 'Headline';

  @override
  String get editProfileAbout => 'About';

  @override
  String get editProfileInterests => 'Interests';

  @override
  String get editProfilePrivacy => 'Contact privacy';

  @override
  String get editProfilePrivacyHint =>
      'Choose what companies see when your application reaches Contact. Off by default.';

  @override
  String get editProfileShareEmail => 'Share my email';

  @override
  String get editProfileSharePhone => 'Share my phone';

  @override
  String get editProfileSaved => 'Profile saved';

  @override
  String get editProfileNameRequired => 'Enter your name';

  @override
  String get editProfileAboutTooLong => 'About can be up to 600 characters.';

  @override
  String get interestTechInnovation => 'Tech & Innovation';

  @override
  String get interestMarketing => 'Marketing';

  @override
  String get interestDesign => 'Design';

  @override
  String get interestBusiness => 'Business';

  @override
  String get interestNetworking => 'Networking';

  @override
  String get interestProduction => 'Production';

  @override
  String get verifyHeadline => 'Show companies it’s really you';

  @override
  String get verifyIntro =>
      'A verified badge tells companies your identity and experience were checked by Back of House.';

  @override
  String get verifyIdentityTitle => 'Identity document';

  @override
  String get verifyIdentityHint => 'National ID or Iqama';

  @override
  String get verifyExperienceTitle => 'Proof of experience';

  @override
  String get verifyExperienceHint =>
      'A certificate, contract or reference letter';

  @override
  String verifyUploaded(String hint) {
    return '$hint · uploaded';
  }

  @override
  String get verifyReviewTitle => 'Review by Back of House';

  @override
  String get verifyReviewHint => 'We’ll notify you when it’s done';

  @override
  String get verifyInReview => 'In review — we’ll notify you when it’s done';

  @override
  String get verifyNote =>
      'Verification is never granted by points, payments or activity. Your documents are only used for this review.';

  @override
  String get verifyUpload => 'Upload';

  @override
  String get verifySubmit => 'Submit for review';

  @override
  String get verifySubmitted => 'Sent for review';

  @override
  String get redeemedTitle => 'Your reward';

  @override
  String get redeemedBadge => 'Redeemed';

  @override
  String redeemedFor(String points) {
    return 'Redeemed for $points pts';
  }

  @override
  String get redeemedYourCode => 'Your code';

  @override
  String get redeemedHowToUse => 'How to use it';

  @override
  String get redeemedBalance => 'Points balance';

  @override
  String get redeemedPts => 'pts';

  @override
  String get actionCopy => 'Copy';

  @override
  String get companyProjectStartLabel => 'Started';

  @override
  String get companyProjectEndLabel => 'Finished';

  @override
  String get companyProjectOngoing => 'Ongoing';

  @override
  String get resetTitle => 'Reset your password';

  @override
  String get resetSubtitle =>
      'Enter your account email and we’ll send you a link to set a new one.';

  @override
  String get resetCta => 'Send reset link';

  @override
  String get resetSentTitle => 'Check your email';

  @override
  String resetSentBody(String email) {
    return 'If an account exists for $email, a reset link is on its way.';
  }

  @override
  String get resetBackToSignIn => 'Back to sign in';
}
