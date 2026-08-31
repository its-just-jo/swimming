/**
 * Nettoeinkommen aus der Anstellung je Beschaeftigungsgrad.
 *
 * Bonusskalierung: bonusFaktor = max(0, 1 - (1 - grad) / skalierung)
 *
 * Begruendung dieser Formel gegenueber der naheliegenden Variante
 * `bonus * grad * skalierung`: Letztere kuerzt den Bonus auch bei Vollzeit
 * (grad = 1), was fachlich falsch ist. Die gewaehlte Formel liefert bei
 * grad = 1 immer den vollen Bonus, bei skalierung = 1 exakt proportionales
 * Verhalten und bei skalierung < 1 den ueberproportionalen Abfall, den die
 * Spezifikation verlangt. Lesart: "Ein Prozentpunkt Reduktion kostet
 * 1/skalierung Prozentpunkte Bonus."
 */

import type { Rechtsgroessen } from './konstanten';
import { svBeitraegeArbeitnehmer } from './steuer/sozialversicherung';
import { berechneEinkommensteuer, zuVersteuerndesEinkommen } from './steuer/einkommensteuer';
import type { Anstellung, AnstellungErgebnis, Euro, Quote } from './typen';

export function bonusFaktor(beschaeftigungsgrad: Quote, skalierung: number): number {
  return Math.max(0, 1 - (1 - beschaeftigungsgrad) / skalierung);
}

/** Bruttojahresentgelt im Jahr `jahrIndex` inklusive Gehaltssteigerung. */
export function bruttoImJahr(
  anstellung: Anstellung,
  jahrIndex: number,
): { grundgehalt: Euro; bonus: Euro; gesamt: Euro; bonusFaktor: number } {
  const steigerungsfaktor = (1 + anstellung.gehaltssteigerungProJahr) ** jahrIndex;
  const grundgehalt = anstellung.bruttogrundgehaltVollzeit * anstellung.beschaeftigungsgrad * steigerungsfaktor;
  const faktor = bonusFaktor(anstellung.beschaeftigungsgrad, anstellung.bonusSkalierung);
  const bonus = anstellung.bonusProJahr * faktor * steigerungsfaktor;
  return { grundgehalt, bonus, gesamt: grundgehalt + bonus, bonusFaktor: faktor };
}

/**
 * Vollstaendiges Anstellungsergebnis eines Jahres.
 * `gewinnSelbstaendigkeit` und `lehreinkuenfte` fliessen ein, weil die
 * Einkommensteuer gemeinsam veranlagt wird. Der Aufrufer entscheidet durch die
 * Wahl der Parameter, ob dies die tatsaechliche (kombinierte) oder eine
 * hypothetische Baseline-Veranlagung ohne Selbststaendigkeit ist — genau
 * diese Differenzbildung nutzt `gewinn.ts` fuer die Mehrsteuer der
 * Selbststaendigkeit.
 */
export function berechneAnstellung(eingabe: {
  anstellung: Anstellung;
  jahrIndex: number;
  gewinnSelbstaendigkeit: Euro;
  lehreinkuenfte: Euro;
  drvBeitragSelbstaendigkeit: Euro;
  uebungsleiterFreibetrag: Euro;
  rg: Rechtsgroessen;
}): AnstellungErgebnis {
  const {
    anstellung,
    jahrIndex,
    gewinnSelbstaendigkeit,
    lehreinkuenfte,
    drvBeitragSelbstaendigkeit,
    uebungsleiterFreibetrag,
    rg,
  } = eingabe;

  const brutto = bruttoImJahr(anstellung, jahrIndex);
  const sv = svBeitraegeArbeitnehmer({
    bruttolohn: brutto.gesamt,
    kvStatus: anstellung.kvStatus,
    pkvBeitragProMonat: anstellung.pkvBeitragProMonat,
    kinderlosZuschlagPflege: anstellung.kinderlosZuschlagPflege,
    rg,
  });

  const zvE = zuVersteuerndesEinkommen({
    bruttolohn: brutto.gesamt,
    arbeitnehmerSvBeitraege: sv.gesamtArbeitnehmer,
    gewinnSelbstaendigkeit,
    uebungsleiterFreibetrag,
    lehreinkuenfte,
    drvBeitragSelbstaendigkeit,
    kinderfreibetraege: anstellung.kinderfreibetraege,
    rg,
  });
  const steuer = berechneEinkommensteuer(zvE, anstellung.kirchensteuerpflichtig, rg);

  const netto = brutto.gesamt - sv.gesamtArbeitnehmer - steuer.gesamt;

  return {
    grundgehalt: brutto.grundgehalt,
    bonus: brutto.bonus,
    bonusFaktor: brutto.bonusFaktor,
    bruttoGesamt: brutto.gesamt,
    sv,
    steuer,
    netto,
  };
}

