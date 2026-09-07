/**
 * Monatlicher Cashflow eines Musterjahres plus kumulierter Verlauf.
 * Stufe C der zweistufigen Zeitachse: die Jahresabgaben sind gleichmaessig
 * auf die Monate zurueckgetragen (Abgrenzung, nicht Zahlungstermin) — das
 * weisen wir hier explizit aus (ARCHITEKTUR.md 2.2).
 */
import { useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '../../../model/format';
import type { JahresErgebnis, MonatsErgebnis } from '../../../model/typen';
import { TabellenUmschalter } from './TabellenUmschalter';

const MONATSNAMEN = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function CashflowDiagramm({ monate, jahr }: { readonly monate: readonly MonatsErgebnis[]; readonly jahr: JahresErgebnis }) {
  const [tabelle, setTabelle] = useState(false);
  const daten = monate.map((m) => ({
    monat: MONATSNAMEN[m.kalendermonat - 1] ?? String(m.kalendermonat),
    cashflow: Math.round(m.cashflow),
    kumuliert: Math.round(m.kumuliert),
    abgaben: -Math.round(m.steuernUndAbgaben),
  }));
  const jahresendstand = daten[daten.length - 1]?.kumuliert ?? 0;

  return (
    <div className="diagramm-karte">
      <div className="diagramm-karte__kopf">
        <h3>Kumulierter Cashflow endet bei {euro(jahresendstand)} — Jahr {jahr.kalenderjahr}</h3>
        <TabellenUmschalter offen={tabelle} onUmschalten={() => setTabelle((t) => !t)} />
      </div>
      <p className="diagramm-karte__hinweis">
        Steuern, Gewerbesteuer und DRV-Beitrag sind als Abgrenzung gleichmaessig auf die zwoelf Monate
        verteilt (Balken "Abgaben"), nicht auf den tatsaechlichen Zahlungstermin.
      </p>
      {tabelle ? (
        <div className="diagramm-tabelle-wrapper">
          <table className="diagramm-tabelle">
            <thead>
              <tr>
                <th>Monat</th>
                <th className="zahl">Cashflow</th>
                <th className="zahl">davon Abgaben</th>
                <th className="zahl">Kumuliert</th>
              </tr>
            </thead>
            <tbody>
              {daten.map((d) => (
                <tr key={d.monat}>
                  <td>{d.monat}</td>
                  <td className="zahl">{euro(d.cashflow)}</td>
                  <td className="zahl">{euro(d.abgaben)}</td>
                  <td className="zahl">{euro(d.kumuliert)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={daten}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--linie)" vertical={false} />
            <XAxis dataKey="monat" />
            <YAxis tickFormatter={(w: number) => euro(w)} width={90} />
            <Tooltip formatter={(wert: number) => euro(wert)} />
            <Legend />
            <Bar dataKey="cashflow" name="Cashflow" fill="var(--serie-1)" isAnimationActive={false} />
            <Bar dataKey="abgaben" name="davon Abgaben" fill="var(--serie-2)" isAnimationActive={false} />
            <Line type="monotone" dataKey="kumuliert" name="Kumuliert" stroke="var(--text)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
