import { describe, expect, it } from 'vitest';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import { berechneDrvBeitrag } from '../steuer/rentenversicherung';

/**
 * § 2 Satz 1 Nr. 1 SGB VI: selbststaendige Lehrer sind rentenversicherungspflichtig
 * mit dem vollen Beitragssatz (18,6 %) auf das Arbeitseinkommen, weil anders als
 * bei der Anstellung kein Arbeitgeberanteil existiert (ARCHITEKTUR.md 1.6).
 */
describe('Rentenversicherungspflicht selbststaendiger Lehrer', () => {
  it('ist 0, wenn der Schalter drvPflicht aus ist', () => {
    const e = berechneDrvBeitrag({
      gewinn: 30_000,
      bruttolohn: 42_500,
      drvPflicht: false,
      befreiungExistenzgruender: false,
      befreiungBisMonat: 0,
      monatImHorizont: 10,
      rg: RG,
    });
    expect(e.pflichtig).toBe(false);
    expect(e.befreiungsgrund).toBe('abgeschaltet');
    expect(e.beitrag).toBe(0);
  });

  it('rechnet 18,6 % auf den vollen Gewinn, wenn die BBG nicht erreicht wird', () => {
    // Rest-BBG = 96.600 - 42.500 = 54.100 > Gewinn 30.000 -> volle Bemessung.
    // Beitrag = 30.000 * 18,6 % = 5.580,00
    const e = berechneDrvBeitrag({
      gewinn: 30_000,
      bruttolohn: 42_500,
      drvPflicht: true,
      befreiungExistenzgruender: false,
      befreiungBisMonat: 0,
      monatImHorizont: 100,
      rg: RG,
    });
    expect(e.pflichtig).toBe(true);
    expect(e.befreiungsgrund).toBeNull();
    expect(e.bemessungsgrundlage).toBeCloseTo(30_000, 2);
    expect(e.beitrag).toBeCloseTo(5_580, 2);
  });

  it('deckelt die Bemessungsgrundlage auf die verbleibende BBG RV/ALV', () => {
    // Rest-BBG = 96.600 - 42.500 = 54.100 < Gewinn 90.000 -> gedeckelt.
    // Beitrag = 54.100 * 18,6 % = 10.062,60
    const e = berechneDrvBeitrag({
      gewinn: 90_000,
      bruttolohn: 42_500,
      drvPflicht: true,
      befreiungExistenzgruender: false,
      befreiungBisMonat: 0,
      monatImHorizont: 100,
      rg: RG,
    });
    expect(e.bemessungsgrundlage).toBeCloseTo(54_100, 2);
    expect(e.beitrag).toBeCloseTo(10_062.6, 2);
  });

  it('das Arbeitsentgelt kann die BBG bereits ausschoepfen — dann bleibt kein Restraum', () => {
    const e = berechneDrvBeitrag({
      gewinn: 20_000,
      bruttolohn: 96_600,
      drvPflicht: true,
      befreiungExistenzgruender: false,
      befreiungBisMonat: 0,
      monatImHorizont: 100,
      rg: RG,
    });
    expect(e.bemessungsgrundlage).toBe(0);
    expect(e.beitrag).toBe(0);
  });

  it('befreit Existenzgruender innerhalb der Frist des § 6 Abs. 1a SGB VI', () => {
    const e = berechneDrvBeitrag({
      gewinn: 30_000,
      bruttolohn: 42_500,
      drvPflicht: true,
      befreiungExistenzgruender: true,
      befreiungBisMonat: 36,
      monatImHorizont: 10,
      rg: RG,
    });
    expect(e.pflichtig).toBe(false);
    expect(e.befreiungsgrund).toBe('existenzgruender');
    expect(e.beitrag).toBe(0);
  });

  it('die Existenzgruenderbefreiung endet mit dem Befreiungsmonat', () => {
    const e = berechneDrvBeitrag({
      gewinn: 30_000,
      bruttolohn: 42_500,
      drvPflicht: true,
      befreiungExistenzgruender: true,
      befreiungBisMonat: 36,
      monatImHorizont: 40,
      rg: RG,
    });
    expect(e.pflichtig).toBe(true);
    expect(e.befreiungsgrund).toBeNull();
    expect(e.beitrag).toBeCloseTo(5_580, 2);
  });

  it('befreit unterhalb der Geringfuegigkeitsgrenze (556 EUR/Monat = 6.672 EUR/Jahr)', () => {
    const e = berechneDrvBeitrag({
      gewinn: 5_000,
      bruttolohn: 42_500,
      drvPflicht: true,
      befreiungExistenzgruender: false,
      befreiungBisMonat: 0,
      monatImHorizont: 100,
      rg: RG,
    });
    expect(e.pflichtig).toBe(false);
    expect(e.befreiungsgrund).toBe('geringfuegig');
    expect(e.beitrag).toBe(0);
  });

  it('erzeugt bei negativem Gewinn keinen negativen Beitrag', () => {
    const e = berechneDrvBeitrag({
      gewinn: -5_000,
      bruttolohn: 42_500,
      drvPflicht: true,
      befreiungExistenzgruender: false,
      befreiungBisMonat: 0,
      monatImHorizont: 100,
      rg: RG,
    });
    expect(e.beitrag).toBe(0);
    expect(e.bemessungsgrundlage).toBe(0);
  });
});
