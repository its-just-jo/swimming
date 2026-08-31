/**
 * Orchestrierung des Gesamtmodells.
 *
 * ZWEISTUFIGE ZEITACHSE — die zentrale Architekturentscheidung:
 *
 * Steuern sind progressiv und jahresbezogen, Cashflow ist monatlich. Beides in
 * einem Durchlauf zu rechnen fuehrt zwangslaeufig zu falscher Progression.
 * Daher:
 *
 *   Stufe A  Monatliche Rohstroeme: Erloese, Beckenmiete, Honorare, Fixkosten,
 *            Investitionen — aus Produkten und Saisonkalender.
 *   Stufe B  Aggregation je KALENDERJAHR. Erst auf dieser Ebene werden
 *            Einkommensteuer, Gewerbesteuer und DRV-Beitrag berechnet, und zwar
 *            gemeinsam mit dem Arbeitsentgelt.
 *   Stufe C  Ruecktragung der Jahresabgaben auf die Monate (gleichmaessig,
 *            als Abgrenzung, nicht als Vorauszahlungstermin) fuer die
 *            Cashflow-Ansicht. Diese Vereinfachung ist an der Grafik
 *            auszuweisen.
 *
 * Das Steuerjahr ist das Kalenderjahr. Faellt der Startmonat nicht auf Januar,
 * ist das erste Simulationsjahr ein Rumpfjahr auf der Kursseite; das
 * Arbeitsentgelt laeuft ganzjaehrig weiter, weil die Anstellung bereits besteht.
 *
 * `berechneSzenario` ist eine reine Funktion ohne Seiteneffekte und muss schnell
 * genug bleiben, um von der Sensitivitaetsanalyse rund 25-mal je Interaktion
 * aufgerufen zu werden. Richtwert: unter 20 ms je Durchlauf.
 */

import { berechneAnstellung } from './anstellung';
import { berechneGewinn, fixkostenImJahr, investitionenImJahr } from './gewinn';
import { berechneKapazitaet, verfuegbareWasserstunden } from './kapazitaet';
import { mitUeberschreibungen, MODELL_KONSTANTEN, rechtsgroessenFuer, type Rechtsgroessen } from './konstanten';
import { lehrauftragEinkuenfte } from './lehre';
import { berechneProdukt } from './produkte';
import { berechneRentenwirkung } from './rente';
import { kleinunternehmerVerlauf } from './steuer/umsatzsteuer';
import type {
  Anstellung,
  Ergebnis,
  Euro,
  JahresErgebnis,
  MonatsErgebnis,
  ProduktErgebnis,
  Szenario,
} from './typen';
import { berechneZeitbudget, mittlereTerminlaenge } from './zeitbudget';

function rechtsgroessenFuerSzenario(szenario: Szenario): Rechtsgroessen {
  return mitUeberschreibungen(
    rechtsgroessenFuer(szenario.simulation.rechtsstand),
    szenario.rechtlicheUeberschreibungen,
  );
}

/** Anstellung des Jahres — durch die Professur ersetzt, sobald sie aktiv ist. */
function anstellungEffektivImJahr(szenario: Szenario, jahrIndex: number): Anstellung {
  const { anstellung, lehre } = szenario;
  const professurAktivDiesesJahr = lehre.professurAktiv && jahrIndex >= lehre.professurStartjahr;
  if (!professurAktivDiesesJahr) return anstellung;
  return {
    ...anstellung,
    bruttogrundgehaltVollzeit: lehre.professurBruttoProJahr,
    beschaeftigungsgrad: lehre.professurBeschaeftigungsgrad,
    bonusProJahr: 0,
    // Die Professur ersetzt die Anstellung erst ab professurStartjahr; eine
    // Fortschreibung ab jahrIndex 0 wuerde das Gehalt faelschlich vorab
    // hochrechnen. Steigerung ab Uebernahme ist nicht modelliert.
    gehaltssteigerungProJahr: 0,
  };
}

/** Bruttoumsaetze (vor USt-Aufteilung) aller Jahre 0..jahrIndex — Basis der Kleinunternehmerpruefung. */
function bruttoumsaetzeBisJahr(
  szenario: Szenario,
  jahrIndex: number,
  rg: Rechtsgroessen,
): readonly Euro[] {
  const { wasser, produkte, simulation } = szenario;
  const ergebnisse: Euro[] = [];
  for (let y = 0; y <= jahrIndex; y++) {
    const hallenbadVerfuegbar = verfuegbareWasserstunden(wasser, y).hallenbadVerfuegbar;
    const preisIndex = (1 + simulation.preissteigerungKurse) ** y;
    const mietIndex = (1 + simulation.beckenmietsteigerung) ** y;
    let summe = 0;
    for (const produkt of produkte) {
      // ustpflichtig wirkt sich auf erloesBrutto nicht aus (nur auf die
      // Netto/USt-Aufteilung) — der Wert hier ist irrelevant fuer die Summe.
      const ergebnis = berechneProdukt({
        produkt,
        jahrIndex: y,
        preisIndex,
        mietIndex,
        ustpflichtig: false,
        ausfallquote: wasser.ausfallquote,
        ausfallMindertErloes: wasser.ausfallWirkung === 'kapazitaet_und_erloes',
        hallenbadVerfuegbar,
        rg,
      });
      summe += ergebnis.erloesBrutto;
    }
    ergebnisse.push(summe);
  }
  return ergebnisse;
}

/**
 * Berechnet ein Jahresergebnis ohne die Baseline-abhaengigen Felder
 * (baselineNetto/luecke/deckungsgrad = 0). `berechneJahr` ruft dies fuer das
 * eigentliche Szenario UND fuer `baselineSzenario(szenario)` auf und fuehrt
 * beide Ergebnisse zusammen — das haelt beide Seiten der Referenz auf
 * demselben Rechenweg, ohne dass die Baseline sich selbst rekursiv eine
 * eigene Baseline berechnen muesste.
 */
function berechneJahrKern(szenario: Szenario, jahrIndex: number, rg: Rechtsgroessen): JahresErgebnis {
  const { wasser, produkte, fixkosten, fahrtkosten, investitionen, steuer, lehre, simulation } = szenario;
  const anstellungEffektiv = anstellungEffektivImJahr(szenario, jahrIndex);

  const bruttoumsaetze = bruttoumsaetzeBisJahr(szenario, jahrIndex, rg);
  const kuVerlauf = kleinunternehmerVerlauf(bruttoumsaetze, steuer.kleinunternehmer, rg);
  const kuStatusDiesesJahr = kuVerlauf[jahrIndex];
  const kleinunternehmerAktiv = kuStatusDiesesJahr?.kleinunternehmer ?? false;
  const ustpflichtigEffektiv = steuer.umsatzsteuerpflichtig && !kleinunternehmerAktiv;

  const hallenbadVerfuegbar = verfuegbareWasserstunden(wasser, jahrIndex).hallenbadVerfuegbar;
  const preisIndex = (1 + simulation.preissteigerungKurse) ** jahrIndex;
  const mietIndex = (1 + simulation.beckenmietsteigerung) ** jahrIndex;
  const ausfallMindertErloes = wasser.ausfallWirkung === 'kapazitaet_und_erloes';

  const produktErgebnisse: readonly ProduktErgebnis[] = produkte.map((produkt) =>
    berechneProdukt({
      produkt,
      jahrIndex,
      preisIndex,
      mietIndex,
      ustpflichtig: ustpflichtigEffektiv,
      ausfallquote: wasser.ausfallquote,
      ausfallMindertErloes,
      hallenbadVerfuegbar,
      rg,
    }),
  );

  const kapazitaet = berechneKapazitaet({ wasser, produktErgebnisse, jahrIndex });

  const terminlaenge = mittlereTerminlaenge(produktErgebnisse, produkte);
  const aktiveWochen = wasser.aktiveWochenFreibad + wasser.aktiveWochenHalle;
  const zeit = berechneZeitbudget({
    anstellung: anstellungEffektiv,
    wasser,
    eigeneWasserstundenProJahr: kapazitaet.benoetigtGesamt,
    mittlereTerminlaengeStunden: terminlaenge,
    aktiveWochen,
    warnschwelle: simulation.wochenbelastungWarnschwelle,
  });

  const fixkostenJahr = fixkostenImJahr(fixkosten, fahrtkosten, jahrIndex, simulation.inflation);
  const investitionenJahr = investitionenImJahr(investitionen, jahrIndex);
  const lehreinkuenfte = lehrauftragEinkuenfte(lehre, jahrIndex);

  const anstellungOhneSelbstaendigkeit = berechneAnstellung({
    anstellung: anstellungEffektiv,
    jahrIndex,
    gewinnSelbstaendigkeit: 0,
    lehreinkuenfte: 0,
    drvBeitragSelbstaendigkeit: 0,
    uebungsleiterFreibetrag: 0,
    rg,
  });

  const gewinn = berechneGewinn({
    produktErgebnisse,
    fixkosten: fixkostenJahr,
    investitionen: investitionenJahr,
    lehreinkuenfte,
    anstellungOhneSelbstaendigkeit,
    kirchensteuerpflichtig: anstellungEffektiv.kirchensteuerpflichtig,
    steuer,
    jahrIndex,
    rg,
  });

  // Rentenwirkung braucht eine Referenz mit beschaeftigungsgrad 1,0 — das ist
  // hier nur der Bruttolohn dieses einen Jahres, nicht die volle
  // Baseline-Veranlagung (die liefert berechneJahr ueber berechneJahrKern
  // fuer baselineSzenario()).
  const anstellungVollzeitReferenz: Anstellung = { ...anstellungEffektiv, beschaeftigungsgrad: 1.0 };
  const bruttoVollzeitReferenz = berechneAnstellung({
    anstellung: anstellungVollzeitReferenz,
    jahrIndex,
    gewinnSelbstaendigkeit: 0,
    lehreinkuenfte: 0,
    drvBeitragSelbstaendigkeit: 0,
    uebungsleiterFreibetrag: 0,
    rg,
  }).bruttoGesamt;

  const rente = berechneRentenwirkung({
    bruttolohnSzenario: anstellungOhneSelbstaendigkeit.bruttoGesamt,
    bruttolohnBaseline: bruttoVollzeitReferenz,
    drvBeitragSelbstaendigkeit: gewinn.drvBeitrag,
    jahre: jahrIndex + 1,
    rg,
  });

  const umsatzBrutto = produktErgebnisse.reduce((summe, p) => summe + p.erloesBrutto, 0);
  // Gesamtnetto: siehe gewinn.ts-Dateikopf — anstellungOhneSelbstaendigkeit
  // traegt bereits die volle Lohnsteuer (ohne Gewinn/Lehre); die Mehrsteuer
  // beider steckt vollstaendig in gewinn.nettoAusSelbstaendigkeit, deshalb
  // fliesst lehreinkuenfte hier brutto (unversteuert) ein.
  const gesamtnetto = anstellungOhneSelbstaendigkeit.netto + gewinn.nettoAusSelbstaendigkeit + lehreinkuenfte;

  const startjahr = new Date(simulation.startdatum).getUTCFullYear();

  return {
    jahr: jahrIndex,
    kalenderjahr: startjahr + jahrIndex,
    anstellung: anstellungOhneSelbstaendigkeit,
    produkte: produktErgebnisse,
    kapazitaet,
    zeit,
    gewinn,
    lehreNetto: lehreinkuenfte,
    rente,
    umsatzBrutto,
    kleinunternehmerAktiv,
    gesamtnetto,
    // Von berechneJahr() nach dem Aufruf ueberschrieben.
    baselineNetto: 0,
    luecke: 0,
    deckungsgrad: 0,
  };
}

/**
 * Vollstaendiges Jahresergebnis inklusive der Baseline-Referenz
 * (beschaeftigungsgrad 1,0, keine Selbststaendigkeit) fuer Luecke und
 * Deckungsgrad. Beide Seiten laufen ueber denselben Rechenweg
 * (`berechneJahrKern`), damit sie vergleichbar bleiben.
 */
export function berechneJahr(szenario: Szenario, jahrIndex: number): JahresErgebnis {
  const rg = rechtsgroessenFuerSzenario(szenario);
  const kern = berechneJahrKern(szenario, jahrIndex, rg);
  const baselineNetto = berechneJahrKern(baselineSzenario(szenario), jahrIndex, rg).gesamtnetto;

  const luecke = baselineNetto - kern.gesamtnetto;
  const deckungsgrad = baselineNetto !== 0 ? kern.gesamtnetto / baselineNetto : 0;

  return { ...kern, baselineNetto, luecke, deckungsgrad };
}

/**
 * Monatliche Aufloesung eines Musterjahres — macht die Saisonalitaet sichtbar.
 * Stufe C: Jahresabgaben (Steuer, DRV, Gewerbesteuer) werden gleichmaessig auf
 * die zwoelf Monate zurueckgetragen (Abgrenzung, nicht Zahlungstermin).
 * Erloes/Miete/Honorar von Saisonprodukten werden auf die jeweiligen
 * Saisonmonate verteilt, Ganzjahresprodukte gleichmaessig auf alle zwoelf.
 */
export function berechneMonate(szenario: Szenario, jahrIndex: number): readonly MonatsErgebnis[] {
  const jahresErgebnis = berechneJahr(szenario, jahrIndex);
  const { freibadMonate, hallenMonate } = MODELL_KONSTANTEN;
  const startdatum = new Date(szenario.simulation.startdatum);
  const startMonatAbs = startdatum.getUTCMonth();
  const startJahr = startdatum.getUTCFullYear();

  const abgabenProMonat =
    (jahresErgebnis.gewinn.zusaetzlicheEinkommensteuer +
      jahresErgebnis.gewinn.gewerbesteuer -
      jahresErgebnis.gewinn.gewerbesteuerAnrechnung +
      jahresErgebnis.gewinn.drvBeitrag) /
    12;
  const fixkostenProMonat = jahresErgebnis.gewinn.fixkosten / 12;

  const monate: MonatsErgebnis[] = [];
  for (let m = 0; m < 12; m++) {
    const monatAbsolut = startMonatAbs + jahrIndex * 12 + m;
    const kalendermonat = (monatAbsolut % 12) + 1;
    const kalenderjahr = startJahr + Math.floor(monatAbsolut / 12);
    const freibadAktiv = freibadMonate.includes(kalendermonat);
    const halleAktiv = hallenMonate.includes(kalendermonat);

    let einnahmen = 0;
    let beckenmiete = 0;
    let honorare = 0;
    for (const p of jahresErgebnis.produkte) {
      let anteil = 0;
      if (p.saison === 'ganzjahr') anteil = 1 / 12;
      else if (p.saison === 'freibad' && freibadAktiv) anteil = 1 / freibadMonate.length;
      else if (p.saison === 'halle' && halleAktiv) anteil = 1 / hallenMonate.length;
      einnahmen += p.erloesBrutto * anteil;
      beckenmiete += p.miete * anteil;
      honorare += p.honorar * anteil;
    }

    const monatAbsoluterIndex = jahrIndex * 12 + m;
    const investitionenMonat = szenario.investitionen
      .filter((inv) => inv.monat === monatAbsoluterIndex)
      .reduce((summe, inv) => summe + inv.betrag, 0);

    const cashflow =
      einnahmen - beckenmiete - honorare - fixkostenProMonat - investitionenMonat - abgabenProMonat;

    monate.push({
      monat: monatAbsoluterIndex,
      kalenderjahr,
      kalendermonat,
      einnahmen,
      beckenmiete,
      honorare,
      fixkosten: fixkostenProMonat,
      investitionen: investitionenMonat,
      steuernUndAbgaben: abgabenProMonat,
      cashflow,
      kumuliert: cashflow,
    });
  }
  return monate;
}

/**
 * Vollzeit-Baseline: dasselbe Szenario mit beschaeftigungsgrad = 1,0 und ohne
 * jede selbststaendige Taetigkeit. Referenz fuer Luecke und Deckungsgrad.
 */
export function baselineSzenario(szenario: Szenario): Szenario {
  return {
    ...szenario,
    anstellung: { ...szenario.anstellung, beschaeftigungsgrad: 1.0 },
    produkte: szenario.produkte.map((p) => ({ ...p, aktiv: false })),
    lehre: { ...szenario.lehre, lehrauftragAktiv: false, professurAktiv: false },
  };
}

/** Reine Gesamtberechnung eines Szenarios ueber den vollen Horizont. */
export function berechneSzenario(szenario: Szenario): Ergebnis {
  const jahre: JahresErgebnis[] = [];
  for (let y = 0; y < szenario.simulation.horizontJahre; y++) {
    jahre.push(berechneJahr(szenario, y));
  }

  const monateRoh: MonatsErgebnis[] = [];
  for (let y = 0; y < szenario.simulation.horizontJahre; y++) {
    monateRoh.push(...berechneMonate(szenario, y));
  }

  let laufend = 0;
  const monate = monateRoh.map((m) => {
    laufend += m.cashflow;
    return { ...m, kumuliert: laufend };
  });

  return { szenarioId: szenario.id, jahre, monate, warnungen: [] };
}
