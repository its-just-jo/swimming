/**
 * Rentenversicherungspflicht selbststaendiger Lehrer, § 2 Satz 1 Nr. 1 SGB VI.
 *
 * Beitragssatz auf das Arbeitseinkommen (den Gewinn), gedeckelt auf die BBG
 * RV/ALV abzueglich der bereits aus der Anstellung verbeitragten Entgelte.
 *
 * Befreiungstatbestaende:
 *  - § 6 Abs. 1a SGB VI: Existenzgruender, befristet (Default 36 Monate).
 *  - § 5 Abs. 2 SGB VI: Arbeitseinkommen unterhalb der Geringfuegigkeitsgrenze.
 */

import type { Rechtsgroessen } from '../konstanten';
import type { Euro, MonatsIndex } from '../typen';

export interface DrvErgebnis {
  readonly pflichtig: boolean;
  readonly befreiungsgrund: 'existenzgruender' | 'geringfuegig' | 'abgeschaltet' | null;
  readonly bemessungsgrundlage: Euro;
  readonly beitrag: Euro;
}

export function berechneDrvBeitrag(eingabe: {
  gewinn: Euro;
  bruttolohn: Euro;
  drvPflicht: boolean;
  befreiungExistenzgruender: boolean;
  befreiungBisMonat: MonatsIndex;
  monatImHorizont: MonatsIndex;
  rg: Rechtsgroessen;
}): DrvErgebnis {
  void eingabe;
  throw new Error('berechneDrvBeitrag: nicht implementiert');
}
