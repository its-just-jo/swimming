/**
 * Sozialversicherung der Anstellung und Beitragsfolgen der Selbststaendigkeit.
 *
 * Der KV-Status entscheidet ueber die entscheidende Kante des gesamten Modells:
 *
 *  gkv_pflicht     Beitrag nur auf Arbeitsentgelt bis zur BBG. Selbststaendige
 *                  Nebeneinkuenfte bleiben beitragsfrei — bis die
 *                  Selbststaendigkeit hauptberuflich wird (§ 5 Abs. 5 SGB V).
 *                  Genau dieser Umschlagpunkt entscheidet ueber die Stufen 60 %
 *                  und 50 %, nicht die Beitragsbemessungsgrenze.
 *  gkv_freiwillig  Beitrag auf alle Einnahmen bis zur BBG (§ 240 SGB V).
 *                  Hier gilt die in der Spezifikation beschriebene BBG-Kante:
 *                  Nebeneinkuenfte sind beitragsfrei, solange der Lohn die BBG
 *                  allein ausschoepft.
 *  pkv             Festbeitrag, Arbeitgeberzuschuss = min(halber PKV-Beitrag,
 *                  halber GKV-Hoechstbeitrag).
 */

import type { Rechtsgroessen } from '../konstanten';
import type { Euro, KvStatus, SozialversicherungErgebnis, Stunden } from '../typen';

/** Arbeitnehmeranteile aus dem Arbeitsentgelt, je Zweig mit eigener BBG. */
export function svBeitraegeArbeitnehmer(eingabe: {
  bruttolohn: Euro;
  kvStatus: KvStatus;
  pkvBeitragProMonat: Euro;
  kinderlosZuschlagPflege: boolean;
  rg: Rechtsgroessen;
}): SozialversicherungErgebnis {
  void eingabe;
  throw new Error('svBeitraegeArbeitnehmer: nicht implementiert');
}

/**
 * Krankenversicherungsbeitrag auf selbststaendige Einkuenfte.
 * Bei `gkv_pflicht` immer 0, solange nicht hauptberuflich selbststaendig.
 * Bei `gkv_freiwillig` auf den noch nicht durch Lohn ausgeschoepften Teil der BBG.
 */
export function kvAufSelbstaendigkeit(eingabe: {
  bruttolohn: Euro;
  gewinn: Euro;
  kvStatus: KvStatus;
  hauptberuflichSelbstaendig: boolean;
  rg: Rechtsgroessen;
}): Euro {
  void eingabe;
  throw new Error('kvAufSelbstaendigkeit: nicht implementiert');
}

/**
 * Pruefung der Hauptberuflichkeit nach § 5 Abs. 5 SGB V.
 * Indizien: Arbeitszeit der Selbststaendigkeit uebersteigt die der Beschaeftigung
 * ODER das Arbeitseinkommen uebersteigt das Arbeitsentgelt. Beide Indizien
 * werden geprueft; erfuellt eines, ist die Warnung auszuloesen.
 */
export function istHauptberuflichSelbstaendig(eingabe: {
  stundenSelbstaendigkeit: Stunden;
  stundenAnstellung: Stunden;
  gewinn: Euro;
  bruttolohn: Euro;
}): { hauptberuflich: boolean; grundZeit: boolean; grundEinkommen: boolean } {
  void eingabe;
  throw new Error('istHauptberuflichSelbstaendig: nicht implementiert');
}
