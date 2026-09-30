// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'باك أوف هاوس';

  @override
  String get brandMotto => 'صنّاع الكواليس. فعاليات حقيقية.';

  @override
  String get navHome => 'الرئيسية';

  @override
  String get navMenu => 'القائمة';

  @override
  String get actionViewAll => 'عرض الكل';

  @override
  String get actionReadMore => 'اقرأ المزيد';

  @override
  String get actionRetry => 'حاول مجددًا';

  @override
  String get appTagline => 'مجتمع الفعاليات\nفي السعودية';

  @override
  String get actionClose => 'إغلاق';

  @override
  String get actionBack => 'رجوع';

  @override
  String get actionSearch => 'بحث';

  @override
  String get actionClearSearch => 'مسح البحث';

  @override
  String get actionShowPassword => 'إظهار كلمة المرور';

  @override
  String get actionHidePassword => 'إخفاء كلمة المرور';

  @override
  String get actionSignOut => 'تسجيل الخروج';

  @override
  String get actionOpen => 'فتح';

  @override
  String get searchHint => 'ابحث عن أشخاص، شركات، دورات…';

  @override
  String get profileAvatarLabel => 'ملفك الشخصي';

  @override
  String get notificationsLabel => 'الإشعارات';

  @override
  String get stateLoading => 'جارٍ التحميل…';

  @override
  String get stateImageUnavailable => 'الصورة غير متاحة';

  @override
  String get errorStateTitle => 'حدث خلل خلف الكواليس';

  @override
  String get errorStateMessage =>
      'تعذّر تحميل المحتوى الآن. تحقق من اتصالك وحاول مجددًا.';

  @override
  String get emptyStateTitle => 'لا شيء على المسرح بعد';

  @override
  String get emptyStateMessage => 'سيظهر المحتوى هنا فور توفره.';

  @override
  String get comingSoonTitle => 'قريبًا';

  @override
  String get comingSoonMessage => 'الفريق ما زال يجهّز هذا المسرح.';

  @override
  String get timeJustNow => 'الآن';

  @override
  String timeMinutesAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'قبل $count دقيقة',
      few: 'قبل $count دقائق',
      two: 'قبل دقيقتين',
      one: 'قبل دقيقة',
    );
    return '$_temp0';
  }

  @override
  String timeHoursAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'قبل $count ساعة',
      few: 'قبل $count ساعات',
      two: 'قبل ساعتين',
      one: 'قبل ساعة',
    );
    return '$_temp0';
  }

  @override
  String timeDaysAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'قبل $count يومًا',
      few: 'قبل $count أيام',
      two: 'قبل يومين',
      one: 'قبل يوم',
    );
    return '$_temp0';
  }

  @override
  String readTimeMinutes(int count) {
    return 'قراءة $count د';
  }

  @override
  String slideCounter(String current, String total) {
    return '$current / $total';
  }

  @override
  String get routeProfile => 'الملف الشخصي';

  @override
  String get routeCompanies => 'الشركات';

  @override
  String get routeCourses => 'الدورات';

  @override
  String get routeNews => 'الأخبار';

  @override
  String get routeEvents => 'الفعاليات';

  @override
  String get routeResetPassword => 'إعادة تعيين كلمة المرور';

  @override
  String get routeDetail => 'التفاصيل';

  @override
  String get languageLabel => 'اللغة';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageArabic => 'العربية';

  @override
  String get welcomeHaveAccount => 'تسجيل الدخول';

  @override
  String get forgotPassword => 'نسيت كلمة المرور؟';

  @override
  String get signInCta => 'تسجيل الدخول';

  @override
  String get noAccountPrompt => 'جديد في باك أوف هاوس؟';

  @override
  String get agreePrefix => 'أوافق على ';

  @override
  String get termsOfService => 'شروط الخدمة';

  @override
  String get agreeConjunction => ' و';

  @override
  String get privacyPolicy => 'سياسة الخصوصية';

  @override
  String get signUpCta => 'متابعة';

  @override
  String get haveAccountPrompt => 'لديك حساب بالفعل؟';

  @override
  String get logInLink => 'تسجيل الدخول';

  @override
  String get mustAcceptTerms =>
      'يُرجى الموافقة على شروط الخدمة وسياسة الخصوصية.';

  @override
  String get validationRequired => 'هذا الحقل مطلوب';

  @override
  String get validationEmailRequired => 'البريد الإلكتروني مطلوب';

  @override
  String get validationEmailInvalid => 'أدخل بريدًا إلكترونيًا صحيحًا';

  @override
  String get validationNameRequired => 'الاسم الكامل مطلوب';

  @override
  String get validationNameTooShort => 'أدخل اسمك الكامل';

  @override
  String get validationPhoneRequired => 'رقم الجوال مطلوب';

  @override
  String get validationPhoneInvalid => 'أدخل رقم جوال سعوديًا صحيحًا';

  @override
  String get validationPasswordRequired => 'كلمة المرور مطلوبة';

  @override
  String get validationPasswordTooShort => 'استخدم 8 أحرف على الأقل';

  @override
  String get validationPasswordWeak => 'يجب أن تحتوي على حرف ورقم على الأقل';

  @override
  String get validationConfirmRequired => 'أكّد كلمة المرور';

  @override
  String get validationPasswordMismatch => 'كلمتا المرور غير متطابقتين';

  @override
  String get errorTimeout => 'انتهت مهلة الاتصال. حاول مجددًا.';

  @override
  String get errorNoConnection =>
      'لا يوجد اتصال بالإنترنت. تحقق من الشبكة وحاول مجددًا.';

  @override
  String get errorBadCertificate => 'تعذّر إنشاء اتصال آمن.';

  @override
  String get errorCancelled => 'أُلغي الطلب.';

  @override
  String get errorBadRequest => 'تعذّرت معالجة هذا الطلب.';

  @override
  String get errorSessionExpired => 'انتهت جلستك. يُرجى تسجيل الدخول مجددًا.';

  @override
  String get errorForbidden => 'ليست لديك صلاحية الوصول.';

  @override
  String get errorNotFound => 'لم نعثر على ما تبحث عنه.';

  @override
  String get errorValidation => 'يُرجى مراجعة الحقول المحددة.';

  @override
  String get errorTooManyRequests =>
      'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.';

  @override
  String get errorServer => 'الخادم يواجه مشكلة. حاول بعد قليل.';

  @override
  String get errorUnknown => 'حدث خطأ ما. حاول مجددًا.';

  @override
  String get errorInvalidCredentials =>
      'البريد الإلكتروني وكلمة المرور لا يطابقان أي حساب.';

  @override
  String get navProfile => 'حسابي';

  @override
  String get themeLabel => 'المظهر';

  @override
  String get themeLight => 'فاتح';

  @override
  String get themeDark => 'داكن';

  @override
  String get welcomeEyebrow => 'مجتمع الفعاليات في السعودية';

  @override
  String get welcomeTitleLead => 'نبني المجتمع خلف ';

  @override
  String get welcomeTitleAccent => 'كل تجربة.';

  @override
  String get welcomeSubtitle =>
      'تواصل مع المحترفين والشركات والمواهب الصاعدة التي تصنع قطاع الفعاليات.';

  @override
  String get welcomeGetStarted => 'إنشاء حساب';

  @override
  String get signInTitle => 'أهلًا ';

  @override
  String get signInSubtitle => 'سجّل الدخول لتكمل من حيث توقفت.';

  @override
  String get fieldEmailLabel => 'البريد الإلكتروني';

  @override
  String get fieldEmailHint => 'you@example.com';

  @override
  String get fieldPasswordLabel => 'كلمة المرور';

  @override
  String get fieldPasswordHint => 'أدخل كلمة المرور';

  @override
  String get fieldFullNameLabel => 'الاسم الكامل';

  @override
  String get fieldFullNameHint => 'أدخل اسمك الكامل';

  @override
  String get fieldPhoneLabel => 'رقم الجوال';

  @override
  String get fieldPhoneHint => '+966 5X XXX XXXX';

  @override
  String get fieldNewPasswordHint => 'أنشئ كلمة مرور قوية';

  @override
  String get fieldConfirmPasswordLabel => 'تأكيد كلمة المرور';

  @override
  String get fieldConfirmPasswordHint => 'أعد إدخال كلمة المرور';

  @override
  String get orDivider => 'أو';

  @override
  String get continueWithGoogle => 'المتابعة باستخدام Google';

  @override
  String get createAccountLink => 'إنشاء حساب';

  @override
  String get signUpTitle => 'أنشئ حسابك';

  @override
  String get signUpSubtitle =>
      'انضم إلى مجتمع الفعاليات في السعودية خلال دقيقة.';

  @override
  String get navDiscover => 'استكشف';

  @override
  String get navRewards => 'المكافآت';

  @override
  String get upcomingEvents => 'الفعاليات القادمة';

  @override
  String notificationsUnreadCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'الإشعارات، $count إشعار غير مقروء',
      few: 'الإشعارات، $count إشعارات غير مقروءة',
      two: 'الإشعارات، إشعاران غير مقروءين',
      one: 'الإشعارات، إشعار واحد غير مقروء',
    );
    return '$_temp0';
  }

  @override
  String get pointsYourPoints => 'نقاطك';

  @override
  String get pointsTotal => 'إجمالي النقاط';

  @override
  String get pointsUnit => 'نقطة';

  @override
  String pointsAmount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count نقطة',
      few: '$count نقاط',
      two: 'نقطتان',
      one: 'نقطة واحدة',
      zero: 'لا نقاط',
    );
    return '$_temp0';
  }

  @override
  String pointsThisMonth(int count) {
    return '+$count هذا الشهر';
  }

  @override
  String pointsUntilBenefit(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count نقطة حتى ميزتك التالية',
      few: '$count نقاط حتى ميزتك التالية',
      two: 'نقطتان حتى ميزتك التالية',
      one: 'نقطة واحدة حتى ميزتك التالية',
      zero: 'يمكنك فتح ميزتك التالية',
    );
    return '$_temp0';
  }

  @override
  String pointsToNextLevel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count نقطة للوصول إلى المستوى التالي',
      few: '$count نقاط للوصول إلى المستوى التالي',
      two: 'نقطتان للوصول إلى المستوى التالي',
      one: 'نقطة واحدة للوصول إلى المستوى التالي',
      zero: 'وصلت إلى المستوى التالي',
    );
    return '$_temp0';
  }

  @override
  String pointsRemaining(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'تبقّت لديك $count نقطة',
      few: 'تبقّت لديك $count نقاط',
      two: 'تبقّت لديك نقطتان',
      one: 'تبقّت لديك نقطة واحدة',
      zero: 'لم يتبقَّ لديك نقاط',
    );
    return '$_temp0';
  }

  @override
  String pointsOfTarget(String current, String target) {
    return '$current من $target نقطة';
  }

  @override
  String get memberLevelLabel => 'مستوى عضويتك';

  @override
  String get levelNewcomer => 'عضو جديد';

  @override
  String get levelActive => 'عضو نشط';

  @override
  String get levelContributor => 'عضو مساهم';

  @override
  String get levelLeader => 'رائد في القطاع';

  @override
  String get myPointsTitle => 'سجل النقاط';

  @override
  String get filterAll => 'الكل';

  @override
  String get filterEarned => 'المكتسبة';

  @override
  String get filterRedeemed => 'المستخدمة';

  @override
  String get pointsHistoryTitle => 'كيف جمعت نقاطك';

  @override
  String get pointsHistoryEmptyTitle => 'لا يوجد نشاط نقاط بعد';

  @override
  String get pointsHistoryEmptyMessage =>
      'احضر الفعاليات وأكمل ملفك لتبدأ بجمع النقاط.';

  @override
  String get activityAttendedWorkshop => 'حضور ورشة عمل';

  @override
  String get activityProfileCompletion => 'اكتمال الملف الشخصي';

  @override
  String get activityVerifiedIdentity => 'توثيق الهوية';

  @override
  String get activityAttendanceVerified => 'تم التحقق من الحضور';

  @override
  String get activityVolunteerShift => 'إتمام نوبة تطوع';

  @override
  String get activityFollowedCompany => 'متابعة الشركات';

  @override
  String get activityRedeemedReward => 'استبدال مكافأة';

  @override
  String get rewardsTitle => 'المكافآت';

  @override
  String get rewardsHistory => 'السجل';

  @override
  String get pointsToSpend => 'نقاط متاحة للاستبدال';

  @override
  String get rewardsHighlightTag => 'إبراز الملف';

  @override
  String get rewardsHighlightNote => 'الإبراز لا يغيّر حالة التحقق من حسابك.';

  @override
  String get rewardsCatalog => 'الكتالوج';

  @override
  String get pointsShortUnit => 'نقطة';

  @override
  String get rewardsHeroTitle => 'استخدم نقاطك لفتح مزايا حصرية';

  @override
  String get rewardsHeroBody =>
      'خصومات، ودخول لفعاليات خاصة، والمزيد، فقط لأنك جزء من مجتمعنا.';

  @override
  String get rewardsSearchHint => 'ابحث في المكافآت';

  @override
  String get rewardsEmptyTitle => 'لا توجد مكافآت هنا بعد';

  @override
  String get rewardsEmptyMessage => 'جرّب فئة أخرى، أو عد قريبًا.';

  @override
  String get rewardCategoryLearn => 'تعلّم';

  @override
  String get rewardCategoryAttend => 'احضر';

  @override
  String get rewardCategoryCareer => 'المسيرة المهنية';

  @override
  String get rewardCategoryCommunity => 'المجتمع';

  @override
  String get availableRewards => 'المكافآت المتاحة';

  @override
  String get actionRedeem => 'استبدال';

  @override
  String get rewardDetailsTitle => 'تفاصيل المكافأة';

  @override
  String get rewardWhatYouGet => 'ماذا ستحصل';

  @override
  String get rewardHowToRedeem => 'طريقة الاستبدال';

  @override
  String rewardRedeemFor(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'استبدل بـ $count نقطة',
      few: 'استبدل بـ $count نقاط',
      two: 'استبدل بنقطتين',
      one: 'استبدل بنقطة واحدة',
    );
    return '$_temp0';
  }

  @override
  String rewardNeedMorePoints(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'تحتاج إلى $count نقطة إضافية',
      few: 'تحتاج إلى $count نقاط إضافية',
      two: 'تحتاج إلى نقطتين إضافيتين',
      one: 'تحتاج إلى نقطة واحدة إضافية',
    );
    return '$_temp0';
  }

  @override
  String get redeemConfirmTitle => 'استبدال هذه المكافأة؟';

  @override
  String get actionCancel => 'إلغاء';

  @override
  String get redeemSuccessTitle => 'تم استبدال المكافأة';

  @override
  String get redeemSuccessBody =>
      'استخدم هذا الرمز للحصول على مكافأتك. أرسلناه أيضًا إلى بريدك الإلكتروني.';

  @override
  String get actionCopyCode => 'نسخ الرمز';

  @override
  String get codeCopied => 'تم نسخ الرمز';

  @override
  String get actionDone => 'تم';

  @override
  String get errorInsufficientPoints => 'نقاطك غير كافية لهذه المكافأة.';

  @override
  String get eventsTitle => 'الفعاليات';

  @override
  String get eventsSubtitle =>
      'اكتشف ما يحدث في قطاع الفعاليات الحية والإنتاج التقني في المملكة.';

  @override
  String get eventsSearchHint => 'ابحث عن فعاليات';

  @override
  String get eventsEmptyTitle => 'لا توجد فعاليات تطابق بحثك';

  @override
  String get eventsEmptyMessage =>
      'جرّب تصفية أقل أو كلمة أعم. إليك بعض عمليات البحث الشائعة:';

  @override
  String get eventFilterConferences => 'مؤتمرات';

  @override
  String get eventFilterWorkshops => 'ورش عمل';

  @override
  String get eventFilterNetworking => 'تواصل';

  @override
  String get eventFilterExpos => 'معارض';

  @override
  String get eventTypeConference => 'مؤتمر';

  @override
  String get eventTypeWorkshop => 'ورشة عمل';

  @override
  String get eventTypeNetworking => 'تواصل مهني';

  @override
  String get eventTypeExpo => 'معرض';

  @override
  String get eventFlagshipTag => 'رئيسية';

  @override
  String eventAttending(int count) {
    return '+$count سيحضرون';
  }

  @override
  String get eventRegisteredTag => 'مسجّل';

  @override
  String get eventDetailsTitle => 'الفعالية';

  @override
  String get eventOrganizedBy => 'من تنظيم';

  @override
  String get eventAbout => 'عن الفعالية';

  @override
  String get eventRegister => 'سجّل الآن';

  @override
  String get eventCancelRegistration => 'إلغاء التسجيل';

  @override
  String get eventRegisteredMessage => 'تم تسجيلك. سنذكّرك قبل بدء الفعالية.';

  @override
  String get actionShare => 'مشاركة';

  @override
  String get notificationsMarkAllRead => 'تعليم الكل كمقروء';

  @override
  String get notificationsEmptyTitle => 'لا جديد حاليًا';

  @override
  String get notificationsEmptyMessage =>
      'ستظهر هنا التحديثات الجديدة عن الفعاليات والتواصل والمكافآت.';

  @override
  String get notificationUnread => 'جديد';

  @override
  String get discoverTitle => 'استكشف';

  @override
  String get settingsTitle => 'الإعدادات';

  @override
  String get profileEditProfile => 'تعديل الملف';

  @override
  String get profileMyPointsHint => 'الرصيد والسجل والمكافآت';

  @override
  String get profileAbout => 'نبذة';

  @override
  String get profileExperience => 'الخبرات';

  @override
  String get profilePresent => 'حتى الآن';

  @override
  String get profileSkills => 'المهارات';

  @override
  String get availabilityAvailable => 'متاح للمشاريع';

  @override
  String get availabilityInProduction => 'في مشروع حاليًا';

  @override
  String get availabilityFullyBooked => 'محجوز بالكامل';

  @override
  String matchPercent(int count) {
    return 'تطابق $count%';
  }

  @override
  String get verifiedLabel => 'موثّق';

  @override
  String companyCompletedProjects(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مشروعًا منجزًا',
      few: '$count مشاريع منجزة',
      two: 'مشروعان منجزان',
      one: 'مشروع منجز واحد',
    );
    return '$_temp0';
  }

  @override
  String get actionFollow => 'متابعة';

  @override
  String get actionFollowing => 'تتابعها';

  @override
  String get actionViewDetails => 'عرض التفاصيل';

  @override
  String get actionConnect => 'تواصل';

  @override
  String get actionRequested => 'تم الإرسال';

  @override
  String yearsExperience(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'خبرة $count سنة',
      few: 'خبرة $count سنوات',
      two: 'خبرة سنتين',
      one: 'خبرة سنة',
    );
    return '$_temp0';
  }

  @override
  String get breakingBriefing => 'موجز عاجل';

  @override
  String get actionReadBriefing => 'اقرأ الموجز';

  @override
  String postedAgo(String time) {
    return 'نُشر $time';
  }

  @override
  String get actionSave => 'حفظ';

  @override
  String get actionSaved => 'محفوظ';

  @override
  String actionViewAllCount(int count) {
    return 'عرض الكل ($count)';
  }

  @override
  String get actionBrowseAll => 'تصفح الكل';

  @override
  String pointsShort(int count) {
    return '$count نقطة';
  }

  @override
  String verificationLevel(int count) {
    return 'مستوى التوثيق $count';
  }

  @override
  String get geaVerified => 'موثّق من هيئة الترفيه';

  @override
  String get geaAccredited => 'معتمد من هيئة الترفيه';

  @override
  String homeWelcome(String name) {
    return 'أهلًا، $name';
  }

  @override
  String get homeUpcomingIndustryEvents => 'فعاليات القطاع القادمة';

  @override
  String get actionViewCalendar => 'التقويم';

  @override
  String get homeRelevantOpportunities => 'فرص مناسبة لك';

  @override
  String get standingTitle => 'المكانة المهنية';

  @override
  String get standingActive => 'حساب نشط';

  @override
  String get standingCredential => 'الاعتماد';

  @override
  String get standingVisibility => 'الظهور';

  @override
  String scoreOutOf100(int count) {
    return '$count/100';
  }

  @override
  String get standingStrongSearch => 'ظهور قوي';

  @override
  String get standingAttendance => 'الحضور';

  @override
  String eventsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count فعالية',
      few: '$count فعاليات',
      two: 'فعاليتان',
      one: 'فعالية واحدة',
    );
    return '$_temp0';
  }

  @override
  String get standingNote =>
      'تعكس النقاط عمليات مسح البطاقات الموثقة في قمم القطاع المعتمدة.';

  @override
  String get standingAction => 'نشاطي وبطاقات الحضور';

  @override
  String get discoverEyebrow => 'دليل المنظومة';

  @override
  String get discoverLiveFeed => 'مباشر';

  @override
  String get discoverSearchHint => 'ابحث عن فعاليات أو مواضيع أو أماكن';

  @override
  String get actionFilters => 'التصفية';

  @override
  String directoryCompaniesCount(String count) {
    return '+$count شركة موثقة';
  }

  @override
  String get directoryProfessionals => 'المحترفون';

  @override
  String directoryProfessionalsCount(String count) {
    return '$count متخصص';
  }

  @override
  String directoryEventsCount(String count) {
    return '$count فعالية قادمة';
  }

  @override
  String get directoryOpportunities => 'الفرص';

  @override
  String directoryOpportunitiesCount(String count) {
    return '$count فرصة نشطة';
  }

  @override
  String get discoverRecommended => 'مقترح لك';

  @override
  String get discoverRecommendedSubtitle => 'بناءً على اعتماداتك ونشاط شبكتك';

  @override
  String get actionRsvp => 'احجز';

  @override
  String get actionApplyNow => 'قدّم الآن';

  @override
  String get discoverLatestBriefings => 'أحدث الموجزات';

  @override
  String get eventsEyebrow => 'تقويم القطاع والمؤتمرات';

  @override
  String get eventsVisionChip => 'تقويم رؤية 2030';

  @override
  String get eventViewEvent => 'عرض الفعالية';

  @override
  String eventsScheduled(int count) {
    return '$count مجدولة';
  }

  @override
  String get eventsFeatured => 'القمة الرئيسية';

  @override
  String get eventPassTitle => 'بطاقة حضور معتمدة';

  @override
  String get eventPassSubtitle => 'تسجيل قياسي للقطاع';

  @override
  String get eventFreeTier => 'مجاني';

  @override
  String eventRegisteredPass(String code) {
    return 'مسجّل · بطاقة #$code';
  }

  @override
  String get eventViewPass => 'عرض التذكرة';

  @override
  String get eventAddToCalendar => 'أضف إلى التقويم';

  @override
  String eventPointsNote(int count) {
    return 'تُضاف $count نقطة وسجل حضور رسمي عند مسح بطاقتك عند بوابة الدخول.';
  }

  @override
  String get eventWhyMatters => 'لماذا تهمك هذه الفعالية';

  @override
  String eventFit(int count) {
    return 'ملاءمة $count%';
  }

  @override
  String eventWhyCredential(String role) {
    return 'تتوافق مع اعتمادك الموثق بصفتك $role.';
  }

  @override
  String eventWhyPeers(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count شخصًا من شبكتك أكدوا حضورهم.',
      few: '$count أشخاص من شبكتك أكدوا حضورهم.',
      two: 'شخصان من شبكتك أكدا حضورهما.',
      one: 'شخص واحد من شبكتك أكد حضوره.',
    );
    return '$_temp0';
  }

  @override
  String eventWhyTopics(String topics) {
    return 'تغطي $topics.';
  }

  @override
  String get eventBrief => 'نبذة الفعالية';

  @override
  String get eventSpecs => 'التفاصيل الفنية';

  @override
  String get eventSpecDates => 'التواريخ والمدة';

  @override
  String eventDays(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count يومًا متتاليًا',
      few: '$count أيام متتالية',
      two: 'يومان متتاليان',
      one: 'يوم واحد',
    );
    return '$_temp0';
  }

  @override
  String get eventSpecTiming => 'مواعيد الجلسات';

  @override
  String get eventTimezone => 'بتوقيت السعودية';

  @override
  String get eventSpecFormat => 'صيغة الحضور';

  @override
  String get eventInPerson => 'حضوري فقط';

  @override
  String get eventFormatDetail => 'القاعة الرئيسية + ورش العمل';

  @override
  String get eventRecognized => 'معترف به من هيئة الترفيه';

  @override
  String get eventCommunityRecognized => 'فعالية مجتمعية';

  @override
  String eventStandingPoints(int count) {
    return '+$count نقطة حضور';
  }

  @override
  String get eventKeynoteLeaders => 'قادة الجلسات';

  @override
  String get eventKeynoteSubtitle => 'خبراء فنيون وتنظيميون موثوقون';

  @override
  String get speakerHost => 'المضيف';

  @override
  String get speakerKeynote => 'متحدث رئيسي';

  @override
  String get eventAgenda => 'جدول الأعمال';

  @override
  String eventDay(int count) {
    return 'اليوم $count';
  }

  @override
  String eventVerifiedAttendees(int count) {
    return '+$count حاضر موثق';
  }

  @override
  String get eventVenue => 'موقع الفعالية';

  @override
  String get actionOpenMaps => 'الخريطة';

  @override
  String get eventVerifiedOrganizer => 'منظم موثّق';

  @override
  String get eventHost => 'المنظم:';

  @override
  String get actionDownload => 'تنزيل';

  @override
  String get notificationsInbox => 'صندوق الوارد';

  @override
  String notificationsUnread(int count) {
    return '$count غير مقروءة';
  }

  @override
  String notificationsAllCount(int count) {
    return 'الكل ($count)';
  }

  @override
  String get notificationCategoryOpportunities => 'الطلبات';

  @override
  String get notificationCategoryEvents => 'الفعاليات';

  @override
  String get notificationCategoryCredentials => 'الاعتمادات';

  @override
  String get notificationsToday => 'اليوم';

  @override
  String get notificationsEarlier => 'سابقًا';

  @override
  String get notificationsTimezone => 'الرياض (GMT+3)';

  @override
  String get notificationActionApplication => 'حالة الطلب';

  @override
  String get notificationActionEvent => 'بطاقة الحضور';

  @override
  String get notificationActionCredential => 'ملف الاعتماد';

  @override
  String get notificationActionLedger => 'سجل النقاط';

  @override
  String notificationPointsLogged(int count) {
    return '+$count نقطة مسجلة';
  }

  @override
  String get notificationsCategoryEmptyTitle => 'لا توجد إشعارات هنا';

  @override
  String get notificationsCategoryEmptyMessage =>
      'لا توجد تحديثات في هذه الفئة حاليًا. سيظهر النشاط الجديد تلقائيًا.';

  @override
  String get notificationsFooter =>
      'تعكس الإشعارات الأحداث الموثقة في المنظومة فقط.';

  @override
  String get profileVisibilityScore => 'درجة الظهور';

  @override
  String get profileVisibilityHint => 'اكتمال الملف ومستوى التفاعل';

  @override
  String get profileVerification => 'التوثيق';

  @override
  String get profileVerificationHint => 'الهوية والاعتماد موثقان';

  @override
  String get profileExecutiveSummary => 'الملخص التنفيذي';

  @override
  String get profileExperienceRecord => 'سجل الخبرات';

  @override
  String profileYearsExp(int count) {
    return '+$count سنوات خبرة';
  }

  @override
  String get profileSkillsTitle => 'المهارات الفنية والتشغيلية';

  @override
  String verifiedCount(int count) {
    return '$count موثقة';
  }

  @override
  String get profileBadges => 'الشارات والتقدير';

  @override
  String get navNews => 'الأخبار';

  @override
  String get newsEyebrow => 'المجلة التنفيذية الرسمية';

  @override
  String get newsTitle => 'الأخبار والرؤى';

  @override
  String get newsSubtitle =>
      'إحاطات تقنية موثوقة وتحديثات تنظيمية ومعلومات عن السوق تنشرها باك أوف هاوس.';

  @override
  String get newsSearchHint => 'ابحث في المقالات والتقارير والإحاطات…';

  @override
  String get newsFilterForYou => 'لك';

  @override
  String get newsAllDesks => 'كل المكاتب';

  @override
  String get newsDeskTechnical => 'التقني';

  @override
  String get newsDeskRegulatory => 'التنظيمي';

  @override
  String get newsDeskMarket => 'السوق';

  @override
  String get newsBriefings => 'الموجزات';

  @override
  String get newsLatestEyebrow => 'آخر الأخبار';

  @override
  String get newsOrderLabel => 'الترتيب';

  @override
  String get newsSavedArticles => 'المقالات المحفوظة';

  @override
  String get newsFilterLatest => 'الأحدث';

  @override
  String get newsTopicTechnical => 'إحاطات تقنية';

  @override
  String get newsTopicRegulatory => 'التنظيم والسلامة';

  @override
  String get newsTopicMarket => 'تقارير السوق';

  @override
  String get newsCurated => 'معلومات منتقاة';

  @override
  String get newsCuratedSubtitle => 'ملفات تقنية ودراسات سوق موثقة';

  @override
  String get newsPeerReviewed => 'مراجعة من الخبراء';

  @override
  String get actionReadFullBriefing => 'اقرأ الإحاطة كاملة';

  @override
  String get newsEmptyTitle => 'لا توجد إحاطات';

  @override
  String get newsEmptyMessage => 'جرّب موضوعًا أو كلمة بحث أخرى.';

  @override
  String get newsStandardsTitle => 'معايير التحرير في باك أوف هاوس';

  @override
  String get newsStandardsBody =>
      'تُكتب كل إحاطة أو تُراجَع من مكتب التحرير في باك أوف هاوس، وتُدقَّق وفق معايير القطاع وسلامة الفعاليات في المملكة.';

  @override
  String get articleDetailsTitle => 'إحاطة';

  @override
  String get articleDirectives => 'التوجيهات التشغيلية الأساسية';

  @override
  String get articleRelated => 'إحاطات ذات صلة';

  @override
  String articlePublished(String date) {
    return 'نُشرت في $date';
  }

  @override
  String get articleSavedMessage => 'حُفظت الإحاطة';

  @override
  String get articleRemovedMessage => 'أُزيلت من المحفوظات';

  @override
  String get notificationCategoryNews => 'الأخبار';

  @override
  String get accountTypeLabel => 'نوع الحساب';

  @override
  String get accountIndividual => 'فرد';

  @override
  String get accountCompany => 'شركة';

  @override
  String get fieldCompanyNameLabel => 'اسم الشركة';

  @override
  String get fieldCompanyNameHint => 'مثال: ميدان للفعاليات';

  @override
  String get fieldCompanyNameRequired => 'أدخل اسم شركتك';

  @override
  String get companyTypeLabel => 'نوع الشركة';

  @override
  String get companyTypeRequired => 'اختر نوع الشركة';

  @override
  String get companyTypeEventOrganizer => 'منظم فعاليات';

  @override
  String get companyTypeSupplier => 'مورّد';

  @override
  String get companyTypeVenue => 'مكان فعاليات';

  @override
  String get companyTypeProduction => 'إنتاج';

  @override
  String get companyTypeAgency => 'وكالة';

  @override
  String get companyTypeServiceProvider => 'مقدم خدمات';

  @override
  String get companyTypeOther => 'أخرى';

  @override
  String get profileStatusStudent => 'طالب';

  @override
  String get homeCompaniesToWatch => 'شركات تستحق المتابعة';

  @override
  String get discoverRecommendedGathering => 'لقاء مقترح';

  @override
  String eventSpeakersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count متحدثًا',
      few: '$count متحدثين',
      two: 'متحدثان',
      one: 'متحدث واحد',
    );
    return '$_temp0';
  }

  @override
  String get profileSelectedProjects => 'مشاريع مختارة';

  @override
  String companyOpenOpportunities(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count فرصة مفتوحة',
      few: '$count فرص مفتوحة',
      two: 'فرصتان مفتوحتان',
      one: 'فرصة مفتوحة واحدة',
      zero: 'لا توجد فرص مفتوحة',
    );
    return '$_temp0';
  }

  @override
  String get opportunityTypeJob => 'وظيفة';

  @override
  String get opportunityTypeProject => 'مشروع';

  @override
  String get opportunityTypeCoOp => 'تعاوني';

  @override
  String get opportunityTypeVolunteering => 'تطوع';

  @override
  String get opportunityTypeSupplierRequest => 'طلب توريد';

  @override
  String get employmentFullTime => 'دوام كامل';

  @override
  String get employmentPartTime => 'دوام جزئي';

  @override
  String get employmentContract => 'عقد';

  @override
  String get employmentFreelance => 'عمل حر';

  @override
  String get opportunitiesSubtitle =>
      'وظائف ومشاريع وتدريب تعاوني وفرص تطوع تناسب ملفك.';

  @override
  String get opportunitiesSearchHint => 'ابحث عن أدوار أو شركات أو مدن…';

  @override
  String get opportunitiesRecommended => 'مقترحة لك';

  @override
  String get opportunitiesOpen => 'الفرص المفتوحة';

  @override
  String get opportunitiesEmptyTitle => 'لا توجد فرص';

  @override
  String get opportunitiesEmptyMessage => 'جرّب نوعًا أو كلمة بحث أخرى.';

  @override
  String opportunityApplicants(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count متقدمًا',
      few: '$count متقدمين',
      two: 'متقدمان',
      one: 'متقدم واحد',
      zero: 'لا متقدمين بعد',
    );
    return '$_temp0';
  }

  @override
  String opportunityClosesOn(String date) {
    return 'يُغلق في $date';
  }

  @override
  String get opportunityWhyMatch => 'سبب التوافق';

  @override
  String get opportunityOverview => 'عن الدور';

  @override
  String get opportunityResponsibilities => 'المسؤوليات';

  @override
  String get opportunityRequirements => 'ما نبحث عنه';

  @override
  String get opportunitySkills => 'المهارات';

  @override
  String get opportunityPostedBy => 'نُشرت بواسطة';

  @override
  String get actionViewCompany => 'عرض ملف الشركة';

  @override
  String get opportunityUnpaid => 'بدون مقابل';

  @override
  String get opportunityYourApplication => 'طلبك';

  @override
  String get opportunityClosed => 'هذه الفرصة مغلقة.';

  @override
  String get actionViewApplication => 'عرض الطلب';

  @override
  String get applyTitle => 'التقديم';

  @override
  String applyStepOf(int step, int total) {
    return 'الخطوة $step من $total';
  }

  @override
  String get applyStepProfile => 'الملف والخبرات';

  @override
  String get applyStepReview => 'المراجعة والإرسال';

  @override
  String get applyExperienceTitle => 'الخبرات التي ستشاركها';

  @override
  String get applyExperienceSubtitle =>
      'اختر الأدوار التي تريد إرفاقها بهذا الطلب.';

  @override
  String applySelectedCount(int count) {
    return '$count محدد';
  }

  @override
  String get applySkillsTitle => 'مهاراتك';

  @override
  String get actionContinue => 'متابعة';

  @override
  String get applyStatementTitle => 'رسالة إلى الشركة';

  @override
  String get applyStatementOptional => 'اختياري';

  @override
  String get applyStatementHint => 'لماذا تناسبك هذه الفرصة';

  @override
  String get applyStatementIncluded => 'مُرفقة';

  @override
  String get applyStatementNotIncluded => 'غير مُرفقة';

  @override
  String applyChecklistTitle(String company) {
    return 'ما تستلمه $company';
  }

  @override
  String get applyChecklistProfile => 'ملفك وحالة التوثيق';

  @override
  String applyChecklistExperience(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count خبرة',
      few: '$count خبرات',
      two: 'خبرتان',
      one: 'خبرة واحدة',
    );
    return '$_temp0';
  }

  @override
  String applyPrivacyNote(String company) {
    return 'يبقى بريدك ورقم جوالك خاصَّين. لا ترى $company إلا بيانات التواصل التي تختار مشاركتها، وذلك عند وصول طلبك إلى مرحلة التواصل.';
  }

  @override
  String applyDecisionNote(String company) {
    return 'تراجع $company الطلبات وتتخذ القرار النهائي.';
  }

  @override
  String get actionSubmitApplication => 'إرسال الطلب';

  @override
  String get applySubmittedMessage => 'تم إرسال طلبك';

  @override
  String get applyNotAvailable => 'لا يمكنك التقديم على هذه الفرصة.';

  @override
  String get applyAlreadyApplied => 'سبق أن تقدمت لهذه الفرصة.';

  @override
  String get applicationsTitle => 'طلباتي';

  @override
  String get applicationsEntryHint => 'تابع حالة كل طلب';

  @override
  String get applicationsSubtitle =>
      'تراجع كل شركة طلباتها وتتخذ القرار، ويمكنك متابعة كل خطوة هنا.';

  @override
  String applicationsActive(int count) {
    return 'النشطة · $count';
  }

  @override
  String applicationsPast(int count) {
    return 'المغلقة · $count';
  }

  @override
  String get applicationsEmptyActiveTitle => 'لا توجد طلبات نشطة';

  @override
  String get applicationsEmptyActiveMessage =>
      'تصفح الفرص وتقدّم لما يناسب ملفك.';

  @override
  String get applicationsEmptyPastTitle => 'لا توجد طلبات سابقة';

  @override
  String get applicationsEmptyPastMessage =>
      'تظهر هنا الطلبات التي صدر فيها قرار.';

  @override
  String get actionBrowseOpportunities => 'تصفح الفرص';

  @override
  String applicationAppliedOn(String date) {
    return 'قُدّم في $date';
  }

  @override
  String applicationReference(String code) {
    return 'المرجع $code';
  }

  @override
  String applicationStageOf(int step, int total) {
    return 'الخطوة $step من $total';
  }

  @override
  String get applicationStatusSubmitted => 'مُرسل';

  @override
  String get applicationStatusReviewed => 'تمت المراجعة';

  @override
  String get applicationStatusShortlisted => 'في القائمة المختصرة';

  @override
  String get applicationStatusContact => 'تواصل';

  @override
  String get applicationStatusAccepted => 'مقبول';

  @override
  String get applicationStatusRejected => 'لم يتم الاختيار';

  @override
  String get applicationStatusWithdrawn => 'مسحوب';

  @override
  String get applicationStageDecision => 'القرار';

  @override
  String get actionWithdraw => 'سحب الطلب';

  @override
  String get actionViewOpportunity => 'عرض الفرصة';

  @override
  String get applicationWithdrawTitle => 'هل تريد سحب هذا الطلب؟';

  @override
  String applicationWithdrawBody(String company) {
    return 'ستتوقف $company عن مراجعته، ويمكنك التقديم مجددًا ما دامت الفرصة مفتوحة.';
  }

  @override
  String get applicationWithdrawnMessage => 'تم سحب الطلب';

  @override
  String get applicationsFooter =>
      'تربطك باك أوف هاوس بالشركات، وتتخذ كل شركة قرارات التوظيف بنفسها.';

  @override
  String get companyNavListings => 'الفرص';

  @override
  String get companyNavSuppliers => 'التوريد';

  @override
  String get companyNavDashboard => 'لوحة التحكم';

  @override
  String get companyNavPortfolio => 'المشاريع السابقة';

  @override
  String get companyWorkspace => 'مساحة عملك';

  @override
  String companyListingsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count فرصة',
      few: '$count فرص',
      two: 'فرصتان',
      one: 'فرصة واحدة',
      zero: 'لا توجد فرص بعد',
    );
    return '$_temp0';
  }

  @override
  String companyProjectsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مشروعًا',
      few: '$count مشاريع',
      two: 'مشروعان',
      one: 'مشروع واحد',
      zero: 'لا توجد مشاريع بعد',
    );
    return '$_temp0';
  }

  @override
  String get companyCreateOpportunityShort => 'ابدأ مسودة للمراجعة';

  @override
  String get applyIndividualsOnly =>
      'التقديم على هذه الفرصة متاح لحسابات الأفراد فقط.';

  @override
  String get applyStudentsOnly =>
      'التدريب التعاوني متاح للأفراد الذين لديهم صفة طالب.';

  @override
  String get applyProjectsTitle => 'المشاريع';

  @override
  String get applyProjectsSubtitle =>
      'اختر المشاريع التي تريد إرفاقها بهذا الطلب.';

  @override
  String applyChecklistProjects(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مشروعًا',
      few: '$count مشاريع',
      two: 'مشروعان',
      one: 'مشروع واحد',
      zero: 'لا مشاريع',
    );
    return '$_temp0';
  }

  @override
  String notificationApplicationTitle(String status) {
    String _temp0 = intl.Intl.selectLogic(status, {
      'SUBMITTED': 'تم إرسال الطلب',
      'REVIEWED': 'تمت مراجعة الطلب',
      'SHORTLISTED': 'الطلب في القائمة المختصرة',
      'CONTACT': 'مرحلة التواصل مع الشركة',
      'ACCEPTED': 'تم قبول الطلب',
      'REJECTED': 'لم يتم اختيار الطلب',
      'WITHDRAWN': 'تم سحب الطلب',
      'other': 'تم تحديث الطلب',
    });
    return '$_temp0';
  }

  @override
  String notificationApplicationBody(String status, String title) {
    String _temp0 = intl.Intl.selectLogic(status, {
      'SUBMITTED': 'تم إرسال طلبك لفرصة $title.',
      'REVIEWED': 'تمت مراجعة طلبك لفرصة $title.',
      'SHORTLISTED': 'أُضيف طلبك لفرصة $title إلى القائمة المختصرة.',
      'CONTACT': 'انتقل طلبك لفرصة $title إلى مرحلة التواصل.',
      'ACCEPTED': 'تم قبول طلبك لفرصة $title.',
      'REJECTED': 'لم يتم اختيار طلبك لفرصة $title.',
      'WITHDRAWN': 'سحبت طلبك لفرصة $title.',
      'other': 'تم تحديث طلبك لفرصة $title.',
    });
    return '$_temp0';
  }

  @override
  String get actionDelete => 'حذف';

  @override
  String get actionEdit => 'تعديل';

  @override
  String get fieldCategoryLabel => 'الفئة';

  @override
  String get fieldCityLabel => 'المدينة';

  @override
  String get fieldDescriptionLabel => 'الوصف';

  @override
  String get fieldLocationLabel => 'الموقع';

  @override
  String get fieldOnePerLine => 'عنصر واحد في كل سطر';

  @override
  String get fieldOptional => 'اختياري';

  @override
  String get fieldRequired => 'هذا الحقل مطلوب';

  @override
  String get fieldTitleLabel => 'العنوان';

  @override
  String fieldTooLong(int max) {
    return 'استخدم $max حرفًا أو أقل';
  }

  @override
  String get opportunityStatusDraft => 'مسودة';

  @override
  String get opportunityStatusInReview => 'قيد المراجعة';

  @override
  String get opportunityStatusPublished => 'منشورة';

  @override
  String get opportunityStatusPaused => 'متوقفة';

  @override
  String get opportunityStatusClosed => 'مغلقة';

  @override
  String get opportunityStatusArchived => 'مؤرشفة';

  @override
  String get companyNavSupplierRequests => 'طلبات التوريد';

  @override
  String get companyNavSupplierRequestsShort => 'الطلبات';

  @override
  String get companyNotVerified => 'غير موثقة بعد';

  @override
  String get companyEditProfile => 'تعديل ملف الشركة';

  @override
  String get companyProfileIncomplete =>
      'أضف نبذة ومدينة ليعرف المشترون والمتقدمون طبيعة عملك.';

  @override
  String get companyAbout => 'نبذة';

  @override
  String get companyAboutHint => 'ما تقدمه شركتك ولمن';

  @override
  String get companySpecialization => 'التخصص';

  @override
  String get companySpecializationHint => 'مثال: المسارح والتعليق';

  @override
  String get companyServices => 'الخدمات';

  @override
  String get companyIndustries => 'القطاعات';

  @override
  String get companyContact => 'التواصل';

  @override
  String get companyContactEmpty => 'لم تُضف بيانات تواصل بعد.';

  @override
  String get companyWebsite => 'الموقع الإلكتروني';

  @override
  String get companyCapabilities => 'أدوات الشركة';

  @override
  String get companyCanCreateSupplierRequests => 'يمكن لشركتك نشر طلبات توريد.';

  @override
  String get companyCannotCreateSupplierRequests =>
      'يمكن لشركتك الرد على طلبات التوريد الموجهة لنوعها.';

  @override
  String get companyProfileSaved => 'تم حفظ ملف الشركة';

  @override
  String companyIdentityNote(String name) {
    return 'اسم $name ونوعها جزء من هويتها المسجلة. تواصل مع باك أوف هاوس لتغييرهما.';
  }

  @override
  String get companyAddProject => 'إضافة مشروع';

  @override
  String get companyEditProject => 'تعديل المشروع';

  @override
  String get companyPortfolioSubtitle =>
      'أعمال نفذتها شركتك. أرفقها بردود التوريد كدليل.';

  @override
  String get companyPortfolioEmptyTitle => 'لا توجد مشاريع بعد';

  @override
  String get companyPortfolioEmptyMessage =>
      'أضف مشاريع سابقة لتُظهر للمشترين ما تستطيع شركتك تقديمه.';

  @override
  String get companyProjectDeleteTitle => 'هل تريد حذف هذا المشروع؟';

  @override
  String companyProjectDeleteBody(String title) {
    return 'سيُزال «$title» من سجل أعمالك.';
  }

  @override
  String get companyProjectDeleted => 'تم حذف المشروع';

  @override
  String get companyProjectSaved => 'تم حفظ المشروع';

  @override
  String get companyProjectClientConfidential => 'العميل سري';

  @override
  String get companyProjectCategoryHint => 'مثال: الإنتاج التقني';

  @override
  String companyProjectStart(String date) {
    return 'البداية: $date';
  }

  @override
  String companyProjectEnd(String date) {
    return 'النهاية: $date';
  }

  @override
  String get companyProjectAddEnd => 'إضافة تاريخ النهاية';

  @override
  String get companyProjectEndsBeforeStart =>
      'يجب أن يكون تاريخ النهاية بعد تاريخ البداية.';

  @override
  String get companyProjectServices => 'الخدمات المقدمة';

  @override
  String get companyProjectClient => 'اسم العميل';

  @override
  String get companyProjectClientHint => 'اختياري — اتركه فارغًا إن كان سريًا';

  @override
  String get companyMyOpportunities => 'فرصي';

  @override
  String get companyOpportunitiesSubtitle =>
      'المسودات والفرص قيد المراجعة والمنشورة.';

  @override
  String get companyReviewNote => 'تراجع باك أوف هاوس كل فرصة قبل نشرها.';

  @override
  String get companyOpportunitiesEmptyTitle => 'لا يوجد شيء هنا بعد';

  @override
  String get companyOpportunitiesEmptyMessage =>
      'أنشئ مسودة ثم أرسلها للمراجعة.';

  @override
  String get companyCreateOpportunity => 'إنشاء فرصة';

  @override
  String get companyCreateOpportunityHint =>
      'وظائف ومشاريع وتدريب تعاوني وتطوع وطلبات توريد';

  @override
  String get companyEditOpportunity => 'تعديل المسودة';

  @override
  String get companyUntitled => 'مسودة بلا عنوان';

  @override
  String get companyOnlyDraftsEditable =>
      'لا تُعدّل الفرص المنشورة مباشرة. اقترح تعديلات وتراجع باك أوف هاوس التحديث.';

  @override
  String get companyDraftSaved => 'تم حفظ المسودة';

  @override
  String get companyDraftNote =>
      'تُحفظ كمسودة، ولا يظهر شيء للعامة حتى توافق عليه باك أوف هاوس.';

  @override
  String get companySaveDraft => 'حفظ المسودة';

  @override
  String get companyOpportunityType => 'النوع';

  @override
  String get companyOpportunitySummary => 'الملخص';

  @override
  String get companyOpportunitySummaryHint => 'سطر واحد يظهر على البطاقات';

  @override
  String get companyEmploymentType => 'نوع التوظيف';

  @override
  String get companySupplierTypes => 'أنواع الموردين المدعوين';

  @override
  String get companySupplierTypesHint =>
      'لن يرى هذا الطلب ويرد عليه إلا الشركات من هذه الأنواع.';

  @override
  String get companySupplierTypesRequired => 'اختر نوع مورد واحدًا على الأقل';

  @override
  String get companyCompensation => 'المقابل المادي';

  @override
  String get companyBudget => 'الميزانية';

  @override
  String get companyDuration => 'المدة';

  @override
  String get companyStatusNoteDraft =>
      'هذه المسودة خاصة. أرسلها للمراجعة عندما تصبح جاهزة.';

  @override
  String get companyStatusNoteInReview =>
      'تراجع باك أوف هاوس هذه الفرصة. يمكنك إعادتها لتعديلها.';

  @override
  String get companyStatusNotePublished =>
      'هذه الفرصة منشورة. لتغييرها اقترح تحديثًا، وتبقى النسخة المنشورة كما هي حتى تتم الموافقة عليه.';

  @override
  String get companyStatusNoteClosed => 'هذه الفرصة مغلقة.';

  @override
  String get companySubmitForReview => 'إرسال للمراجعة';

  @override
  String get companySubmittedForReview => 'أُرسلت للمراجعة';

  @override
  String get companyDraftIncomplete => 'أكمل الحقول المطلوبة قبل الإرسال.';

  @override
  String get companyReturnToDraft => 'إعادة إلى المسودة';

  @override
  String get companyReturnedToDraft => 'أُعيدت إلى المسودة';

  @override
  String get companySimulateApproval => 'محاكاة الموافقة (تطوير)';

  @override
  String get companyPublished => 'تم النشر';

  @override
  String get companyCloseOpportunity => 'إغلاق الفرصة';

  @override
  String get companyCloseTitle => 'هل تريد إغلاق هذه الفرصة؟';

  @override
  String get companyCloseBody =>
      'ستتوقف عن استقبال الطلبات. الإغلاق نهائي ولا يمكن إعادة فتح الفرصة، وتبقى الطلبات الحالية متاحة للمراجعة.';

  @override
  String get companyClosed => 'تم إغلاق الفرصة';

  @override
  String get companyLiveOpportunities => 'الفرص المنشورة';

  @override
  String get companyNoLiveOpportunities =>
      'لا توجد فرص منشورة بعد. تظهر المسودات في قسم الفرص.';

  @override
  String get companyReviewApplicants => 'مراجعة المتقدمين';

  @override
  String get companyApplicants => 'المتقدمون';

  @override
  String get companyApplicant => 'المتقدم';

  @override
  String get companyApplicantsEmpty => 'لا يوجد متقدمون في هذه المرحلة';

  @override
  String get companyApplicantContact => 'بيانات التواصل';

  @override
  String get companyContactHidden =>
      'تُشارك بيانات التواصل من مرحلة التواصل فقط، وبما اختار المتقدم مشاركته فقط.';

  @override
  String get companyContactNotShared =>
      'لم يشارك المتقدم بيانات التواصل. المشاركة متوقفة افتراضيًا.';

  @override
  String get companyContactOutsideApp => 'يتم التواصل خارج باك أوف هاوس.';

  @override
  String get companyNoneIncluded => 'لم يُرفق شيء';

  @override
  String get companyDecisionNote =>
      'شركتك هي من تتخذ القرار، والقرارات نهائية بعد تسجيلها.';

  @override
  String get companyMarkReviewed => 'تمت المراجعة';

  @override
  String get companyShortlist => 'إضافة للقائمة المختصرة';

  @override
  String get companyMoveToContact => 'الانتقال إلى التواصل';

  @override
  String get companyAcceptApplicant => 'قبول';

  @override
  String get companyRejectApplicant => 'لم يتم الاختيار';

  @override
  String get companyAcceptTitle => 'هل تريد قبول هذا المتقدم؟';

  @override
  String get companyRejectTitle => 'هل تريد الرفض؟';

  @override
  String companyDecisionFinal(String name) {
    return 'هذا القرار بشأن $name نهائي ولا يمكن التراجع عنه.';
  }

  @override
  String companyStatusUpdated(String status) {
    return 'تم النقل إلى $status';
  }

  @override
  String get supplierRequestsSubtitle => 'طلبات من المشترين موجهة لنوع شركتك.';

  @override
  String get supplierCreateRequest => 'إنشاء طلب توريد';

  @override
  String get supplierTabInvited => 'الموجهة لك';

  @override
  String get supplierTabMyResponses => 'ردودي';

  @override
  String get supplierInvitedEmptyTitle => 'لا توجد طلبات مفتوحة';

  @override
  String get supplierInvitedEmptyMessage =>
      'ستظهر هنا الطلبات الموجهة لنوع شركتك.';

  @override
  String supplierInvitedCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count طلبًا مفتوحًا لنوعك',
      few: '$count طلبات مفتوحة لنوعك',
      two: 'طلبان مفتوحان لنوعك',
      one: 'طلب مفتوح واحد لنوعك',
      zero: 'لا توجد طلبات مفتوحة لنوعك',
    );
    return '$_temp0';
  }

  @override
  String get supplierResponsesEmptyTitle => 'لا توجد ردود بعد';

  @override
  String get supplierResponsesEmptyMessage =>
      'تظهر هنا الردود التي ترسلها على طلبات التوريد.';

  @override
  String supplierForBuyer(String buyer) {
    return 'لصالح $buyer';
  }

  @override
  String get supplierNotInvited => 'هذا الطلب غير موجه لنوع شركتك.';

  @override
  String get supplierOwnRequest => 'هذا طلبك.';

  @override
  String get supplierAlreadyResponded => 'سبق أن ردت شركتك.';

  @override
  String get supplierResponsesReceived => 'الردود المستلمة';

  @override
  String get supplierNoResponsesYet => 'لا توجد ردود بعد.';

  @override
  String get supplierViewMyResponse => 'عرض ردي';

  @override
  String get supplierRespond => 'الرد';

  @override
  String get supplierReviewResponses => 'مراجعة ردود الموردين';

  @override
  String supplierResponsesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count ردًا',
      few: '$count ردود',
      two: 'ردان',
      one: 'رد واحد',
      zero: 'لا ردود بعد',
    );
    return '$_temp0';
  }

  @override
  String get supplierResponseSent => 'تم إرسال الرد';

  @override
  String get supplierSendResponse => 'إرسال الرد';

  @override
  String get supplierMessage => 'الرسالة';

  @override
  String get supplierMessageHint =>
      'ما يمكنك توريده والتوفر وأي معلومات يحتاجها المشتري';

  @override
  String get supplierProposedPrice => 'السعر المقترح';

  @override
  String get supplierEvidence => 'مشاريع ذات صلة';

  @override
  String get supplierEvidenceSubtitle => 'اختياري: أرفق مشاريع الشركة كدليل.';

  @override
  String get supplierNoProjects => 'أضف مشاريع إلى سجل أعمالك لإرفاقها هنا.';

  @override
  String get supplierNoAttachments => 'إرفاق الملفات غير متاح بعد.';

  @override
  String get supplierResponse => 'رد المورد';

  @override
  String supplierSentOn(String date) {
    return 'أُرسل في $date';
  }

  @override
  String get supplierRespondingCompany => 'الشركة المستجيبة';

  @override
  String get supplierResponseSelected => 'تم الاختيار';

  @override
  String get supplierSelect => 'اختيار';

  @override
  String get supplierSelectTitle => 'هل تريد اختيار هذا المورد؟';

  @override
  String get opportunityStatusChangesRequested => 'مطلوب تعديلات';

  @override
  String get companyReviewerNote => 'المطلوب تعديله';

  @override
  String get companyStatusNoteChangesRequested =>
      'طلبت باك أوف هاوس تعديلات. عدّل الفرصة ثم أعد إرسالها للمراجعة.';

  @override
  String get companyProposeChanges => 'اقتراح تعديلات';

  @override
  String get companyPendingUpdate => 'تحديث قيد الإعداد';

  @override
  String get companyUpdateNoteDraft =>
      'هذا التحديث غير منشور. تبقى النسخة المنشورة كما هي حتى توافق باك أوف هاوس عليه.';

  @override
  String get companyUpdateNoteInReview =>
      'تراجع باك أوف هاوس هذا التحديث، وتبقى النسخة المنشورة كما هي.';

  @override
  String get companyUpdateNoteChangesRequested =>
      'طُلبت تعديلات على هذا التحديث، ولم تتغير النسخة المنشورة.';

  @override
  String get companyEditUpdate => 'تعديل التحديث';

  @override
  String get companySaveUpdate => 'حفظ التحديث';

  @override
  String get companySubmitUpdate => 'إرسال التحديث للمراجعة';

  @override
  String get companyUpdateStarted => 'بدأ إعداد التحديث';

  @override
  String get companyUpdateSaved => 'تم حفظ التحديث';

  @override
  String get companyUpdateSubmitted => 'أُرسل التحديث للمراجعة';

  @override
  String get companySimulateChangesRequested => 'محاكاة طلب تعديلات (تطوير)';

  @override
  String get companySimulateNote => 'أضف تفاصيل أكثر إلى الوصف والمتطلبات.';

  @override
  String get companyChangesRequestedRecorded => 'طُلبت تعديلات';

  @override
  String get companyVerificationReadOnly =>
      'التوثيق تديره باك أوف هاوس خارج التطبيق، ولا يؤثر على النشر: كل فرصة تخضع للمراجعة.';

  @override
  String supplierSelectBody(String name) {
    return 'سيتم اختيار $name، وتُرفض بقية الردود المفتوحة ويُغلق الطلب. لا يمكن التراجع عن ذلك.';
  }

  @override
  String get articleLike => 'إعجاب';

  @override
  String get articleLiked => 'أعجبني';

  @override
  String articleLikeCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count إعجابًا',
      few: '$count إعجابات',
      two: 'إعجابان',
      one: 'إعجاب واحد',
      zero: 'لا توجد إعجابات بعد',
    );
    return '$_temp0';
  }

  @override
  String get articleComments => 'التعليقات';

  @override
  String articleCommentsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count تعليقًا',
      few: '$count تعليقات',
      two: 'تعليقان',
      one: 'تعليق واحد',
      zero: 'لا توجد تعليقات بعد',
    );
    return '$_temp0';
  }

  @override
  String get articleCommentHint => 'أضف تعليقًا…';

  @override
  String get articleCommentPost => 'نشر التعليق';

  @override
  String get articleCommentsEmpty =>
      'لا توجد تعليقات بعد. كن أول من يشارك رأيه.';

  @override
  String get articleCommentsMembersOnly =>
      'الإعجاب والتعليق متاحان للأفراد فقط.';

  @override
  String get articleCommentsMore => 'عرض المزيد من التعليقات';

  @override
  String get articleCommentsError => 'تعذّر تحميل التعليقات.';

  @override
  String get articleCommentDelete => 'حذف التعليق';

  @override
  String get articleCommentDeleteTitle => 'حذف هذا التعليق؟';

  @override
  String get articleCommentDeleteBody => 'سيُحذف التعليق من هذا المقال.';

  @override
  String get articleCommentDeleted => 'تم حذف التعليق';

  @override
  String get articleCommentYou => 'أنت';

  @override
  String get companyDetailsTitle => 'الشركة';

  @override
  String get companyDetailsOpportunities => 'الفرص المتاحة';

  @override
  String get companyDetailsNoOpportunities => 'لا توجد فرص متاحة حاليًا.';

  @override
  String get companyDetailsNoProjects => 'لم تُضف مشاريع بعد.';

  @override
  String get companyDetailsOpportunitiesStat => 'فرص متاحة';

  @override
  String get companyDetailsProjectsStat => 'مشاريع';

  @override
  String get welcomeTermsLead => 'بالمتابعة فإنك توافق على ';

  @override
  String get welcomeTermsLink => 'الشروط والخصوصية';

  @override
  String get signInTitleAccent => 'بعودتك.';

  @override
  String get continueWithPhone => 'المتابعة برمز الجوال';

  @override
  String get validationCodeInvalid => 'أدخل الرمز المكوّن من 6 أرقام.';

  @override
  String get errorInvalidCode =>
      'الرمز غير صحيح أو انتهت صلاحيته. حاول مجددًا أو اطلب رمزًا جديدًا.';

  @override
  String get phoneSignInTitle => 'سجّل الدخول ';

  @override
  String get phoneSignInTitleAccent => 'برقم جوالك.';

  @override
  String get phoneSignInSubtitle =>
      'سنرسل لك رمزًا من 6 أرقام. دون الحاجة إلى كلمة مرور.';

  @override
  String get phoneSendCode => 'إرسال الرمز';

  @override
  String get phoneCodeTitle => 'أدخل الرمز';

  @override
  String phoneCodeSubtitle(String phone) {
    return 'أرسلنا رمزًا من 6 أرقام إلى $phone.';
  }

  @override
  String get phoneCodeLabel => 'الرمز';

  @override
  String get phoneVerifyCta => 'تحقّق وسجّل الدخول';

  @override
  String get phoneResendCode => 'إرسال رمز جديد';

  @override
  String get phoneChangeNumber => 'تغيير الرقم';

  @override
  String get phoneCodeSent => 'تم إرسال رمز جديد.';

  @override
  String pointsLevel(int level) {
    return 'المستوى $level';
  }

  @override
  String pointsToLevel(int count, int level) {
    return '$count نقطة للمستوى $level';
  }

  @override
  String get pointsTopLevel => 'وصلت إلى أعلى مستوى';

  @override
  String get homeGreetingMorning => 'صباح الخير، ';

  @override
  String get homeGreetingAfternoon => 'مساء الخير، ';

  @override
  String get homeGreetingEvening => 'مساء الخير، ';

  @override
  String get homeFlagshipEvent => 'فعالية رئيسية';

  @override
  String get homeOpportunitiesForYou => 'فرص لك';

  @override
  String get actionOpenRewards => 'فتح المكافآت';

  @override
  String get accountIndividualHint => 'محترفون ومستقلون وطلاب';

  @override
  String get accountCompanyHint => 'منظمون ووكالات وقاعات وموردون';

  @override
  String get signUpStudentTitle => 'أنا طالب حاليًا';

  @override
  String get signUpStudentHint => 'يتيح لك فرص التدريب التعاوني.';

  @override
  String get discoverSections => 'أقسام اكتشف';

  @override
  String get discoverUpcomingEvents => 'الفعاليات القادمة';

  @override
  String get discoverCalendar => 'التقويم';

  @override
  String get actionClearFilters => 'مسح التصفية';

  @override
  String actionRemoveFilter(String name) {
    return 'إزالة التصفية $name';
  }

  @override
  String get searchSuggestionLightShows => 'عروض ضوئية';

  @override
  String get searchSuggestionConcerts => 'حفلات';

  @override
  String get searchSuggestionRiyadh => 'الرياض';

  @override
  String get pointsBalanceLabel => 'الرصيد';

  @override
  String get profileGetVerified => 'احصل على التوثيق';

  @override
  String get profileNotVerified => 'غير موثّق';

  @override
  String get profileStatusProfessional => 'محترف';

  @override
  String get profileEventsAttended => 'فعاليات حضرتها';

  @override
  String get profileVisibilityShort => 'الظهور';

  @override
  String get profileYearsShort => 'سنوات الخبرة';

  @override
  String get profileMyApplications => 'طلباتي';

  @override
  String get profileAddPhoto => 'تغيير الصورة';

  @override
  String get eventAboutTab => 'نبذة';

  @override
  String get eventAgendaTab => 'البرنامج';

  @override
  String get eventSpeakersTab => 'المتحدثون';

  @override
  String get eventSections => 'أقسام الفعالية';

  @override
  String eventAttendingLabel(String count) {
    return '+$count مشارك';
  }

  @override
  String eventPeopleYouKnow(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count شخصًا تعرفهم',
      few: '$count أشخاص تعرفهم',
      two: 'شخصان تعرفهما',
      one: 'شخص واحد تعرفه',
    );
    return '$_temp0';
  }

  @override
  String get eventEntry => 'الدخول';

  @override
  String get eventMap => 'الخريطة';

  @override
  String get eventSaveLabel => 'حفظ الفعالية';

  @override
  String eventAgendaDay(int day, String date) {
    return 'اليوم $day · $date';
  }

  @override
  String get eventRegisteredTitle => 'تم تسجيلك!';

  @override
  String get eventRegisteredBody =>
      'حجزنا مكانك، وسيصلك تذكير قبل بدء الفعالية.';

  @override
  String get eventDateLabel => 'التاريخ';

  @override
  String get eventVenueLabel => 'المكان';

  @override
  String get eventPassHeading => 'تذكرة الفعالية';

  @override
  String get eventPassHint => 'اعرض هذا الرمز عند المدخل لتسجيل حضورك.';

  @override
  String get eventPointsOnAttendance =>
      'تحصل على النقاط عند التحقق من حضورك في الفعالية.';

  @override
  String get eventExploreMore => 'استكشف فعاليات أخرى';

  @override
  String get opportunityDetailTitle => 'الفرصة';

  @override
  String get opportunityEligible => 'يمكنك التقديم';

  @override
  String get opportunityApplyHint => 'ستشارك خبراتك ومشاريعك ورسالة قصيرة.';

  @override
  String get applyExperienceRequired => 'اختر واحدة على الأقل';

  @override
  String get applyExperienceMissing => 'اختر خبرة واحدة على الأقل لمشاركتها.';

  @override
  String get companyWorkspaceSubtitle => 'مساحة عمل الشركة';

  @override
  String get companyWelcomeBack => 'مرحبًا بعودتك';

  @override
  String get companyNewListing => 'فرصة جديدة';

  @override
  String get companyStatLiveListings => 'فرص منشورة';

  @override
  String get companyStatNewApplicants => 'متقدمون جدد';

  @override
  String companyStatThisWeek(int count) {
    return '+$count هذا الأسبوع';
  }

  @override
  String get companyStatSupplierInvites => 'دعوات توريد';

  @override
  String get companyStatProfileViews => 'مشاهدات الملف';

  @override
  String companyStatChange(String sign, int count) {
    return '$sign$count%';
  }

  @override
  String companyChangesRequestedTitle(String title) {
    return 'مطلوب تعديل على «$title»';
  }

  @override
  String get companyEditListing => 'تعديل الفرصة';

  @override
  String get companyRecentApplicants => 'أحدث المتقدمين';

  @override
  String get companyNoApplicantsYet =>
      'لا يوجد متقدمون بعد. تظهر الطلبات هنا بعد نشر الفرصة.';

  @override
  String get companyListingsTitle => 'الفرص';

  @override
  String filterAllCount(int count) {
    return 'الكل · $count';
  }

  @override
  String get companyFilterChanges => 'تعديلات';

  @override
  String get companyFilterDrafts => 'مسودات';

  @override
  String get companyListingNotLive => 'لم تُنشر بعد';

  @override
  String get companyListingApplicants => 'المتقدمون';

  @override
  String get companyListingEdit => 'تعديل';

  @override
  String get companyListingView => 'عرض';

  @override
  String get companyListingContinue => 'متابعة';

  @override
  String get companyListingType => 'نوع الفرصة';

  @override
  String get companyClosesOn => 'تُغلق في';

  @override
  String get companyClosesOnPick => 'اختياري — اختر تاريخًا';

  @override
  String get companyClosesInPast => 'اختر تاريخًا بعد اليوم.';

  @override
  String get companyClearDate => 'مسح التاريخ';

  @override
  String get companyWorkSetup => 'طبيعة العمل';

  @override
  String get workSetupOnSite => 'حضوري';

  @override
  String get workSetupHybrid => 'مرن';

  @override
  String get workSetupRemote => 'عن بُعد';

  @override
  String get companyReviewInfo =>
      'يراجع فريق باك أوف هاوس كل فرصة قبل نشرها، وسيصلك إشعار عند الموافقة أو طلب تعديلات.';

  @override
  String companyApplicantsSubtitle(int count, String status) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count متقدمًا',
      few: '$count متقدمين',
      two: 'متقدمان',
      one: 'متقدم واحد',
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
      other: '$count خبرة',
      few: '$count خبرات',
      two: 'خبرتان',
      one: 'خبرة واحدة',
    );
    return '$_temp0';
  }

  @override
  String applicantProjectCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مشروعًا',
      few: '$count مشاريع',
      two: 'مشروعان',
      one: 'مشروع واحد',
    );
    return '$_temp0';
  }

  @override
  String get applicantContactShared => 'بيانات التواصل متاحة';

  @override
  String get companyViewApplication => 'عرض الطلب';

  @override
  String get companyApplicationFor => 'طلب لـ';

  @override
  String get companyMessageTitle => 'الرسالة';

  @override
  String get companyExperienceShared => 'الخبرات المشاركة';

  @override
  String get companyProjectsShared => 'المشاريع المشاركة';

  @override
  String applicantStatusApplied(String status, String time) {
    return '$status · قدّم $time';
  }

  @override
  String get supplierYourResponse => 'ردّك';

  @override
  String supplierRespondBy(String date) {
    return 'الرد قبل $date';
  }

  @override
  String get supplierBudget => 'الميزانية';

  @override
  String get supplierRespondByLabel => 'الرد قبل';

  @override
  String get supplierYourPrice => 'سعرك';

  @override
  String get supplierSetupTime => 'مدة التجهيز';

  @override
  String get supplierSetupTimeHint => 'مثال: يومان';

  @override
  String get supplierAttachProjects => 'إرفاق مشاريع';

  @override
  String supplierSelectedCount(int count) {
    return 'تم اختيار $count';
  }

  @override
  String supplierPrivateNote(String buyer) {
    return 'لا يرى ردّك وسعرك إلا $buyer.';
  }

  @override
  String get supplierRequestsTitle => 'طلبات التوريد';

  @override
  String supplierTabInvitedCount(int count) {
    return 'المدعوّة · $count';
  }

  @override
  String supplierTabResponsesCount(int count) {
    return 'ردودي · $count';
  }

  @override
  String get supplierTabMyRequests => 'طلباتي';

  @override
  String supplierOpenToYourType(String time) {
    return 'متاح لنوع شركتك · $time';
  }

  @override
  String supplierYouResponded(String date) {
    return 'رددت · $date';
  }

  @override
  String get supplierBadgeOpen => 'مفتوح';

  @override
  String get supplierMyRequestsEmpty => 'تظهر طلبات التوريد الخاصة بك هنا.';

  @override
  String get companyVerifiedByBoh => 'موثّقة من باك أوف هاوس';

  @override
  String get companyStatProjects => 'مشاريع';

  @override
  String get companyStatFollowers => 'متابعون';

  @override
  String get companiesSearchHint => 'ابحث عن شركات أو خدمات أو مدن';

  @override
  String get companiesFilterOrganizers => 'منظمون';

  @override
  String get companiesFilterVenues => 'قاعات';

  @override
  String get companiesFilterSuppliers => 'موردون';

  @override
  String get companiesFilterAgencies => 'وكالات';

  @override
  String get companiesEditorsPick => 'اختيار المحرر';

  @override
  String get companiesEmpty => 'لا توجد شركات تطابق بحثك';

  @override
  String get professionalsSearchHint => 'ابحث بالاسم أو المهارة أو المدينة';

  @override
  String get professionalsFilterProducers => 'منتجون';

  @override
  String get professionalsFilterDesigners => 'مصممون';

  @override
  String get professionalsFilterTechnical => 'تقنيون';

  @override
  String get professionalsFilterStudents => 'طلاب';

  @override
  String get professionalsHighlighted => 'مُبرز';

  @override
  String get professionalsEmpty => 'لا يوجد محترفون يطابقون بحثك';

  @override
  String get actionConnected => 'متصل';

  @override
  String get editProfileIAm => 'أنا';

  @override
  String get editProfileHeadline => 'النبذة المختصرة';

  @override
  String get editProfileAbout => 'نبذة';

  @override
  String get editProfileInterests => 'الاهتمامات';

  @override
  String get editProfilePrivacy => 'خصوصية التواصل';

  @override
  String get editProfilePrivacyHint =>
      'اختر ما تراه الشركات عند وصول طلبك إلى مرحلة التواصل. مغلق افتراضيًا.';

  @override
  String get editProfileShareEmail => 'مشاركة بريدي';

  @override
  String get editProfileSharePhone => 'مشاركة جوالي';

  @override
  String get editProfileSaved => 'تم حفظ الملف';

  @override
  String get editProfileNameRequired => 'أدخل اسمك';

  @override
  String get editProfileAboutTooLong => 'النبذة حتى 600 حرف.';

  @override
  String get interestTechInnovation => 'التقنية والابتكار';

  @override
  String get interestMarketing => 'التسويق';

  @override
  String get interestDesign => 'التصميم';

  @override
  String get interestBusiness => 'الأعمال';

  @override
  String get interestNetworking => 'التواصل المهني';

  @override
  String get interestProduction => 'الإنتاج';

  @override
  String get verifyHeadline => 'أثبت للشركات أنك أنت';

  @override
  String get verifyIntro =>
      'تخبر شارة التوثيق الشركات بأن فريق باك أوف هاوس تحقق من هويتك وخبرتك.';

  @override
  String get verifyIdentityTitle => 'وثيقة الهوية';

  @override
  String get verifyIdentityHint => 'الهوية الوطنية أو الإقامة';

  @override
  String get verifyExperienceTitle => 'إثبات الخبرة';

  @override
  String get verifyExperienceHint => 'شهادة أو عقد أو خطاب توصية';

  @override
  String verifyUploaded(String hint) {
    return '$hint · تم الرفع';
  }

  @override
  String get verifyReviewTitle => 'مراجعة باك أوف هاوس';

  @override
  String get verifyReviewHint => 'سنبلغك عند اكتمالها';

  @override
  String get verifyInReview => 'قيد المراجعة — سنبلغك عند اكتمالها';

  @override
  String get verifyNote =>
      'لا يُمنح التوثيق أبدًا مقابل النقاط أو الدفع أو النشاط. تُستخدم مستنداتك لهذه المراجعة فقط.';

  @override
  String get verifyUpload => 'رفع';

  @override
  String get verifySubmit => 'إرسال للمراجعة';

  @override
  String get verifySubmitted => 'تم الإرسال للمراجعة';

  @override
  String get redeemedTitle => 'مكافأتك';

  @override
  String get redeemedBadge => 'تم الاستبدال';

  @override
  String redeemedFor(String points) {
    return 'استُبدلت مقابل $points نقطة';
  }

  @override
  String get redeemedYourCode => 'رمزك';

  @override
  String get redeemedHowToUse => 'طريقة الاستخدام';

  @override
  String get redeemedBalance => 'رصيد النقاط';

  @override
  String get redeemedPts => 'نقطة';

  @override
  String get actionCopy => 'نسخ';

  @override
  String get companyProjectStartLabel => 'تاريخ البدء';

  @override
  String get companyProjectEndLabel => 'تاريخ الانتهاء';

  @override
  String get companyProjectOngoing => 'مستمر';

  @override
  String get resetTitle => 'إعادة تعيين كلمة المرور';

  @override
  String get resetSubtitle =>
      'أدخل بريد حسابك وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.';

  @override
  String get resetCta => 'إرسال رابط إعادة التعيين';

  @override
  String get resetSentTitle => 'تحقق من بريدك';

  @override
  String resetSentBody(String email) {
    return 'إن كان هناك حساب مرتبط بـ $email، فرابط إعادة التعيين في الطريق إليك.';
  }

  @override
  String get resetBackToSignIn => 'العودة لتسجيل الدخول';
}
