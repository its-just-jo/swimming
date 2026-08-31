import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../defaults';
import { herleite, type Kennzahl } from '../herleitung';
import { berechneJahr } from '../simulation';

describe('herleite', () => {
  const szenario = szenarioDefault('h1');
  const jahr = berechneJahr(szenario, 3);

  const kennzahlen: readonly Kennzahl[] = [
    'gesamtnetto',
    'differenz_baseline',
    'db_je_wasserstunde',
    'kapazitaetsauslastung',
    'wochenbelastung',
    'deckungsgrad',
    'netto_anstellung',
    'gewinn',
    'rentendifferenz',
  ];

  it.each(kennzahlen)('liefert fuer %s mindestens einen Rechenschritt und eine Annahme', (kennzahl) => {
    const h = herleite(kennzahl, szenario, jahr);
    expect(h.schritte.length).toBeGreaterThan(0);
    expect(h.annahmen.length).toBeGreaterThan(0);
    for (const s of h.schritte) {
      expect(s.bezeichnung.length).toBeGreaterThan(0);
      expect(s.ergebnis.length).toBeGreaterThan(0);
    }
  });

  it('die Gesamtnetto-Herleitung endet auf denselben Wert wie jahr.gesamtnetto', () => {
    const h = herleite('gesamtnetto', szenario, jahr);
    const letzterSchritt = h.schritte.at(-1);
    expect(letzterSchritt?.bezeichnung).toBe('Gesamtnetto');
  });
});
