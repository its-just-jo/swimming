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

export function lehrauftragEinkuenfte(lehre: Lehre, jahrIndex: number): Euro {
  void lehre; void jahrIndex;
  throw new Error('lehrauftragEinkuenfte: nicht implementiert');
}

export function professurBrutto(lehre: Lehre, jahrIndex: number): Euro {
  void lehre; void jahrIndex;
  throw new Error('professurBrutto: nicht implementiert');
}
