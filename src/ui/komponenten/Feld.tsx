/**
 * Generisches Eingabefeld, gesteuert durch eine Feldkonfiguration.
 *
 * Zahlenfelder verwenden inputMode="decimal" mit Komma als Dezimaltrennzeichen
 * (AP 13). Der Rohtext wird lokal gehalten, damit man z. B. "0," tippen kann,
 * ohne dass der kontrollierte Wert sofort zurueckspringt — committet wird bei
 * jedem gueltigen Zwischenstand UND beim Verlassen des Feldes.
 */
import { useEffect, useState } from 'react';
import { prozent as formatiereProzent } from '../../model/format';
import type { Feldkonfiguration } from '../feldKonfiguration';
import { Hilfe } from './Hilfe';

function zahlZuText(wert: number): string {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 10 }).format(wert);
}

function textZuZahl(text: string): number | null {
  const bereinigt = text.trim().replace(/\./g, '').replace(',', '.');
  if (bereinigt === '') return null;
  const zahl = Number(bereinigt);
  return Number.isFinite(zahl) ? zahl : null;
}

export interface FeldProps {
  readonly konfig: Feldkonfiguration;
  readonly wert: unknown;
  readonly onAendern: (wert: unknown) => void;
  /** Wird nur gesetzt, wenn ein Abschnitt seine wirkungslosen Felder eingeblendet hat (design.md 7.3). */
  readonly gedaempft?: boolean;
}

function GedaempftHinweis({ konfig, gedaempft }: { readonly konfig: Feldkonfiguration; readonly gedaempft: boolean | undefined }) {
  if (!gedaempft || !konfig.sichtbarHinweis) return null;
  return <span className="feld__hinweis">{konfig.sichtbarHinweis}</span>;
}

export function Feld({ konfig, wert, onAendern, gedaempft }: FeldProps) {
  const kennung = `feld-${konfig.schluessel}-${Math.random().toString(36).slice(2, 7)}`;
  const klasse = gedaempft ? 'feld feld--gedaempft' : 'feld';

  if (konfig.typ === 'bool') {
    return (
      <label className={`${klasse} feld--bool`}>
        <input type="checkbox" checked={Boolean(wert)} onChange={(e) => onAendern(e.target.checked)} />
        <span className="feld__label">
          {konfig.label}
          {konfig.herkunft === 'rechtsgroesse' && <span className="feld__marke" aria-label="Rechtsgroesse"> §</span>}
        </span>
        <GedaempftHinweis konfig={konfig} gedaempft={gedaempft} />
        <Hilfe label={konfig.label} text={konfig.hilfe} />
      </label>
    );
  }

  if (konfig.typ === 'select') {
    return (
      <label className={klasse}>
        <span className="feld__label">
          {konfig.label}
          {konfig.herkunft === 'rechtsgroesse' && <span className="feld__marke" aria-label="Rechtsgroesse"> §</span>}
          <Hilfe label={konfig.label} text={konfig.hilfe} />
        </span>
        <GedaempftHinweis konfig={konfig} gedaempft={gedaempft} />
        <select value={String(wert)} onChange={(e) => onAendern(e.target.value)}>
          {(konfig.optionen ?? []).map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (konfig.typ === 'text') {
    return (
      <label className={klasse}>
        <span className="feld__label">
          {konfig.label}
          <Hilfe label={konfig.label} text={konfig.hilfe} />
        </span>
        <GedaempftHinweis konfig={konfig} gedaempft={gedaempft} />
        <input type="text" value={String(wert ?? '')} onChange={(e) => onAendern(e.target.value)} />
      </label>
    );
  }

  // 'zahl' | 'prozent'
  return (
    <ZahlFeld id={kennung} konfig={konfig} wert={typeof wert === 'number' ? wert : 0} onAendern={onAendern} gedaempft={gedaempft} />
  );
}

function ZahlFeld({
  konfig,
  wert,
  onAendern,
  gedaempft,
}: {
  readonly id: string;
  readonly konfig: Feldkonfiguration;
  readonly wert: number;
  readonly onAendern: (wert: number) => void;
  readonly gedaempft?: boolean | undefined;
}) {
  const [text, setText] = useState(() => zahlZuText(wert));

  useEffect(() => {
    setText(zahlZuText(wert));
    // Nur bei extern veraendertem Wert (Undo/Preset) neu synchronisieren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wert]);

  function commit(rohtext: string) {
    const geparst = textZuZahl(rohtext);
    if (geparst === null) {
      setText(zahlZuText(wert));
      return;
    }
    const hatGrenzen = konfig.min !== konfig.max;
    const geklemmt = hatGrenzen ? Math.min(konfig.max, Math.max(konfig.min, geparst)) : geparst;
    onAendern(geklemmt);
    setText(zahlZuText(geklemmt));
  }

  return (
    <label className={gedaempft ? 'feld feld--gedaempft' : 'feld'}>
      <span className="feld__label">
        {konfig.label}
        {konfig.herkunft === 'rechtsgroesse' && <span className="feld__marke" aria-label="Rechtsgroesse"> §</span>}
        <Hilfe label={konfig.label} text={konfig.hilfe} />
      </span>
      <GedaempftHinweis konfig={konfig} gedaempft={gedaempft} />
      <span className="feld__eingabe">
        <input
          type="text"
          inputMode="decimal"
          className="zahl"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        {konfig.einheit && <span className="feld__einheit">{konfig.einheit}</span>}
        {konfig.typ === 'prozent' && <span className="feld__vorschau">≈ {formatiereProzent(wert)}</span>}
      </span>
    </label>
  );
}
