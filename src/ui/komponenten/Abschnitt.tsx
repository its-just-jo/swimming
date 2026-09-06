/**
 * Aufklappbarer Eingabeabschnitt (AP 13). "Rechtliche Parameter" startet
 * eingeklappt, alle anderen offen — per `startOffen` steuerbar.
 */
import { useState, type ReactNode } from 'react';

export interface AbschnittProps {
  readonly titel: string;
  readonly startOffen?: boolean;
  readonly kennung?: string;
  readonly aktionen?: ReactNode;
  readonly children: ReactNode;
}

export function Abschnitt({ titel, startOffen = true, kennung, aktionen, children }: AbschnittProps) {
  const [offen, setOffen] = useState(startOffen);

  return (
    <section className="abschnitt" id={kennung} aria-label={titel}>
      <header className="abschnitt__kopf">
        <button
          type="button"
          className="abschnitt__umschalter"
          onClick={() => setOffen((o) => !o)}
          aria-expanded={offen}
        >
          <span className="abschnitt__pfeil">{offen ? '▾' : '▸'}</span>
          {titel}
        </button>
        {aktionen && <div className="abschnitt__aktionen">{aktionen}</div>}
      </header>
      {offen && <div className="abschnitt__inhalt">{children}</div>}
    </section>
  );
}
