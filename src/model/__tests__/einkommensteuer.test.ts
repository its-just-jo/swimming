import { describe, expect, it } from 'vitest';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import {
  einkommensteuerGrundtarif,
  grenzbelastung,
  kirchensteuer,
  solidaritaetszuschlag,
} from '../steuer/einkommensteuer';

/**
 * Erwartungswerte sind von Hand nach § 32a Abs. 1 EStG (Rechtsstand 2025)
 * gerechnet. Der Rechenweg steht jeweils im Kommentar, damit ein Fehler in der
 * Implementierung nicht versehentlich in den Test uebernommen wird.
 */
describe('Einkommensteuer Grundtarif 2025', () => {
  it('Nullzone: bis zum Grundfreibetrag faellt keine Steuer an', () => {
    expect(einkommensteuerGrundtarif(0, RG)).toBe(0);
    expect(einkommensteuerGrundtarif(12_096, RG)).toBe(0);
  });

  it('Zone 2 direkt oberhalb des Grundfreibetrags rundet auf 0 EUR ab', () => {
    // y = 1/10000 = 0,0001 -> (932,30 * 0,0001 + 1400) * 0,0001 = 0,14 EUR
    // § 32a Abs. 1 Satz 6 EStG: Abrundung auf den naechsten vollen Euro.
    expect(einkommensteuerGrundtarif(12_097, RG)).toBe(0);
  });

  it('Zone 3: zvE 50.000 EUR', () => {
    // z = (50000 - 17443) / 10000 = 3,2557
    // (176,64 * 3,2557 + 2397) * 3,2557 + 1015,13
    // = (575,087 + 2397) * 3,2557 + 1015,13 = 9676,22 + 1015,13 = 10.691,35
    expect(einkommensteuerGrundtarif(50_000, RG)).toBe(10_691);
  });

  it('Zone 4: zvE 85.000 EUR', () => {
    // 0,42 * 85000 - 10911,92 = 35700 - 10911,92 = 24.788,08
    expect(einkommensteuerGrundtarif(85_000, RG)).toBe(24_788);
  });

  it('Zone 5: zvE 300.000 EUR', () => {
    // 0,45 * 300000 - 19246,67 = 135000 - 19246,67 = 115.753,33
    expect(einkommensteuerGrundtarif(300_000, RG)).toBe(115_753);
  });

  it('Tarif ist an den Zonengrenzen stetig', () => {
    // Diese Pruefung faellt auf, sobald eine Tarifkonstante falsch uebernommen
    // wurde — der haeufigste Fehler bei der jaehrlichen Aktualisierung.
    for (const grenze of [17_443, 68_480, 277_825]) {
      const links = einkommensteuerGrundtarif(grenze, RG);
      const rechts = einkommensteuerGrundtarif(grenze + 1, RG);
      expect(rechts - links).toBeLessThan(1);
      expect(rechts - links).toBeGreaterThanOrEqual(0);
    }
  });

  it('Tarif ist monoton steigend', () => {
    let vorher = -1;
    for (let zvE = 0; zvE <= 300_000; zvE += 2_500) {
      const jetzt = einkommensteuerGrundtarif(zvE, RG);
      expect(jetzt).toBeGreaterThanOrEqual(vorher);
      vorher = jetzt;
    }
  });
});

describe('Solidaritaetszuschlag mit Freigrenze und Milderungszone', () => {
  it('unterhalb der Freigrenze faellt kein Soli an', () => {
    expect(solidaritaetszuschlag(10_691, RG)).toBe(0);
    expect(solidaritaetszuschlag(19_950, RG)).toBe(0);
  });

  it('Milderungszone begrenzt den Soli auf 11,9 % des Ueberhangs', () => {
    // ESt 24.788: 5,5 % = 1363,34; Milderung 11,9 % * (24788 - 19950) = 575,72
    expect(solidaritaetszuschlag(24_788, RG)).toBeCloseTo(575.72, 2);
  });

  it('oberhalb der Milderungszone gelten volle 5,5 %', () => {
    // ESt 60.000: 5,5 % = 3300; Milderung 11,9 % * 40050 = 4765,95 -> 3300 greift
    expect(solidaritaetszuschlag(60_000, RG)).toBeCloseTo(3_300, 2);
  });
});

describe('Kirchensteuer', () => {
  it('ist 0, wenn nicht kirchensteuerpflichtig', () => {
    expect(kirchensteuer(24_788, false, RG)).toBe(0);
  });

  it('betraegt 8 % der Einkommensteuer in Baden-Wuerttemberg', () => {
    expect(kirchensteuer(24_788, true, RG)).toBeCloseTo(1_983.04, 2);
  });
});

describe('Grenzbelastung', () => {
  it('liegt bei 85.000 EUR zvE knapp ueber dem Spitzensatz der Zone 4', () => {
    // 42 % ESt zuzueglich Soli in der Milderungszone (11,9 % auf den ESt-Zuwachs)
    // -> rund 42 % * 1,119 = 47,0 %
    expect(grenzbelastung(85_000, false, RG)).toBeGreaterThan(0.46);
    expect(grenzbelastung(85_000, false, RG)).toBeLessThan(0.48);
  });

  it('ist im Grundfreibetrag 0', () => {
    expect(grenzbelastung(10_000, false, RG)).toBe(0);
  });

  it('steigt mit Kirchensteuerpflicht', () => {
    expect(grenzbelastung(85_000, true, RG)).toBeGreaterThan(
      grenzbelastung(85_000, false, RG),
    );
  });
});
