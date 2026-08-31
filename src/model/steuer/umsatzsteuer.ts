/**
 * Umsatzsteuer und Kleinunternehmerregelung § 19 UStG.
 *
 * Schwimmunterricht faellt nach EuGH C-373/19 und BFH V R 31/21 nicht unter die
 * Bildungsbefreiung des § 4 Nr. 21 UStG. Default ist deshalb steuerpflichtig.
 *
 * Da die Endkundenpreise brutto fixiert sind, MINDERT die Umsatzsteuer den
 * Erloes — sie wird nicht aufgeschlagen. Netto = Brutto / (1 + Satz).
 */

import type { Rechtsgroessen } from '../konstanten';
import type { Euro } from '../typen';

/** Nettoerloes aus einem brutto fixierten Preis. */
export function nettoAusBrutto(brutto: Euro, ustpflichtig: boolean, rg: Rechtsgroessen): Euro {
  if (!ustpflichtig) return brutto;
  return brutto / (1 + rg.ustRegelsatz);
}

export interface KleinunternehmerStatus {
  readonly jahr: number;
  readonly kleinunternehmer: boolean;
  readonly vorjahresumsatz: Euro;
  readonly umsatzLaufendesJahr: Euro;
  readonly schwelleGerissen: boolean;
  readonly grund: 'vorjahr' | 'laufendes_jahr' | 'manuell_aus' | null;
}

/**
 * Zustandsmaschine ueber den Simulationshorizont.
 *
 * Regel ab 01.01.2025: Kleinunternehmer bleibt, wer im Vorjahr hoechstens
 * 25.000 EUR und im laufenden Jahr hoechstens 100.000 EUR umsetzt. Die
 * 100.000-EUR-Grenze wirkt unterjaehrig: ab ihrem Ueberschreiten sind
 * Folgeumsaetze steuerpflichtig. Die 25.000-EUR-Grenze wirkt zum Folgejahr.
 *
 * Einmal verlassen, wird der Status im Modell nicht automatisch zurueckgesetzt —
 * ein Rueckwechsel waere zwar moeglich, ist aber an einen Antrag gebunden und
 * wuerde das Ergebnis stillschweigend beschoenigen.
 */
export function kleinunternehmerVerlauf(
  bruttoumsaetzeJeJahr: readonly Euro[],
  startAlsKleinunternehmer: boolean,
  rg: Rechtsgroessen,
): readonly KleinunternehmerStatus[] {
  const ergebnisse: KleinunternehmerStatus[] = [];
  let verloren = false;
  let verlorenGrund: 'vorjahr' | 'laufendes_jahr' | null = null;

  for (let i = 0; i < bruttoumsaetzeJeJahr.length; i++) {
    const umsatzLaufendesJahr = bruttoumsaetzeJeJahr[i] ?? 0;
    const vorjahresumsatz = i > 0 ? (bruttoumsaetzeJeJahr[i - 1] ?? 0) : 0;
    const schwelleGerissenLaufend = umsatzLaufendesJahr > rg.kleinunternehmerLaufendesJahrGrenze;

    if (!startAlsKleinunternehmer) {
      ergebnisse.push({
        jahr: i,
        kleinunternehmer: false,
        vorjahresumsatz,
        umsatzLaufendesJahr,
        schwelleGerissen: schwelleGerissenLaufend,
        grund: 'manuell_aus',
      });
      continue;
    }

    if (verloren) {
      ergebnisse.push({
        jahr: i,
        kleinunternehmer: false,
        vorjahresumsatz,
        umsatzLaufendesJahr,
        schwelleGerissen: schwelleGerissenLaufend,
        grund: verlorenGrund,
      });
      continue;
    }

    if (vorjahresumsatz > rg.kleinunternehmerVorjahresgrenze) {
      verloren = true;
      verlorenGrund = 'vorjahr';
      ergebnisse.push({
        jahr: i,
        kleinunternehmer: false,
        vorjahresumsatz,
        umsatzLaufendesJahr,
        schwelleGerissen: schwelleGerissenLaufend,
        grund: 'vorjahr',
      });
      continue;
    }

    if (schwelleGerissenLaufend) {
      verloren = true;
      verlorenGrund = 'laufendes_jahr';
      ergebnisse.push({
        jahr: i,
        kleinunternehmer: false,
        vorjahresumsatz,
        umsatzLaufendesJahr,
        schwelleGerissen: true,
        grund: 'laufendes_jahr',
      });
      continue;
    }

    ergebnisse.push({
      jahr: i,
      kleinunternehmer: true,
      vorjahresumsatz,
      umsatzLaufendesJahr,
      schwelleGerissen: false,
      grund: null,
    });
  }

  return ergebnisse;
}

/** Abziehbare Vorsteuer aus Kostenpositionen, 0 wenn Kleinunternehmer. */
export function vorsteuer(bruttokosten: Euro, abzugsfaehig: boolean, rg: Rechtsgroessen): Euro {
  if (!abzugsfaehig) return 0;
  return bruttokosten - bruttokosten / (1 + rg.ustRegelsatz);
}
