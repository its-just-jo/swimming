/**
 * Drittes Standbein: Lehrauftrag und optionaler Professurpfad, Abschnitt 3.7.
 *
 * Lehrauftrag: LVS je Semester x Satz je LVS x 2 Semester. Einkuenfte aus
 * einem Lehrauftrag sind regelmaessig selbststaendige Einkuenfte nach § 18
 * EStG und fliessen in die gemeinsame Veranlagung ein. Sie unterliegen
 * grundsaetzlich ebenfalls der Rentenversicherungspflicht nach § 2 SGB VI.
 *
 * Professurpfad: ersetzt ab dem Startjahr die bisherige Anstellung. Das Modell
 * behandelt sie als regulaeres Beschaeftigungsverhaeltnis mit eigenem Brutto
 * und eigenem Beschaeftigungsgrad.
 */

import type { Euro, Lehre } from './typen';

/** Volle Jahreseinkuenfte, anteilig ab dem Startmonat innerhalb des Jahres. */
export function lehrauftragEinkuenfte(lehre: Lehre, jahrIndex: number): Euro {
  if (!lehre.lehrauftragAktiv) return 0;

  const jahresStart = jahrIndex * 12;
  const jahresEnde = jahresStart + 12;
  const aktivAb = Math.max(lehre.startmonat, jahresStart);
  const aktiveMonate = Math.min(12, Math.max(0, jahresEnde - aktivAb));
  const fraktion = aktiveMonate / 12;

  return lehre.lvsJeSemester * lehre.satzJeLvs * 2 * fraktion;
}

/** Bruttojahresentgelt der Professur, 0 vor dem konfigurierten Startjahr. */
export function professurBrutto(lehre: Lehre, jahrIndex: number): Euro {
  if (!lehre.professurAktiv) return 0;
  if (jahrIndex < lehre.professurStartjahr) return 0;
  return lehre.professurBruttoProJahr * lehre.professurBeschaeftigungsgrad;
}
