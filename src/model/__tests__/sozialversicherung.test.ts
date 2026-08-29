import { describe, expect, it } from 'vitest';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import {
  istHauptberuflichSelbstaendig,
  kvAufSelbstaendigkeit,
  svBeitraegeArbeitnehmer,
} from '../steuer/sozialversicherung';

describe('Arbeitnehmeranteile 2025', () => {
  it('deckelt KV und PV auf die Beitragsbemessungsgrenze', () => {
    // Brutto 85.000 > BBG KV/PV 66.150
    // KV: 66150 * (7,3 % + 1,25 %) = 66150 * 8,55 % = 5.655,83
    // PV: 66150 * (1,8 % + 0,6 % kinderlos) = 66150 * 2,4 % = 1.587,60
    // RV: 85000 * 9,3 % = 7.905,00  (BBG RV 96.600 nicht erreicht)
    // ALV: 85000 * 1,3 % = 1.105,00
    const e = svBeitraegeArbeitnehmer({
      bruttolohn: 85_000,
      kvStatus: 'gkv_pflicht',
      pkvBeitragProMonat: 0,
      kinderlosZuschlagPflege: true,
      rg: RG,
    });
    expect(e.kvArbeitnehmer).toBeCloseTo(5_655.83, 2);
    expect(e.pvArbeitnehmer).toBeCloseTo(1_587.6, 2);
    expect(e.rvArbeitnehmer).toBeCloseTo(7_905, 2);
    expect(e.alvArbeitnehmer).toBeCloseTo(1_105, 2);
    expect(e.gesamtArbeitnehmer).toBeCloseTo(16_253.43, 2);
    expect(e.beitragsbemessungsgrenzeErreicht).toBe(true);
  });

  it('meldet das Ueberschreiten der JAEG', () => {
    // 85.000 > JAEG 73.800 -> Versicherungsfreiheit, Status ist zu pruefen
    const e = svBeitraegeArbeitnehmer({
      bruttolohn: 85_000,
      kvStatus: 'gkv_pflicht',
      pkvBeitragProMonat: 0,
      kinderlosZuschlagPflege: true,
      rg: RG,
    });
    expect(e.ueberJaeg).toBe(true);
  });

  it('bei 60 % Beschaeftigungsgrad wird die BBG unterschritten', () => {
    // 85.000 * 0,6 = 51.000 < BBG 66.150 und < JAEG 73.800
    const e = svBeitraegeArbeitnehmer({
      bruttolohn: 51_000,
      kvStatus: 'gkv_pflicht',
      pkvBeitragProMonat: 0,
      kinderlosZuschlagPflege: true,
      rg: RG,
    });
    expect(e.beitragsbemessungsgrenzeErreicht).toBe(false);
    expect(e.ueberJaeg).toBe(false);
    expect(e.kvArbeitnehmer).toBeCloseTo(51_000 * 0.0855, 2);
  });

  it('laesst den Kinderlosenzuschlag weg, wenn Kinder vorhanden sind', () => {
    const mitKindern = svBeitraegeArbeitnehmer({
      bruttolohn: 85_000,
      kvStatus: 'gkv_pflicht',
      pkvBeitragProMonat: 0,
      kinderlosZuschlagPflege: false,
      rg: RG,
    });
    expect(mitKindern.pvArbeitnehmer).toBeCloseTo(66_150 * 0.018, 2);
  });

  it('PKV: Arbeitgeberzuschuss ist auf den halben GKV-Hoechstbeitrag gedeckelt', () => {
    // halber GKV-Hoechstbeitrag = 66150 * (14,6 % + 2,5 %) / 2 = 5.655,83
    // PKV 900 EUR/Monat = 10.800/Jahr, haelftig 5.400 -> unter der Deckelung
    const e = svBeitraegeArbeitnehmer({
      bruttolohn: 85_000,
      kvStatus: 'pkv',
      pkvBeitragProMonat: 900,
      kinderlosZuschlagPflege: true,
      rg: RG,
    });
    expect(e.pkvArbeitgeberzuschuss).toBeCloseTo(5_400, 2);
  });
});

describe('Krankenversicherung auf selbststaendige Einkuenfte', () => {
  it('gkv_pflicht: Nebeneinkuenfte sind beitragsfrei', () => {
    // Der entscheidende Unterschied zur freiwilligen Mitgliedschaft.
    expect(
      kvAufSelbstaendigkeit({
        bruttolohn: 51_000,
        gewinn: 20_000,
        kvStatus: 'gkv_pflicht',
        hauptberuflichSelbstaendig: false,
        rg: RG,
      }),
    ).toBe(0);
  });

  it('gkv_pflicht: bei Hauptberuflichkeit entfaellt die Beitragsfreiheit', () => {
    expect(
      kvAufSelbstaendigkeit({
        bruttolohn: 42_500,
        gewinn: 50_000,
        kvStatus: 'gkv_pflicht',
        hauptberuflichSelbstaendig: true,
        rg: RG,
      }),
    ).toBeGreaterThan(0);
  });

  it('gkv_freiwillig: beitragsfrei, solange der Lohn die BBG ausschoepft', () => {
    expect(
      kvAufSelbstaendigkeit({
        bruttolohn: 85_000,
        gewinn: 20_000,
        kvStatus: 'gkv_freiwillig',
        hauptberuflichSelbstaendig: false,
        rg: RG,
      }),
    ).toBe(0);
  });

  it('gkv_freiwillig: unterhalb der BBG wird der Restbetrag beitragspflichtig', () => {
    // Lohn 51.000, BBG 66.150 -> 15.150 EUR Restraum.
    // Gewinn 20.000 > Restraum -> Beitrag auf 15.150 zum vollen Satz 17,1 %
    // (freiwillig Versicherte tragen auf Nebeneinkuenfte den vollen Satz)
    const beitrag = kvAufSelbstaendigkeit({
      bruttolohn: 51_000,
      gewinn: 20_000,
      kvStatus: 'gkv_freiwillig',
      hauptberuflichSelbstaendig: false,
      rg: RG,
    });
    expect(beitrag).toBeCloseTo(15_150 * (0.146 + 0.025), 2);
  });
});

describe('Hauptberuflichkeit § 5 Abs. 5 SGB V', () => {
  it('erkennt das Zeitindiz', () => {
    const e = istHauptberuflichSelbstaendig({
      stundenSelbstaendigkeit: 25,
      stundenAnstellung: 20,
      gewinn: 10_000,
      bruttolohn: 42_500,
    });
    expect(e.grundZeit).toBe(true);
    expect(e.hauptberuflich).toBe(true);
  });

  it('erkennt das Einkommensindiz', () => {
    const e = istHauptberuflichSelbstaendig({
      stundenSelbstaendigkeit: 10,
      stundenAnstellung: 20,
      gewinn: 50_000,
      bruttolohn: 42_500,
    });
    expect(e.grundEinkommen).toBe(true);
    expect(e.hauptberuflich).toBe(true);
  });

  it('meldet keine Hauptberuflichkeit, wenn beide Indizien fehlen', () => {
    const e = istHauptberuflichSelbstaendig({
      stundenSelbstaendigkeit: 12,
      stundenAnstellung: 32,
      gewinn: 18_000,
      bruttolohn: 68_000,
    });
    expect(e.hauptberuflich).toBe(false);
  });
});
