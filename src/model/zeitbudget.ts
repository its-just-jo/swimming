/**
 * Wochenbelastung, Abschnitt 4.5.
 *
 *   gesamt = Hauptjobstunden
 *          + eigene Wasserstunden x (1 + Vorbereitungsfaktor)
 *          + Anfahrt
 *          + Adminpauschale
 *
 * Anfahrt: Die Zahl der Kurstermine je Woche wird aus den eigenen
 * Wasserstunden und der mengengewichteten mittleren Termindauer abgeleitet.
 * Ein 45-Minuten-Termin bedeutet bei acht Wasserstunden rund elf Anfahrten
 * je Woche — dieser Effekt ist gross genug, um ihn nicht zu pauschalieren.
 */

import type { Anstellung, ProduktErgebnis, Stunden, Wasserkapazitaet, ZeitbudgetErgebnis } from './typen';

/** Mengengewichtete mittlere Dauer eines Kurstermins in Stunden. */
export function mittlereTerminlaenge(produktErgebnisse: readonly ProduktErgebnis[], produkte: readonly { id: string; dauerJeEinheitMinuten: number }[]): Stunden {
  let stundenGesamt = 0;
  let minutenGewichtet = 0;

  for (const ergebnis of produktErgebnisse) {
    if (ergebnis.durchfuehrung === 'fremdlehrkraft') continue;
    const produkt = produkte.find((p) => p.id === ergebnis.produktId);
    if (!produkt) continue;
    stundenGesamt += ergebnis.wasserzeitGesamt;
    minutenGewichtet += ergebnis.wasserzeitGesamt * produkt.dauerJeEinheitMinuten;
  }

  if (stundenGesamt === 0) return 0;
  return minutenGewichtet / stundenGesamt / 60;
}

export function berechneZeitbudget(eingabe: {
  anstellung: Anstellung;
  wasser: Wasserkapazitaet;
  eigeneWasserstundenProJahr: Stunden;
  mittlereTerminlaengeStunden: Stunden;
  aktiveWochen: number;
  warnschwelle: Stunden;
}): ZeitbudgetErgebnis {
  const { anstellung, wasser, eigeneWasserstundenProJahr, mittlereTerminlaengeStunden, aktiveWochen, warnschwelle } =
    eingabe;

  const hauptjobStunden = anstellung.wochenstundenVollzeit * anstellung.beschaeftigungsgrad;
  const wasserstunden = aktiveWochen > 0 ? eigeneWasserstundenProJahr / aktiveWochen : 0;
  const vorbereitung = wasserstunden * wasser.vorbereitungsfaktor;
  const termineProWoche =
    mittlereTerminlaengeStunden > 0 ? wasserstunden / mittlereTerminlaengeStunden : 0;
  const anfahrt = termineProWoche * wasser.anfahrtJeTermin;
  const admin = wasser.adminStundenProWoche;

  const gesamtProWoche = hauptjobStunden + wasserstunden + vorbereitung + anfahrt + admin;

  return {
    hauptjobStunden,
    wasserstunden,
    vorbereitung,
    anfahrt,
    admin,
    gesamtProWoche,
    ueberSchwelle: gesamtProWoche > warnschwelle,
  };
}
