/**
 * Deckungsbeitrag je Produkt im ausgewaehlten Jahr — macht Klumpenrisiken
 * sichtbar (siehe warnungen.ts, klumpenrisiko_produkt).
 */
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import { MODELL_KONSTANTEN } from '../../../model/konstanten';
import type { JahresErgebnis } from '../../../model/typen';

export function DeckungsbeitragDiagramm({ jahr }: { readonly jahr: JahresErgebnis }) {
  const summe = jahr.gewinn.deckungsbeitragSumme;
  const daten = jahr.produkte
    .filter((p) => p.anzahlKurseProJahr > 0)
    .map((p) => ({
      name: p.bezeichnung,
      deckungsbeitrag: Math.round(p.deckungsbeitrag),
      anteil: summe !== 0 ? p.deckungsbeitrag / summe : 0,
    }));

  return (
    <div className="diagramm-karte">
      <h3>Deckungsbeitrag je Produkt — Jahr {jahr.kalenderjahr}</h3>
      <ResponsiveContainer width="100%" height={Math.max(220, daten.length * 32)}>
        <BarChart data={daten} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" />
          <XAxis type="number" tickFormatter={(w: number) => euro(w)} />
          <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(wert: number) => euro(wert)} />
          <Bar dataKey="deckungsbeitrag" isAnimationActive={false}>
            {daten.map((d, i) => (
              <Cell key={i} fill={d.anteil > MODELL_KONSTANTEN.klumpenrisikoSchwelle ? '#8c2f2f' : '#3d5a6c'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
