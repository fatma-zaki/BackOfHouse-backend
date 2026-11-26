import 'package:flutter/widgets.dart';

import '../../../core/constants/app_icons.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../domain/company_type.dart';

extension CompanyTypePresentation on CompanyType {
  String label(AppLocalizations l10n) => switch (this) {
    CompanyType.eventOrganizer => l10n.companyTypeEventOrganizer,
    CompanyType.supplier => l10n.companyTypeSupplier,
    CompanyType.venue => l10n.companyTypeVenue,
    CompanyType.production => l10n.companyTypeProduction,
    CompanyType.agency => l10n.companyTypeAgency,
    CompanyType.serviceProvider => l10n.companyTypeServiceProvider,
    CompanyType.other => l10n.companyTypeOther,
  };

  IconData get icon => switch (this) {
    CompanyType.eventOrganizer => AppIcons.sectorEntertainment,
    CompanyType.supplier => AppIcons.sectorLogistics,
    CompanyType.venue => AppIcons.sectorVenues,
    CompanyType.production => AppIcons.sectorStaging,
    CompanyType.agency => AppIcons.people,
    CompanyType.serviceProvider => AppIcons.sectorAudiovisual,
    CompanyType.other => AppIcons.companies,
  };
}
