import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../data/verification_data.dart';
import '../../domain/verification.dart';

/// An individual asks Back Of House to verify them: an identity document,
/// a proof of experience, then a review. Submitting only asks for the
/// review — nothing here grants verification.
class GetVerifiedScreen extends ConsumerStatefulWidget {
  const GetVerifiedScreen({super.key});

  @override
  ConsumerState<GetVerifiedScreen> createState() => _GetVerifiedScreenState();
}

class _GetVerifiedScreenState extends ConsumerState<GetVerifiedScreen> {
  VerificationDocument? _uploading;
  bool _submitting = false;

  bool get _busy => _uploading != null || _submitting;

  void _showError(Object error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(context.l10n.error(error))));
  }

  Future<void> _upload(VerificationDocument document) async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
      withData: true,
    );
    final file = picked?.files.singleOrNull;
    if (file == null || !mounted) return;
    setState(() => _uploading = document);
    try {
      await ref
          .read(verificationRepositoryProvider)
          .upload(document, fileName: file.name, bytes: file.bytes ?? const []);
      ref.invalidate(myVerificationRequestProvider);
    } catch (error) {
      _showError(error);
    } finally {
      if (mounted) setState(() => _uploading = null);
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    try {
      await ref.read(verificationRepositoryProvider).submit();
      ref.invalidate(myVerificationRequestProvider);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(l10n.verifySubmitted)));
    } catch (error) {
      _showError(error);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final value = ref.watch(myVerificationRequestProvider);
    final request = value.value;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.profileGetVerified),
      bottomNavigationBar:
          request == null ||
              request.status == VerificationRequestStatus.inReview
          ? null
          : BOHActionBar(
              child: BOHButton(
                label: l10n.verifySubmit,
                size: BOHButtonSize.large,
                trailingIcon: null,
                isLoading: _submitting,
                onPressed: request.canSubmit && !_busy ? _submit : null,
              ),
            ),
      body: switch (value) {
        AsyncData(value: final request) => _Body(
          request: request,
          uploading: _uploading,
          onUpload: _busy ? null : _upload,
        ),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(myVerificationRequestProvider),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.request,
    required this.uploading,
    required this.onUpload,
  });

  final VerificationRequest request;
  final VerificationDocument? uploading;
  final ValueChanged<VerificationDocument>? onUpload;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final inReview = request.status == VerificationRequestStatus.inReview;
    final next = request.nextDocument;

    Widget document(int number, VerificationDocument d) {
      final (title, hint) = switch (d) {
        VerificationDocument.identity => (
          l10n.verifyIdentityTitle,
          l10n.verifyIdentityHint,
        ),
        VerificationDocument.experience => (
          l10n.verifyExperienceTitle,
          l10n.verifyExperienceHint,
        ),
      };
      final done = request.has(d);
      final current = !inReview && d == next;
      return BOHStepCard(
        number: number,
        title: title,
        subtitle: done ? l10n.verifyUploaded(hint) : hint,
        state: done
            ? BOHStepState.done
            : current
            ? BOHStepState.current
            : BOHStepState.pending,
        action: current
            ? BOHButton(
                label: l10n.verifyUpload,
                size: BOHButtonSize.compact,
                leadingIcon: AppIcons.upload,
                trailingIcon: null,
                expand: false,
                isLoading: uploading == d,
                onPressed: onUpload == null ? null : () => onUpload!(d),
              )
            : null,
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.formHorizontal,
        AppSpacing.s8,
        AppSpacing.formHorizontal,
        AppSpacing.s32,
      ),
      children: [
        Container(
          width: 56,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: c.primaryTint,
            shape: BoxShape.circle,
          ),
          child: Icon(AppIcons.verifiedShield, size: 26, color: c.primaryText),
        ),
        const SizedBox(height: AppSpacing.s14),
        Text(l10n.verifyHeadline, style: context.text.h1),
        const SizedBox(height: AppSpacing.s6),
        Text(l10n.verifyIntro, style: context.text.body),
        const SizedBox(height: AppSpacing.s20),
        document(1, VerificationDocument.identity),
        const SizedBox(height: AppSpacing.s10),
        document(2, VerificationDocument.experience),
        const SizedBox(height: AppSpacing.s10),
        BOHStepCard(
          number: 3,
          title: l10n.verifyReviewTitle,
          subtitle: inReview ? l10n.verifyInReview : l10n.verifyReviewHint,
          state: inReview ? BOHStepState.current : BOHStepState.pending,
        ),
        const SizedBox(height: AppSpacing.s20),
        BOHBanner(l10n.verifyNote, icon: AppIcons.verifiedShield),
      ],
    );
  }
}
