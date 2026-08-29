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
import type { Anstellung, AnstellungErgebnis, Euro, Quote } from './typen';

export function bonusFaktor(beschaeftigungsgrad: Quote, skalierung: number): number {
  void beschaeftigungsgrad; void skalierung;
  throw new Error('bonusFaktor: nicht implementiert');
}

/** Bruttojahresentgelt im Jahr `jahrIndex` inklusive Gehaltssteigerung. */
export function bruttoImJahr(
  anstellung: Anstellung,
  jahrIndex: number,
): { grundgehalt: Euro; bonus: Euro; gesamt: Euro; bonusFaktor: number } {
  void anstellung; void jahrIndex;
  throw new Error('bruttoImJahr: nicht implementiert');
}

/**
 * Vollstaendiges Anstellungsergebnis eines Jahres.
 * `gewinnSelbstaendigkeit` und `lehreinkuenfte` fliessen ein, weil die
 * Einkommensteuer gemeinsam veranlagt wird.
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
  void eingabe;
  throw new Error('berechneAnstellung: nicht implementiert');
}
