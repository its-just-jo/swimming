/**
 * Szenarienverwaltung (AP 16): anlegen, benennen, duplizieren, loeschen,
 * Presets laden, Export/Import, Vergleich von bis zu drei Szenarien.
 */
import { useMemo, useRef, useState, type Dispatch } from 'react';
import { szenarioDefault } from '../../model/defaults';
import { euro, prozent } from '../../model/format';
import { PRESETS } from '../../model/presets';
import { berechneSzenario } from '../../model/simulation';
import type { Szenario } from '../../model/typen';
import { alsDatei, exportiere, importiere } from '../../persistenz/exportImport';
import { ladeIndex, ladeSzenario, loescheSzenario, speichereSzenario } from '../../persistenz/speicher';
import type { Aktion } from '../../state/szenarioReducer';

function ladeDateiAlsText(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leser = new FileReader();
    leser.onload = () => resolve(String(leser.result ?? ''));
    leser.onerror = () => reject(leser.error);
    leser.readAsText(datei, 'utf-8');
  });
}

export function SzenarienVerwaltung({
  aktuellesSzenario,
  dispatch,
  indexVersion,
  onGeaendert,
}: {
  readonly aktuellesSzenario: Szenario;
  readonly dispatch: Dispatch<Aktion>;
  readonly indexVersion: number;
  readonly onGeaendert: () => void;
}) {
  const index = useMemo(() => ladeIndex(), [indexVersion]);
  const [vergleichIds, setVergleichIds] = useState<readonly string[]>([]);
  const dateiEingabe = useRef<HTMLInputElement>(null);
  const [importFehler, setImportFehler] = useState<string | null>(null);

  function wechsleZu(id: string) {
    if (id === aktuellesSzenario.id) return;
    speichereSzenario(aktuellesSzenario);
    const geladen = ladeSzenario(id);
    if (geladen) dispatch({ typ: 'szenario_ersetzen', szenario: geladen });
    onGeaendert();
  }

  function neuesSzenario() {
    speichereSzenario(aktuellesSzenario);
    const neu = szenarioDefault(crypto.randomUUID(), 'Neues Szenario');
    speichereSzenario(neu);
    dispatch({ typ: 'szenario_ersetzen', szenario: neu });
    onGeaendert();
  }

  function umbenennen() {
    const name = prompt('Neuer Name des Szenarios:', aktuellesSzenario.name);
    if (name && name.trim()) {
      dispatch({ typ: 'setze', pfad: 'name', wert: name.trim() });
    }
  }

  function duplizieren() {
    const kopie: Szenario = {
      ...aktuellesSzenario,
      id: crypto.randomUUID(),
      name: `${aktuellesSzenario.name} (Kopie)`,
      erstelltAm: new Date().toISOString(),
      geaendertAm: new Date().toISOString(),
    };
    speichereSzenario(kopie);
    dispatch({ typ: 'szenario_ersetzen', szenario: kopie });
    onGeaendert();
  }

  function loeschen() {
    if (index.length <= 1) {
      alert('Das letzte Szenario kann nicht geloescht werden.');
      return;
    }
    if (!confirm(`Szenario "${aktuellesSzenario.name}" wirklich loeschen?`)) return;
    loescheSzenario(aktuellesSzenario.id);
    const naechstes = index.find((e) => e.id !== aktuellesSzenario.id);
    onGeaendert();
    if (naechstes) {
      const geladen = ladeSzenario(naechstes.id);
      if (geladen) dispatch({ typ: 'szenario_ersetzen', szenario: geladen });
    }
  }

  function exportieren() {
    const huelle = exportiere(aktuellesSzenario);
    const { dateiname, inhalt } = alsDatei(huelle);
    const blob = new Blob([inhalt], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = dateiname;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importDatei(datei: File) {
    setImportFehler(null);
    const text = await ladeDateiAlsText(datei);
    const ergebnis = importiere(text, crypto.randomUUID());
    if ('fehler' in ergebnis) {
      setImportFehler(ergebnis.fehler);
      return;
    }
    speichereSzenario(aktuellesSzenario);
    speichereSzenario(ergebnis);
    dispatch({ typ: 'szenario_ersetzen', szenario: ergebnis });
    onGeaendert();
  }

  function schalteVergleich(id: string) {
    setVergleichIds((vorher) => {
      if (vorher.includes(id)) return vorher.filter((v) => v !== id);
      if (vorher.length >= 2) return vorher; // + aktuelles Szenario = max. 3
      return [...vorher, id];
    });
  }

  return (
    <div className="szenarien-verwaltung">
      <div className="szenarien-verwaltung__aktionen">
        <button type="button" className="knopf knopf--klein" onClick={neuesSzenario}>
          Neu
        </button>
        <button type="button" className="knopf knopf--klein" onClick={umbenennen}>
          Umbenennen
        </button>
        <button type="button" className="knopf knopf--klein" onClick={duplizieren}>
          Duplizieren
        </button>
        <button type="button" className="knopf knopf--klein knopf--gefahr" onClick={loeschen}>
          Loeschen
        </button>
        <button type="button" className="knopf knopf--klein" onClick={exportieren}>
          Export
        </button>
        <button type="button" className="knopf knopf--klein" onClick={() => dateiEingabe.current?.click()}>
          Import
        </button>
        <input
          ref={dateiEingabe}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const datei = e.target.files?.[0];
            if (datei) void importDatei(datei);
            e.target.value = '';
          }}
        />
      </div>
      {importFehler && <p className="warnung warnung--kritisch">{importFehler}</p>}

      <label className="feld">
        <span className="feld__label">Preset laden</span>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              dispatch({ typ: 'preset_laden', schluessel: e.target.value });
              e.target.value = '';
            }
          }}
        >
          <option value="" disabled>
            Preset waehlen…
          </option>
          {PRESETS.map((p) => (
            <option key={p.schluessel} value={p.schluessel} title={p.aussage}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <ul className="szenarien-liste">
        {index.map((eintrag) => (
          <li key={eintrag.id} className={eintrag.id === aktuellesSzenario.id ? 'szenarien-liste__aktiv' : ''}>
            <label>
              <input
                type="checkbox"
                checked={vergleichIds.includes(eintrag.id)}
                disabled={eintrag.id === aktuellesSzenario.id}
                onChange={() => schalteVergleich(eintrag.id)}
                title="Zum Vergleich hinzufuegen (max. 3 inkl. aktuellem Szenario)"
              />
              <button type="button" className="szenarien-liste__name" onClick={() => wechsleZu(eintrag.id)}>
                {eintrag.name}
              </button>
            </label>
          </li>
        ))}
      </ul>

      {vergleichIds.length > 0 && <Vergleich hauptId={aktuellesSzenario.id} hauptSzenario={aktuellesSzenario} vergleichIds={vergleichIds} />}
    </div>
  );
}

function Vergleich({
  hauptId,
  hauptSzenario,
  vergleichIds,
}: {
  readonly hauptId: string;
  readonly hauptSzenario: Szenario;
  readonly vergleichIds: readonly string[];
}) {
  const szenarien = [hauptSzenario, ...vergleichIds.map((id) => ladeSzenario(id)).filter((s): s is Szenario => s !== null)];
  const zeilen = szenarien.map((s) => {
    const ergebnis = berechneSzenario(s);
    const letztes = ergebnis.jahre.at(-1);
    return {
      id: s.id,
      name: s.name,
      gesamtnetto: letztes?.gesamtnetto ?? 0,
      deckungsgrad: letztes?.deckungsgrad ?? 0,
    };
  });
  const bestesNetto = Math.max(...zeilen.map((z) => z.gesamtnetto));

  return (
    <div className="vergleich-tabelle-wrapper">
      <table className="vergleich-tabelle">
        <thead>
          <tr>
            <th>Szenario</th>
            <th>Gesamtnetto (letztes Jahr)</th>
            <th>Deckungsgrad</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z) => (
            <tr key={z.id} className={z.id === hauptId ? 'vergleich-tabelle__haupt' : ''}>
              <td>{z.name}</td>
              <td className={`zahl ${z.gesamtnetto === bestesNetto ? 'vergleich-tabelle__best' : ''}`}>{euro(z.gesamtnetto)}</td>
              <td className="zahl">{prozent(z.deckungsgrad)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
