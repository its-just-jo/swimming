import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../defaults';
import { berechneSzenario } from '../simulation';
import { buendleWarnungen, ermittleWarnungen, verdichteJahresLabel } from '../warnungen';
import type { Szenario, Warnung } from '../typen';

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

/**
 * Die fuenf Faelle aus design.md 6.1, woertlich aus der Tabelle uebernommen.
 * Bezugsrahmen ('alleJahreDesHorizonts') ist jeweils 2026..2035 (10 Jahre),
 * ausser beim Spezialfall "alle Jahre".
 */
describe('verdichteJahresLabel (design.md 6.1)', () => {
  const horizont10 = Array.from({ length: 10 }, (_, i) => 2026 + i);

  it('ein einzelnes Jahr', () => {
    expect(verdichteJahresLabel([2026], horizont10)).toBe('2026');
  });

  it('eine zusammenhaengende Gruppe', () => {
    expect(verdichteJahresLabel([2026, 2027, 2028], horizont10)).toBe('2026–2028');
  });

  it('zwei Gruppen mit Luecke', () => {
    expect(verdichteJahresLabel([2026, 2028, 2029, 2030], horizont10)).toBe('2026, 2028–2030');
  });

  it('mehr als drei Gruppen wird kompakt zusammengefasst', () => {
    // 2026, 2028, 2030, 2032, 2033, 2034, 2035, 2035(dupe entfernt) -> 4 Gruppen: 2026 / 2028 / 2030 / 2032-2035
    const jahre = [2026, 2028, 2030, 2032, 2033, 2034, 2035];
    expect(verdichteJahresLabel(jahre, horizont10)).toBe('2026–2035 · 7 Jahre');
  });

  it('alle Jahre des Horizonts', () => {
    expect(verdichteJahresLabel(horizont10, horizont10)).toBe('alle Jahre');
  });
});

function baueWarnung(teil: Partial<Warnung> & Pick<Warnung, 'code' | 'stufe'>): Warnung {
  return {
    titel: 'Titel',
    text: 'Text mit Jahr',
    textOhneJahr: 'Text ohne Jahr',
    ...teil,
  };
}

describe('buendleWarnungen (design.md 6.1)', () => {
  it('fasst mehrere Jahre desselben Codes zu einer Karte zusammen', () => {
    const warnungen: Warnung[] = [
      baueWarnung({ code: 'jaeg_ueberschritten', stufe: 'grenzwert', jahr: 2026 }),
      baueWarnung({ code: 'jaeg_ueberschritten', stufe: 'grenzwert', jahr: 2027 }),
      baueWarnung({ code: 'jaeg_ueberschritten', stufe: 'grenzwert', jahr: 2028 }),
    ];
    const gebuendelt = buendleWarnungen(warnungen);
    expect(gebuendelt).toHaveLength(1);
    expect(gebuendelt[0]?.jahre).toEqual([2026, 2027, 2028]);
    expect(gebuendelt[0]?.jahresLabel).toBe('alle Jahre');
    expect(gebuendelt[0]?.text).toBe('Text ohne Jahr');
    expect(gebuendelt[0]?.details).toHaveLength(3);
    expect(gebuendelt[0]?.details[0]).toEqual({ jahr: 2026, text: 'Text mit Jahr' });
  });

  it('behaelt globale (nicht jahresbezogene) Warnungen als eigene Karte mit leerem Label', () => {
    const warnungen: Warnung[] = [baueWarnung({ code: 'rechtsgroessen_ungeprueft', stufe: 'hinweis' })];
    const gebuendelt = buendleWarnungen(warnungen);
    expect(gebuendelt).toHaveLength(1);
    expect(gebuendelt[0]?.jahre).toEqual([]);
    expect(gebuendelt[0]?.jahresLabel).toBe('');
  });

  it('sortiert kritisch vor grenzwert vor hinweis', () => {
    const warnungen: Warnung[] = [
      baueWarnung({ code: 'rechtsgroessen_ungeprueft', stufe: 'hinweis' }),
      baueWarnung({ code: 'kapazitaet_ueberschritten', stufe: 'kritisch', jahr: 2026 }),
      baueWarnung({ code: 'jaeg_ueberschritten', stufe: 'grenzwert', jahr: 2026 }),
    ];
    const gebuendelt = buendleWarnungen(warnungen);
    expect(gebuendelt.map((w) => w.stufe)).toEqual(['kritisch', 'grenzwert', 'hinweis']);
  });

  it('reduziert das Default-Szenario auf deutlich weniger Karten als Einzelwarnungen', () => {
    const szenario = szenarioDefault('w7');
    const ergebnis = berechneSzenario(szenario);
    const einzeln = ermittleWarnungen(szenario, ergebnis);
    const gebuendelt = buendleWarnungen(einzeln);
    expect(einzeln.length).toBeGreaterThan(gebuendelt.length);
    // Jede Einzelwarnung muss in genau einem Buendel wiederzufinden sein.
    const summeDetails = gebuendelt.reduce((s, b) => s + Math.max(1, b.details.length), 0);
    const anzahlOhneJahr = einzeln.filter((w) => w.jahr === undefined).length;
    const anzahlMitJahr = einzeln.filter((w) => w.jahr !== undefined).length;
    expect(summeDetails).toBe(anzahlOhneJahr + anzahlMitJahr);
  });
});
