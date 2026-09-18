import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The only icon set in the app: Lucide outline at weight 300 (~1.5px stroke
/// at 24px). Features reference icons by role from here — never
/// `Icons.*` from Material and never a filled glyph.
///
/// Icons that imply reading direction use Lucide's `Dir` variants, which set
/// `matchTextDirection` so they mirror automatically in Arabic.
abstract final class AppIcons {
  // ── Navigation ───────────────────────────────────────────────────────────
  static const IconData home = LucideIcons.house300;
  static const IconData companies = LucideIcons.building2300;
  static const IconData courses = LucideIcons.graduationCap300;
  static const IconData community = LucideIcons.network300;
  static const IconData discover = LucideIcons.compass300;
  static const IconData rewards = LucideIcons.gift300;
  static const IconData news = LucideIcons.newspaper300;
  static const IconData events = LucideIcons.calendarDays300;
  static const IconData profile = LucideIcons.user300;

  // ── Directional (mirror in RTL) ──────────────────────────────────────────
  static const IconData arrowForward = LucideIcons.arrowRight300Dir;
  static const IconData arrowBack = LucideIcons.arrowLeft300Dir;
  static const IconData chevronForward = LucideIcons.chevronRight300Dir;
  static const IconData chevronBack = LucideIcons.chevronLeft300Dir;
  static const IconData trendingUp = LucideIcons.trendingUp300Dir;
  static const IconData externalLink = LucideIcons.squareArrowOutUpRight300Dir;
  static const IconData logOut = LucideIcons.logOut300Dir;
  static const IconData send = LucideIcons.sendHorizontal300Dir;

  // ── Actions ──────────────────────────────────────────────────────────────
  static const IconData search = LucideIcons.search300;
  static const IconData notifications = LucideIcons.bell300;
  static const IconData bookmark = LucideIcons.bookmark300;
  static const IconData share = LucideIcons.share2300;
  static const IconData link = LucideIcons.link300;
  static const IconData plus = LucideIcons.plus300;
  static const IconData close = LucideIcons.x300;
  static const IconData check = LucideIcons.check300;
  static const IconData filter = LucideIcons.slidersHorizontal300;
  static const IconData refresh = LucideIcons.refreshCw300;
  static const IconData chevronDown = LucideIcons.chevronDown300;
  static const IconData language = LucideIcons.languages300;
  static const IconData lightMode = LucideIcons.sun300;
  static const IconData darkMode = LucideIcons.moon300;

  // ── Content & categories ─────────────────────────────────────────────────
  static const IconData categoryAll = LucideIcons.newspaper300;
  static const IconData industry = LucideIcons.building2300;
  static const IconData technology = LucideIcons.cpu300;
  static const IconData saudiMarket = LucideIcons.treePalm300;
  static const IconData tips = LucideIcons.lightbulb300;
  static const IconData clock = LucideIcons.clock300;
  static const IconData location = LucideIcons.mapPin300;
  static const IconData calendar = LucideIcons.calendar300;
  static const IconData people = LucideIcons.users300;
  static const IconData ticket = LucideIcons.ticket300;
  static const IconData star = LucideIcons.star300;
  static const IconData heart = LucideIcons.heart300;
  static const IconData settings = LucideIcons.settings300;
  static const IconData verified = LucideIcons.badgeCheck300;
  static const IconData points = LucideIcons.coins300;
  static const IconData level = LucideIcons.award300;
  static const IconData workshop = LucideIcons.presentation300;
  static const IconData profileCompletion = LucideIcons.userCheck300;
  static const IconData identity = LucideIcons.shieldCheck300;
  static const IconData contribution = LucideIcons.messageCircle300;
  static const IconData follow = LucideIcons.building300;
  static const IconData redeemed = LucideIcons.ticketCheck300;
  static const IconData report = LucideIcons.fileText300;
  static const IconData highlight = LucideIcons.highlighter300;
  static const IconData job = LucideIcons.briefcase300;
  static const IconData like = LucideIcons.heart300;
  static const IconData comment = LucideIcons.messageSquare300;
  static const IconData copy = LucideIcons.copy300;
  static const IconData greetingSun = LucideIcons.sun300;
  static const IconData greetingMoon = LucideIcons.moon300;

  // ── Ecosystem (Stitch directory) ─────────────────────────────────────────
  static const IconData professionals = LucideIcons.shieldCheck300;
  static const IconData opportunities = LucideIcons.briefcaseBusiness300;
  static const IconData sectorStaging = LucideIcons.hardHat300;
  static const IconData sectorEntertainment = LucideIcons.drama300;
  static const IconData sectorVenues = LucideIcons.landmark300;
  static const IconData sectorAudiovisual = LucideIcons.speaker300;
  static const IconData sectorLogistics = LucideIcons.truck300;
  static const IconData match = LucideIcons.target300;
  static const IconData registered = LucideIcons.calendarCheck300;
  static const IconData shield = LucideIcons.shield300;
  static const IconData recommended = LucideIcons.sparkles300;
  static const IconData connect = LucideIcons.userPlus300;
  static const IconData post = LucideIcons.send300;
  static const IconData repost = LucideIcons.repeat2300;
  static const IconData download = LucideIcons.download300;
  static const IconData saved = LucideIcons.bookmarkCheck300;
  static const IconData pass = LucideIcons.qrCode300;
  static const IconData network = LucideIcons.network300;
  static const IconData keynote = LucideIcons.micVocal300;
  static const IconData camera = LucideIcons.camera300;

  // ── Company workspace ────────────────────────────────────────────────────
  static const IconData dashboard = LucideIcons.layoutDashboard300;
  static const IconData edit = LucideIcons.pencil300;
  static const IconData delete = LucideIcons.trash2300;
  static const IconData applicants = LucideIcons.clipboardList300;
  static const IconData supplierRequests = LucideIcons.packageSearch300;
  static const IconData website = LucideIcons.globe300;
  static const IconData hidden = LucideIcons.eyeOff300;

  // ── Forms ────────────────────────────────────────────────────────────────
  static const IconData email = LucideIcons.mail300;
  static const IconData password = LucideIcons.lock300;
  static const IconData phone = LucideIcons.phone300;
  static const IconData user = LucideIcons.user300;
  static const IconData show = LucideIcons.eye300;
  static const IconData hide = LucideIcons.eyeOff300;

  // ── Feedback ─────────────────────────────────────────────────────────────
  static const IconData error = LucideIcons.triangleAlert300;
  static const IconData info = LucideIcons.circleAlert300;
  static const IconData success = LucideIcons.circleCheck300;
  static const IconData offline = LucideIcons.wifiOff300;
  static const IconData empty = LucideIcons.inbox300;
  static const IconData imageUnavailable = LucideIcons.imageOff300;
  static const IconData comingSoon = LucideIcons.clapperboard300;
}
