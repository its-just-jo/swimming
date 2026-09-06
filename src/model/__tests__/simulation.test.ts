import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../defaults';
import { baselineSzenario, berechneJahr, berechneSzenario } from '../simulation';
import type { Szenario } from '../typen';

describe('berechneSzenario: Gesamtlauf', () => {
  const szenario = szenarioDefault('test-1');

  it('liefert ein Jahresergebnis je Horizontjahr und 12 Monatsergebnisse je Jahr', () => {
    const ergebnis = berechneSzenario(szenario);
    expect(ergebnis.jahre).toHaveLength(szenario.simulation.horizontJahre);
    expect(ergebnis.monate).toHaveLength(szenario.simulation.horizontJahre * 12);
    expect(ergebnis.jahre[0]?.jahr).toBe(0);
    expect(ergebnis.jahre[0]?.kalenderjahr).toBe(2026);
  });

  it('kumuliert den Cashflow monatsweise ueber den gesamten Horizont', () => {
    const ergebnis = berechneSzenario(szenario);
    let laufend = 0;
    for (const monat of ergebnis.monate) {
      laufend += monat.cashflow;
      expect(monat.kumuliert).toBeCloseTo(laufend, 6);
    }
  });

  it('bleibt unter dem Leistungsbudget von 20 ms je Durchlauf', () => {
    // Ein Aufwaermlauf, damit die JIT-Kompilierung die Messung nicht verzerrt.
    berechneSzenario(szenario);
    const start = performance.now();
    berechneSzenario(szenario);
    const dauer = performance.now() - start;
    expect(dauer).toBeLessThan(20);
  });
});

describe('baselineSzenario', () => {
  const szenario = szenarioDefault('test-2');

  it('deaktiviert alle Kursprodukte und jede Lehrtaetigkeit', () => {
    const baseline = baselineSzenario(szenario);
    expect(baseline.produkte.every((p) => !p.aktiv)).toBe(true);
    expect(baseline.lehre.lehrauftragAktiv).toBe(false);
    expect(baseline.lehre.professurAktiv).toBe(false);
    expect(baseline.anstellung.beschaeftigungsgrad).toBe(1.0);
  });

  it('das Gesamtnetto der Baseline entspricht ihrem eigenen baselineNetto', () => {
    // baselineSzenario deaktiviert nur Produkte und Lehrtaetigkeit — Fixkosten
    // und Investitionen laufen unveraendert weiter (sie sind kein Teil der
    // Definition in UMSETZUNG.md AP 10), daher ist gewinnVorSteuern hier
    // typischerweise negativ, nicht 0.
    const baseline = baselineSzenario(szenario);
    const jahr = berechneJahr(baseline, 0);
    expect(jahr.gesamtnetto).toBeCloseTo(jahr.baselineNetto, 6);
    expect(jahr.gewinn.deckungsbeitragSumme).toBe(0);
  });
});

describe('Kapazitaetsueberschreitung wird gemeldet, nicht stillschweigend gedeckelt', () => {
  it('setzt ueberschreitung, ohne den geplanten Erloes zu kappen', () => {
    const basis = szenarioDefault('test-3');
    // Nachfrage massiv ueber das verfuegbare Kontingent heben, indem alle
    // Produkte auf sehr viele Zyklen gestellt werden, bei unveraendertem
    // (kleinem) Wasserzeitkontingent.
    const ueberlastet: Szenario = {
      ...basis,
      wasser: { ...basis.wasser, wasserstundenProWoche: 2, aktiveWochenFreibad: 4, aktiveWochenHalle: 4 },
      produkte: basis.produkte.map((p) => ({ ...p, aktiv: true, zyklenProJahr: 50 })),
    };
    const jahr = berechneJahr(ueberlastet, 0);
    expect(jahr.kapazitaet.ueberschreitung).toBe(true);
    // Der geplante (nicht gedeckelte) Erloes bleibt in den Produktergebnissen
    // sichtbar, statt still auf die Kapazitaet reduziert zu werden.
    const geplanterErloes = jahr.produkte.reduce((summe, p) => summe + p.erloesBrutto, 0);
    expect(geplanterErloes).toBeGreaterThan(0);
    expect(jahr.kapazitaet.benoetigtGesamt).toBeGreaterThan(jahr.kapazitaet.verfuegbarGesamt);
  });
});
