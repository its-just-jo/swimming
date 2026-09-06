/**
 * Deklarative Feldkonfiguration fuer die Eingabeformulare.
 *
 * Kein Rechenkern-Code — reine UI-Praesentationsdaten (Label, Einheit,
 * Min/Max, Kurzhilfe, Herkunft), zusammen mit `FeldMeta` aus src/model/typen.ts.
 * Getrennt von den Formularkomponenten gehalten, damit jedes Feld an genau
 * einer Stelle beschrieben ist (AP 13: "Jedes Feld mit Label, Einheit,
 * Min/Max, Kurzhilfe und Auszeichnung als Schaetzwert oder Rechtsgroesse").
 */

import type { Herkunft } from '../model/typen';

export type FeldTyp = 'zahl' | 'prozent' | 'bool' | 'text' | 'select';

export interface Feldkonfiguration {
  readonly schluessel: string;
  readonly label: string;
  readonly einheit: string;
  readonly min: number;
  readonly max: number;
  readonly schritt: number;
  readonly hilfe: string;
  readonly herkunft: Herkunft;
  readonly typ: FeldTyp;
  readonly optionen?: readonly { readonly wert: string; readonly label: string }[];
}

function schaetz(
  schluessel: string,
  label: string,
  einheit: string,
  min: number,
  max: number,
  schritt: number,
  hilfe: string,
  typ: FeldTyp = 'zahl',
  optionen?: readonly { readonly wert: string; readonly label: string }[],
): Feldkonfiguration {
  return optionen
    ? { schluessel, label, einheit, min, max, schritt, hilfe, herkunft: 'schaetzwert', typ, optionen }
    : { schluessel, label, einheit, min, max, schritt, hilfe, herkunft: 'schaetzwert', typ };
}

function recht(
  schluessel: string,
  label: string,
  einheit: string,
  min: number,
  max: number,
  schritt: number,
  hilfe: string,
  typ: FeldTyp = 'zahl',
  optionen?: readonly { readonly wert: string; readonly label: string }[],
): Feldkonfiguration {
  return optionen
    ? { schluessel, label, einheit, min, max, schritt, hilfe, herkunft: 'rechtsgroesse', typ, optionen }
    : { schluessel, label, einheit, min, max, schritt, hilfe, herkunft: 'rechtsgroesse', typ };
}

export const ANSTELLUNG_FELDER: readonly Feldkonfiguration[] = [
  schaetz('bruttogrundgehaltVollzeit', 'Bruttogrundgehalt (Vollzeit)', '€/Jahr', 0, 300_000, 500, 'Jahresgrundgehalt bei 100 % Beschaeftigungsgrad, ohne Bonus.'),
  schaetz('bonusProJahr', 'Bonus pro Jahr', '€/Jahr', 0, 100_000, 250, 'Voller Bonus bei Vollzeit, siehe Bonusskalierung.'),
  schaetz('bonusSkalierung', 'Bonusskalierung', '', 0.1, 2, 0.05, '1,0 = proportionaler Abfall bei Teilzeit; darunter faellt der Bonus ueberproportional.'),
  schaetz('beschaeftigungsgrad', 'Beschaeftigungsgrad', '', 0, 1, 0.05, '1,0 = Vollzeit. UI bietet 1,0 / 0,8 / 0,6 / 0,5 / 0 als Stufen an, frei einstellbar.', 'prozent'),
  schaetz('gehaltssteigerungProJahr', 'Gehaltssteigerung pro Jahr', '', 0, 0.2, 0.005, 'Jaehrliche Fortschreibung von Grundgehalt und Bonus.', 'prozent'),
  recht('steuerklasse', 'Steuerklasse', '', 0, 0, 0, 'Nur informativ — das Modell rechnet stets die Einzelveranlagung.', 'select', [
    { wert: 'I', label: 'I' }, { wert: 'II', label: 'II' }, { wert: 'III', label: 'III' },
    { wert: 'IV', label: 'IV' }, { wert: 'V', label: 'V' }, { wert: 'VI', label: 'VI' },
  ]),
  schaetz('kirchensteuerpflichtig', 'Kirchensteuerpflichtig', '', 0, 1, 1, 'Bestimmt, ob Kirchensteuer auf die Einkommensteuer erhoben wird.', 'bool'),
  schaetz('kinderfreibetraege', 'Kinderfreibetraege', 'Anzahl', 0, 10, 1, 'Anzahl voller Kinderfreibetraege (beide Elternteile).'),
  schaetz('kinderlosZuschlagPflege', 'Kinderlosenzuschlag Pflege', '', 0, 1, 1, '§ 55 SGB XI, traegt der Beschaeftigte allein, ab 23 Jahren ohne Kinder.', 'bool'),
  recht('kvStatus', 'Krankenversicherungsstatus', '', 0, 0, 0, 'Entscheidet, wie Nebeneinkuenfte aus Selbststaendigkeit beitragsrechtlich behandelt werden.', 'select', [
    { wert: 'gkv_pflicht', label: 'GKV pflichtversichert' },
    { wert: 'gkv_freiwillig', label: 'GKV freiwillig versichert' },
    { wert: 'pkv', label: 'Privat versichert (PKV)' },
  ]),
  schaetz('pkvBeitragProMonat', 'PKV-Beitrag pro Monat', '€/Monat', 0, 3_000, 10, 'Nur relevant bei PKV-Status.'),
  schaetz('wochenstundenVollzeit', 'Wochenstunden Vollzeit', 'h/Woche', 20, 48, 1, 'Referenzstundenzahl fuer die Wochenbelastung.'),
];

export const WASSER_FELDER: readonly Feldkonfiguration[] = [
  schaetz('wasserstundenProWoche', 'Wasserstunden pro Woche', 'h/Woche', 0, 40, 0.5, 'Eigene Unterrichtsstunden im Wasser, ohne Vor-/Nachbereitung.'),
  schaetz('davonSamstag', 'davon Samstag', 'h/Woche', 0, 40, 0.5, 'Reines Datenfeld ohne Rechenwirkung — eigene Kennzahl "Wochenendbelastung" vorgeschlagen, aber offen (ARCHITEKTUR.md 1.7).'),
  schaetz('aktiveWochenFreibad', 'Aktive Wochen Freibad', 'Wochen/Jahr', 0, 26, 1, 'Anzahl Wochen mit Freibadbetrieb (Saison Mai–September).'),
  schaetz('aktiveWochenHalle', 'Aktive Wochen Halle', 'Wochen/Jahr', 0, 52, 1, 'Anzahl Wochen mit Hallenbadbetrieb.'),
  schaetz('hallenbadzugang', 'Hallenbadzugang vorhanden', '', 0, 1, 1, 'Ohne Zugang liefern Ganzjahres- und Hallenprodukte keinen Erloes.', 'bool'),
  schaetz('hallenbadAbMonat', 'Hallenbadzugang ab Monat', 'Monat', 0, 120, 1, 'Simulationsmonat, ab dem der Hallenbadzugang besteht (0 = von Anfang an).'),
  schaetz('ausfallquote', 'Ausfallquote', '', 0, 0.5, 0.01, 'Anteil ausfallender Termine, z. B. durch Krankheit oder Bad-Sperrung.', 'prozent'),
  schaetz('ausfallWirkung', 'Wirkung der Ausfallquote', '', 0, 0, 0, 'Standardmaessig mindert die Ausfallquote Kapazitaet UND Erloes.', 'select', [
    { wert: 'nur_kapazitaet', label: 'Nur Kapazitaet' },
    { wert: 'kapazitaet_und_erloes', label: 'Kapazitaet und Erloes' },
  ]),
  schaetz('vorbereitungsfaktor', 'Vorbereitungsfaktor', '', 0, 2, 0.05, '0,4 = 24 Minuten Vor-/Nachbereitung je Wasserstunde.'),
  schaetz('anfahrtJeTermin', 'Anfahrt je Termin', 'h', 0, 3, 0.05, 'Fahrzeit fuer einen einzelnen Kurstermin.'),
  schaetz('adminStundenProWoche', 'Admin-Stunden pro Woche', 'h/Woche', 0, 20, 0.5, 'Pauschale fuer Verwaltung, Abrechnung, Kommunikation.'),
];

export const STEUER_FELDER: readonly Feldkonfiguration[] = [
  schaetz('kleinunternehmer', 'Kleinunternehmerregelung nutzen', '', 0, 1, 1, '§ 19 UStG — wird bei Schwellenriss automatisch fuer die Folgejahre deaktiviert.', 'bool'),
  schaetz('umsatzsteuerpflichtig', 'Grundsaetzlich umsatzsteuerpflichtig', '', 0, 1, 1, 'Schwimmunterricht ist nach EuGH C-373/19 nicht nach § 4 Nr. 21 UStG befreit.', 'bool'),
  schaetz('preiseSindBrutto', 'Endkundenpreise sind brutto fixiert', '', 0, 1, 1, 'USt mindert dann den Erloes, statt aufgeschlagen zu werden.', 'bool'),
  schaetz('vorsteuerabzug', 'Vorsteuerabzug geltend machen', '', 0, 1, 1, 'Kommunale Beckenmiete wird haeufig ohne USt abgerechnet — Default daher aus.', 'bool'),
  schaetz('rechtsform', 'Rechtsform', '', 0, 0, 0, 'Unterrichtende Taetigkeit ist grundsaetzlich freiberuflich (§ 18 EStG); Fremdlehrkraefte koennen in die Gewerblichkeit fuehren.', 'select', [
    { wert: 'freiberuflich', label: 'Freiberuflich' },
    { wert: 'gewerbe', label: 'Gewerbe' },
  ]),
  recht('gewerbesteuerHebesatz', 'Gewerbesteuer-Hebesatz', '%', 0, 900, 5, 'Gemeindespezifisch — Platzhalter, bei der Gemeinde erfragen.'),
  schaetz('drvPflicht', 'Rentenversicherungspflicht (§ 2 SGB VI)', '', 0, 1, 1, 'Selbststaendige Lehrer sind grundsaetzlich rentenversicherungspflichtig.', 'bool'),
  schaetz('drvBefreiungExistenzgruender', 'Existenzgruenderbefreiung nutzen', '', 0, 1, 1, '§ 6 Abs. 1a SGB VI, befristet.', 'bool'),
  schaetz('drvBefreiungBisMonat', 'Befreiung bis Monat', 'Monat', 0, 60, 1, 'Ende der Existenzgruenderbefreiung (i. d. R. 36 Monate).'),
  schaetz('uebungsleiterpauschale', 'Uebungsleiterpauschale nutzen', '', 0, 1, 1, '§ 3 Nr. 26 EStG — mit eigenen Kursprodukten NICHT vereinbar (siehe Warnungen).', 'bool'),
];

export const LEHRE_FELDER: readonly Feldkonfiguration[] = [
  schaetz('lehrauftragAktiv', 'Lehrauftrag aktiv', '', 0, 1, 1, 'Selbststaendige Einkuenfte nach § 18 EStG, gemeinsam veranlagt.', 'bool'),
  schaetz('lvsJeSemester', 'LVS je Semester', 'LVS', 0, 20, 1, 'Lehrveranstaltungsstunden je Semester.'),
  schaetz('satzJeLvs', 'Satz je LVS', '€', 0, 200, 1, 'Honorar je Lehrveranstaltungsstunde.'),
  schaetz('startmonat', 'Startmonat', 'Monat', 0, 120, 1, 'Simulationsmonat, ab dem der Lehrauftrag beginnt.'),
  schaetz('professurAktiv', 'Professurpfad aktiv', '', 0, 1, 1, 'Ersetzt ab dem Startjahr die bisherige Anstellung vollstaendig.', 'bool'),
  schaetz('professurBruttoProJahr', 'Professur-Brutto pro Jahr', '€/Jahr', 0, 200_000, 500, ''),
  schaetz('professurBeschaeftigungsgrad', 'Professur-Beschaeftigungsgrad', '', 0, 1, 0.05, '', 'prozent'),
  schaetz('professurStartjahr', 'Professur-Startjahr', 'Jahr (Index)', 0, 20, 1, '0 = erstes Simulationsjahr.'),
];

export const SIMULATION_FELDER: readonly Feldkonfiguration[] = [
  schaetz('horizontJahre', 'Horizont', 'Jahre', 1, 20, 1, 'Anzahl der simulierten Jahre.'),
  schaetz('startdatum', 'Startdatum', '', 0, 0, 0, 'ISO-Datum, z. B. 2026-01-01. Steuerjahr bleibt das Kalenderjahr.', 'text'),
  schaetz('preissteigerungKurse', 'Preissteigerung Kurse', '', 0, 0.15, 0.005, 'Jaehrliche Steigerung der Kurspreise.', 'prozent'),
  schaetz('beckenmietsteigerung', 'Beckenmietsteigerung', '', 0, 0.15, 0.005, 'Jaehrliche Steigerung der Beckenmiete — separat gefuehrt, oft hoeher als die Preissteigerung.', 'prozent'),
  schaetz('inflation', 'Inflation', '', 0, 0.15, 0.005, 'Fuer die indexierten Fixkostenpositionen.', 'prozent'),
  schaetz('wochenbelastungWarnschwelle', 'Warnschwelle Wochenbelastung', 'h/Woche', 20, 80, 1, 'Ab dieser Wochenbelastung wird gewarnt.'),
  recht('rechtsstand', 'Rechtsstand', 'Jahr', 2025, 2025, 1, 'Aktuell nur 2025 hinterlegt.'),
];

export const PRODUKT_FELDER: readonly Feldkonfiguration[] = [
  schaetz('bezeichnung', 'Bezeichnung', '', 0, 0, 0, '', 'text'),
  schaetz('kategorie', 'Kategorie', '', 0, 0, 0, '', 'select', [
    { wert: 'Kinderkurs', label: 'Kinderkurs' }, { wert: 'Erwachsene', label: 'Erwachsene' },
    { wert: 'Aquafitness', label: 'Aquafitness' }, { wert: 'Intensivkurs', label: 'Intensivkurs' },
    { wert: 'BGM/Firma', label: 'BGM/Firma' },
  ]),
  schaetz('aktiv', 'Aktiv', '', 0, 1, 1, '', 'bool'),
  schaetz('abMonat', 'Ab Monat', 'Monat', 0, 120, 1, 'Simulationsmonat, ab dem das Produkt angeboten wird.'),
  schaetz('abrechnung', 'Abrechnung', '', 0, 0, 0, 'Bei Pauschale wirkt der Auslastungsgrad nicht auf den Erloes.', 'select', [
    { wert: 'je_teilnehmer', label: 'Je Teilnehmer' }, { wert: 'pauschale', label: 'Pauschale' },
  ]),
  schaetz('teilnehmerJeKurs', 'Teilnehmer je Kurs', 'Personen', 0, 40, 1, ''),
  schaetz('preisJeTeilnehmer', 'Preis je Teilnehmer', '€', 0, 2_000, 5, 'Bruttopreis fuer den gesamten Kurs.'),
  schaetz('pauschaleJeKurs', 'Pauschale je Kurs', '€', 0, 10_000, 50, 'Nur bei Abrechnung "Pauschale".'),
  schaetz('einheitenJeKurs', 'Einheiten je Kurs', 'Einheiten', 1, 30, 1, ''),
  schaetz('dauerJeEinheitMinuten', 'Dauer je Einheit', 'Minuten', 15, 180, 5, ''),
  schaetz('beckenflaeche', 'Beckenflaeche', 'Bahnen', 0.1, 5, 0.1, '1,0 = eine Bahn, wirkt als Faktor auf den Mietsatz.'),
  schaetz('beckenmieteJeStunde', 'Beckenmiete je Stunde', '€/h', 0, 300, 5, ''),
  schaetz('auslastungsgrad', 'Auslastungsgrad', '', 0, 1, 0.05, '', 'prozent'),
  schaetz('kurseParallelJeZyklus', 'Kurse parallel je Zyklus', 'Anzahl', 1, 5, 1, 'Erhoeht Erloes und Wasserzeit gleichermassen.'),
  schaetz('zyklenProJahr', 'Zyklen pro Jahr', 'Anzahl', 0, 20, 1, ''),
  schaetz('saison', 'Saison', '', 0, 0, 0, 'Ganzjahres- und Hallenprodukte brauchen Hallenbadzugang.', 'select', [
    { wert: 'freibad', label: 'Freibad' }, { wert: 'halle', label: 'Halle' }, { wert: 'ganzjahr', label: 'Ganzjahr' },
  ]),
  schaetz('zppFaehig', 'ZPP-faehig', '', 0, 1, 1, 'Zentrale Pruefstelle Praevention — ermoeglicht den ZPP-Preisaufschlag.', 'bool'),
  schaetz('zppPreisaufschlag', 'ZPP-Preisaufschlag', '€', 0, 200, 5, 'Nur wirksam, wenn ZPP-faehig aktiv ist.'),
  schaetz('durchfuehrung', 'Durchfuehrung', '', 0, 0, 0, 'Fremdlehrkraft-Stunden belasten das eigene Zeitbudget nicht.', 'select', [
    { wert: 'ich', label: 'Ich selbst' }, { wert: 'fremdlehrkraft', label: 'Fremdlehrkraft' },
  ]),
  schaetz('honorarFremdlehrkraftJeStunde', 'Honorar Fremdlehrkraft', '€/h', 0, 100, 1, 'Nur bei Durchfuehrung "Fremdlehrkraft".'),
];

export const FIXKOSTEN_FELDER: readonly Feldkonfiguration[] = [
  schaetz('bezeichnung', 'Bezeichnung', '', 0, 0, 0, '', 'text'),
  schaetz('betragProJahr', 'Betrag pro Jahr', '€/Jahr', 0, 50_000, 50, ''),
  schaetz('vorsteuerabzugsfaehig', 'Vorsteuerabzugsfaehig', '', 0, 1, 1, '', 'bool'),
  schaetz('indexiert', 'Mit Inflation indexiert', '', 0, 1, 1, '', 'bool'),
];

export const INVESTITION_FELDER: readonly Feldkonfiguration[] = [
  schaetz('bezeichnung', 'Bezeichnung', '', 0, 0, 0, '', 'text'),
  schaetz('betrag', 'Betrag', '€', 0, 50_000, 50, 'Sofortabzug im Monat des Anfalls.'),
  schaetz('monat', 'Monat', 'Monat', 0, 120, 1, 'Simulationsmonat, in dem die Investition anfaellt.'),
  schaetz('vorsteuerabzugsfaehig', 'Vorsteuerabzugsfaehig', '', 0, 1, 1, '', 'bool'),
];

export const FAHRTKOSTEN_FELDER: readonly Feldkonfiguration[] = [
  schaetz('kilometerProJahr', 'Kilometer pro Jahr', 'km', 0, 30_000, 100, ''),
  schaetz('satzJeKilometer', 'Satz je Kilometer', '€/km', 0, 1, 0.01, 'Kilometerpauschale.'),
];
