/**
 * Break-even je Reduktionsstufe, Abschnitt 5.
 *
 * Beantwortet Kernfrage 2 der Spezifikation: "Wie viele Kurseinheiten pro Woche
 * schliessen die Luecke, und passt das in mein Zeitbudget?"
 *
 * Verfahren je Stufe (100 / 80 / 60 / 50 / 0 %):
 *  1. Nettoluecke gegenueber der Vollzeit-Baseline ermitteln.
 *  2. Den NETTO-Deckungsbeitrag je Wasserstunde bestimmen — also nach
 *     Einkommensteuer und DRV-Beitrag. Der Bruttodeckungsbeitrag wuerde die
 *     benoetigte Stundenzahl systematisch unterschaetzen, weil die zusaetzliche
 *     Grenzbelastung bei diesem Gehaltsniveau erheblich ist.
 *  3. benoetigteStunden = Luecke / NettoDB je Stunde.
 *  4. Gegen das verfuegbare Zeitbudget der Stufe pruefen.
 *
 * Schritt 2 ist iterativ, weil der Gewinn die Grenzbelastung mitbestimmt:
 * Fixpunktiteration mit maximal 20 Schritten, Abbruch bei Aenderung < 1 EUR.
 */

import { berechneAnstellung } from './anstellung';
import { anstellungEffektivImJahr, berechneJahr, rechtsgroessenFuerSzenario } from './simulation';
import { grenzbelastung } from './steuer/einkommensteuer';
import { berechneZeitbudget, mittlereTerminlaenge } from './zeitbudget';
import type { BreakEvenPunkt, Szenario } from './typen';

const MAX_ITERATIONEN = 20;
const ABBRUCH_EUR = 1;

export function berechneBreakEven(szenario: Szenario, jahrIndex: number): readonly BreakEvenPunkt[] {
  const rg = rechtsgroessenFuerSzenario(szenario);
  const anstellungEffektiv = anstellungEffektivImJahr(szenario, jahrIndex);

  // Vollzeit-Baseline desselben Jahres — dieselbe Referenz wie in
  // simulation.ts, direkt (nicht rekursiv) berechnet.
  const baselineNetto = berechneAnstellung({
    anstellung: { ...anstellungEffektiv, beschaeftigungsgrad: 1.0 },
    jahrIndex,
    gewinnSelbstaendigkeit: 0,
    lehreinkuenfte: 0,
    drvBeitragSelbstaendigkeit: 0,
    uebungsleiterFreibetrag: 0,
    rg,
  }).netto;

  // Repraesentativer Netto-Deckungsbeitrag je Wasserstunde aus dem aktuellen
  // Produktmix — Grundlage fuer die Hochrechnung benoetigter Stunden.
  const jahresErgebnis = berechneJahr(szenario, jahrIndex);
  const eigeneProdukte = jahresErgebnis.produkte.filter((p) => p.durchfuehrung === 'ich');
  const wasserstundenEigen = eigeneProdukte.reduce((s, p) => s + p.wasserzeitGesamt, 0);
  const deckungsbeitragEigen = eigeneProdukte.reduce((s, p) => s + p.deckungsbeitrag, 0);
  const bruttoDbJeStunde = wasserstundenEigen > 0 ? deckungsbeitragEigen / wasserstundenEigen : 0;

  const drvSatzFlach = szenario.steuer.drvPflicht ? rg.rvSatz : 0;
  const aktiveWochen = szenario.wasser.aktiveWochenFreibad + szenario.wasser.aktiveWochenHalle;
  const terminlaenge = mittlereTerminlaenge(jahresErgebnis.produkte, szenario.produkte) || 0.75;

  const punkte: BreakEvenPunkt[] = [];

  for (const stufe of [1.0, 0.8, 0.6, 0.5, 0.0] as const) {
    const anstellungStufe = { ...anstellungEffektiv, beschaeftigungsgrad: stufe };
    const ergebnisStufe = berechneAnstellung({
      anstellung: anstellungStufe,
      jahrIndex,
      gewinnSelbstaendigkeit: 0,
      lehreinkuenfte: 0,
      drvBeitragSelbstaendigkeit: 0,
      uebungsleiterFreibetrag: 0,
      rg,
    });
    const luecke = baselineNetto - ergebnisStufe.netto;

    let wasserstundenGesamt = 0;
    if (luecke > 0 && bruttoDbJeStunde > 0) {
      for (let i = 0; i < MAX_ITERATIONEN; i++) {
        const gewinnGeschaetzt = wasserstundenGesamt * bruttoDbJeStunde;
        const zvEGeschaetzt = ergebnisStufe.steuer.zvE + gewinnGeschaetzt;
        const satz =
          grenzbelastung(zvEGeschaetzt, anstellungEffektiv.kirchensteuerpflichtig, rg) + drvSatzFlach;
        const nettoDbJeStunde = bruttoDbJeStunde * (1 - satz);
        if (nettoDbJeStunde <= 0) {
          wasserstundenGesamt = Number.POSITIVE_INFINITY;
          break;
        }
        const neueWasserstunden = luecke / nettoDbJeStunde;
        const aenderungEur = Math.abs((neueWasserstunden - wasserstundenGesamt) * bruttoDbJeStunde);
        wasserstundenGesamt = neueWasserstunden;
        if (aenderungEur < ABBRUCH_EUR) break;
      }
    }

    const benoetigteWasserstundenProWoche =
      Number.isFinite(wasserstundenGesamt) && aktiveWochen > 0 ? wasserstundenGesamt / aktiveWochen : Number.POSITIVE_INFINITY;
    const benoetigteKurseProWoche = Number.isFinite(benoetigteWasserstundenProWoche)
      ? benoetigteWasserstundenProWoche / terminlaenge
      : Number.POSITIVE_INFINITY;

    const zeitStufe = berechneZeitbudget({
      anstellung: anstellungStufe,
      wasser: szenario.wasser,
      eigeneWasserstundenProJahr: Number.isFinite(wasserstundenGesamt) ? wasserstundenGesamt : 0,
      mittlereTerminlaengeStunden: terminlaenge,
      aktiveWochen,
      warnschwelle: szenario.simulation.wochenbelastungWarnschwelle,
    });

    punkte.push({
      beschaeftigungsgrad: stufe,
      luecke,
      deckungsbeitragJeWasserstunde: bruttoDbJeStunde,
      benoetigteWasserstundenProWoche,
      benoetigteKurseProWoche,
      imZeitbudget: Number.isFinite(wasserstundenGesamt) && !zeitStufe.ueberSchwelle,
    });
  }

  return punkte;
}
