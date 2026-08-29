import { describe, expect, it } from 'vitest';
import { PRODUKTE_DEFAULT } from '../defaults';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import { berechneProdukt, erloesJeKurs, wasserzeitJeKurs } from '../produkte';
import type { Kursprodukt } from '../typen';

const hole = (id: string): Kursprodukt => {
  const p = PRODUKTE_DEFAULT.find((x) => x.id === id);
  if (!p) throw new Error(`Testprodukt fehlt: ${id}`);
  return p;
};

describe('Wasserzeit je Kurs', () => {
  it('rechnet Einheiten mal Dauer in Stunden um', () => {
    // 10 Einheiten * 45 min / 60 = 7,5 h
    expect(wasserzeitJeKurs(hole('p-kinder-anfaenger'))).toBeCloseTo(7.5, 6);
    // 10 Einheiten * 60 min / 60 = 10 h
    expect(wasserzeitJeKurs(hole('p-erwachsene-nichtschwimmer'))).toBeCloseTo(10, 6);
    // 5 Einheiten * 45 min / 60 = 3,75 h
    expect(wasserzeitJeKurs(hole('p-intensiv-ferien'))).toBeCloseTo(3.75, 6);
  });
});

describe('Erloes je Kurs', () => {
  it('Abrechnung je Teilnehmer beruecksichtigt die Auslastung', () => {
    // 6 TN * 90 % * 180 EUR = 972 EUR
    expect(erloesJeKurs(hole('p-kinder-anfaenger'))).toBeCloseTo(972, 2);
    // 14 TN * 85 % * 180 EUR = 2.142 EUR
    expect(erloesJeKurs(hole('p-aqua-mit-zpp'))).toBeCloseTo(2_142, 2);
  });

  it('Pauschale ist unabhaengig von der Auslastung', () => {
    // Modellregel: eine Firmenpauschale wird unabhaengig von der
    // Teilnehmerzahl gezahlt. Bei halber Auslastung bleibt der Erloes gleich.
    const bgm = hole('p-bgm-firma');
    expect(erloesJeKurs(bgm)).toBeCloseTo(2_500, 2);
    expect(erloesJeKurs({ ...bgm, auslastungsgrad: 0.5 })).toBeCloseTo(2_500, 2);
  });

  it('beruecksichtigt den ZPP-Aufschlag nur bei ZPP-faehigen Produkten', () => {
    const zpp = { ...hole('p-aqua-mit-zpp'), zppPreisaufschlag: 20 };
    // 14 * 0,85 * (180 + 20) = 2.380
    expect(erloesJeKurs(zpp)).toBeCloseTo(2_380, 2);
    const ohne = { ...hole('p-aqua-ohne-zpp'), zppPreisaufschlag: 20 };
    // 14 * 0,75 * 120 = 1.260 — der Aufschlag bleibt wirkungslos
    expect(erloesJeKurs(ohne)).toBeCloseTo(1_260, 2);
  });
});

describe('Deckungsbeitrag je Produkt', () => {
  const basis = {
    jahrIndex: 0,
    preisIndex: 1,
    mietIndex: 1,
    ustpflichtig: true,
    ausfallquote: 0,
    ausfallMindertErloes: false,
    hallenbadVerfuegbar: true,
    rg: RG,
  };

  it('Aquafitness mit ZPP, ein Zyklus', () => {
    // Erloes brutto  14 * 0,85 * 180            = 2.142,00
    // Netto          2.142 / 1,19               = 1.800,00
    // Wasserzeit     10 * 45 / 60               =     7,50 h
    // Miete          7,5 * 1,5 Bahnen * 90 EUR  = 1.012,50
    // DB             1.800,00 - 1.012,50        =   787,50
    // DB je Stunde   787,50 / 7,5               =   105,00
    const e = berechneProdukt({
      ...basis,
      produkt: { ...hole('p-aqua-mit-zpp'), zyklenProJahr: 1, aktiv: true, abMonat: 0 },
    });
    expect(e.erloesBrutto).toBeCloseTo(2_142, 2);
    expect(e.erloesNetto).toBeCloseTo(1_800, 2);
    expect(e.umsatzsteuer).toBeCloseTo(342, 2);
    expect(e.wasserzeitGesamt).toBeCloseTo(7.5, 6);
    expect(e.miete).toBeCloseTo(1_012.5, 2);
    expect(e.deckungsbeitrag).toBeCloseTo(787.5, 2);
    expect(e.deckungsbeitragJeWasserstunde).toBeCloseTo(105, 2);
  });

  it('Kinderkurs Anfaenger als Kleinunternehmer, ein Zyklus', () => {
    // Ohne Umsatzsteuer: 972,00 - (7,5 * 1 * 60) = 972 - 450 = 522,00
    // DB je Stunde 522 / 7,5 = 69,60
    const e = berechneProdukt({
      ...basis,
      ustpflichtig: false,
      produkt: { ...hole('p-kinder-anfaenger'), zyklenProJahr: 1 },
    });
    expect(e.erloesNetto).toBeCloseTo(972, 2);
    expect(e.deckungsbeitrag).toBeCloseTo(522, 2);
    expect(e.deckungsbeitragJeWasserstunde).toBeCloseTo(69.6, 2);
  });

  it('Fremdlehrkraft mindert den Deckungsbeitrag um das Honorar', () => {
    // Netto 972 / 1,19 = 816,81; Miete 450; Honorar 7,5 * 35 = 262,50
    // DB = 816,81 - 450 - 262,50 = 104,31
    const e = berechneProdukt({
      ...basis,
      produkt: {
        ...hole('p-kinder-anfaenger'),
        zyklenProJahr: 1,
        durchfuehrung: 'fremdlehrkraft',
      },
    });
    expect(e.honorar).toBeCloseTo(262.5, 2);
    expect(e.deckungsbeitrag).toBeCloseTo(104.31, 2);
  });

  it('parallele Kurse erhoehen Erloes und Wasserzeit gleichermassen', () => {
    // Modellregel: eine Lehrkraft kann keine zwei Gruppen gleichzeitig
    // betreuen — die Zeit ist additiv, nicht parallel.
    const einzeln = berechneProdukt({
      ...basis,
      produkt: { ...hole('p-kinder-anfaenger'), zyklenProJahr: 1, kurseParallelJeZyklus: 1 },
    });
    const doppelt = berechneProdukt({
      ...basis,
      produkt: { ...hole('p-kinder-anfaenger'), zyklenProJahr: 1, kurseParallelJeZyklus: 2 },
    });
    expect(doppelt.erloesBrutto).toBeCloseTo(einzeln.erloesBrutto * 2, 2);
    expect(doppelt.wasserzeitGesamt).toBeCloseTo(einzeln.wasserzeitGesamt * 2, 6);
  });

  it('ohne Hallenbadzugang liefern Ganzjahresprodukte keinen Erloes', () => {
    // Kritische Anforderung aus Abschnitt 3.2: es duerfen nur Freibadwochen
    // gerechnet werden. Stilles Weiterrechnen waere der schlimmste Fehler
    // des gesamten Modells.
    const e = berechneProdukt({
      ...basis,
      hallenbadVerfuegbar: false,
      produkt: { ...hole('p-kinder-anfaenger'), saison: 'ganzjahr' },
    });
    expect(e.erloesBrutto).toBe(0);
    expect(e.wasserzeitGesamt).toBe(0);
  });

  it('Freibadprodukte laufen auch ohne Hallenbadzugang', () => {
    const e = berechneProdukt({
      ...basis,
      hallenbadVerfuegbar: false,
      produkt: { ...hole('p-intensiv-ferien'), zyklenProJahr: 1 },
    });
    expect(e.erloesBrutto).toBeGreaterThan(0);
  });

  it('die Ausfallquote mindert den Erloes, wenn so konfiguriert', () => {
    const e = berechneProdukt({
      ...basis,
      ausfallquote: 0.1,
      ausfallMindertErloes: true,
      produkt: { ...hole('p-kinder-anfaenger'), zyklenProJahr: 1 },
    });
    expect(e.erloesBrutto).toBeCloseTo(972 * 0.9, 2);
  });

  it('ein Produkt vor seinem Startmonat liefert nichts', () => {
    const e = berechneProdukt({
      ...basis,
      jahrIndex: 0,
      produkt: { ...hole('p-aqua-mit-zpp'), abMonat: 24, aktiv: true },
    });
    expect(e.erloesBrutto).toBe(0);
  });

  it('Preis- und Mietindex wirken getrennt', () => {
    // Beckenmiete steigt schneller als die Kurspreise — der pessimistische
    // Default. Nach zehn Jahren muss der DB je Stunde deshalb sinken.
    const jahr0 = berechneProdukt({
      ...basis,
      produkt: { ...hole('p-kinder-anfaenger'), zyklenProJahr: 1 },
    });
    const jahr10 = berechneProdukt({
      ...basis,
      preisIndex: 1.02 ** 10,
      mietIndex: 1.04 ** 10,
      produkt: { ...hole('p-kinder-anfaenger'), zyklenProJahr: 1 },
    });
    expect(jahr10.deckungsbeitragJeWasserstunde).toBeLessThan(
      jahr0.deckungsbeitragJeWasserstunde,
    );
  });
});
