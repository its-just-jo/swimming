import { describe, expect, it } from 'vitest';
import { euro, euroMitVorzeichen, prozent, stunden, zahl } from '../format';

/**
 * Das einzige gruen laufende Testmodul dieses Gerüsts. Es sichert die
 * Formatregel aus Abschnitt 2 der Spezifikation ab und belegt zugleich, dass
 * die Testinfrastruktur funktioniert.
 */

/**
 * Intl trennt Betrag und Waehrungszeichen mit einem GESCHUETZTEN Leerzeichen
 * (U+00A0). Das ist erwuenscht — in den Zahlentabellen darf zwischen Betrag und
 * "EUR" kein Zeilenumbruch fallen. Fuer die Lesbarkeit der Erwartungswerte wird
 * es hier normalisiert; ein eigener Test sichert seine Anwesenheit ab.
 */
const n = (s: string) => s.replace(/\u00A0/g, ' ');

describe('Waehrungsformat de-DE', () => {
  it('zeigt Betraege ueber 1.000 EUR ohne Nachkommastellen', () => {
    expect(n(euro(97_500))).toBe('97.500 €');
    expect(n(euro(1_234.56))).toBe('1.235 €');
  });

  it('zeigt Betraege bis 1.000 EUR mit zwei Nachkommastellen', () => {
    expect(n(euro(105))).toBe('105,00 €');
    expect(n(euro(48.91))).toBe('48,91 €');
    expect(n(euro(1_000))).toBe('1.000,00 €');
  });

  it('behandelt negative Betraege symmetrisch', () => {
    expect(n(euro(-97_500))).toBe('-97.500 €');
    expect(n(euro(-105))).toBe('-105,00 €');
  });

  it('faengt nicht darstellbare Werte ab', () => {
    expect(n(euro(Number.NaN))).toBe('—');
    expect(n(euro(Number.POSITIVE_INFINITY))).toBe('—');
  });
});

describe('Differenzdarstellung', () => {
  it('setzt ein explizites Vorzeichen', () => {
    expect(n(euroMitVorzeichen(12_000))).toBe('+12.000 €');
    expect(n(euroMitVorzeichen(-12_000))).toBe('−12.000 €');
    expect(n(euroMitVorzeichen(0))).toBe('0,00 €');
  });
});

describe('Weitere Formate', () => {
  it('formatiert Quoten als Prozent', () => {
    expect(n(prozent(0.085))).toBe('8,5 %');
    expect(n(prozent(1))).toBe('100,0 %');
    expect(n(prozent(0.186, 2))).toBe('18,60 %');
  });

  it('formatiert Stunden', () => {
    expect(n(stunden(50.533))).toBe('50,5 h');
  });

  it('formatiert ganze Zahlen', () => {
    expect(zahl(3_000)).toBe('3.000');
    expect(zahl(2.5, 1)).toBe('2,5');
  });
});

describe('Geschütztes Leerzeichen', () => {
  it('trennt Betrag und Währungszeichen umbruchsicher', () => {
    expect(euro(97_500)).toContain('\u00A0');
    expect(prozent(0.085)).toContain('\u00A0');
  });
});
