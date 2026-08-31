import { describe, expect, it } from 'vitest';
import { szenarioDefault } from '../../model/defaults';
import { alsDatei, exportiere, importiere } from '../exportImport';

describe('exportiere / alsDatei', () => {
  it('verpackt das Szenario mit Schemaversion und Zeitstempel', () => {
    const szenario = szenarioDefault('e1', 'Mein Szenario');
    const huelle = exportiere(szenario);
    expect(huelle.anwendung).toBe('szenariorechner-ausstiegspfad');
    expect(huelle.szenario).toEqual(szenario);
    expect(huelle.exportiertAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('erzeugt einen sicheren Dateinamen und gueltiges JSON', () => {
    const huelle = exportiere(szenarioDefault('e2', 'Ausstieg Schwimmkurse!! 2026'));
    const datei = alsDatei(huelle);
    expect(datei.dateiname).toMatch(/^[a-zA-Z0-9-_]+\.json$/);
    expect(() => JSON.parse(datei.inhalt)).not.toThrow();
  });
});

describe('importiere', () => {
  it('legt ein neues Szenario mit der uebergebenen ID an, niemals mit der alten', () => {
    const original = szenarioDefault('e3', 'Original');
    const huelle = exportiere(original);
    const datei = alsDatei(huelle);

    const importiert = importiere(datei.inhalt, 'neue-id-123');
    expect('fehler' in importiert).toBe(false);
    if (!('fehler' in importiert)) {
      expect(importiert.id).toBe('neue-id-123');
      expect(importiert.id).not.toBe('e3');
      expect(importiert.name).toBe('Original');
      expect(importiert.anstellung).toEqual(original.anstellung);
    }
  });

  it('liefert einen Fehler bei ungueltigem JSON', () => {
    const ergebnis = importiere('{ das ist kein json', 'neu-1');
    expect('fehler' in ergebnis).toBe(true);
  });

  it('liefert einen Fehler bei einem JSON-Array statt eines Objekts', () => {
    const ergebnis = importiere('[1, 2, 3]', 'neu-2');
    expect('fehler' in ergebnis).toBe(true);
  });

  it('akzeptiert auch eine Datei, die nur das rohe Szenario ohne Huelle enthaelt', () => {
    const original = szenarioDefault('e4', 'Nur Szenario');
    const ergebnis = importiere(JSON.stringify(original), 'neu-3');
    expect('fehler' in ergebnis).toBe(false);
    if (!('fehler' in ergebnis)) {
      expect(ergebnis.id).toBe('neu-3');
      expect(ergebnis.name).toBe('Nur Szenario');
    }
  });

  it('ergaenzt fehlende Felder statt zu scheitern (handbearbeitetes JSON)', () => {
    const ergebnis = importiere(JSON.stringify({ name: 'Handbearbeitet' }), 'neu-4');
    expect('fehler' in ergebnis).toBe(false);
    if (!('fehler' in ergebnis)) {
      expect(ergebnis.name).toBe('Handbearbeitet');
      expect(ergebnis.produkte.length).toBeGreaterThan(0);
    }
  });
});
