/**
 * Datenmodell des Szenario-Rechners.
 *
 * Grundsatz: Dieses Modul enthaelt ausschliesslich Typen und keine Logik.
 * Ein `Szenario` ist der vollstaendige, serialisierbare Eingabezustand — alles,
 * was in localStorage bzw. in den JSON-Export wandert. Ein `Ergebnis` ist das
 * vollstaendige Rechenergebnis inklusive aller Zwischenwerte.
 *
 * WICHTIG (Herleitungs-Architektur): Ergebnisobjekte tragen jeden Zwischenwert,
 * den die UI zur Erklaerung braucht. Die Herleitung ist damit eine reine Sicht
 * auf das Ergebnisobjekt und keine Instrumentierung des Rechenwegs. Das haelt
 * die Rechenkernfunktionen frei von String-Aufbau — entscheidend, weil die
 * Sensitivitaetsanalyse das komplette Modell rund 30-mal je Interaktion faehrt.
 */

// ---------------------------------------------------------------------------
// Hilfstypen
// ---------------------------------------------------------------------------

/** Betrag in Euro. Immer Netto oder Brutto laut Feldname, nie implizit. */
export type Euro = number;
/** Anteil als Dezimalzahl: 0,08 = 8 %. Niemals 8 fuer 8 %. */
export type Quote = number;
/** Prozentsatz als Dezimalzahl, identisch zu Quote — semantisch fuer Steuersaetze. */
export type Satz = number;
/** Stunden. */
export type Stunden = number;
/** Monat 0 = Startmonat der Simulation. */
export type MonatsIndex = number;
/** UUID eines Szenarios oder einer Tabellenzeile. */
export type Id = string;

/** Kennzeichnet die Herkunft einer Variablen — steuert die UI-Auszeichnung. */
export type Herkunft = 'schaetzwert' | 'rechtsgroesse';

/** Metadaten je Eingabefeld. Wird von der UI zur Beschriftung genutzt. */
export interface FeldMeta {
  readonly label: string;
  readonly einheit: string;
  readonly min: number;
  readonly max: number;
  readonly schritt: number;
  readonly hilfe: string;
  readonly herkunft: Herkunft;
  /** Nur bei Rechtsgroessen: Quelle und Stand. */
  readonly quelle?: string;
  readonly stand?: number;
}

// ---------------------------------------------------------------------------
// 3.1 Anstellung
// ---------------------------------------------------------------------------

export type Steuerklasse = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

/**
 * Krankenversicherungsstatus.
 *
 * Diese Unterscheidung entscheidet ueber die gesamte KV-Logik:
 *
 * - `gkv_pflicht`: Beitrag nur auf Arbeitsentgelt bis zur BBG. Selbststaendige
 *   Nebeneinkuenfte sind beitragsfrei, SOLANGE die Selbststaendigkeit nicht
 *   hauptberuflich wird (§ 5 Abs. 5 SGB V). Nicht die BBG ist hier die Kante,
 *   sondern die Hauptberuflichkeit.
 * - `gkv_freiwillig`: Beitrag auf ALLE Einkuenfte bis zur BBG. Hier ist die in
 *   der Spezifikation beschriebene BBG-Kante wirksam: Nebeneinkuenfte sind
 *   genau so lange beitragsfrei, wie der Lohn die BBG allein ausschoepft.
 * - `pkv`: einkommensunabhaengiger Festbeitrag, Arbeitgeberzuschuss haelftig
 *   und gedeckelt auf den halben GKV-Hoechstbeitrag.
 */
export type KvStatus = 'gkv_pflicht' | 'gkv_freiwillig' | 'pkv';

export interface Anstellung {
  readonly bruttogrundgehaltVollzeit: Euro;
  readonly bonusProJahr: Euro;
  /**
   * Skalierung des Bonus bei Teilzeit.
   * Formel: bonusFaktor = max(0, 1 - (1 - beschaeftigungsgrad) / skalierung)
   * 1,0 = proportional; 0,8 = jeder Prozentpunkt Reduktion kostet 1,25
   * Prozentpunkte Bonus. Bei beschaeftigungsgrad = 1 immer voller Bonus.
   */
  readonly bonusSkalierung: number;
  /** 1,0 = Vollzeit. Frei einstellbar, UI bietet 1,0 / 0,8 / 0,6 / 0,5 / 0 an. */
  readonly beschaeftigungsgrad: Quote;
  readonly gehaltssteigerungProJahr: Quote;
  readonly steuerklasse: Steuerklasse;
  readonly kirchensteuerpflichtig: boolean;
  readonly kinderfreibetraege: number;
  readonly kinderlosZuschlagPflege: boolean;
  readonly kvStatus: KvStatus;
  /** Nur bei kvStatus === 'pkv' relevant. */
  readonly pkvBeitragProMonat: Euro;
  readonly wochenstundenVollzeit: Stunden;
}

// ---------------------------------------------------------------------------
// 3.2 Wasserkapazitaet
// ---------------------------------------------------------------------------

export type Saison = 'freibad' | 'halle';

/** Wirkung der Ausfallquote — siehe ARCHITEKTUR.md, Abschnitt "Ausfallquote". */
export type AusfallWirkung = 'nur_kapazitaet' | 'kapazitaet_und_erloes';

export interface Wasserkapazitaet {
  readonly wasserstundenProWoche: Stunden;
  readonly davonSamstag: Stunden;
  readonly aktiveWochenFreibad: number;
  readonly aktiveWochenHalle: number;
  readonly hallenbadzugang: boolean;
  /** Monat ab Simulationsstart, ab dem der Hallenbadzugang besteht. */
  readonly hallenbadAbMonat: MonatsIndex;
  readonly ausfallquote: Quote;
  readonly ausfallWirkung: AusfallWirkung;
  /** Vor-/Nachbereitung je Wasserstunde als Faktor, 0,4 = 24 min je Stunde. */
  readonly vorbereitungsfaktor: number;
  readonly anfahrtJeTermin: Stunden;
  readonly adminStundenProWoche: Stunden;
}

// ---------------------------------------------------------------------------
// 3.3 Kursprodukte
// ---------------------------------------------------------------------------

export type Kategorie =
  | 'Kinderkurs'
  | 'Erwachsene'
  | 'Aquafitness'
  | 'Intensivkurs'
  | 'BGM/Firma';

/** Abrechnungsart. Bei 'pauschale' wirkt der Auslastungsgrad NICHT auf den Erloes. */
export type Abrechnung = 'je_teilnehmer' | 'pauschale';

export type Durchfuehrung = 'ich' | 'fremdlehrkraft';

export interface Kursprodukt {
  readonly id: Id;
  readonly bezeichnung: string;
  readonly kategorie: Kategorie;
  readonly aktiv: boolean;
  /** Monat ab Simulationsstart, ab dem das Produkt angeboten wird. */
  readonly abMonat: MonatsIndex;

  readonly abrechnung: Abrechnung;
  readonly teilnehmerJeKurs: number;
  /** Bruttopreis je Teilnehmer fuer den GESAMTEN Kurs (nicht je Einheit). */
  readonly preisJeTeilnehmer: Euro;
  /** Bruttopauschale je Kurs. Nur bei abrechnung === 'pauschale'. */
  readonly pauschaleJeKurs: Euro;

  readonly einheitenJeKurs: number;
  readonly dauerJeEinheitMinuten: number;
  /** Benoetigte Beckenflaeche als Faktor auf den Mietsatz. 1,0 = eine Bahn. */
  readonly beckenflaeche: number;
  readonly beckenmieteJeStunde: Euro;
  readonly auslastungsgrad: Quote;
  readonly kurseParallelJeZyklus: number;
  readonly zyklenProJahr: number;

  readonly saison: Saison | 'ganzjahr';

  readonly zppFaehig: boolean;
  /** Aufschlag auf den Bruttopreis, nur wirksam wenn zppFaehig. */
  readonly zppPreisaufschlag: Euro;

  readonly durchfuehrung: Durchfuehrung;
  readonly honorarFremdlehrkraftJeStunde: Euro;
}

// ---------------------------------------------------------------------------
// 3.4 / 3.5 Kosten
// ---------------------------------------------------------------------------

export interface Fixkostenposition {
  readonly id: Id;
  readonly bezeichnung: string;
  readonly betragProJahr: Euro;
  /** true = Bruttobetrag enthaelt abziehbare Vorsteuer. */
  readonly vorsteuerabzugsfaehig: boolean;
  readonly indexiert: boolean;
}

export interface Fahrtkosten {
  readonly kilometerProJahr: number;
  readonly satzJeKilometer: Euro;
}

export interface Einmalinvestition {
  readonly id: Id;
  readonly bezeichnung: string;
  readonly betrag: Euro;
  readonly monat: MonatsIndex;
  readonly vorsteuerabzugsfaehig: boolean;
}

// ---------------------------------------------------------------------------
// 3.6 Steuer- und Sozialversicherungsschalter
// ---------------------------------------------------------------------------

export type Rechtsform = 'freiberuflich' | 'gewerbe';

export interface SteuerSchalter {
  /** § 19 UStG. Wird bei Schwellenriss automatisch deaktiviert. */
  readonly kleinunternehmer: boolean;
  /** § 4 Nr. 21 UStG greift laut EuGH C-373/19 NICHT fuer Schwimmunterricht. */
  readonly umsatzsteuerpflichtig: boolean;
  /** Endkundenpreise sind brutto fixiert -> USt mindert den Erloes. */
  readonly preiseSindBrutto: boolean;
  /** Vorsteuerabzug auf Kostenpositionen tatsaechlich geltend machen. */
  readonly vorsteuerabzug: boolean;

  readonly rechtsform: Rechtsform;
  readonly gewerbesteuerHebesatz: number;

  /** § 2 Satz 1 Nr. 1 SGB VI — selbststaendige Lehrer sind rentenversicherungspflichtig. */
  readonly drvPflicht: boolean;
  /** § 6 Abs. 1a SGB VI, Existenzgruender, drei Jahre. */
  readonly drvBefreiungExistenzgruender: boolean;
  readonly drvBefreiungBisMonat: MonatsIndex;

  /** § 3 Nr. 26 EStG. Schliesst das gewerbliche Modell aus — erzeugt Warnung. */
  readonly uebungsleiterpauschale: boolean;
}

// ---------------------------------------------------------------------------
// 3.7 Lehre
// ---------------------------------------------------------------------------

export interface Lehre {
  readonly lehrauftragAktiv: boolean;
  readonly lvsJeSemester: number;
  readonly satzJeLvs: Euro;
  readonly startmonat: MonatsIndex;

  readonly professurAktiv: boolean;
  readonly professurBruttoProJahr: Euro;
  readonly professurBeschaeftigungsgrad: Quote;
  readonly professurStartjahr: number;
}

// ---------------------------------------------------------------------------
// 3.8 Simulationsparameter
// ---------------------------------------------------------------------------

export interface Simulationsparameter {
  readonly horizontJahre: number;
  /** ISO-Datum, z. B. '2026-01-01'. */
  readonly startdatum: string;
  readonly preissteigerungKurse: Quote;
  readonly beckenmietsteigerung: Quote;
  readonly inflation: Quote;
  readonly wochenbelastungWarnschwelle: Stunden;
  /** Rechtsstand der Konstanten. Erlaubt spaetere Jahrgaenge ohne Codeaenderung. */
  readonly rechtsstand: number;
}

// ---------------------------------------------------------------------------
// Szenario
// ---------------------------------------------------------------------------

/** Nutzerseitige Ueberschreibungen der Rechtsgroessen. Leer = Defaults gelten. */
export type RechtlicheUeberschreibungen = Partial<Record<string, number>>;

export interface Szenario {
  readonly id: Id;
  readonly name: string;
  readonly erstelltAm: string;
  readonly geaendertAm: string;

  readonly anstellung: Anstellung;
  readonly wasser: Wasserkapazitaet;
  readonly produkte: readonly Kursprodukt[];
  readonly fixkosten: readonly Fixkostenposition[];
  readonly fahrtkosten: Fahrtkosten;
  readonly investitionen: readonly Einmalinvestition[];
  readonly steuer: SteuerSchalter;
  readonly lehre: Lehre;
  readonly simulation: Simulationsparameter;
  readonly rechtlicheUeberschreibungen: RechtlicheUeberschreibungen;
}

// ---------------------------------------------------------------------------
// Ergebnistypen
// ---------------------------------------------------------------------------

export interface EinkommensteuerErgebnis {
  readonly zvE: Euro;
  readonly einkommensteuer: Euro;
  readonly solidaritaetszuschlag: Euro;
  readonly kirchensteuer: Euro;
  readonly gesamt: Euro;
  /** Belastung des naechsten Euro, inkl. Soli und KiSt. */
  readonly grenzbelastung: Satz;
  readonly durchschnittsbelastung: Satz;
  readonly zone: 1 | 2 | 3 | 4 | 5;
}

export interface SozialversicherungErgebnis {
  readonly kvArbeitnehmer: Euro;
  readonly pvArbeitnehmer: Euro;
  readonly rvArbeitnehmer: Euro;
  readonly alvArbeitnehmer: Euro;
  readonly gesamtArbeitnehmer: Euro;
  /** Beitrag auf selbststaendige Einkuenfte — nur bei gkv_freiwillig > 0. */
  readonly kvAufSelbstaendigkeit: Euro;
  readonly beitragsbemessungsgrenzeErreicht: boolean;
  readonly ueberJaeg: boolean;
  readonly pkvArbeitgeberzuschuss: Euro;
}

export interface AnstellungErgebnis {
  readonly grundgehalt: Euro;
  readonly bonus: Euro;
  readonly bonusFaktor: number;
  readonly bruttoGesamt: Euro;
  readonly sv: SozialversicherungErgebnis;
  readonly steuer: EinkommensteuerErgebnis;
  readonly netto: Euro;
}

export interface ProduktErgebnis {
  readonly produktId: Id;
  readonly bezeichnung: string;
  readonly erloesBrutto: Euro;
  readonly umsatzsteuer: Euro;
  readonly erloesNetto: Euro;
  readonly wasserzeitJeKurs: Stunden;
  readonly wasserzeitGesamt: Stunden;
  readonly miete: Euro;
  readonly honorar: Euro;
  readonly deckungsbeitrag: Euro;
  readonly deckungsbeitragJeWasserstunde: Euro;
  readonly anzahlKurseProJahr: number;
  readonly durchfuehrung: Durchfuehrung;
  readonly saison: Saison | 'ganzjahr';
}

export interface KapazitaetErgebnis {
  readonly verfuegbarFreibad: Stunden;
  readonly verfuegbarHalle: Stunden;
  readonly verfuegbarGesamt: Stunden;
  readonly benoetigtFreibad: Stunden;
  readonly benoetigtHalle: Stunden;
  readonly benoetigtGesamt: Stunden;
  /** Stunden, die von Fremdlehrkraeften getragen werden. */
  readonly benoetigtFremd: Stunden;
  readonly auslastungFreibad: Quote;
  readonly auslastungHalle: Quote;
  readonly ueberschreitung: boolean;
}

export interface ZeitbudgetErgebnis {
  readonly hauptjobStunden: Stunden;
  readonly wasserstunden: Stunden;
  readonly vorbereitung: Stunden;
  readonly anfahrt: Stunden;
  readonly admin: Stunden;
  readonly gesamtProWoche: Stunden;
  readonly ueberSchwelle: boolean;
}

export interface GewinnErgebnis {
  readonly deckungsbeitragSumme: Euro;
  readonly fixkosten: Euro;
  readonly investitionen: Euro;
  readonly gewinnVorSteuern: Euro;
  readonly uebungsleiterFreibetrag: Euro;
  readonly steuerpflichtigerGewinn: Euro;
  readonly gewerbesteuer: Euro;
  readonly gewerbesteuerAnrechnung: Euro;
  readonly drvBeitrag: Euro;
  /** Zusaetzliche ESt+Soli+KiSt allein wegen der Selbststaendigkeit. */
  readonly zusaetzlicheEinkommensteuer: Euro;
  readonly nettoAusSelbstaendigkeit: Euro;
}

export interface RenteErgebnis {
  readonly entgeltpunkteAnstellung: number;
  readonly entgeltpunkteSelbstaendigkeit: number;
  readonly entgeltpunkteBaseline: number;
  readonly differenzEntgeltpunkte: number;
  readonly rentendifferenzProMonat: Euro;
}

export interface JahresErgebnis {
  readonly jahr: number;
  readonly kalenderjahr: number;
  readonly anstellung: AnstellungErgebnis;
  readonly produkte: readonly ProduktErgebnis[];
  readonly kapazitaet: KapazitaetErgebnis;
  readonly zeit: ZeitbudgetErgebnis;
  readonly gewinn: GewinnErgebnis;
  readonly lehreNetto: Euro;
  readonly rente: RenteErgebnis;
  readonly umsatzBrutto: Euro;
  readonly kleinunternehmerAktiv: boolean;
  readonly gesamtnetto: Euro;
  /** Gesamtnetto der Vollzeit-Baseline im selben Jahr. */
  readonly baselineNetto: Euro;
  readonly luecke: Euro;
  readonly deckungsgrad: Quote;
}

export interface MonatsErgebnis {
  readonly monat: MonatsIndex;
  readonly kalenderjahr: number;
  readonly kalendermonat: number;
  readonly einnahmen: Euro;
  readonly beckenmiete: Euro;
  readonly honorare: Euro;
  readonly fixkosten: Euro;
  readonly investitionen: Euro;
  readonly steuernUndAbgaben: Euro;
  readonly cashflow: Euro;
  readonly kumuliert: Euro;
}

export type WarnStufe = 'hinweis' | 'grenzwert' | 'kritisch';

export type WarnCode =
  | 'kapazitaet_ueberschritten'
  | 'ust_schwelle_gerissen'
  | 'bbg_unterschritten'
  | 'kein_hallenbad_ganzjahresumsatz'
  | 'wochenbelastung_ueber_schwelle'
  | 'deckungsgrad_unter_100'
  | 'klumpenrisiko_produkt'
  | 'hauptberuflich_selbstaendig'
  | 'uebungsleiter_unvereinbar'
  | 'jaeg_ueberschritten'
  | 'rechtsgroessen_ungeprueft';

export interface Warnung {
  readonly code: WarnCode;
  readonly stufe: WarnStufe;
  readonly titel: string;
  readonly text: string;
  /** Betroffenes Jahr, falls jahresbezogen. */
  readonly jahr?: number;
  /** Sprungziel in der Eingabespalte. */
  readonly ankerAbschnitt?: string;
}

export interface Ergebnis {
  readonly szenarioId: Id;
  readonly jahre: readonly JahresErgebnis[];
  readonly monate: readonly MonatsErgebnis[];
  readonly warnungen: readonly Warnung[];
}

// ---------------------------------------------------------------------------
// Sensitivitaet und Break-even
// ---------------------------------------------------------------------------

export type SensitivitaetsVariable =
  | 'auslastungsgrad'
  | 'preisJeTeilnehmer'
  | 'beckenmieteJeStunde'
  | 'wasserstundenProWoche'
  | 'ausfallquote'
  | 'aktiveWochenHalle'
  | 'fixkosten'
  | 'bonusSkalierung'
  | 'gehaltssteigerungProJahr'
  | 'preissteigerungKurse'
  | 'beckenmietsteigerung'
  | 'honorarFremdlehrkraftJeStunde';

export interface SensitivitaetsZeile {
  readonly variable: SensitivitaetsVariable;
  readonly label: string;
  readonly basiswert: Euro;
  readonly bei_minus20: Euro;
  readonly bei_plus20: Euro;
  readonly spannweite: Euro;
}

export interface BreakEvenPunkt {
  readonly beschaeftigungsgrad: Quote;
  readonly luecke: Euro;
  readonly deckungsbeitragJeWasserstunde: Euro;
  readonly benoetigteWasserstundenProWoche: Stunden;
  readonly benoetigteKurseProWoche: number;
  readonly imZeitbudget: boolean;
}

// ---------------------------------------------------------------------------
// Herleitung
// ---------------------------------------------------------------------------

export interface Rechenschritt {
  readonly bezeichnung: string;
  readonly formel: string;
  readonly werte: string;
  readonly ergebnis: string;
  readonly quelle?: string;
}

export interface Herleitung {
  readonly kennzahl: string;
  readonly schritte: readonly Rechenschritt[];
  readonly annahmen: readonly string[];
}

// ---------------------------------------------------------------------------
// Persistenz
// ---------------------------------------------------------------------------

export interface SzenarioIndexEintrag {
  readonly id: Id;
  readonly name: string;
  readonly geaendertAm: string;
}

export interface AppEinstellungen {
  readonly aktivesSzenario: Id | null;
  readonly vergleichsSzenarien: readonly Id[];
  readonly aufgeklappteAbschnitte: readonly string[];
}

export type SpeicherModus = 'localstorage' | 'nur_speicher';
