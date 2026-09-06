import { afterEach, describe, expect, it, vi } from 'vitest';
import { szenarioDefault } from '../../model/defaults';

function baueFakeLocalStorage(): Storage {
  const daten = new Map<string, string>();
  return {
    getItem: (schluessel: string) => (daten.has(schluessel) ? (daten.get(schluessel) as string) : null),
    setItem: (schluessel: string, wert: string) => {
      daten.set(schluessel, wert);
    },
    removeItem: (schluessel: string) => {
      daten.delete(schluessel);
    },
    clear: () => daten.clear(),
    key: (index: number) => Array.from(daten.keys())[index] ?? null,
    get length() {
      return daten.size;
    },
  } as Storage;
}

/** Simuliert einen kaputten Speicher (Kontingent erschoepft, Privatmodus etc.). */
function baueWerfendenLocalStorage(): Storage {
  const wirf = () => {
    throw new Error('QuotaExceededError');
  };
  return { getItem: wirf, setItem: wirf, removeItem: wirf, clear: wirf, key: wirf, length: 0 } as Storage;
}

const urspruenglicherLocalStorage = globalThis.localStorage;

afterEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: urspruenglicherLocalStorage,
    configurable: true,
    writable: true,
  });
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Speicher mit funktionierendem localStorage', () => {
  it('erkennt den Speichermodus als localstorage und speichert Szenarien wieder auffindbar', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: baueFakeLocalStorage(),
      configurable: true,
      writable: true,
    });
    vi.resetModules();
    const { pruefeSpeicher, speichereSzenario, ladeSzenario, ladeIndex } = await import('../speicher');

    expect(pruefeSpeicher()).toBe('localstorage');

    const szenario = szenarioDefault('sp-1', 'Testszenario');
    speichereSzenario(szenario);

    expect(ladeSzenario('sp-1')).toEqual(szenario);
    expect(ladeIndex()).toEqual([{ id: 'sp-1', name: 'Testszenario', geaendertAm: szenario.geaendertAm }]);
  });

  it('loescht ein Szenario samt Indexeintrag', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: baueFakeLocalStorage(),
      configurable: true,
      writable: true,
    });
    vi.resetModules();
    const { speichereSzenario, loescheSzenario, ladeSzenario, ladeIndex } = await import('../speicher');

    speichereSzenario(szenarioDefault('sp-2', 'Zu loeschen'));
    loescheSzenario('sp-2');

    expect(ladeSzenario('sp-2')).toBeNull();
    expect(ladeIndex()).toEqual([]);
  });
});

describe('Speicher mit werfendem localStorage-Stub (Kontingent erschoepft)', () => {
  it('faellt in den Nur-Speicher-Modus, ohne dass Aufrufe werfen', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: baueWerfendenLocalStorage(),
      configurable: true,
      writable: true,
    });
    vi.resetModules();
    const { pruefeSpeicher, speichereSzenario, ladeSzenario, ladeIndex } = await import('../speicher');

    expect(pruefeSpeicher()).toBe('nur_speicher');

    const szenario = szenarioDefault('sp-3', 'Nur im Speicher');
    expect(() => speichereSzenario(szenario)).not.toThrow();
    expect(ladeSzenario('sp-3')).toEqual(szenario);
    expect(ladeIndex()).toHaveLength(1);
  });

  it('ohne jedes localStorage (undefined) ist der Modus ebenfalls Nur-Speicher', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    vi.resetModules();
    const { pruefeSpeicher } = await import('../speicher');
    expect(pruefeSpeicher()).toBe('nur_speicher');
  });
});

describe('drossle', () => {
  it('schreibt erst nach der Verzoegerung und nur den letzten Wert', async () => {
    vi.useFakeTimers();
    const { drossle } = await import('../speicher');
    const aufrufe: number[] = [];
    const { schreibe } = drossle<number>((wert) => aufrufe.push(wert), 400);

    schreibe(1);
    schreibe(2);
    schreibe(3);
    expect(aufrufe).toEqual([]);

    vi.advanceTimersByTime(400);
    expect(aufrufe).toEqual([3]);
  });

  it('flush schreibt sofort, auch vor Ablauf der Verzoegerung', async () => {
    vi.useFakeTimers();
    const { drossle } = await import('../speicher');
    const aufrufe: number[] = [];
    const { schreibe, flush } = drossle<number>((wert) => aufrufe.push(wert), 400);

    schreibe(42);
    flush();
    expect(aufrufe).toEqual([42]);

    vi.advanceTimersByTime(400);
    expect(aufrufe).toEqual([42]);
  });

  it('flush ohne ausstehenden Wert tut nichts', async () => {
    vi.useFakeTimers();
    const { drossle } = await import('../speicher');
    const aufrufe: number[] = [];
    const { flush } = drossle<number>((wert) => aufrufe.push(wert), 400);

    flush();
    expect(aufrufe).toEqual([]);
  });
});
