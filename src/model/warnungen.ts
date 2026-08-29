/**
 * Warnsystem, Abschnitt 5. "Auffaellig, nicht dezent."
 *
 * Regelwerk als reine Funktion ueber dem Ergebnis. Warnungen werden nicht in
 * den Rechenfunktionen erzeugt, sondern nachgelagert aus dem Ergebnisobjekt
 * abgeleitet — so bleibt das Regelwerk an einer Stelle pruefbar und die
 * Sensitivitaetsanalyse muss es nicht mitrechnen.
 *
 * Stufen: 'kritisch' (gedecktes Rot), 'grenzwert' (Bernstein), 'hinweis'.
 */

import type { Ergebnis, Szenario, Warnung } from './typen';

/**
 * Vollstaendiges Regelwerk. Reihenfolge = Anzeigereihenfolge, kritisch zuerst.
 *
 *  kapazitaet_ueberschritten        benoetigte > verfuegbare Wasserstunden
 *  kein_hallenbad_ganzjahresumsatz  kein Hallenbadzugang, aber Ganzjahresprodukte aktiv
 *  hauptberuflich_selbstaendig      § 5 Abs. 5 SGB V — Statuswechsel droht
 *  ust_schwelle_gerissen            § 19 UStG Grenze ueberschritten
 *  bbg_unterschritten               nur bei kvStatus 'gkv_freiwillig' relevant
 *  jaeg_ueberschritten              Entgelt ueber JAEG, KV-Status pruefen
 *  deckungsgrad_unter_100           Luecke wird nicht geschlossen
 *  wochenbelastung_ueber_schwelle   ueber der konfigurierten Schwelle
 *  klumpenrisiko_produkt            > 60 % des DB aus einem Produkt
 *  uebungsleiter_unvereinbar        § 3 Nr. 26 EStG neben gewerblichem Modell
 *  rechtsgroessen_ungeprueft        Dauerhinweis, solange nicht quittiert
 */
export function ermittleWarnungen(szenario: Szenario, ergebnis: Ergebnis): readonly Warnung[] {
  void szenario; void ergebnis;
  throw new Error('ermittleWarnungen: nicht implementiert');
}
