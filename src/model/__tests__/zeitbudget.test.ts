import { describe, expect, it } from 'vitest';
import { ANSTELLUNG_DEFAULT, WASSER_DEFAULT } from '../defaults';
import { berechneZeitbudget } from '../zeitbudget';

describe('Wochenbelastung', () => {
  const basis = {
    wasser: WASSER_DEFAULT,
    eigeneWasserstundenProJahr: 320, // 8 h/Woche bei 40 aktiven Wochen
    mittlereTerminlaengeStunden: 0.75, // 45-Minuten-Termine
    aktiveWochen: 40,
    warnschwelle: 55,
  };

  it('80 % Beschaeftigungsgrad bleibt unter der Warnschwelle', () => {
    // Hauptjob      40 h * 0,8                     = 32,00
    // Wasserzeit    320 / 40                       =  8,00
    // Vorbereitung  8 * 0,4                        =  3,20
    // Anfahrt       (8 / 0,75) * 0,5 h             =  5,33
    // Admin                                        =  2,00
    // Summe                                        = 50,53
    const e = berechneZeitbudget({
      ...basis,
      anstellung: { ...ANSTELLUNG_DEFAULT, beschaeftigungsgrad: 0.8 },
    });
    expect(e.hauptjobStunden).toBeCloseTo(32, 2);
    expect(e.wasserstunden).toBeCloseTo(8, 2);
    expect(e.vorbereitung).toBeCloseTo(3.2, 2);
    expect(e.anfahrt).toBeCloseTo(5.333, 2);
    expect(e.gesamtProWoche).toBeCloseTo(50.533, 2);
    expect(e.ueberSchwelle).toBe(false);
  });

  it('Vollzeit neben acht Wasserstunden reisst die Schwelle', () => {
    // 40 + 8 + 3,2 + 5,33 + 2 = 58,53 > 55
    const e = berechneZeitbudget({
      ...basis,
      anstellung: { ...ANSTELLUNG_DEFAULT, beschaeftigungsgrad: 1.0 },
    });
    expect(e.gesamtProWoche).toBeCloseTo(58.533, 2);
    expect(e.ueberSchwelle).toBe(true);
  });

  it('laengere Termine senken die Anfahrtszeit', () => {
    // 60-Minuten-Termine: (8 / 1,0) * 0,5 = 4,0 statt 5,33
    const e = berechneZeitbudget({
      ...basis,
      mittlereTerminlaengeStunden: 1.0,
      anstellung: { ...ANSTELLUNG_DEFAULT, beschaeftigungsgrad: 0.8 },
    });
    expect(e.anfahrt).toBeCloseTo(4, 2);
  });

  it('Stunden von Fremdlehrkraeften belasten das eigene Budget nicht', () => {
    // Nur `eigeneWasserstundenProJahr` geht ein — der Aufrufer filtert
    // fremd durchgefuehrte Produkte heraus.
    const e = berechneZeitbudget({
      ...basis,
      eigeneWasserstundenProJahr: 0,
      anstellung: { ...ANSTELLUNG_DEFAULT, beschaeftigungsgrad: 0.8 },
    });
    expect(e.gesamtProWoche).toBeCloseTo(34, 2);
  });
});
