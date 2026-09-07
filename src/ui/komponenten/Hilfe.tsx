/**
 * Echter Tooltip statt `title=` (design.md Abschnitt 8). Das native Attribut
 * oeffnet erst nach rund einer Sekunde, ist auf Touchgeraeten gar nicht
 * erreichbar, laesst sich nicht gestalten und ist fuer Screenreader
 * unzuverlaessig — bei einem Werkzeug mit Rechtsbegriffen die falsche Wahl.
 *
 * Ausloeser ist ein eigenes Schaltelement neben dem Label, nie das Label
 * selbst (sonst ist die Hilfe per Tastatur nicht erreichbar). Oeffnet nach
 * 150 ms Verweilen mit dem Zeiger, sofort bei Tastaturfokus oder Tippen.
 * Schliesst per Esc, Klick ausserhalb oder Fokusverlust; Verweilen im Panel
 * haelt offen (Ausloeser und Panel teilen sich denselben Hover-Bereich).
 *
 * Vereinfachung gegenueber 8.2: `aria-describedby` sitzt auf dem Ausloeser
 * selbst, nicht auf dem Eingabefeld — eine Verdrahtung bis ins jeweilige
 * `<input>` haette in jeder der vier Feldarten in Feld.tsx eine eigene,
 * stabile Feld-ID vorausgesetzt. Der Ausloeser steht unmittelbar neben dem
 * Label, der Bezug bleibt fuer Screenreader-Nutzer damit eindeutig.
 *
 * Ebenfalls offen: die mobile Darstellung als Blatt am unteren Rand
 * (design.md 8.2) — das faellt mit dem Handy-Layout in AP 28 zusammen.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

const VERWEILDAUER_MS = 150;

export interface HilfeProps {
  readonly label: string;
  readonly text: string;
}

export function Hilfe({ label, text }: HilfeProps) {
  const [offen, setOffen] = useState(false);
  const [linksAusgerichtet, setLinksAusgerichtet] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zeitgeberRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  function zeitgeberLoeschen() {
    if (zeitgeberRef.current !== null) {
      clearTimeout(zeitgeberRef.current);
      zeitgeberRef.current = null;
    }
  }

  function verzoegertOeffnen() {
    zeitgeberLoeschen();
    zeitgeberRef.current = setTimeout(() => setOffen(true), VERWEILDAUER_MS);
  }

  function sofortOeffnen() {
    zeitgeberLoeschen();
    setOffen(true);
  }

  function schliessen() {
    zeitgeberLoeschen();
    setOffen(false);
  }

  useEffect(() => () => zeitgeberLoeschen(), []);

  // Kollisionspruefung gegen den Viewport: rechts bevorzugt, bei Ueberlauf links ausrichten.
  useLayoutEffect(() => {
    if (!offen || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setLinksAusgerichtet(rect.right > window.innerWidth);
  }, [offen]);

  useEffect(() => {
    if (!offen) return;
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') schliessen();
    }
    function beiKlickAussen(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) schliessen();
    }
    document.addEventListener('keydown', beiTaste);
    document.addEventListener('mousedown', beiKlickAussen);
    return () => {
      document.removeEventListener('keydown', beiTaste);
      document.removeEventListener('mousedown', beiKlickAussen);
    };
  }, [offen]);

  if (!text) return null;

  return (
    <span className="hilfe" ref={wrapperRef} onMouseEnter={verzoegertOeffnen} onMouseLeave={schliessen}>
      <button
        type="button"
        className="hilfe__ausloeser"
        aria-label={`Hilfe zu ${label}`}
        aria-describedby={offen ? panelId : undefined}
        aria-expanded={offen}
        onFocus={sofortOeffnen}
        onBlur={schliessen}
        onClick={(e) => {
          // preventDefault unterdrueckt die Checkbox-Weiterleitung, falls dieses
          // Element in einem <label> steckt (etwa bei bool-Feldern in Feld.tsx).
          e.preventDefault();
          setOffen((v) => !v);
        }}
      >
        ⓘ
      </button>
      {offen && (
        <div
          ref={panelRef}
          id={panelId}
          role="tooltip"
          className={`hilfe__panel${linksAusgerichtet ? ' hilfe__panel--links' : ''}`}
        >
          {text}
        </div>
      )}
    </span>
  );
}
