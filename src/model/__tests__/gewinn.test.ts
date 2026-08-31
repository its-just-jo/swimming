import { describe, expect, it } from 'vitest';
import { STEUER_DEFAULT } from '../defaults';
import { berechneGewinn, fixkostenImJahr, investitionenImJahr } from '../gewinn';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import { berechneEinkommensteuer } from '../steuer/einkommensteuer';
import type { AnstellungErgebnis, Fahrtkosten, Fixkostenposition, ProduktErgebnis } from '../typen';

function baueAnstellungOhne(zvE: number, bruttoGesamt: number, svGesamt: number): AnstellungErgebnis {
  const steuer = berechneEinkommensteuer(zvE, false, RG);
  return {
    grundgehalt: bruttoGesamt,
    bonus: 0,
    bonusFaktor: 1,
    bruttoGesamt,
    sv: {
      kvArbeitnehmer: 0,
      pvArbeitnehmer: 0,
      rvArbeitnehmer: 0,
      alvArbeitnehmer: 0,
      gesamtArbeitnehmer: svGesamt,
      kvAufSelbstaendigkeit: 0,
      beitragsbemessungsgrenzeErreicht: false,
      ueberJaeg: false,
      pkvArbeitgeberzuschuss: 0,
    },
    steuer,
    netto: bruttoGesamt - svGesamt - steuer.gesamt,
  };
}

function produkt(deckungsbeitrag: number): ProduktErgebnis {
  return {
    produktId: 'p',
    bezeichnung: 'Test',
    erloesBrutto: 0,
    umsatzsteuer: 0,
    erloesNetto: 0,
    wasserzeitJeKurs: 0,
    wasserzeitGesamt: 0,
    miete: 0,
    honorar: 0,
    deckungsbeitrag,
    deckungsbeitragJeWasserstunde: 0,
    anzahlKurseProJahr: 0,
    durchfuehrung: 'ich',
    saison: 'ganzjahr',
  };
}

describe('fixkostenImJahr', () => {
  it('indexiert nur die dafuer markierten Positionen, addiert die Fahrtkosten unindexiert', () => {
    const positionen: Fixkostenposition[] = [
      { id: 'a', bezeichnung: 'Indexiert', betragProJahr: 1_000, vorsteuerabzugsfaehig: false, indexiert: true },
      { id: 'b', bezeichnung: 'Fix', betragProJahr: 500, vorsteuerabzugsfaehig: false, indexiert: false },
    ];
    const fahrtkosten: Fahrtkosten = { kilometerProJahr: 1_000, satzJeKilometer: 0.3 };
    // Jahr 0: 1000 + 500 + 300 = 1800
    expect(fixkostenImJahr(positionen, fahrtkosten, 0, 0.02)).toBeCloseTo(1_800, 2);
    // Jahr 5: 1000 * 1,02^5 + 500 + 300 = 1104,08 + 800 = 1904,08
    expect(fixkostenImJahr(positionen, fahrtkosten, 5, 0.02)).toBeCloseTo(1_000 * 1.02 ** 5 + 800, 2);
  });
});

describe('investitionenImJahr', () => {
  it('ordnet Investitionen ueber Math.floor(monat / 12) dem richtigen Jahr zu', () => {
    const investitionen = [
      { id: 'i1', bezeichnung: 'a', betrag: 100, monat: 6, vorsteuerabzugsfaehig: false },
      { id: 'i2', bezeichnung: 'b', betrag: 200, monat: 11, vorsteuerabzugsfaehig: false },
      { id: 'i3', bezeichnung: 'c', betrag: 300, monat: 12, vorsteuerabzugsfaehig: false },
    ];
    expect(investitionenImJahr(investitionen, 0)).toBeCloseTo(300, 2);
    expect(investitionenImJahr(investitionen, 1)).toBeCloseTo(300, 2);
    expect(investitionenImJahr(investitionen, 2)).toBe(0);
  });
});

describe('berechneGewinn: Mehrsteuer als Differenz der Veranlagung', () => {
  const steuerOhneDrvUndUebungsleiter = {
    ...STEUER_DEFAULT,
    drvPflicht: false,
    uebungsleiterpauschale: false,
    rechtsform: 'freiberuflich' as const,
  };

  it('ein Gewinnjahr erhoeht die Steuer gegenueber der Baseline', () => {
    const anstellungOhne = baueAnstellungOhne(60_000, 85_000, 16_253.43);
    const gewinn = berechneGewinn({
      produktErgebnisse: [produkt(20_000)],
      fixkosten: 3_000,
      investitionen: 0,
      lehreinkuenfte: 0,
      anstellungOhneSelbstaendigkeit: anstellungOhne,
      kirchensteuerpflichtig: false,
      steuer: steuerOhneDrvUndUebungsleiter,
      jahrIndex: 5,
      rg: RG,
    });

    expect(gewinn.gewinnVorSteuern).toBeCloseTo(17_000, 2);
    expect(gewinn.drvBeitrag).toBe(0);

    // Konsistenzpruefung: dieselbe Differenz, direkt mit der (unabhaengig
    // getesteten) Steuerfunktion nachgerechnet.
    const steuerMitGewinn = berechneEinkommensteuer(60_000 + 17_000, false, RG);
    const erwarteteMehrsteuer = steuerMitGewinn.gesamt - anstellungOhne.steuer.gesamt;
    expect(gewinn.zusaetzlicheEinkommensteuer).toBeCloseTo(erwarteteMehrsteuer, 2);
    expect(gewinn.zusaetzlicheEinkommensteuer).toBeGreaterThan(0);
    expect(gewinn.nettoAusSelbstaendigkeit).toBeCloseTo(17_000 - erwarteteMehrsteuer, 2);
  });

  it('KRITISCH: ein Verlustjahr wird nicht auf 0 begrenzt und mindert die Steuer (negative Mehrsteuer)', () => {
    const anstellungOhne = baueAnstellungOhne(60_000, 85_000, 16_253.43);
    const gewinn = berechneGewinn({
      produktErgebnisse: [produkt(2_000)],
      fixkosten: 10_000,
      investitionen: 0,
      lehreinkuenfte: 0,
      anstellungOhneSelbstaendigkeit: anstellungOhne,
      kirchensteuerpflichtig: false,
      steuer: steuerOhneDrvUndUebungsleiter,
      jahrIndex: 0,
      rg: RG,
    });

    // 2.000 - 10.000 = -8.000 — die Kette begrenzt das an keiner Stelle auf 0.
    expect(gewinn.gewinnVorSteuern).toBe(-8_000);
    expect(gewinn.steuerpflichtigerGewinn).toBe(-8_000);

    const steuerMitVerlust = berechneEinkommensteuer(60_000 - 8_000, false, RG);
    const erwarteteMehrsteuer = steuerMitVerlust.gesamt - anstellungOhne.steuer.gesamt;
    expect(erwarteteMehrsteuer).toBeLessThan(0);
    expect(gewinn.zusaetzlicheEinkommensteuer).toBeCloseTo(erwarteteMehrsteuer, 2);

    // Die Steuererstattung federt den Verlust ab: der tatsaechliche Nettobeitrag
    // ist weniger negativ als der buchhalterische Verlust von -8.000.
    expect(gewinn.nettoAusSelbstaendigkeit).toBeGreaterThan(-8_000);
    expect(gewinn.nettoAusSelbstaendigkeit).toBeLessThan(0);
  });

  it('Gewerbesteuer bei Hebesatz 360 % wird durch § 35 EStG nahezu neutralisiert', () => {
    const anstellungOhne = baueAnstellungOhne(60_000, 85_000, 16_253.43);
    const gewinn = berechneGewinn({
      produktErgebnisse: [produkt(60_000)],
      fixkosten: 20_000,
      investitionen: 0,
      lehreinkuenfte: 0,
      anstellungOhneSelbstaendigkeit: anstellungOhne,
      kirchensteuerpflichtig: false,
      steuer: { ...steuerOhneDrvUndUebungsleiter, rechtsform: 'gewerbe', gewerbesteuerHebesatz: 360 },
      jahrIndex: 0,
      rg: RG,
    });

    expect(gewinn.gewerbesteuer).toBeGreaterThan(0);
    expect(gewinn.gewerbesteuerAnrechnung).toBeGreaterThan(0);
    // Nettobelastung der Gewerbesteuer nach Anrechnung ist klein gegenueber der Bruttolast.
    expect(gewinn.gewerbesteuer - gewinn.gewerbesteuerAnrechnung).toBeLessThan(gewinn.gewerbesteuer * 0.05);
  });
});
