import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../defaults';
import { berechneSzenario } from '../simulation';
import { ermittleWarnungen } from '../warnungen';
import type { Szenario } from '../typen';

describe('ermittleWarnungen', () => {
  it('meldet fehlenden Hallenbadzugang bei aktiven Ganzjahresprodukten', () => {
    const szenario = szenarioDefault('w1');
    expect(szenario.wasser.hallenbadzugang).toBe(false);
    const ergebnis = berechneSzenario(szenario);
    const warnungen = ermittleWarnungen(szenario, ergebnis);
    expect(warnungen.some((w) => w.code === 'kein_hallenbad_ganzjahresumsatz')).toBe(true);
    // Kritisch steht vorne.
    expect(warnungen[0]?.stufe).toBe('kritisch');
  });

  it('meldet keine fehlende Halle, wenn Hallenbadzugang besteht', () => {
    const basis = szenarioDefault('w2');
    const szenario: Szenario = { ...basis, wasser: { ...basis.wasser, hallenbadzugang: true, hallenbadAbMonat: 0 } };
    const ergebnis = berechneSzenario(szenario);
    const warnungen = ermittleWarnungen(szenario, ergebnis);
    expect(warnungen.some((w) => w.code === 'kein_hallenbad_ganzjahresumsatz')).toBe(false);
  });

  it('meldet die Unvereinbarkeit von Uebungsleiterpauschale und eigenen Kursprodukten', () => {
    const basis = szenarioDefault('w3');
    const szenario: Szenario = {
      ...basis,
      steuer: { ...basis.steuer, uebungsleiterpauschale: true },
    };
    const ergebnis = berechneSzenario(szenario);
    const warnungen = ermittleWarnungen(szenario, ergebnis);
    expect(warnungen.some((w) => w.code === 'uebungsleiter_unvereinbar' && w.stufe === 'kritisch')).toBe(true);
  });

  it('enthaelt immer den Dauerhinweis zu ungeprueften Rechtsgroessen', () => {
    const szenario = szenarioDefault('w4');
    const ergebnis = berechneSzenario(szenario);
    const warnungen = ermittleWarnungen(szenario, ergebnis);
    expect(warnungen.some((w) => w.code === 'rechtsgroessen_ungeprueft')).toBe(true);
  });

  it('meldet Kapazitaetsueberschreitung bei kuenstlich ueberlasteter Wasserzeit', () => {
    const basis = szenarioDefault('w5');
    const szenario: Szenario = {
      ...basis,
      wasser: { ...basis.wasser, wasserstundenProWoche: 2, aktiveWochenFreibad: 4, aktiveWochenHalle: 4 },
      produkte: basis.produkte.map((p) => ({ ...p, aktiv: true, zyklenProJahr: 50 })),
    };
    const ergebnis = berechneSzenario(szenario);
    const warnungen = ermittleWarnungen(szenario, ergebnis);
    expect(warnungen.some((w) => w.code === 'kapazitaet_ueberschritten')).toBe(true);
  });

  it('bbg_unterschritten erscheint nur bei gkv_freiwillig', () => {
    const basis = szenarioDefault('w6');
    const pflicht: Szenario = { ...basis, anstellung: { ...basis.anstellung, kvStatus: 'gkv_pflicht' } };
    const freiwillig: Szenario = {
      ...basis,
      anstellung: { ...basis.anstellung, kvStatus: 'gkv_freiwillig', beschaeftigungsgrad: 0.5 },
    };
    const wPflicht = ermittleWarnungen(pflicht, berechneSzenario(pflicht));
    const wFreiwillig = ermittleWarnungen(freiwillig, berechneSzenario(freiwillig));
    expect(wPflicht.some((w) => w.code === 'bbg_unterschritten')).toBe(false);
    expect(wFreiwillig.some((w) => w.code === 'bbg_unterschritten')).toBe(true);
  });
});
