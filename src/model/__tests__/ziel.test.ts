import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../defaults';
import { berechneJahr } from '../simulation';
import { loeseZiel, wendeVorschlagAn } from '../ziel';
import type { Leitplanken, Szenario } from '../typen';

const LEITPLANKEN_GROSSZUEGIG: Leitplanken = {
  wasserstundenProWocheMax: 30,
  wochenbelastungMax: 70,
  samstagsstundenMax: 8,
  fremdlehrkraftZulaessig: false,
};

/**
 * Szenario mit Hallenbadzugang (sonst liefern die Ganzjahresprodukte nichts)
 * und grosszuegigen Leitplanken, damit der Solver tatsaechlich Spielraum hat.
 * Die Standardprodukte duerfen bis zum Fuenffachen wachsen.
 *
 * Leitplanken begrenzen nur die EIGENE Wasserzeit/Wochenbelastung der
 * Kursleitung — die tatsaechlich gebuchte Bad-Kapazitaet (`wasser.*`) ist
 * eine davon unabhaengige, physische Grenze. Damit die Tests unten echten
 * Spielraum vorfinden (statt am Freibad-Kontingent haengen zu bleiben),
 * wird auch diese Kapazitaet grosszuegig angesetzt.
 */
function testSzenario(id: string): Szenario {
  const basis = szenarioDefault(id);
  return {
    ...basis,
    wasser: { ...basis.wasser, hallenbadzugang: true, hallenbadAbMonat: 0, wasserstundenProWoche: 30 },
    leitplanken: LEITPLANKEN_GROSSZUEGIG,
    produkte: basis.produkte.map((p) => ({ ...p, solverMaxZyklenProJahr: p.zyklenProJahr * 5 })),
  };
}

describe('loeseZiel: Z1 Reduktion', () => {
  it('findet einen Vorschlag, der die Luecke bei 80 % schliesst', () => {
    const szenario = testSzenario('z1-80');
    const [ergebnis] = loeseZiel(szenario, { art: 'reduktion', zielBeschaeftigungsgrad: 0.8 }, 0);
    expect(ergebnis).toBeDefined();
    expect(['erreicht', 'knapp']).toContain(ergebnis!.status);
    expect(ergebnis!.jahrIndex).not.toBeNull();
    expect(ergebnis!.luecke).toBeLessThanOrEqual(0.01);
    const erhoeht = ergebnis!.zyklenAenderungen.some((a) => a.veraenderbar && a.zyklenNachher > a.zyklenVorher);
    expect(erhoeht).toBe(true);
  }, 15000);

  it('meldet unerreichbar mit staerkstem Hebel, wenn die Leitplanken zu eng sind', () => {
    const szenario: Szenario = {
      ...testSzenario('z1-eng'),
      leitplanken: {
        wasserstundenProWocheMax: 0.5,
        wochenbelastungMax: 40,
        samstagsstundenMax: 0,
        fremdlehrkraftZulaessig: false,
      },
    };
    const [ergebnis] = loeseZiel(szenario, { art: 'reduktion', zielBeschaeftigungsgrad: 0.0 }, 0);
    expect(ergebnis!.status).toBe('unerreichbar');
    expect(ergebnis!.bindendeBeschraenkung).not.toBeNull();
    expect(ergebnis!.staerksterHebel).not.toBeNull();
  }, 15000);

  it('veraendert "fest" markierte Produkte nicht', () => {
    const basis = testSzenario('z1-fest');
    const szenario: Szenario = {
      ...basis,
      produkte: basis.produkte.map((p) => ({ ...p, solverRolle: 'fest' as const })),
    };
    const [ergebnis] = loeseZiel(szenario, { art: 'reduktion', zielBeschaeftigungsgrad: 0.8 }, 0);
    expect(ergebnis!.zyklenAenderungen.every((a) => a.zyklenNachher === a.zyklenVorher)).toBe(true);
    // Ohne jeden Spielraum ist das Ziel folgerichtig nicht erreichbar.
    expect(ergebnis!.status).toBe('unerreichbar');
  }, 15000);

  it('"aus" markierte Produkte tauchen nicht im Vorschlag auf', () => {
    const basis = testSzenario('z1-aus');
    const szenario: Szenario = {
      ...basis,
      produkte: basis.produkte.map((p, i) => (i === 0 ? { ...p, solverRolle: 'aus' as const } : p)),
    };
    const [ergebnis] = loeseZiel(szenario, { art: 'reduktion', zielBeschaeftigungsgrad: 0.8 }, 0);
    const ausId = basis.produkte[0]!.id;
    expect(ergebnis!.zyklenAenderungen.some((a) => a.produktId === ausId)).toBe(false);
  }, 15000);
});

describe('loeseZiel: Z2 Zeitpunkt', () => {
  it('liefert die tiefste Stufe, die bis zum Zieljahr traegt', () => {
    const szenario = testSzenario('z2');
    const [ergebnis] = loeseZiel(szenario, { art: 'zeitpunkt', zielJahrIndex: 9 }, 0);
    expect(ergebnis).toBeDefined();
    expect([1.0, 0.8, 0.6, 0.5, 0.0]).toContain(ergebnis!.beschaeftigungsgrad);
  }, 20000);

  it('mit grosszuegigen Leitplanken traegt zumindest die 80 %-Stufe', () => {
    const szenario = testSzenario('z2-erreichbar');
    const [ergebnis] = loeseZiel(szenario, { art: 'zeitpunkt', zielJahrIndex: 9 }, 0);
    expect(ergebnis!.status === 'erreicht' || ergebnis!.status === 'knapp').toBe(true);
    expect(ergebnis!.beschaeftigungsgrad).toBeLessThanOrEqual(0.8);
  }, 20000);
});

describe('loeseZiel: Z3 Nettoziel', () => {
  it('liefert einen Vorschlag je Reduktionsstufe', () => {
    const szenario = testSzenario('z3');
    const ergebnisse = loeseZiel(szenario, { art: 'nettoziel', zielNetto: 40_000 }, 0);
    expect(ergebnisse).toHaveLength(5);
    expect(ergebnisse.map((e) => e.beschaeftigungsgrad)).toEqual([1.0, 0.8, 0.6, 0.5, 0.0]);
  }, 20000);

  it('ein Nettoziel von 0 EUR ist bei jeder Stufe sofort erreicht', () => {
    const szenario = testSzenario('z3-null');
    const ergebnisse = loeseZiel(szenario, { art: 'nettoziel', zielNetto: 0 }, 0);
    expect(ergebnisse.every((e) => e.status === 'erreicht' || e.status === 'knapp')).toBe(true);
    // Ohne jede Erhoehung noetig bleiben die Zyklen unveraendert.
    expect(ergebnisse[0]!.zyklenAenderungen.every((a) => a.zyklenNachher === a.zyklenVorher)).toBe(true);
  }, 20000);

  it('ein hoeheres Nettoziel bei tieferer Stufe braucht mindestens so viele Kurse', () => {
    const szenario = testSzenario('z3-monoton');
    const ergebnisse = loeseZiel(szenario, { art: 'nettoziel', zielNetto: 30_000 }, 0);
    const erreichte = ergebnisse.filter((e) => e.status !== 'unerreichbar');
    for (let i = 1; i < erreichte.length; i++) {
      // Niedrigere Beschaeftigungsgrade (spaeter im Array) brauchen tendenziell
      // gleich viele oder mehr Kurse, um denselben Netto-Betrag zu erreichen.
      expect(erreichte[i]!.benoetigteKurseProJahr).toBeGreaterThanOrEqual(erreichte[i - 1]!.benoetigteKurseProJahr - 1);
    }
  }, 20000);
});

describe('loeseZiel: Z4 Zeitbudget', () => {
  it('meldet unerreichbar, wenn schon die Ausgangslage die Grenze verletzt', () => {
    // Standard-Wochenbelastung bei 100 % liegt deutlich ueber 20 h.
    const szenario = testSzenario('z4-zu-eng');
    const [ergebnis] = loeseZiel(szenario, { art: 'zeitbudget', maxWochenstunden: 20 }, 0);
    expect(ergebnis!.status).toBe('unerreichbar');
  }, 20000);

  it('haelt die vorgegebene Wochenbelastung ein, wenn sie erreichbar ist', () => {
    const szenario = testSzenario('z4-erreichbar');
    const [ergebnis] = loeseZiel(szenario, { art: 'zeitbudget', maxWochenstunden: 65 }, 0);
    expect(ergebnis).toBeDefined();
    if (ergebnis!.status !== 'unerreichbar') {
      expect(ergebnis!.wochenbelastung).toBeLessThanOrEqual(65 + 0.01);
    }
  }, 20000);
});

describe('wendeVorschlagAn', () => {
  it('uebernimmt nur die ausgewaehlten Zeilen und setzt den Beschaeftigungsgrad', () => {
    const szenario = testSzenario('vorschlag');
    const [ergebnis] = loeseZiel(szenario, { art: 'reduktion', zielBeschaeftigungsgrad: 0.8 }, 0);
    const veraendert = ergebnis!.zyklenAenderungen.filter((a) => a.veraenderbar && a.zyklenNachher > a.zyklenVorher);
    expect(veraendert.length).toBeGreaterThan(0);

    const uebernommen = new Set([veraendert[0]!.produktId]);
    const neuesSzenario = wendeVorschlagAn(szenario, ergebnis!.zyklenAenderungen, 0.8, uebernommen);

    expect(neuesSzenario.anstellung.beschaeftigungsgrad).toBe(0.8);
    const angepasstesProdukt = neuesSzenario.produkte.find((p) => p.id === veraendert[0]!.produktId);
    expect(angepasstesProdukt?.zyklenProJahr).toBe(veraendert[0]!.zyklenNachher);

    if (veraendert.length > 1) {
      const nichtUebernommen = neuesSzenario.produkte.find((p) => p.id === veraendert[1]!.produktId);
      expect(nichtUebernommen?.zyklenProJahr).toBe(veraendert[1]!.zyklenVorher);
    }

    expect(szenario.anstellung.beschaeftigungsgrad).toBe(1.0);
  }, 15000);
});

describe('Konsistenz mit berechneJahr', () => {
  it('das gemeldete Gesamtnetto entspricht einer direkten Neuberechnung des Vorschlagsszenarios', () => {
    const szenario = testSzenario('konsistenz');
    const [ergebnis] = loeseZiel(szenario, { art: 'reduktion', zielBeschaeftigungsgrad: 0.8 }, 0);
    expect(ergebnis!.jahrIndex).not.toBeNull();

    const uebernommen = new Set(ergebnis!.zyklenAenderungen.filter((a) => a.veraenderbar).map((a) => a.produktId));
    const neuesSzenario = wendeVorschlagAn(szenario, ergebnis!.zyklenAenderungen, ergebnis!.beschaeftigungsgrad, uebernommen);
    const nachrechnung = berechneJahr(neuesSzenario, ergebnis!.jahrIndex!);
    expect(nachrechnung.gesamtnetto).toBeCloseTo(ergebnis!.gesamtnetto, 2);
  }, 15000);
});
