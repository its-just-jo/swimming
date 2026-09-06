/**
 * Herleitung jeder Kennzahl, Abschnitt 5 ("Jede Kennzahl per Klick aufklappbar
 * mit vollstaendigem Rechenweg und den verwendeten Annahmen").
 *
 * ARCHITEKTUR: Die Herleitung ist eine reine SICHT auf das Ergebnisobjekt.
 * Rechenfunktionen protokollieren nichts — sie liefern lediglich alle
 * Zwischenwerte im Ergebnistyp mit. Vorteil: keine String-Erzeugung im
 * heissen Pfad der Sensitivitaetsanalyse, und die Herleitung kann nicht vom
 * tatsaechlichen Rechenweg abweichen, weil sie dieselben Werte liest.
 */

import { euro, prozent, stunden, zahl } from './format';
import type { Herleitung, JahresErgebnis, Rechenschritt, Szenario } from './typen';

export type Kennzahl =
  | 'gesamtnetto'
  | 'differenz_baseline'
  | 'db_je_wasserstunde'
  | 'kapazitaetsauslastung'
  | 'wochenbelastung'
  | 'deckungsgrad'
  | 'netto_anstellung'
  | 'gewinn'
  | 'rentendifferenz';

function schritt(bezeichnung: string, formel: string, werte: string, ergebnis: string, quelle?: string): Rechenschritt {
  return quelle ? { bezeichnung, formel, werte, ergebnis, quelle } : { bezeichnung, formel, werte, ergebnis };
}

const ANNAHME_VEREINFACHUNG =
  'Vereinfachtes Steuermodell: Einzelveranlagung, keine volle Vorsorgeaufwendungen-Hoechstbetragsrechnung.';
const ANNAHME_RECHTSSTAND = 'Rechtsstand 2025 — vor Nutzung gegen die Primaerquelle pruefen.';

function herleiteGesamtnetto(jahr: JahresErgebnis): Herleitung {
  return {
    kennzahl: 'Gesamtnetto',
    schritte: [
      schritt(
        'Netto aus Anstellung',
        'Bruttolohn − Sozialversicherung − Einkommensteuer (ohne Gewinn/Lehre)',
        `${euro(jahr.anstellung.bruttoGesamt)} − ${euro(jahr.anstellung.sv.gesamtArbeitnehmer)} − ${euro(jahr.anstellung.steuer.gesamt)}`,
        euro(jahr.anstellung.netto),
      ),
      schritt(
        'Netto aus Selbststaendigkeit',
        'Gewinn vor Steuern − Gewerbesteuer (netto) − DRV-Beitrag − Mehrsteuer',
        `${euro(jahr.gewinn.gewinnVorSteuern)} − ${euro(jahr.gewinn.gewerbesteuer - jahr.gewinn.gewerbesteuerAnrechnung)} − ${euro(jahr.gewinn.drvBeitrag)} − ${euro(jahr.gewinn.zusaetzlicheEinkommensteuer)}`,
        euro(jahr.gewinn.nettoAusSelbstaendigkeit),
      ),
      schritt('Lehreinkuenfte', 'brutto, unversteuert — Steuerwirkung steckt in der Mehrsteuer oben', '', euro(jahr.lehreNetto)),
      schritt(
        'Gesamtnetto',
        'Netto Anstellung + Netto Selbststaendigkeit + Lehreinkuenfte',
        `${euro(jahr.anstellung.netto)} + ${euro(jahr.gewinn.nettoAusSelbstaendigkeit)} + ${euro(jahr.lehreNetto)}`,
        euro(jahr.gesamtnetto),
      ),
    ],
    annahmen: [ANNAHME_VEREINFACHUNG, ANNAHME_RECHTSSTAND],
  };
}

function herleiteDifferenzBaseline(jahr: JahresErgebnis): Herleitung {
  return {
    kennzahl: 'Luecke gegenueber der Vollzeit-Baseline',
    schritte: [
      schritt('Baseline-Netto', 'Vollzeit (100 %), keine Selbststaendigkeit, selbes Jahr', '', euro(jahr.baselineNetto)),
      schritt('Gesamtnetto im Szenario', 'siehe Herleitung "Gesamtnetto"', '', euro(jahr.gesamtnetto)),
      schritt(
        'Luecke',
        'Baseline-Netto − Gesamtnetto',
        `${euro(jahr.baselineNetto)} − ${euro(jahr.gesamtnetto)}`,
        euro(jahr.luecke),
      ),
    ],
    annahmen: ['Positive Luecke = Szenario liegt unter der Vollzeit-Baseline.'],
  };
}

function herleiteDbJeWasserstunde(jahr: JahresErgebnis): Herleitung {
  const dbSumme = jahr.gewinn.deckungsbeitragSumme;
  const stundenSumme = jahr.produkte.reduce((s, p) => s + p.wasserzeitGesamt, 0);
  return {
    kennzahl: 'Deckungsbeitrag je Wasserstunde',
    schritte: [
      schritt('Deckungsbeitragssumme', 'Summe ueber alle Produkte', '', euro(dbSumme)),
      schritt('Wasserzeit gesamt', 'Summe ueber alle Produkte (inkl. Fremdlehrkraft)', '', stunden(stundenSumme)),
      schritt(
        'Deckungsbeitrag je Wasserstunde',
        'Deckungsbeitragssumme / Wasserzeit gesamt',
        `${euro(dbSumme)} / ${stunden(stundenSumme)}`,
        stundenSumme > 0 ? euro(dbSumme / stundenSumme) : '—',
      ),
    ],
    annahmen: ['Durchschnittswert ueber alle aktiven Produkte — einzelne Produkte weichen ab.'],
  };
}

function herleiteKapazitaetsauslastung(jahr: JahresErgebnis): Herleitung {
  const k = jahr.kapazitaet;
  return {
    kennzahl: 'Kapazitaetsauslastung',
    schritte: [
      schritt('Verfuegbar Freibad', '', '', stunden(k.verfuegbarFreibad)),
      schritt('Verfuegbar Halle', '', '', stunden(k.verfuegbarHalle)),
      schritt('Benoetigt Freibad', 'aus den Produktergebnissen', '', stunden(k.benoetigtFreibad)),
      schritt('Benoetigt Halle', 'aus den Produktergebnissen', '', stunden(k.benoetigtHalle)),
      schritt(
        'Auslastung',
        'benoetigt / verfuegbar je Saison',
        `Freibad ${prozent(k.auslastungFreibad)}, Halle ${prozent(k.auslastungHalle)}`,
        k.ueberschreitung ? 'Kapazitaet ueberschritten' : 'im Rahmen der Kapazitaet',
      ),
    ],
    annahmen: [
      'Bei Ueberschreitung wird NICHT gedeckelt — der geplante Wert bleibt sichtbar, das ist Absicht.',
    ],
  };
}

function herleiteWochenbelastung(jahr: JahresErgebnis): Herleitung {
  const z = jahr.zeit;
  return {
    kennzahl: 'Wochenbelastung',
    schritte: [
      schritt('Hauptjob', 'Wochenstunden Vollzeit × Beschaeftigungsgrad', '', stunden(z.hauptjobStunden)),
      schritt('Eigene Wasserstunden', '', '', stunden(z.wasserstunden)),
      schritt('Vorbereitung', 'Wasserstunden × Vorbereitungsfaktor', '', stunden(z.vorbereitung)),
      schritt('Anfahrt', 'Termine je Woche × Anfahrtszeit je Termin', '', stunden(z.anfahrt)),
      schritt('Admin', 'Pauschale', '', stunden(z.admin)),
      schritt(
        'Summe pro Woche',
        'Hauptjob + Wasserstunden + Vorbereitung + Anfahrt + Admin',
        '',
        stunden(z.gesamtProWoche),
        z.ueberSchwelle ? 'ueber der Warnschwelle' : undefined,
      ),
    ],
    annahmen: ['Fremdlehrkraft-Stunden belasten dieses Budget nicht.'],
  };
}

function herleiteDeckungsgrad(jahr: JahresErgebnis): Herleitung {
  return {
    kennzahl: 'Deckungsgrad',
    schritte: [
      schritt('Gesamtnetto', '', '', euro(jahr.gesamtnetto)),
      schritt('Baseline-Netto', '', '', euro(jahr.baselineNetto)),
      schritt(
        'Deckungsgrad',
        'Gesamtnetto / Baseline-Netto',
        `${euro(jahr.gesamtnetto)} / ${euro(jahr.baselineNetto)}`,
        prozent(jahr.deckungsgrad),
      ),
    ],
    annahmen: ['100 % = Szenario erreicht exakt das Vollzeit-Baseline-Netto desselben Jahres.'],
  };
}

function herleiteNettoAnstellung(jahr: JahresErgebnis): Herleitung {
  const a = jahr.anstellung;
  return {
    kennzahl: 'Netto aus Anstellung',
    schritte: [
      schritt('Grundgehalt', '', '', euro(a.grundgehalt)),
      schritt('Bonus', `Faktor ${zahl(a.bonusFaktor, 2)}`, '', euro(a.bonus)),
      schritt('Brutto gesamt', 'Grundgehalt + Bonus', '', euro(a.bruttoGesamt)),
      schritt('Sozialversicherung Arbeitnehmer', 'KV + PV + RV + ALV', '', euro(a.sv.gesamtArbeitnehmer)),
      schritt(
        'Einkommensteuer + Soli + KiSt',
        `zvE ${euro(a.steuer.zvE)}, Grenzbelastung ${prozent(a.steuer.grenzbelastung)}`,
        '',
        euro(a.steuer.gesamt),
      ),
      schritt('Netto', 'Brutto − SV − Steuer', '', euro(a.netto)),
    ],
    annahmen: [ANNAHME_VEREINFACHUNG, 'Ohne Gewinn und Lehreinkuenfte — deren Mehrsteuer steckt im Gewinn-Block.'],
  };
}

function herleiteGewinn(jahr: JahresErgebnis): Herleitung {
  const g = jahr.gewinn;
  return {
    kennzahl: 'Gewinn der Selbststaendigkeit',
    schritte: [
      schritt('Deckungsbeitragssumme', '', '', euro(g.deckungsbeitragSumme)),
      schritt('− Fixkosten', '', '', euro(g.fixkosten)),
      schritt('− Investitionen', 'Sofortabzug im Jahr des Anfalls', '', euro(g.investitionen)),
      schritt('= Gewinn vor Steuern', 'nicht auf 0 begrenzt', '', euro(g.gewinnVorSteuern)),
      schritt('− Uebungsleiterfreibetrag', '', '', euro(g.uebungsleiterFreibetrag)),
      schritt('= Steuerpflichtiger Gewinn', '', '', euro(g.steuerpflichtigerGewinn)),
      schritt('DRV-Beitrag', '', '', euro(g.drvBeitrag)),
      schritt(
        'Mehrsteuer (ESt+Soli+KiSt)',
        'Veranlagung mit Gewinn − Veranlagung ohne Gewinn',
        '',
        euro(g.zusaetzlicheEinkommensteuer),
      ),
      schritt('Gewerbesteuer', `§ 35 EStG Anrechnung ${euro(g.gewerbesteuerAnrechnung)}`, '', euro(g.gewerbesteuer)),
      schritt('Nettobeitrag der Selbststaendigkeit', '', '', euro(g.nettoAusSelbstaendigkeit)),
    ],
    annahmen: [
      'Ein Verlust wird an keiner Stelle auf 0 begrenzt — er mindert ueber die gemeinsame Veranlagung die Steuer.',
    ],
  };
}

function herleiteRentendifferenz(jahr: JahresErgebnis): Herleitung {
  const r = jahr.rente;
  return {
    kennzahl: 'Rentendifferenz pro Monat',
    schritte: [
      schritt('Entgeltpunkte Anstellung', 'kumuliert bis zu diesem Jahr', '', zahl(r.entgeltpunkteAnstellung, 3)),
      schritt('Entgeltpunkte Selbststaendigkeit', 'DRV-Beitrag / (Durchschnittsentgelt × RV-Satz)', '', zahl(r.entgeltpunkteSelbstaendigkeit, 3)),
      schritt('Entgeltpunkte Baseline', 'Vollzeit, kumuliert', '', zahl(r.entgeltpunkteBaseline, 3)),
      schritt(
        'Differenz',
        '(EP Anstellung + EP Selbststaendigkeit) − EP Baseline',
        '',
        zahl(r.differenzEntgeltpunkte, 3),
      ),
      schritt('Rentendifferenz pro Monat', 'Differenz × aktueller Rentenwert', '', euro(r.rentendifferenzProMonat)),
    ],
    annahmen: [
      'Grob, aber sichtbar: keine Rentenwertdynamik, keine Zurechnungszeiten, keine Abschlaege, keine Rentenbesteuerung.',
    ],
  };
}

export function herleite(kennzahl: Kennzahl, szenario: Szenario, jahr: JahresErgebnis): Herleitung {
  void szenario;
  switch (kennzahl) {
    case 'gesamtnetto':
      return herleiteGesamtnetto(jahr);
    case 'differenz_baseline':
      return herleiteDifferenzBaseline(jahr);
    case 'db_je_wasserstunde':
      return herleiteDbJeWasserstunde(jahr);
    case 'kapazitaetsauslastung':
      return herleiteKapazitaetsauslastung(jahr);
    case 'wochenbelastung':
      return herleiteWochenbelastung(jahr);
    case 'deckungsgrad':
      return herleiteDeckungsgrad(jahr);
    case 'netto_anstellung':
      return herleiteNettoAnstellung(jahr);
    case 'gewinn':
      return herleiteGewinn(jahr);
    case 'rentendifferenz':
      return herleiteRentendifferenz(jahr);
  }
}
