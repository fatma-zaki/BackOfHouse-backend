import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';
import '../../../core/utils/paginated.dart';

enum EventType { conference, workshop, networking, expo }

@immutable
class EventSpeaker {
  const EventSpeaker({
    required this.name,
    required this.role,
    required this.organization,
    this.photo,
    this.host = false,
  });

  final String name;
  final String role;
  final String organization;
  final AppImage? photo;
  final bool host;
}

@immutable
class AgendaItem {
  const AgendaItem({
    required this.day,
    required this.startsAt,
    required this.endsAt,
    required this.title,
    required this.description,
    this.format,
    this.keynote = false,
  });

  /// 1-based conference day.
  final int day;
  final DateTime startsAt;
  final DateTime endsAt;
  final String title;
  final String description;

  /// e.g. "Technical Panel", "Workshop".
  final String? format;
  final bool keynote;
}

@immutable
class Event {
  const Event({
    required this.id,
    required this.title,
    required this.type,
    required this.startsAt,
    required this.endsAt,
    required this.city,
    required this.venue,
    required this.organizer,
    required this.description,
    required this.topics,
    required this.attendees,
    this.image,
    this.isRegistered = false,
    this.organizerVerified = false,
    this.accredited = false,
    this.pointsReward = 0,
    this.speakers = const [],
    this.agenda = const [],
    this.networkPeers = 0,
    this.matchScore = 0,
    this.passCode,
  });

  final String id;
  final String title;
  final EventType type;
  final DateTime startsAt;
  final DateTime endsAt;
  final String city;
  final String venue;
  final String organizer;
  final String description;

  /// Short topic labels, e.g. "Networking", "Tech".
  final List<String> topics;
  final int attendees;
  final AppImage? image;
  final bool isRegistered;
  final bool organizerVerified;

  /// Accredited by the General Entertainment Authority.
  final bool accredited;

  /// Points credited after verified check-in.
  final int pointsReward;
  final List<EventSpeaker> speakers;
  final List<AgendaItem> agenda;

  /// Confirmed attendees from the member's own network.
  final int networkPeers;

  /// Fit with the member's credentials, 0-100.
  final int matchScore;

  /// Delegate pass reference, issued once registered.
  final String? passCode;

  /// Whole days the event spans (1 for a single-day event).
  int get durationDays => endsAt.difference(startsAt).inDays + 1;

  Event copyWith({bool? isRegistered, int? attendees, String? passCode}) =>
      Event(
        id: id,
        title: title,
        type: type,
        startsAt: startsAt,
        endsAt: endsAt,
        city: city,
        venue: venue,
        organizer: organizer,
        description: description,
        topics: topics,
        attendees: attendees ?? this.attendees,
        image: image,
        isRegistered: isRegistered ?? this.isRegistered,
        organizerVerified: organizerVerified,
        accredited: accredited,
        pointsReward: pointsReward,
        speakers: speakers,
        agenda: agenda,
        networkPeers: networkPeers,
        matchScore: matchScore,
        passCode: (isRegistered ?? this.isRegistered)
            ? passCode ?? this.passCode
            : null,
      );
}

typedef EventsQuery = ({EventType? type, String query});

abstract interface class EventsRepository {
  Future<Paginated<Event>> getEvents(EventsQuery query, PageRequest request);

  Future<Event> getEvent(String id);

  /// Registers or cancels; returns the updated event.
  Future<Event> setRegistration(String id, {required bool registered});

  /// Upcoming events across the directory, for counts.
  Future<int> countUpcoming();
}
