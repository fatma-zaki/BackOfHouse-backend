import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The only icon set in the app: Lucide outline at weight 400 (~1.8px stroke
/// at 24px). Features reference icons by role from here — never
/// `Icons.*` from Material and never a filled glyph.
///
/// Icons that imply reading direction use Lucide's `Dir` variants, which set
/// `matchTextDirection` so they mirror automatically in Arabic.
abstract final class AppIcons {
  // ── Navigation ───────────────────────────────────────────────────────────
  static const IconData home = LucideIcons.house400;
  static const IconData companies = LucideIcons.building2400;
  static const IconData courses = LucideIcons.graduationCap400;
  static const IconData community = LucideIcons.network400;
  static const IconData discover = LucideIcons.compass400;
  static const IconData rewards = LucideIcons.gift400;
  static const IconData news = LucideIcons.newspaper400;
  static const IconData events = LucideIcons.calendarDays400;
  static const IconData profile = LucideIcons.user400;

  // ── Directional (mirror in RTL) ──────────────────────────────────────────
  static const IconData arrowForward = LucideIcons.arrowRight400Dir;
  static const IconData arrowBack = LucideIcons.arrowLeft400Dir;
  static const IconData chevronForward = LucideIcons.chevronRight400Dir;
  static const IconData chevronBack = LucideIcons.chevronLeft400Dir;
  static const IconData trendingUp = LucideIcons.trendingUp400Dir;
  static const IconData externalLink = LucideIcons.squareArrowOutUpRight400Dir;
  static const IconData logOut = LucideIcons.logOut400Dir;
  static const IconData send = LucideIcons.sendHorizontal400Dir;

  // ── Actions ──────────────────────────────────────────────────────────────
  static const IconData search = LucideIcons.search400;
  static const IconData notifications = LucideIcons.bell400;
  static const IconData bookmark = LucideIcons.bookmark400;
  static const IconData share = LucideIcons.share2400;
  static const IconData link = LucideIcons.link400;
  static const IconData plus = LucideIcons.plus400;
  static const IconData close = LucideIcons.x400;
  static const IconData check = LucideIcons.check400;
  static const IconData filter = LucideIcons.slidersHorizontal400;
  static const IconData refresh = LucideIcons.refreshCw400;
  static const IconData chevronDown = LucideIcons.chevronDown400;
  static const IconData language = LucideIcons.languages400;
  static const IconData lightMode = LucideIcons.sun400;
  static const IconData darkMode = LucideIcons.moon400;

  // ── Content & categories ─────────────────────────────────────────────────
  static const IconData categoryAll = LucideIcons.newspaper400;
  static const IconData industry = LucideIcons.building2400;
  static const IconData technology = LucideIcons.cpu400;
  static const IconData saudiMarket = LucideIcons.treePalm400;
  static const IconData tips = LucideIcons.lightbulb400;
  static const IconData clock = LucideIcons.clock400;
  static const IconData location = LucideIcons.mapPin400;
  static const IconData calendar = LucideIcons.calendar400;
  static const IconData people = LucideIcons.users400;
  static const IconData ticket = LucideIcons.ticket400;
  static const IconData star = LucideIcons.star400;
  static const IconData heart = LucideIcons.heart400;
  static const IconData settings = LucideIcons.settings400;
  static const IconData verified = LucideIcons.badgeCheck400;
  static const IconData points = LucideIcons.coins400;
  static const IconData level = LucideIcons.award400;
  static const IconData workshop = LucideIcons.presentation400;
  static const IconData profileCompletion = LucideIcons.userCheck400;
  static const IconData identity = LucideIcons.shieldCheck400;
  static const IconData contribution = LucideIcons.messageCircle400;
  static const IconData follow = LucideIcons.building400;
  static const IconData redeemed = LucideIcons.ticketCheck400;
  static const IconData report = LucideIcons.fileText400;
  static const IconData highlight = LucideIcons.highlighter400;
  static const IconData job = LucideIcons.briefcase400;
  static const IconData like = LucideIcons.heart400;
  static const IconData comment = LucideIcons.messageSquare400;
  static const IconData copy = LucideIcons.copy400;
  static const IconData greetingSun = LucideIcons.sun400;
  static const IconData greetingMoon = LucideIcons.moon400;

  // ── Ecosystem (Stitch directory) ─────────────────────────────────────────
  static const IconData professionals = LucideIcons.shieldCheck400;
  static const IconData opportunities = LucideIcons.briefcaseBusiness400;
  static const IconData sectorStaging = LucideIcons.hardHat400;
  static const IconData sectorEntertainment = LucideIcons.drama400;
  static const IconData sectorVenues = LucideIcons.landmark400;
  static const IconData sectorAudiovisual = LucideIcons.speaker400;
  static const IconData sectorLogistics = LucideIcons.truck400;
  static const IconData match = LucideIcons.target400;
  static const IconData registered = LucideIcons.calendarCheck400;
  static const IconData shield = LucideIcons.shield400;
  static const IconData recommended = LucideIcons.sparkles400;
  static const IconData connect = LucideIcons.userPlus400;
  static const IconData post = LucideIcons.send400;
  static const IconData repost = LucideIcons.repeat2400;
  static const IconData download = LucideIcons.download400;
  static const IconData saved = LucideIcons.bookmarkCheck400;
  static const IconData pass = LucideIcons.qrCode400;
  static const IconData network = LucideIcons.network400;
  static const IconData keynote = LucideIcons.micVocal400;
  static const IconData camera = LucideIcons.camera400;

  // ── Company workspace ────────────────────────────────────────────────────
  static const IconData dashboard = LucideIcons.layoutDashboard400;
  static const IconData edit = LucideIcons.pencil400;
  static const IconData delete = LucideIcons.trash2400;
  static const IconData applicants = LucideIcons.clipboardList400;
  static const IconData supplierRequests = LucideIcons.packageSearch400;
  static const IconData website = LucideIcons.globe400;
  static const IconData hidden = LucideIcons.eyeOff400;
  static const IconData handshake = LucideIcons.handshake400;
  static const IconData listings = LucideIcons.briefcaseBusiness400;
  static const IconData upload = LucideIcons.upload400;
  static const IconData arrowUp = LucideIcons.arrowUp400;
  static const IconData calendarAdd = LucideIcons.calendarPlus400;
  static const IconData verifiedShield = LucideIcons.shieldCheck400;
  static const IconData appearance = LucideIcons.moon400;
  static const IconData globe = LucideIcons.globe400;
  static const IconData smartphone = LucideIcons.smartphone400;

  // ── Forms ────────────────────────────────────────────────────────────────
  static const IconData email = LucideIcons.mail400;
  static const IconData password = LucideIcons.lock400;
  static const IconData phone = LucideIcons.phone400;
  static const IconData user = LucideIcons.user400;
  static const IconData show = LucideIcons.eye400;
  static const IconData hide = LucideIcons.eyeOff400;

  // ── Feedback ─────────────────────────────────────────────────────────────
  static const IconData error = LucideIcons.triangleAlert400;
  static const IconData info = LucideIcons.circleAlert400;
  static const IconData success = LucideIcons.circleCheck400;
  static const IconData offline = LucideIcons.wifiOff400;
  static const IconData empty = LucideIcons.inbox400;
  static const IconData imageUnavailable = LucideIcons.imageOff400;
  static const IconData comingSoon = LucideIcons.clapperboard400;
}
