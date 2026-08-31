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

/** Rundet auf den vollen Cent — Beitraege werden in der Lohnabrechnung centgenau ausgewiesen. */
function rundeCent(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}

/** Arbeitnehmeranteile aus dem Arbeitsentgelt, je Zweig mit eigener BBG. */
export function svBeitraegeArbeitnehmer(eingabe: {
  bruttolohn: Euro;
  kvStatus: KvStatus;
  pkvBeitragProMonat: Euro;
  kinderlosZuschlagPflege: boolean;
  rg: Rechtsgroessen;
}): SozialversicherungErgebnis {
  const { bruttolohn, kvStatus, pkvBeitragProMonat, kinderlosZuschlagPflege, rg } = eingabe;

  const bemessungKvPv = Math.min(bruttolohn, rg.bbgKvPv);
  const bemessungRvAlv = Math.min(bruttolohn, rg.bbgRvAlv);

  const pvArbeitnehmer = rundeCent(
    bemessungKvPv * (rg.pvSatz / 2 + (kinderlosZuschlagPflege ? rg.pvKinderlosZuschlag : 0)),
  );
  const rvArbeitnehmer = rundeCent(bemessungRvAlv * (rg.rvSatz / 2));
  const alvArbeitnehmer = rundeCent(bemessungRvAlv * (rg.alvSatz / 2));

  let kvArbeitnehmer: number;
  let pkvArbeitgeberzuschuss = 0;
  if (kvStatus === 'pkv') {
    const gkvHoechstbeitragHalbe =
      (rg.bbgKvPv * (rg.kvAllgemeinerSatz + rg.kvZusatzbeitragDurchschnitt)) / 2;
    const pkvJahresbeitrag = pkvBeitragProMonat * 12;
    pkvArbeitgeberzuschuss = rundeCent(Math.min(pkvJahresbeitrag / 2, gkvHoechstbeitragHalbe));
    kvArbeitnehmer = rundeCent(pkvJahresbeitrag - pkvArbeitgeberzuschuss);
  } else {
    kvArbeitnehmer = rundeCent(
      bemessungKvPv * (rg.kvAllgemeinerSatz / 2 + rg.kvZusatzbeitragDurchschnitt / 2),
    );
  }

  const gesamtArbeitnehmer = rundeCent(
    kvArbeitnehmer + pvArbeitnehmer + rvArbeitnehmer + alvArbeitnehmer,
  );

  return {
    kvArbeitnehmer,
    pvArbeitnehmer,
    rvArbeitnehmer,
    alvArbeitnehmer,
    gesamtArbeitnehmer,
    kvAufSelbstaendigkeit: 0,
    beitragsbemessungsgrenzeErreicht: bruttolohn >= rg.bbgKvPv,
    ueberJaeg: bruttolohn > rg.jaeg,
    pkvArbeitgeberzuschuss,
  };
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
  const { bruttolohn, gewinn, kvStatus, hauptberuflichSelbstaendig, rg } = eingabe;

  if (kvStatus === 'pkv') return 0;
  if (kvStatus === 'gkv_pflicht' && !hauptberuflichSelbstaendig) return 0;
  if (gewinn <= 0) return 0;

  // gkv_freiwillig sowie gkv_pflicht bei Hauptberuflichkeit: die
  // Selbststaendigkeit traegt den vollen Beitragssatz (kein Arbeitgeberanteil)
  // auf den noch nicht durch das Arbeitsentgelt ausgeschoepften Teil der BBG.
  const restraum = Math.max(0, rg.bbgKvPv - bruttolohn);
  const bemessung = Math.min(gewinn, restraum);
  return rundeCent(bemessung * (rg.kvAllgemeinerSatz + rg.kvZusatzbeitragDurchschnitt));
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
  const { stundenSelbstaendigkeit, stundenAnstellung, gewinn, bruttolohn } = eingabe;
  const grundZeit = stundenSelbstaendigkeit > stundenAnstellung;
  const grundEinkommen = gewinn > bruttolohn;
  return { hauptberuflich: grundZeit || grundEinkommen, grundZeit, grundEinkommen };
}
