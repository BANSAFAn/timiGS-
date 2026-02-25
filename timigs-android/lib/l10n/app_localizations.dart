import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_uk.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('de'),
    Locale('es'),
    Locale('fr'),
    Locale('uk'),
  ];

  String get appName;
  String get dashboard;
  String get timeline;
  String get analytics;
  String get tools;
  String get transfer;
  String get settings;
  String get activeNow;
  String get noActivity;
  String get todaySummary;
  String get totalTime;
  String get appsUsed;
  String get topApps;
  String get noData;
  String get selectDate;
  String get today;
  String get yesterday;
  String get noSessions;
  String get weeklyOverview;
  String get usageByApp;
  String get appearance;
  String get language;
  String get theme;
  String get dark;
  String get light;
  String get tracking;
  String get trackingActive;
  String get trackingPaused;
  String get dataManagement;
  String get exportData;
  String get about;
  String get version;
  String get permissionRequired;
  String get permissionMsg;
  String get grantPermission;
  String get weatherTitle;
  String get enterCity;
  String get humidity;
  String get wind;
  String get feelsLike;
  String get forecast;
  String get tomorrow;
  String get focusTitle;
  String get focusSelectApp;
  String get focusDuration;
  String get focusPassword;
  String get focusStart;
  String get focusCancel;
  String get focusActive;
  String get focusMessage;
  String get focusWrongPassword;
  String get timeoutTitle;
  String get timeoutWorkInterval;
  String get timeoutBreakDuration;
  String get timeoutPassword;
  String get timeoutStart;
  String get timeoutCancel;
  String get timeoutBreakTitle;
  String get timeoutBreakMessage;
  String get timeoutNextBreak;
  String get timeoutWorking;
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
      <String>['de', 'en', 'es', 'fr', 'uk'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return AppLocalizationsDe();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'uk':
      return AppLocalizationsUk();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
