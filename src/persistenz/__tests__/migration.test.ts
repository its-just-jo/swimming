import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../../model/defaults';
import { migriere, normalisiere } from '../migration';

describe('normalisiere', () => {
  it('liefert null fuer nicht-objektartige Eingaben', () => {
    expect(normalisiere(null)).toBeNull();
    expect(normalisiere('text')).toBeNull();
    expect(normalisiere(42)).toBeNull();
    expect(normalisiere([1, 2, 3])).toBeNull();
  });

  it('ergaenzt fehlende Felder aus den Defaults', () => {
    const ergebnis = normalisiere({ id: 'x1', name: 'Halb ausgefuellt' });
    expect(ergebnis).not.toBeNull();
    expect(ergebnis?.id).toBe('x1');
    expect(ergebnis?.name).toBe('Halb ausgefuellt');
    expect(ergebnis?.anstellung.bruttogrundgehaltVollzeit).toBe(85_000);
    expect(ergebnis?.produkte.length).toBeGreaterThan(0);
  });

  it('verwirft unbekannte Felder', () => {
    const ergebnis = normalisiere({ id: 'x2', unbekanntesFeld: 'sollte verschwinden' });
    expect(ergebnis).not.toBeNull();
    expect(ergebnis).not.toHaveProperty('unbekanntesFeld');
  });

  it('verwirft Typabweichungen zugunsten des Defaults', () => {
    const ergebnis = normalisiere({
      id: 'x3',
      anstellung: { bruttogrundgehaltVollzeit: 'nicht-numerisch' },
    });
    expect(ergebnis?.anstellung.bruttogrundgehaltVollzeit).toBe(85_000);
  });

  it('fuellt Eintraege in Produktarrays gegen die Formvorlage des ersten Default-Produkts auf', () => {
    const ergebnis = normalisiere({
      id: 'x4',
      produkte: [{ id: 'p-eigen', bezeichnung: 'Mein Kurs', preisJeTeilnehmer: 999 }],
    });
    expect(ergebnis?.produkte).toHaveLength(1);
    expect(ergebnis?.produkte[0]?.id).toBe('p-eigen');
    expect(ergebnis?.produkte[0]?.preisJeTeilnehmer).toBe(999);
    // Fehlende Felder aus der Formvorlage (erstes Default-Produkt) ergaenzt.
    expect(ergebnis?.produkte[0]?.abrechnung).toBeDefined();
  });

  it('akzeptiert ein bereits gueltiges, vollstaendiges Szenario unveraendert in der Struktur', () => {
    const original = szenarioDefault('x5', 'Voll');
    const ergebnis = normalisiere(original);
    expect(ergebnis).toEqual(original);
  });
});

describe('migriere', () => {
  it('liefert das Objekt unveraendert, wenn keine Migrationsschritte noetig sind', () => {
    const roh = { id: 'm1', name: 'unveraendert' };
    expect(migriere(roh, 1)).toBe(roh);
  });
});
