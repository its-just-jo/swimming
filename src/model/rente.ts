/**
 * Rentenwirkung, Abschnitt 4.6. Bewusst grob, aber sichtbar.
 *
 *   Entgeltpunkte Anstellung = min(Bruttolohn, BBG RV) / Durchschnittsentgelt
 *   Entgeltpunkte Selbst.    = DRV-Beitrag / (Durchschnittsentgelt x RV-Satz)
 *   Rentendifferenz          = (EP Szenario - EP Baseline) x aktueller Rentenwert
 *
 * `jahre` skaliert die Einzeljahres-Entgeltpunkte auf die kumulierte Wirkung
 * bis zum betrachteten Jahr hoch (vereinfachend: gleichbleibendes Brutto in
 * jedem Jahr unterstellt) — eine echte Jahr-fuer-Jahr-Kumulierung mit
 * variierendem Lohn ist hier bewusst nicht modelliert.
 *
 * Nicht modelliert: Rentenwertdynamik, Zurechnungszeiten, Abschlaege,
 * Besteuerung der Rente. Der Wert ist als Richtungsangabe zu lesen, nicht als
 * Rentenprognose — die UI weist das an der Kennzahl aus.
 */

import type { Rechtsgroessen } from './konstanten';
import type { Euro, RenteErgebnis } from './typen';

export function berechneRentenwirkung(eingabe: {
  bruttolohnSzenario: Euro;
  bruttolohnBaseline: Euro;
  drvBeitragSelbstaendigkeit: Euro;
  jahre: number;
  rg: Rechtsgroessen;
}): RenteErgebnis {
  const { bruttolohnSzenario, bruttolohnBaseline, drvBeitragSelbstaendigkeit, jahre, rg } = eingabe;

  const entgeltpunkteAnstellung =
    (Math.min(bruttolohnSzenario, rg.bbgRvAlv) / rg.durchschnittsentgeltRv) * jahre;
  const entgeltpunkteSelbstaendigkeit =
    (drvBeitragSelbstaendigkeit / (rg.durchschnittsentgeltRv * rg.rvSatz)) * jahre;
  const entgeltpunkteBaseline =
    (Math.min(bruttolohnBaseline, rg.bbgRvAlv) / rg.durchschnittsentgeltRv) * jahre;

  const differenzEntgeltpunkte =
    entgeltpunkteAnstellung + entgeltpunkteSelbstaendigkeit - entgeltpunkteBaseline;
  const rentendifferenzProMonat = differenzEntgeltpunkte * rg.rentenwertProEntgeltpunktMonat;

  return {
    entgeltpunkteAnstellung,
    entgeltpunkteSelbstaendigkeit,
    entgeltpunkteBaseline,
    differenzEntgeltpunkte,
    rentendifferenzProMonat,
  };
}
