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
  const {
    gewinn,
    bruttolohn,
    drvPflicht,
    befreiungExistenzgruender,
    befreiungBisMonat,
    monatImHorizont,
    rg,
  } = eingabe;

  if (!drvPflicht) {
    return { pflichtig: false, befreiungsgrund: 'abgeschaltet', bemessungsgrundlage: 0, beitrag: 0 };
  }

  // Bemessungsgrundlage: der Gewinn, gedeckelt auf die BBG RV/ALV abzueglich
  // des bereits durch die Anstellung ausgeschoepften Teils. Ein Verlust
  // erzeugt keinen negativen Beitrag.
  const restraumBbg = Math.max(0, rg.bbgRvAlv - Math.min(bruttolohn, rg.bbgRvAlv));
  const bemessungsgrundlage = Math.max(0, Math.min(gewinn, restraumBbg));

  if (befreiungExistenzgruender && monatImHorizont < befreiungBisMonat) {
    return {
      pflichtig: false,
      befreiungsgrund: 'existenzgruender',
      bemessungsgrundlage,
      beitrag: 0,
    };
  }

  const geringfuegigkeitsgrenzeJahr = rg.geringfuegigkeitsgrenzeMonat * 12;
  if (gewinn < geringfuegigkeitsgrenzeJahr) {
    return { pflichtig: false, befreiungsgrund: 'geringfuegig', bemessungsgrundlage, beitrag: 0 };
  }

  const beitrag = Math.round(bemessungsgrundlage * rg.rvSatz * 100) / 100;
  return { pflichtig: true, befreiungsgrund: null, bemessungsgrundlage, beitrag };
}
