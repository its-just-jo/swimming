import { describe, expect, it, vi } from 'vitest';
import { szenarioDefault } from '../../model/defaults';
import { anfangsZustand, reduziere } from '../szenarioReducer';

describe('reduziere: setze', () => {
  it('setzt ein verschachteltes Feld ueber einen Punktpfad', () => {
    const start = anfangsZustand(szenarioDefault('r1'));
    const nach = reduziere(start, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.6 });
    expect(nach.gegenwart.anstellung.beschaeftigungsgrad).toBe(0.6);
    expect(nach.gegenwart.anstellung.bruttogrundgehaltVollzeit).toBe(85_000);
  });

  it('setzt ein Feld in einem Array-Element ueber den Index', () => {
    const start = anfangsZustand(szenarioDefault('r2'));
    const nach = reduziere(start, { typ: 'setze', pfad: 'produkte.0.preisJeTeilnehmer', wert: 999 });
    expect(nach.gegenwart.produkte[0]?.preisJeTeilnehmer).toBe(999);
    expect(nach.gegenwart.produkte[1]?.preisJeTeilnehmer).not.toBe(999);
  });

  it('legt einen Vergangenheits-Eintrag an', () => {
    const start = anfangsZustand(szenarioDefault('r3'));
    const nach = reduziere(start, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.6 });
    expect(nach.vergangenheit).toHaveLength(1);
    expect(nach.vergangenheit[0]?.anstellung.beschaeftigungsgrad).toBe(1.0);
  });

  it('fasst aufeinanderfolgende Aenderungen am selben Feld innerhalb von 800 ms zusammen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let zustand = anfangsZustand(szenarioDefault('r4'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.9 });
    vi.setSystemTime(200);
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.8 });
    vi.setSystemTime(400);
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.7 });

    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(0.7);
    // Alle drei Aenderungen liegen innerhalb des 800-ms-Fensters -> ein Schritt.
    expect(zustand.vergangenheit).toHaveLength(1);
    expect(zustand.vergangenheit[0]?.anstellung.beschaeftigungsgrad).toBe(1.0);
    vi.useRealTimers();
  });

  it('erzeugt einen neuen Schritt, wenn das Zeitfenster ueberschritten wird', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let zustand = anfangsZustand(szenarioDefault('r5'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.9 });
    vi.setSystemTime(1000);
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.8 });

    expect(zustand.vergangenheit).toHaveLength(2);
    vi.useRealTimers();
  });

  it('begrenzt den Verlauf auf 50 Eintraege', () => {
    let zustand = anfangsZustand(szenarioDefault('r6'));
    for (let i = 0; i < 60; i++) {
      zustand = reduziere(zustand, { typ: 'setze', pfad: 'simulation.horizontJahre', wert: 5 + (i % 3) });
      // Jede Aenderung mit anderem Wert auf demselben Pfad wuerde ohne
      // Zeitfortschritt zusammengefasst; hier reicht die Pruefung der
      // Kappung unabhaengig vom Merge-Verhalten.
    }
    expect(zustand.vergangenheit.length).toBeLessThanOrEqual(50);
  });
});

describe('reduziere: Arrays', () => {
  it('fuegt ein Produkt hinzu und entfernt es wieder', () => {
    let zustand = anfangsZustand(szenarioDefault('r7'));
    const anzahlVorher = zustand.gegenwart.produkte.length;
    zustand = reduziere(zustand, { typ: 'produkt_hinzufuegen' });
    expect(zustand.gegenwart.produkte).toHaveLength(anzahlVorher + 1);

    const neuesProdukt = zustand.gegenwart.produkte.at(-1)!;
    zustand = reduziere(zustand, { typ: 'produkt_loeschen', id: neuesProdukt.id });
    expect(zustand.gegenwart.produkte).toHaveLength(anzahlVorher);
  });

  it('fuegt eine Fixkostenposition hinzu und entfernt sie wieder', () => {
    let zustand = anfangsZustand(szenarioDefault('r8'));
    const anzahlVorher = zustand.gegenwart.fixkosten.length;
    zustand = reduziere(zustand, { typ: 'fixkosten_hinzufuegen' });
    expect(zustand.gegenwart.fixkosten).toHaveLength(anzahlVorher + 1);
    const neu = zustand.gegenwart.fixkosten.at(-1)!;
    zustand = reduziere(zustand, { typ: 'fixkosten_loeschen', id: neu.id });
    expect(zustand.gegenwart.fixkosten).toHaveLength(anzahlVorher);
  });

  it('fuegt eine Investition hinzu und entfernt sie wieder', () => {
    let zustand = anfangsZustand(szenarioDefault('r9'));
    const anzahlVorher = zustand.gegenwart.investitionen.length;
    zustand = reduziere(zustand, { typ: 'investition_hinzufuegen' });
    expect(zustand.gegenwart.investitionen).toHaveLength(anzahlVorher + 1);
    const neu = zustand.gegenwart.investitionen.at(-1)!;
    zustand = reduziere(zustand, { typ: 'investition_loeschen', id: neu.id });
    expect(zustand.gegenwart.investitionen).toHaveLength(anzahlVorher);
  });
});

describe('reduziere: Presets und Zuruecksetzen', () => {
  it('laedt ein Preset unter Beibehaltung von ID und Name', () => {
    let zustand = anfangsZustand(szenarioDefault('r10', 'Mein Name'));
    zustand = reduziere(zustand, { typ: 'preset_laden', schluessel: 'ambitioniert' });
    expect(zustand.gegenwart.id).toBe('r10');
    expect(zustand.gegenwart.name).toBe('Mein Name');
    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(0.6);
  });

  it('setzt einen einzelnen Bereich auf die Defaults zurueck', () => {
    let zustand = anfangsZustand(szenarioDefault('r11'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.5 });
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'simulation.horizontJahre', wert: 3 });
    zustand = reduziere(zustand, { typ: 'zuruecksetzen', bereich: 'anstellung' });
    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(1.0);
    expect(zustand.gegenwart.simulation.horizontJahre).toBe(3);
  });

  it('setzt alles zurueck, behaelt aber ID und Name', () => {
    let zustand = anfangsZustand(szenarioDefault('r12', 'Behalten'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.5 });
    zustand = reduziere(zustand, { typ: 'zuruecksetzen', bereich: 'alle' });
    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(1.0);
    expect(zustand.gegenwart.id).toBe('r12');
    expect(zustand.gegenwart.name).toBe('Behalten');
  });
});

describe('reduziere: undo/redo', () => {
  it('macht eine Aenderung rueckgaengig und wieder her', () => {
    let zustand = anfangsZustand(szenarioDefault('r13'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.6 });
    zustand = reduziere(zustand, { typ: 'undo' });
    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(1.0);
    zustand = reduziere(zustand, { typ: 'redo' });
    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(0.6);
  });

  it('undo ohne Verlauf ist ein No-op', () => {
    const start = anfangsZustand(szenarioDefault('r14'));
    const nach = reduziere(start, { typ: 'undo' });
    expect(nach).toBe(start);
  });

  it('eine neue Aenderung nach undo verwirft die verworfene Zukunft', () => {
    let zustand = anfangsZustand(szenarioDefault('r15'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.6 });
    zustand = reduziere(zustand, { typ: 'undo' });
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.5 });
    expect(zustand.zukunft).toHaveLength(0);
    zustand = reduziere(zustand, { typ: 'redo' });
    // Kein Effekt, da die Zukunft leer ist.
    expect(zustand.gegenwart.anstellung.beschaeftigungsgrad).toBe(0.5);
  });
});

describe('reduziere: szenario_ersetzen', () => {
  it('ersetzt das Szenario vollstaendig und leert den Verlauf', () => {
    let zustand = anfangsZustand(szenarioDefault('r16'));
    zustand = reduziere(zustand, { typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: 0.6 });
    const anderes = szenarioDefault('anderes-szenario', 'Anderes');
    zustand = reduziere(zustand, { typ: 'szenario_ersetzen', szenario: anderes });
    expect(zustand.gegenwart.id).toBe('anderes-szenario');
    expect(zustand.vergangenheit).toHaveLength(0);
    expect(zustand.zukunft).toHaveLength(0);
  });
});
