/**
 * Rechtsgroessen — Rechtsstand 2025.
 *
 * REGEL: Jede Konstante traegt Jahr, Quelle und den Marker
 * `// vor Nutzung verifizieren`. Keine Rechtsgroesse darf ausserhalb dieser
 * Datei literal auftauchen. Die UI zeigt diesen Block unter "Rechtliche
 * Parameter" eingeklappt an; jeder Wert ist dort ueberschreibbar.
 *
 * Die Konstanten sind bewusst nach Rechtsstand gebuendelt, damit ein spaeterer
 * Jahrgang additiv ergaenzt werden kann, ohne den Rechenkern anzufassen.
 * Alle Rechenfunktionen nehmen `Rechtsgroessen` als Parameter — es gibt keinen
 * globalen Zugriff.
 */

import type { Euro, Quote, Satz } from './typen';

export interface EstTarifZone {
  readonly bis: Euro;
  readonly art: 'null' | 'progressiv' | 'linear';
  /** Progressionszone: (a * y + b) * y + c mit y = (zvE - basis) / 10000 */
  readonly a?: number;
  readonly b?: number;
  readonly c?: number;
  readonly basis?: Euro;
  /** Proportionalzone: satz * zvE - abzug */
  readonly satz?: Satz;
  readonly abzug?: Euro;
}

export interface Rechtsgroessen {
  readonly jahr: number;

  // --- Einkommensteuer -----------------------------------------------------
  readonly grundfreibetrag: Euro;
  readonly estTarif: readonly EstTarifZone[];
  readonly soliSatz: Satz;
  readonly soliFreigrenzeEinzel: Euro;
  readonly soliMilderungssatz: Satz;
  readonly kirchensteuersatz: Satz;
  readonly arbeitnehmerPauschbetrag: Euro;
  readonly sonderausgabenPauschbetrag: Euro;
  readonly kinderfreibetragJeKind: Euro;

  // --- Sozialversicherung --------------------------------------------------
  readonly bbgKvPv: Euro;
  readonly bbgRvAlv: Euro;
  readonly jaeg: Euro;
  readonly kvAllgemeinerSatz: Satz;
  readonly kvZusatzbeitragDurchschnitt: Satz;
  readonly pvSatz: Satz;
  readonly pvKinderlosZuschlag: Satz;
  readonly rvSatz: Satz;
  readonly alvSatz: Satz;
  readonly geringfuegigkeitsgrenzeMonat: Euro;
  readonly mindestbemessungsgrundlageFreiwilligKvMonat: Euro;

  // --- Umsatzsteuer --------------------------------------------------------
  readonly ustRegelsatz: Satz;
  readonly kleinunternehmerVorjahresgrenze: Euro;
  readonly kleinunternehmerLaufendesJahrGrenze: Euro;

  // --- Gewerbesteuer -------------------------------------------------------
  readonly gewerbesteuerFreibetrag: Euro;
  readonly gewerbesteuerMesszahl: Satz;
  readonly gewerbesteuerAnrechnungsfaktor: number;
  readonly gewerbesteuerHebesatzDefault: number;

  // --- Sonstiges -----------------------------------------------------------
  readonly uebungsleiterpauschale: Euro;
  readonly durchschnittsentgeltRv: Euro;
  readonly rentenwertProEntgeltpunktMonat: Euro;
}

/**
 * Rechtsstand 2025.
 *
 * Quellen sind je Feld angegeben. Saemtliche Werte sind vor produktiver
 * Nutzung gegen die Primaerquelle zu pruefen — das Tool ersetzt keine
 * Steuerberatung (siehe Fussbereich der Anwendung).
 */
export const RECHTSGROESSEN_2025: Rechtsgroessen = {
  jahr: 2025,

  // § 32a Abs. 1 EStG i. d. F. des Steuerfortentwicklungsgesetzes.
  // vor Nutzung verifizieren
  grundfreibetrag: 12_096,

  /**
   * Grundtarif 2025 nach § 32a Abs. 1 EStG.
   * Die Zonen sind stetig: Zone 2 endet bei 17.443 exakt auf 1.015,13 (= c der
   * Zone 3), Zone 3 endet bei 68.480 auf denselben Wert wie Zone 4. Diese
   * Stetigkeit ist als Test hinterlegt (einkommensteuer.test.ts).
   * vor Nutzung verifizieren
   */
  estTarif: [
    { bis: 12_096, art: 'null' },
    { bis: 17_443, art: 'progressiv', a: 932.3, b: 1_400, c: 0, basis: 12_096 },
    { bis: 68_480, art: 'progressiv', a: 176.64, b: 2_397, c: 1_015.13, basis: 17_443 },
    { bis: 277_825, art: 'linear', satz: 0.42, abzug: 10_911.92 },
    { bis: Number.POSITIVE_INFINITY, art: 'linear', satz: 0.45, abzug: 19_246.67 },
  ],

  // § 4 SolZG 1995. Freigrenze bezogen auf die Einkommensteuer, Einzelveranlagung.
  // Milderungszone: 11,9 % der Differenz zwischen ESt und Freigrenze.
  // vor Nutzung verifizieren
  soliSatz: 0.055,
  soliFreigrenzeEinzel: 19_950,
  soliMilderungssatz: 0.119,

  // Baden-Wuerttemberg: 8 % der Einkommensteuer. // vor Nutzung verifizieren
  kirchensteuersatz: 0.08,

  // § 9a Satz 1 Nr. 1a EStG. // vor Nutzung verifizieren
  arbeitnehmerPauschbetrag: 1_230,
  // § 10c EStG. // vor Nutzung verifizieren
  sonderausgabenPauschbetrag: 36,
  // § 32 Abs. 6 EStG, voller Jahresbetrag beider Elternteile. // vor Nutzung verifizieren
  kinderfreibetragJeKind: 9_600,

  // Sozialversicherungsrechengroessenverordnung 2025, bundeseinheitlich.
  // vor Nutzung verifizieren
  bbgKvPv: 66_150,
  bbgRvAlv: 96_600,
  jaeg: 73_800,

  // § 241 SGB V allgemeiner Beitragssatz; Zusatzbeitrag: rechnerischer
  // Durchschnitt 2025. Beide werden haelftig getragen.
  // vor Nutzung verifizieren
  kvAllgemeinerSatz: 0.146,
  kvZusatzbeitragDurchschnitt: 0.025,

  // § 55 SGB XI. Zuschlag fuer Kinderlose ab 23 Jahren traegt der Beschaeftigte
  // allein. Abschlaege ab dem zweiten Kind sind NICHT modelliert.
  // vor Nutzung verifizieren
  pvSatz: 0.036,
  pvKinderlosZuschlag: 0.006,

  // § 158 SGB VI / § 341 SGB III. // vor Nutzung verifizieren
  rvSatz: 0.186,
  alvSatz: 0.026,

  // § 8 Abs. 1a SGB IV, dynamisiert am Mindestlohn. // vor Nutzung verifizieren
  geringfuegigkeitsgrenzeMonat: 556,
  // § 240 Abs. 4 SGB V, 1/90 der monatlichen Bezugsgroesse.
  // vor Nutzung verifizieren
  mindestbemessungsgrundlageFreiwilligKvMonat: 1_248.33,

  // § 12 UStG. Schwimmunterricht ist nach EuGH v. 21.10.2021, C-373/19
  // (Dubrovin & Troeger) und BFH v. 16.12.2021, V R 31/21 NICHT nach
  // § 4 Nr. 21 UStG befreit. // vor Nutzung verifizieren
  ustRegelsatz: 0.19,
  // § 19 UStG in der ab 01.01.2025 geltenden Fassung: Vorjahresumsatz bis
  // 25.000 EUR und laufendes Jahr bis 100.000 EUR. Die 100.000-EUR-Grenze
  // wirkt unterjaehrig — ab Ueberschreiten sind Folgeumsaetze steuerpflichtig.
  // vor Nutzung verifizieren
  kleinunternehmerVorjahresgrenze: 25_000,
  kleinunternehmerLaufendesJahrGrenze: 100_000,

  // § 11 Abs. 1 Satz 3 Nr. 1 GewStG, § 11 Abs. 2 GewStG, § 35 EStG.
  // Der Anrechnungsfaktor 4,0 auf den Messbetrag neutralisiert die
  // Gewerbesteuer bis rund 400 % Hebesatz — ohne diese Anrechnung ueberzeichnet
  // das Modell die Belastung der Rechtsform "Gewerbe" erheblich.
  // Hebesatz Tettnang: // vor Nutzung verifizieren
  gewerbesteuerFreibetrag: 24_500,
  gewerbesteuerMesszahl: 0.035,
  gewerbesteuerAnrechnungsfaktor: 4.0,
  gewerbesteuerHebesatzDefault: 360,

  // § 3 Nr. 26 EStG. Setzt Taetigkeit im Dienst einer gemeinnuetzigen
  // Koerperschaft voraus — mit dem gewerblichen Modell unvereinbar.
  // vor Nutzung verifizieren
  uebungsleiterpauschale: 3_000,

  // Vorlaeufiges Durchschnittsentgelt (Anlage 1 SGB VI) und aktueller
  // Rentenwert ab 01.07.2025. // vor Nutzung verifizieren
  durchschnittsentgeltRv: 50_493,
  rentenwertProEntgeltpunktMonat: 40.79,
};

export const RECHTSSTAENDE: Readonly<Record<number, Rechtsgroessen>> = {
  2025: RECHTSGROESSEN_2025,
};

/** Liefert die Rechtsgroessen eines Jahrgangs; faellt auf 2025 zurueck. */
export function rechtsgroessenFuer(jahr: number): Rechtsgroessen {
  return RECHTSSTAENDE[jahr] ?? RECHTSGROESSEN_2025;
}

/**
 * Wendet nutzerseitige Ueberschreibungen auf einen Rechtsstand an.
 * Nur flache, numerische Felder sind ueberschreibbar — der Tarifverlauf nicht.
 */
export function mitUeberschreibungen(
  basis: Rechtsgroessen,
  ueberschreibungen: Partial<Record<string, number>>,
): Rechtsgroessen {
  const kopie: Record<string, unknown> = { ...basis };
  for (const [schluessel, wert] of Object.entries(ueberschreibungen)) {
    if (wert === undefined) continue;
    if (schluessel === 'estTarif' || !(schluessel in basis)) continue;
    kopie[schluessel] = wert;
  }
  return kopie as unknown as Rechtsgroessen;
}

/** Nicht-rechtliche Modellkonstanten mit Begruendung. */
export const MODELL_KONSTANTEN = {
  /** Freibadsaison: Mai bis September (Kalendermonate 5-9). */
  freibadMonate: [5, 6, 7, 8, 9] as readonly number[],
  /** Hallensaison: uebrige Monate. */
  hallenMonate: [1, 2, 3, 4, 10, 11, 12] as readonly number[],
  /** Wochen je Monat fuer die Umrechnung von Wochen- auf Monatswerte. */
  wochenProMonat: 52 / 12,
  /** Auslenkung der Sensitivitaetsanalyse. */
  sensitivitaetsAuslenkung: 0.2 as Quote,
  /** Schwelle Klumpenrisiko: Anteil eines Produkts am Deckungsbeitrag. */
  klumpenrisikoSchwelle: 0.6 as Quote,
  /** Stufen des Beschaeftigungsgrads fuer Break-even und Vergleich. */
  reduktionsstufen: [1.0, 0.8, 0.6, 0.5, 0.0] as readonly Quote[],
} as const;
