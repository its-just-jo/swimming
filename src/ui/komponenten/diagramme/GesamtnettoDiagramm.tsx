/**
 * Gesamtnetto vs. Vollzeit-Baseline ueber den Horizont.
 */
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import type { Ergebnis } from '../../../model/typen';

export function GesamtnettoDiagramm({ ergebnis }: { readonly ergebnis: Ergebnis }) {
  const daten = ergebnis.jahre.map((j) => ({
    jahr: j.kalenderjahr,
    gesamtnetto: Math.round(j.gesamtnetto),
    baseline: Math.round(j.baselineNetto),
  }));

  return (
    <div className="diagramm-karte">
      <h3>Gesamtnetto gegenüber Baseline</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={daten}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" />
          <XAxis dataKey="jahr" />
          <YAxis tickFormatter={(w: number) => euro(w)} width={90} />
          <Tooltip formatter={(wert: number) => euro(wert)} />
          <Legend />
          <Line type="monotone" dataKey="gesamtnetto" name="Gesamtnetto" stroke="#3d5a6c" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="baseline" name="Vollzeit-Baseline" stroke="#8a8478" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
