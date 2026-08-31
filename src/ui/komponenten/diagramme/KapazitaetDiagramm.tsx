/**
 * Verfuegbare gegen benoetigte Wasserstunden je Saison. Bei Ueberschreitung
 * wird NICHT gedeckelt — geplanter Wert bleibt sichtbar (kapazitaet.ts).
 */
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { stunden } from '../../../model/format';
import type { JahresErgebnis } from '../../../model/typen';

export function KapazitaetDiagramm({ jahr }: { readonly jahr: JahresErgebnis }) {
  const k = jahr.kapazitaet;
  const daten = [
    { saison: 'Freibad', verfuegbar: Math.round(k.verfuegbarFreibad), benoetigt: Math.round(k.benoetigtFreibad) },
    { saison: 'Halle', verfuegbar: Math.round(k.verfuegbarHalle), benoetigt: Math.round(k.benoetigtHalle) },
  ];

  return (
    <div className="diagramm-karte">
      <h3>Wasserkapazitaet — Jahr {jahr.kalenderjahr}</h3>
      {k.ueberschreitung && (
        <p className="diagramm-karte__hinweis diagramm-karte__hinweis--warnung">
          Die benoetigte Wasserzeit uebersteigt die verfuegbare Kapazitaet. Gezeigt wird der geplante,
          nicht der kapazitaetsgedeckelte Wert.
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={daten}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" />
          <XAxis dataKey="saison" />
          <YAxis tickFormatter={(w: number) => stunden(w)} width={80} />
          <Tooltip formatter={(wert: number) => stunden(wert)} />
          <Legend />
          <Bar dataKey="verfuegbar" name="Verfuegbar" fill="#8a8478" isAnimationActive={false} />
          <Bar dataKey="benoetigt" name="Benoetigt" isAnimationActive={false}>
            {daten.map((d, i) => (
              <Cell key={i} fill={d.benoetigt > d.verfuegbar ? '#8c2f2f' : '#3d5a6c'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
