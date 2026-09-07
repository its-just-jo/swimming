/**
 * Deckungsbeitrag je Produkt im ausgewaehlten Jahr — macht Klumpenrisiken
 * sichtbar (siehe warnungen.ts, klumpenrisiko_produkt).
 */
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro, prozent } from '../../../model/format';
import { MODELL_KONSTANTEN } from '../../../model/konstanten';
import type { JahresErgebnis } from '../../../model/typen';
import { TabellenUmschalter } from './TabellenUmschalter';

export function DeckungsbeitragDiagramm({ jahr }: { readonly jahr: JahresErgebnis }) {
  const [tabelle, setTabelle] = useState(false);
  const summe = jahr.gewinn.deckungsbeitragSumme;
  const daten = jahr.produkte
    .filter((p) => p.anzahlKurseProJahr > 0)
    .map((p) => ({
      name: p.bezeichnung,
      deckungsbeitrag: Math.round(p.deckungsbeitrag),
      anteil: summe !== 0 ? p.deckungsbeitrag / summe : 0,
    }))
    .sort((a, b) => b.deckungsbeitrag - a.deckungsbeitrag);

  const groesster = daten[0];
  const aussage =
    groesster && groesster.anteil > MODELL_KONSTANTEN.klumpenrisikoSchwelle
      ? `${groesster.name} trägt ${prozent(groesster.anteil, 0)} des Deckungsbeitrags — Klumpenrisiko`
      : `Deckungsbeitrag je Produkt — Jahr ${jahr.kalenderjahr}`;

  return (
    <div className="diagramm-karte">
      <div className="diagramm-karte__kopf">
        <h3>{aussage}</h3>
        <TabellenUmschalter offen={tabelle} onUmschalten={() => setTabelle((t) => !t)} />
      </div>
      {tabelle ? (
        <div className="diagramm-tabelle-wrapper">
          <table className="diagramm-tabelle">
            <thead>
              <tr>
                <th>Produkt</th>
                <th className="zahl">Deckungsbeitrag</th>
                <th className="zahl">Anteil</th>
              </tr>
            </thead>
            <tbody>
              {daten.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td className="zahl">{euro(d.deckungsbeitrag)}</td>
                  <td className="zahl">{prozent(d.anteil)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, daten.length * 32)}>
          <BarChart data={daten} layout="vertical" margin={{ left: 24, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" horizontal={false} />
            <XAxis type="number" tickFormatter={(w: number) => euro(w)} />
            <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(wert: number) => euro(wert)} />
            <Bar dataKey="deckungsbeitrag" isAnimationActive={false}>
              {daten.map((d, i) => (
                <Cell key={i} fill={d.anteil > MODELL_KONSTANTEN.klumpenrisikoSchwelle ? 'var(--kritisch-flaeche)' : 'var(--serie-1)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
