import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../defaults';
import { berechneSensitivitaet, lenkeAus } from '../sensitivitaet';
import { berechneSzenario } from '../simulation';

describe('lenkeAus', () => {
  it('skaliert den Auslastungsgrad aller Produkte und begrenzt auf 1,0', () => {
    const szenario = szenarioDefault('s1');
    const ausgelenkt = lenkeAus(szenario, 'auslastungsgrad', 1.2);
    for (let i = 0; i < szenario.produkte.length; i++) {
      const original = szenario.produkte[i]!;
      const neu = ausgelenkt.produkte[i]!;
      expect(neu.auslastungsgrad).toBeCloseTo(Math.min(1, original.auslastungsgrad * 1.2), 6);
    }
  });

  it('skaliert die Beckenmiete je Stunde nur bei den Produkten, nicht global', () => {
    const szenario = szenarioDefault('s2');
    const ausgelenkt = lenkeAus(szenario, 'beckenmieteJeStunde', 0.8);
    expect(ausgelenkt.produkte[0]?.beckenmieteJeStunde).toBeCloseTo(
      szenario.produkte[0]!.beckenmieteJeStunde * 0.8,
      6,
    );
    expect(ausgelenkt.wasser).toEqual(szenario.wasser);
  });

  it('skaliert Fixkosten je Position', () => {
    const szenario = szenarioDefault('s3');
    const ausgelenkt = lenkeAus(szenario, 'fixkosten', 1.2);
    for (let i = 0; i < szenario.fixkosten.length; i++) {
      expect(ausgelenkt.fixkosten[i]!.betragProJahr).toBeCloseTo(
        szenario.fixkosten[i]!.betragProJahr * 1.2,
        6,
      );
    }
  });

  it('veraendert das Originalszenario nicht (rein, ohne Mutation)', () => {
    const szenario = szenarioDefault('s4');
    const kopie = JSON.parse(JSON.stringify(szenario));
    lenkeAus(szenario, 'wasserstundenProWoche', 1.2);
    expect(szenario).toEqual(kopie);
  });
});

describe('berechneSensitivitaet', () => {
  const szenario = szenarioDefault('s5');

  it('liefert eine Zeile je Variable, absteigend nach Spannweite sortiert', () => {
    const zeilen = berechneSensitivitaet(szenario, 'letztes_jahr');
    expect(zeilen.length).toBe(12);
    for (let i = 1; i < zeilen.length; i++) {
      expect(zeilen[i - 1]!.spannweite).toBeGreaterThanOrEqual(zeilen[i]!.spannweite);
    }
  });

  it('der Basiswert entspricht dem unveraenderten Szenario', () => {
    const zeilen = berechneSensitivitaet(szenario, 'letztes_jahr');
    const erwartet = berechneSzenario(szenario).jahre.at(-1)?.gesamtnetto ?? 0;
    for (const zeile of zeilen) {
      expect(zeile.basiswert).toBeCloseTo(erwartet, 2);
    }
  });

  it('bei_minus20 und bei_plus20 unterscheiden sich fuer eine wirksame Variable', () => {
    const zeilen = berechneSensitivitaet(szenario, 'letztes_jahr');
    const preis = zeilen.find((z) => z.variable === 'preisJeTeilnehmer');
    expect(preis).toBeDefined();
    expect(preis!.bei_plus20).toBeGreaterThan(preis!.bei_minus20);
  });
});
