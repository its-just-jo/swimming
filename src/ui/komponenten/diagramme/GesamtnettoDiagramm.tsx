/**
 * Gesamtnetto vs. Vollzeit-Baseline ueber den Horizont.
 */
import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import type { Ergebnis } from '../../../model/typen';
import { TabellenUmschalter } from './TabellenUmschalter';

/** Kurze Aussage statt Gattungsbezeichnung (design.md 10, Auflage 2). */
function aussage(daten: readonly { readonly jahr: number; readonly gesamtnetto: number; readonly baseline: number }[]): string {
  const uebergang = daten.find((d) => d.gesamtnetto >= d.baseline);
  if (!uebergang) return 'Gesamtnetto bleibt im gesamten Horizont unter der Baseline';
  if (uebergang === daten[0]) return 'Gesamtnetto liegt durchgehend über der Baseline';
  return `Die Lücke schließt sich ab ${uebergang.jahr}`;
}

export function GesamtnettoDiagramm({ ergebnis }: { readonly ergebnis: Ergebnis }) {
  const [tabelle, setTabelle] = useState(false);
  const daten = ergebnis.jahre.map((j) => ({
    jahr: j.kalenderjahr,
    gesamtnetto: Math.round(j.gesamtnetto),
    baseline: Math.round(j.baselineNetto),
  }));

  return (
    <div className="diagramm-karte">
      <div className="diagramm-karte__kopf">
        <h3>{aussage(daten)}</h3>
        <TabellenUmschalter offen={tabelle} onUmschalten={() => setTabelle((t) => !t)} />
      </div>
      {tabelle ? (
        <div className="diagramm-tabelle-wrapper">
          <table className="diagramm-tabelle">
            <thead>
              <tr>
                <th>Jahr</th>
                <th className="zahl">Gesamtnetto</th>
                <th className="zahl">Vollzeit-Baseline</th>
              </tr>
            </thead>
            <tbody>
              {daten.map((d) => (
                <tr key={d.jahr}>
                  <td>{d.jahr}</td>
                  <td className="zahl">{euro(d.gesamtnetto)}</td>
                  <td className="zahl">{euro(d.baseline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={daten}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" vertical={false} />
            <XAxis dataKey="jahr" />
            <YAxis tickFormatter={(w: number) => euro(w)} width={90} />
            <Tooltip formatter={(wert: number) => euro(wert)} />
            <Legend />
            <Line type="monotone" dataKey="gesamtnetto" name="Gesamtnetto" stroke="var(--serie-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="baseline" name="Vollzeit-Baseline" stroke="var(--text-3)" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
