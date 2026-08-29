/**
 * Rentenwirkung, Abschnitt 4.6. Bewusst grob, aber sichtbar.
 *
 *   Entgeltpunkte Anstellung = min(Bruttolohn, BBG RV) / Durchschnittsentgelt
 *   Entgeltpunkte Selbst.    = DRV-Beitrag / (Durchschnittsentgelt x RV-Satz)
 *   Rentendifferenz          = (EP Szenario - EP Baseline) x aktueller Rentenwert
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
  void eingabe;
  throw new Error('berechneRentenwirkung: nicht implementiert');
}
