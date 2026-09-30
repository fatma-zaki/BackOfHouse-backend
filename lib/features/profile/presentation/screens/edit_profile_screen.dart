import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../applications/domain/application.dart' show ContactPrivacy;
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/profile_data.dart';
import '../../domain/profile.dart';
import '../../domain/profile_status.dart';

extension ProfileInterestLabel on ProfileInterest {
  String label(AppLocalizations l10n) => switch (this) {
    ProfileInterest.techInnovation => l10n.interestTechInnovation,
    ProfileInterest.marketing => l10n.interestMarketing,
    ProfileInterest.design => l10n.interestDesign,
    ProfileInterest.business => l10n.interestBusiness,
    ProfileInterest.networking => l10n.interestNetworking,
    ProfileInterest.production => l10n.interestProduction,
  };
}

/// An individual edits their profile: name, headline, city, about, student
/// status (which decides co-op eligibility), interests and what companies
/// may see from the Contact stage (nothing by default).
class EditProfileScreen extends ConsumerWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return switch (ref.watch(myProfileProvider)) {
      AsyncData(:final value) => _Form(profile: value),
      AsyncError(:final error) => BOHScaffold(
        appBar: BOHAppBar(title: context.l10n.profileEditProfile),
        body: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(myProfileProvider),
        ),
      ),
      _ => BOHScaffold(
        appBar: BOHAppBar(title: context.l10n.profileEditProfile),
        body: const BOHLoadingState(),
      ),
    };
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({required this.profile});

  final Profile profile;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.profile.name);
  late final _headline = TextEditingController(text: widget.profile.headline);
  late final _city = TextEditingController(text: widget.profile.city);
  late final _about = TextEditingController(text: widget.profile.about);
  late ProfileStatus _status = widget.profile.status;
  late final Set<ProfileInterest> _interests = {...widget.profile.interests};
  late ContactPrivacy _privacy = widget.profile.contactPrivacy;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _headline.dispose();
    _city.dispose();
    _about.dispose();
    super.dispose();
  }

  ProfileDraft get _draft => ProfileDraft(
    name: _name.text,
    headline: _headline.text,
    city: _city.text,
    about: _about.text,
    status: _status,
    interests: _interests,
    contactPrivacy: _privacy,
  );

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    final l10n = context.l10n;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final saved = await ref
          .read(profileRepositoryProvider)
          .updateProfile(_draft);
      ref
          .read(authControllerProvider.notifier)
          .applyProfile(
            fullName: saved.name,
            headline: saved.headline,
            profileStatus: saved.status,
          );
      ref.invalidate(myProfileProvider);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(l10n.editProfileSaved)));
      if (mounted) context.pop();
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(l10n.error(error))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    const gap = SizedBox(height: AppSpacing.s14);

    Widget fieldLabel(String text) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s6),
      child: Text(text, style: context.text.labelMedium),
    );

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.profileEditProfile,
        actions: [
          BOHButton(
            label: l10n.actionSave,
            size: BOHButtonSize.compact,
            trailingIcon: null,
            expand: false,
            isLoading: _saving,
            onPressed: _save,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.formHorizontal,
            AppSpacing.s8,
            AppSpacing.formHorizontal,
            AppSpacing.s32,
          ),
          children: [
            Center(
              child: BOHAvatar(
                name: widget.profile.name,
                image: widget.profile.avatar,
                dimension: 76,
                ring: true,
                verified: widget.profile.verified,
              ),
            ),
            const SizedBox(height: AppSpacing.s20),
            fieldLabel(l10n.editProfileIAm),
            Semantics(
              label: l10n.editProfileIAm,
              child: BOHSegmentedControl<ProfileStatus>(
                style: BOHSegmentedStyle.radio,
                segments: [
                  (ProfileStatus.professional, l10n.profileStatusProfessional),
                  (ProfileStatus.student, l10n.profileStatusStudent),
                ],
                selected: _status,
                onChanged: (s) => setState(() => _status = s),
              ),
            ),
            gap,
            BOHTextField(
              controller: _name,
              label: l10n.fieldFullNameLabel,
              textCapitalization: TextCapitalization.words,
              autofillHints: const [AutofillHints.name],
              enabled: !_saving,
              validator: (v) => (v ?? '').trim().length < 2
                  ? l10n.editProfileNameRequired
                  : null,
            ),
            gap,
            BOHTextField(
              controller: _headline,
              label: l10n.editProfileHeadline,
              textCapitalization: TextCapitalization.sentences,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _city,
              label: l10n.fieldCityLabel,
              textCapitalization: TextCapitalization.words,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _about,
              label: l10n.editProfileAbout,
              minLines: 3,
              maxLines: 8,
              maxLength: ProfileDraft.aboutMaxLength,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              enabled: !_saving,
              validator: (v) =>
                  (v ?? '').trim().length > ProfileDraft.aboutMaxLength
                  ? l10n.editProfileAboutTooLong
                  : null,
            ),
            const SizedBox(height: AppSpacing.s20),
            BOHSectionHeader(
              title: l10n.editProfileInterests,
              size: BOHSectionSize.sub,
            ),
            Wrap(
              spacing: AppSpacing.s8,
              runSpacing: AppSpacing.s8,
              children: [
                for (final i in ProfileInterest.values)
                  BOHSelectChip(
                    label: i.label(l10n),
                    selected: _interests.contains(i),
                    onChanged: _saving
                        ? null
                        : (on) => setState(
                            () => on ? _interests.add(i) : _interests.remove(i),
                          ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.s20),
            BOHSectionHeader(
              title: l10n.editProfilePrivacy,
              subtitle: l10n.editProfilePrivacyHint,
              size: BOHSectionSize.sub,
            ),
            BOHCard(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.cardPadding,
              ),
              child: Column(
                children: [
                  BOHToggleRow(
                    label: l10n.editProfileShareEmail,
                    value: _privacy.shareEmail,
                    onChanged: _saving
                        ? null
                        : (v) => setState(
                            () => _privacy = ContactPrivacy(
                              shareEmail: v,
                              sharePhone: _privacy.sharePhone,
                            ),
                          ),
                  ),
                  BOHToggleRow(
                    label: l10n.editProfileSharePhone,
                    value: _privacy.sharePhone,
                    showDivider: false,
                    onChanged: _saving
                        ? null
                        : (v) => setState(
                            () => _privacy = ContactPrivacy(
                              shareEmail: _privacy.shareEmail,
                              sharePhone: v,
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
