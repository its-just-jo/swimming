/**
 * Zielsolver, design.md Abschnitt 4: "Der Nutzer bringt ein Ziel mit, nicht
 * 78 Parameter." Loest rueckwaerts auf: welche Kursmenge schliesst die
 * Luecke, gegeben eine Zielart und die Leitplanken.
 *
 * VEREINFACHUNG GEGENUEBER 4.2: Die Spezifikation beschreibt eine stetige
 * Bisektion ueber einen Mengenfaktor `m` mit Monotoniepruefung und Ruecksturz
 * auf einen 60-Stuetzstellen-Rasterlauf, danach eine ganzzahlige Auffuellung.
 * Diese Implementierung geht direkt zur ganzzahligen Auffuellung ueber: sie
 * startet bei den aktuellen Zyklen und erhoeht in Runden das Produkt mit dem
 * hoechsten Deckungsbeitrag je Wasserstunde, wobei nach JEDER Erhoehung das
 * Jahr vollstaendig neu gerechnet wird (keine Naeherung).
 *
 * Eine einzelne +1-Erhoehung kann durch einen Schwelleneffekt (z. B. das
 * Reissen der USt-Grenze) kurzfristig schlechter aussehen, obwohl ein
 * groesserer Sprung denselben Schwellenwert ueberspringt und danach klar
 * besser abschneidet — das ist genau der Fall, fuer den die Spezifikation
 * die Monotoniepruefung samt Rasterlauf vorsieht. Statt dessen probiert
 * `bestenSprungFinden` je Produkt eine verdoppelnde Folge von Sprunggroessen
 * (1, 2, 4, … bis zum verbleibenden Spielraum) und uebernimmt den KLEINSTEN
 * Sprung, der weder eine Leitplanke verletzt noch das Ergebnis verschlechtert.
 * Das faengt denselben Effekt ab wie die stetige Zwischenrechnung, ohne sie
 * zu benoetigen. Berichtet wird ausschliesslich der letzte, vollstaendig
 * durchgerechnete Kandidat — wie in Schritt 4 "Nachrechnung" gefordert.
 *
 * `samstagsstundenMax` wird NICHT durchgesetzt: `davonSamstag` hat im Modell
 * keine Rechenwirkung (ARCHITEKTUR.md 1.7), Kursprodukte kennen keinen
 * Wochentag. Es gibt daher nichts, gegen das der Solver diese Grenze pruefen
 * koennte.
 */

import { berechneJahr } from './simulation';
import { berechneSensitivitaet } from './sensitivitaet';
import type {
  BindendeBeschraenkung,
  JahresErgebnis,
  Kursprodukt,
  Leitplanken,
  Quote,
  Szenario,
  ZielEingabe,
  ZielErgebnis,
  ZielHebel,
  ZielStatus,
  ZielZyklenAenderung,
} from './typen';

const REDUKTIONSSTUFEN = [1.0, 0.8, 0.6, 0.5, 0.0] as const;
const MAX_SCHRITTE = 500;
/** Ab dieser Auslastung einer bindenden Leitplanke gilt ein Erfolg als "knapp". */
const KNAPP_SCHWELLE = 0.95;

interface Auswertung {
  readonly jahr: JahresErgebnis;
  readonly wasserstundenAuslastung: Quote;
  readonly wochenbelastungAuslastung: Quote;
  readonly ueberKapazitaet: boolean;
  readonly ueberWasserstundenProWoche: boolean;
  readonly ueberWochenbelastung: boolean;
}

function auswerten(szenario: Szenario, jahrIndex: number, leitplanken: Leitplanken): Auswertung {
  const jahr = berechneJahr(szenario, jahrIndex);
  const wasserstundenAuslastung =
    leitplanken.wasserstundenProWocheMax > 0 ? jahr.zeit.wasserstunden / leitplanken.wasserstundenProWocheMax : 0;
  const wochenbelastungAuslastung =
    leitplanken.wochenbelastungMax > 0 ? jahr.zeit.gesamtProWoche / leitplanken.wochenbelastungMax : 0;
  return {
    jahr,
    wasserstundenAuslastung,
    wochenbelastungAuslastung,
    ueberKapazitaet: jahr.kapazitaet.ueberschreitung,
    ueberWasserstundenProWoche: jahr.zeit.wasserstunden > leitplanken.wasserstundenProWocheMax,
    ueberWochenbelastung: jahr.zeit.gesamtProWoche > leitplanken.wochenbelastungMax,
  };
}

function bindendeBeschraenkungVon(a: Auswertung): BindendeBeschraenkung {
  if (a.ueberKapazitaet || a.ueberWasserstundenProWoche) return 'kapazitaet';
  if (a.ueberWochenbelastung) return 'wochenbelastung';
  return null;
}

/** Wendet die Zielstufe und die 'aus'-Rolle an — Ausgangspunkt jeder Loesung. */
function bereiteSzenarioVor(szenario: Szenario, beschaeftigungsgrad: Quote): Szenario {
  return {
    ...szenario,
    anstellung: { ...szenario.anstellung, beschaeftigungsgrad },
    produkte: szenario.produkte.map((p) => (p.solverRolle === 'aus' ? { ...p, aktiv: false } : p)),
  };
}

interface LoesungFuerJahr {
  readonly erreicht: boolean;
  readonly szenario: Szenario;
  readonly auswertung: Auswertung;
  readonly bindendeBeschraenkung: BindendeBeschraenkung;
}

/**
 * Ganzzahlige Auffuellung fuer EIN Jahr: erhoeht variable Produkte
 * zyklusweise, priorisiert nach Deckungsbeitrag je Wasserstunde, bis
 * `zielErreicht` zutrifft oder eine Leitplanke bindet.
 */
function loeseGanzzahligFuerJahr(
  szenarioVorbereitet: Szenario,
  jahrIndex: number,
  zielErreicht: (jahr: JahresErgebnis) => boolean,
  leitplanken: Leitplanken,
): LoesungFuerJahr {
  let aktuellesSzenario = szenarioVorbereitet;
  let aktuelleAuswertung = auswerten(aktuellesSzenario, jahrIndex, leitplanken);

  // Verletzt schon der Ausgangspunkt (ohne jede Erhoehung) eine Leitplanke,
  // ist das kein gueltiger Vorschlag — der Solver kann nur erhoehen, nicht
  // reduzieren, und darf eine gebrochene harte Grenze nicht als Erfolg melden.
  const startBeschraenkung = bindendeBeschraenkungVon(aktuelleAuswertung);
  if (startBeschraenkung) {
    return { erreicht: false, szenario: aktuellesSzenario, auswertung: aktuelleAuswertung, bindendeBeschraenkung: startBeschraenkung };
  }

  if (zielErreicht(aktuelleAuswertung.jahr)) {
    return { erreicht: true, szenario: aktuellesSzenario, auswertung: aktuelleAuswertung, bindendeBeschraenkung: null };
  }

  let schritte = 0;
  let bindendeBeschraenkung: BindendeBeschraenkung = null;

  // Runden statt eines einzigen Durchlaufs: eine Erhoehung, die JETZT durch
  // einen Schwelleneffekt unwirtschaftlich aussieht, kann es nach einer
  // spaeteren Erhoehung eines ANDEREN Produkts nicht mehr sein. Eine Runde
  // probiert jedes noch infrage kommende Produkt genau einmal (mit frisch
  // berechneter Prioritaet); abgebrochen wird erst, wenn eine ganze Runde
  // keinen Fortschritt bringt.
  let fortschritt = true;
  while (fortschritt && schritte < MAX_SCHRITTE) {
    fortschritt = false;

    const dbJeStunde = new Map(aktuelleAuswertung.jahr.produkte.map((p) => [p.produktId, p.deckungsbeitragJeWasserstunde]));
    const kandidaten = aktuellesSzenario.produkte
      .filter((p) => p.solverRolle === 'variabel' && p.aktiv && p.zyklenProJahr < p.solverMaxZyklenProJahr)
      .filter((p) => leitplanken.fremdlehrkraftZulaessig || p.durchfuehrung !== 'fremdlehrkraft')
      .sort((a, b) => (dbJeStunde.get(b.id) ?? Number.NEGATIVE_INFINITY) - (dbJeStunde.get(a.id) ?? Number.NEGATIVE_INFINITY));

    for (const produkt of kandidaten) {
      if (schritte >= MAX_SCHRITTE) break;
      const aktuell = aktuellesSzenario.produkte.find((p) => p.id === produkt.id);
      if (!aktuell || aktuell.zyklenProJahr >= aktuell.solverMaxZyklenProJahr) continue;

      const [ergebnisSprung, verbrauchteSchritte] = bestenSprungFinden(
        aktuellesSzenario,
        aktuelleAuswertung,
        aktuell,
        jahrIndex,
        leitplanken,
      );
      schritte += verbrauchteSchritte;

      if (!ergebnisSprung) continue; // kein Sprung dieses Produkts hilft gerade — evtl. in einer spaeteren Runde
      if ('beschraenkung' in ergebnisSprung) {
        bindendeBeschraenkung = ergebnisSprung.beschraenkung;
        continue;
      }

      aktuellesSzenario = ergebnisSprung.szenario;
      aktuelleAuswertung = ergebnisSprung.auswertung;
      fortschritt = true;

      if (zielErreicht(aktuelleAuswertung.jahr)) {
        return { erreicht: true, szenario: aktuellesSzenario, auswertung: aktuelleAuswertung, bindendeBeschraenkung: null };
      }
    }
  }

  return { erreicht: false, szenario: aktuellesSzenario, auswertung: aktuelleAuswertung, bindendeBeschraenkung };
}

type SprungErgebnis = { szenario: Szenario; auswertung: Auswertung } | { beschraenkung: BindendeBeschraenkung };

/**
 * Probiert fuer EIN Produkt eine verdoppelnde Folge von Sprunggroessen
 * (1, 2, 4, … bis zum verbleibenden Spielraum) und liefert den KLEINSTEN
 * Sprung, der weder eine Leitplanke verletzt noch das Ergebnis gegenueber
 * `basisAuswertung` verschlechtert. Faengt Schwelleneffekte ab, bei denen
 * eine +1-Erhoehung allein kurzfristig schlechter aussieht als der
 * Ausgangspunkt (design.md 4.2, Monotoniepruefung) — ohne eine separate
 * stetige Zwischenrechnung zu benoetigen.
 */
function bestenSprungFinden(
  basisSzenario: Szenario,
  basisAuswertung: Auswertung,
  produkt: Kursprodukt,
  jahrIndex: number,
  leitplanken: Leitplanken,
): readonly [SprungErgebnis | null, number] {
  const maxZusatz = produkt.solverMaxZyklenProJahr - produkt.zyklenProJahr;
  if (maxZusatz <= 0) return [null, 0];

  const sprunggroessen: number[] = [];
  for (let s = 1; s < maxZusatz; s *= 2) sprunggroessen.push(s);
  sprunggroessen.push(maxZusatz);

  let versuche = 0;
  for (const sprung of sprunggroessen) {
    versuche++;
    const kandidatSzenario: Szenario = {
      ...basisSzenario,
      produkte: basisSzenario.produkte.map((p) => (p.id === produkt.id ? { ...p, zyklenProJahr: p.zyklenProJahr + sprung } : p)),
    };
    const kandidatAuswertung = auswerten(kandidatSzenario, jahrIndex, leitplanken);
    const beschraenkung = bindendeBeschraenkungVon(kandidatAuswertung);

    if (beschraenkung) {
      // Ein groesserer Sprung verletzt die Leitplanke nur staerker — abbrechen.
      return [{ beschraenkung }, versuche];
    }
    if (kandidatAuswertung.jahr.gesamtnetto >= basisAuswertung.jahr.gesamtnetto) {
      return [{ szenario: kandidatSzenario, auswertung: kandidatAuswertung }, versuche];
    }
  }
  return [null, versuche];
}

function zyklenAenderungenVon(original: Szenario, loesung: Szenario): readonly ZielZyklenAenderung[] {
  const aenderungen: ZielZyklenAenderung[] = [];
  for (const p of original.produkte) {
    if (p.solverRolle === 'aus') continue;
    const nachher = loesung.produkte.find((q) => q.id === p.id);
    aenderungen.push({
      produktId: p.id,
      bezeichnung: p.bezeichnung,
      zyklenVorher: p.zyklenProJahr,
      zyklenNachher: nachher?.zyklenProJahr ?? p.zyklenProJahr,
      veraenderbar: p.solverRolle === 'variabel',
    });
  }
  return aenderungen;
}

function staerksterHebel(szenario: Szenario): ZielHebel | null {
  const zeilen = berechneSensitivitaet(szenario, 'letztes_jahr');
  const erste = zeilen[0];
  if (!erste || erste.spannweite === 0) return null;
  return { variable: erste.variable, label: erste.label, wirkung: erste.spannweite };
}

function bauZielErgebnis(
  art: ZielEingabe['art'],
  beschaeftigungsgrad: Quote,
  szenarioOriginal: Szenario,
  loesung: LoesungFuerJahr,
): ZielErgebnis {
  const jahr = loesung.auswertung.jahr;
  const status: ZielStatus = !loesung.erreicht
    ? 'unerreichbar'
    : Math.max(loesung.auswertung.wasserstundenAuslastung, loesung.auswertung.wochenbelastungAuslastung) >= KNAPP_SCHWELLE
      ? 'knapp'
      : 'erreicht';

  return {
    art,
    status,
    beschaeftigungsgrad,
    jahrIndex: loesung.erreicht ? jahr.jahr : null,
    kalenderjahr: loesung.erreicht ? jahr.kalenderjahr : null,
    gesamtnetto: jahr.gesamtnetto,
    luecke: jahr.luecke,
    benoetigteKurseProJahr: loesung.szenario.produkte
      .filter((p) => p.solverRolle !== 'aus')
      .reduce((s, p) => s + p.zyklenProJahr, 0),
    benoetigteWasserzeitProJahr: jahr.produkte.reduce((s, p) => s + p.wasserzeitGesamt, 0),
    wochenbelastung: jahr.zeit.gesamtProWoche,
    bindendeBeschraenkung: loesung.bindendeBeschraenkung,
    staerksterHebel: loesung.erreicht ? null : staerksterHebel(loesung.szenario),
    zyklenAenderungen: zyklenAenderungenVon(szenarioOriginal, loesung.szenario),
  };
}

/** Erstes Jahr im Horizont, das mit der gefundenen Konfiguration bereits traegt. */
function fruehestesTragfaehigesJahr(
  szenario: Szenario,
  bisJahrIndex: number,
  zielErreicht: (jahr: JahresErgebnis) => boolean,
): JahresErgebnis {
  for (let j = 0; j <= bisJahrIndex; j++) {
    const jahr = berechneJahr(szenario, j);
    if (zielErreicht(jahr)) return jahr;
  }
  return berechneJahr(szenario, bisJahrIndex);
}

const traegtBaseline = (jahr: JahresErgebnis): boolean => jahr.luecke <= 0;

/** Z1 — Reduktion: gegebene Zielstufe, gesucht sind Kurse/Wasserzeit/fruehestes tragfaehiges Jahr. */
function loeseReduktion(szenario: Szenario, ziel: ZielEingabe, leitplanken: Leitplanken): readonly ZielErgebnis[] {
  const beschaeftigungsgrad = ziel.zielBeschaeftigungsgrad ?? szenario.anstellung.beschaeftigungsgrad;
  const szenarioZiel = bereiteSzenarioVor(szenario, beschaeftigungsgrad);
  const letztesJahrIndex = szenario.simulation.horizontJahre - 1;

  const loesung = loeseGanzzahligFuerJahr(szenarioZiel, letztesJahrIndex, traegtBaseline, leitplanken);
  if (!loesung.erreicht) {
    return [bauZielErgebnis('reduktion', beschaeftigungsgrad, szenario, loesung)];
  }

  const erstesJahr = fruehestesTragfaehigesJahr(loesung.szenario, letztesJahrIndex, traegtBaseline);
  const finaleLoesung: LoesungFuerJahr = { ...loesung, auswertung: { ...loesung.auswertung, jahr: erstesJahr } };
  return [bauZielErgebnis('reduktion', beschaeftigungsgrad, szenario, finaleLoesung)];
}

/** Z2 — Zeitpunkt: tiefste Stufe, die bis zum Zieljahr traegt. */
function loeseZeitpunkt(szenario: Szenario, ziel: ZielEingabe, leitplanken: Leitplanken): readonly ZielErgebnis[] {
  const zielJahrIndex = ziel.zielJahrIndex ?? szenario.simulation.horizontJahre - 1;

  let beste: { beschaeftigungsgrad: Quote; loesung: LoesungFuerJahr } | null = null;
  for (const stufe of REDUKTIONSSTUFEN) {
    const szenarioZiel = bereiteSzenarioVor(szenario, stufe);
    const loesung = loeseGanzzahligFuerJahr(szenarioZiel, zielJahrIndex, traegtBaseline, leitplanken);
    if (!loesung.erreicht) break; // tiefere Stufen sind strikt anspruchsvoller — auch aussichtslos.
    beste = { beschaeftigungsgrad: stufe, loesung };
  }

  if (!beste) {
    // Selbst 100 % Beschaeftigung (keine Aenderung) traegt nicht bis zum Zieljahr —
    // unerreichbar mit der ANSPRUCHSVOLLSTEN Stufe als Referenz.
    const szenarioZiel = bereiteSzenarioVor(szenario, REDUKTIONSSTUFEN[0]);
    const loesung = loeseGanzzahligFuerJahr(szenarioZiel, zielJahrIndex, traegtBaseline, leitplanken);
    return [bauZielErgebnis('zeitpunkt', REDUKTIONSSTUFEN[0], szenario, loesung)];
  }

  return [bauZielErgebnis('zeitpunkt', beste.beschaeftigungsgrad, szenario, beste.loesung)];
}

/** Z3 — Nettoziel: benoetigte Kurse je Stufe, gegen einen festen Netto-Betrag statt der Baseline. */
function loeseNettoziel(szenario: Szenario, ziel: ZielEingabe, leitplanken: Leitplanken, jahrIndex: number): readonly ZielErgebnis[] {
  const zielNetto = ziel.zielNetto ?? 0;
  const zielErreicht = (jahr: JahresErgebnis): boolean => jahr.gesamtnetto >= zielNetto;

  return REDUKTIONSSTUFEN.map((stufe) => {
    const szenarioZiel = bereiteSzenarioVor(szenario, stufe);
    const loesung = loeseGanzzahligFuerJahr(szenarioZiel, jahrIndex, zielErreicht, leitplanken);
    return bauZielErgebnis('nettoziel', stufe, szenario, loesung);
  });
}

/** Z4 — Zeitbudget: tiefste Stufe unter einer eigenen Wochenbelastungsgrenze. */
function loeseZeitbudget(szenario: Szenario, ziel: ZielEingabe, leitplanken: Leitplanken): readonly ZielErgebnis[] {
  const zeitbudgetLeitplanken: Leitplanken = {
    ...leitplanken,
    wochenbelastungMax: ziel.maxWochenstunden ?? leitplanken.wochenbelastungMax,
  };
  const letztesJahrIndex = szenario.simulation.horizontJahre - 1;

  let beste: { beschaeftigungsgrad: Quote; loesung: LoesungFuerJahr } | null = null;
  for (const stufe of REDUKTIONSSTUFEN) {
    const szenarioZiel = bereiteSzenarioVor(szenario, stufe);
    const loesung = loeseGanzzahligFuerJahr(szenarioZiel, letztesJahrIndex, traegtBaseline, zeitbudgetLeitplanken);
    if (!loesung.erreicht) break;
    beste = { beschaeftigungsgrad: stufe, loesung };
  }

  if (!beste) {
    const szenarioZiel = bereiteSzenarioVor(szenario, REDUKTIONSSTUFEN[0]);
    const loesung = loeseGanzzahligFuerJahr(szenarioZiel, letztesJahrIndex, traegtBaseline, zeitbudgetLeitplanken);
    return [bauZielErgebnis('zeitbudget', REDUKTIONSSTUFEN[0], szenario, loesung)];
  }

  return [bauZielErgebnis('zeitbudget', beste.beschaeftigungsgrad, szenario, beste.loesung)];
}

/**
 * Oeffentliche Einstiegsfunktion. Liefert immer ein Array: Z1/Z2/Z4 genau
 * einen Eintrag, Z3 einen je Reduktionsstufe (100/80/60/50/0 %).
 * `jahrIndex` ist nur fuer Z3 relevant (die vom Nutzer betrachtete Jahresspalte);
 * Z1/Z2/Z4 bestimmen ihr Zieljahr selbst (design.md 4).
 */
export function loeseZiel(szenario: Szenario, ziel: ZielEingabe, jahrIndex: number): readonly ZielErgebnis[] {
  const leitplanken = szenario.leitplanken;
  switch (ziel.art) {
    case 'reduktion':
      return loeseReduktion(szenario, ziel, leitplanken);
    case 'zeitpunkt':
      return loeseZeitpunkt(szenario, ziel, leitplanken);
    case 'nettoziel':
      return loeseNettoziel(szenario, ziel, leitplanken, jahrIndex);
    case 'zeitbudget':
      return loeseZeitbudget(szenario, ziel, leitplanken);
  }
}

/** Wendet die Zyklenaenderungen eines ZielErgebnisses auf ein Szenario an — fuer "Uebernehmen" (4.5). */
export function wendeVorschlagAn(
  szenario: Szenario,
  zyklenAenderungen: readonly ZielZyklenAenderung[],
  beschaeftigungsgrad: Quote,
  uebernommeneProduktIds: ReadonlySet<string>,
): Szenario {
  const produkte: Kursprodukt[] = szenario.produkte.map((p) => {
    const aenderung = zyklenAenderungen.find((a) => a.produktId === p.id);
    if (!aenderung || !aenderung.veraenderbar || !uebernommeneProduktIds.has(p.id)) return p;
    return { ...p, zyklenProJahr: aenderung.zyklenNachher };
  });
  return {
    ...szenario,
    anstellung: { ...szenario.anstellung, beschaeftigungsgrad },
    produkte,
  };
}
