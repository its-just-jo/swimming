/**
 * Anwendungsrahmen.
 *
 * Zweispaltig auf dem Desktop: links die Eingaben in aufklappbaren
 * Abschnitten, rechts die Ergebnisse. Auf dem Handy gestapelt mit fixierter
 * Kennzahlenleiste. Der Rechtshinweis im Fussbereich ist dauerhaft sichtbar
 * und darf nicht ausblendbar sein (Abschnitt 9 der Spezifikation).
 */
import { useEffect, useMemo, useReducer, useState } from 'react';
import { szenarioDefault } from '../model/defaults';
import type { Kennzahl } from '../model/herleitung';
import { berechneSzenario } from '../model/simulation';
import type { Farbschema, Szenario } from '../model/typen';
import { normalisiere } from '../persistenz/migration';
import {
  drossle,
  ladeEinstellungen,
  ladeIndex,
  ladeSzenario,
  pruefeSpeicher,
  speichereEinstellungen,
  speichereSzenario,
} from '../persistenz/speicher';
import { anfangsZustand, reduziere } from '../state/szenarioReducer';
import { BreakEvenDiagramm } from './komponenten/diagramme/BreakEvenDiagramm';
import { CashflowDiagramm } from './komponenten/diagramme/CashflowDiagramm';
import { DeckungsbeitragDiagramm } from './komponenten/diagramme/DeckungsbeitragDiagramm';
import { GesamtnettoDiagramm } from './komponenten/diagramme/GesamtnettoDiagramm';
import { TornadoDiagramm } from './komponenten/diagramme/TornadoDiagramm';
import { EingabeSpalte } from './komponenten/EingabeSpalte';
import { HerleitungPanel } from './komponenten/HerleitungPanel';
import { Kennzahlenleiste } from './komponenten/Kennzahlenleiste';
import { Kursplan } from './komponenten/Kursplan';
import { SzenarienVerwaltung } from './komponenten/SzenarienVerwaltung';
import { WarnungenBanner } from './komponenten/WarnungenBanner';
import { Zielkarte, type ZielStatusKurz } from './komponenten/Zielkarte';

const NAECHSTES_FARBSCHEMA: Record<Farbschema, Farbschema> = { system: 'hell', hell: 'dunkel', dunkel: 'system' };
const FARBSCHEMA_LABEL: Record<Farbschema, string> = { system: 'System', hell: 'Hell', dunkel: 'Dunkel' };

function ladeInitialesSzenario(): Szenario {
  const einstellungen = ladeEinstellungen();
  const bevorzugteId = einstellungen?.aktivesSzenario ?? ladeIndex()[0]?.id ?? null;
  if (bevorzugteId) {
    const roh = ladeSzenario(bevorzugteId);
    const normalisiert = roh ? normalisiere(roh) : null;
    if (normalisiert) return normalisiert;
  }
  const frisch = szenarioDefault(crypto.randomUUID());
  speichereSzenario(frisch);
  return frisch;
}

export function App() {
  const [zustand, dispatch] = useReducer(reduziere, undefined, () => anfangsZustand(ladeInitialesSzenario()));
  const [modus] = useState(() => pruefeSpeicher());
  const [jahrIndex, setJahrIndex] = useState(0);
  const [ausgewaehlteKennzahl, setAusgewaehlteKennzahl] = useState<Kennzahl | null>(null);
  const [indexVersion, setIndexVersion] = useState(0);
  const [farbschema, setFarbschema] = useState<Farbschema>(() => ladeEinstellungen()?.farbschema ?? 'system');
  const [eingeblendeteAbschnitte, setEingeblendeteAbschnitte] = useState<readonly string[]>(
    () => ladeEinstellungen()?.eingeblendeteAbschnitte ?? [],
  );
  const [zielStatus, setZielStatus] = useState<ZielStatusKurz | null>(null);

  function abschnittUmschalten(kennung: string) {
    setEingeblendeteAbschnitte((bisher) =>
      bisher.includes(kennung) ? bisher.filter((k) => k !== kennung) : [...bisher, kennung],
    );
  }

  const ergebnis = useMemo(() => berechneSzenario(zustand.gegenwart), [zustand.gegenwart]);
  // Dauerhinweis, kein Warnfall (design.md 6.3) — gehoert in den Fussbereich, nicht in die Warnliste.
  const rechtsgroessenHinweis = ergebnis.warnungen.find((w) => w.code === 'rechtsgroessen_ungeprueft');
  const jahrSicher = Math.min(jahrIndex, ergebnis.jahre.length - 1);
  const jahr = ergebnis.jahre[jahrSicher];
  const monateDesJahres = useMemo(
    () => ergebnis.monate.filter((m) => Math.floor(m.monat / 12) === jahrSicher),
    [ergebnis.monate, jahrSicher],
  );

  const speicherer = useMemo(
    () =>
      drossle<Szenario>((sz) => {
        speichereSzenario(sz);
        setIndexVersion((v) => v + 1);
      }, 400),
    [],
  );

  useEffect(() => {
    speicherer.schreibe(zustand.gegenwart);
  }, [zustand.gegenwart, speicherer]);

  useEffect(() => {
    speichereEinstellungen({
      aktivesSzenario: zustand.gegenwart.id,
      vergleichsSzenarien: [],
      aufgeklappteAbschnitte: [],
      farbschema,
      eingeblendeteAbschnitte,
    });
  }, [zustand.gegenwart.id, farbschema, eingeblendeteAbschnitte]);

  useEffect(() => {
    // 'system' entfernt das Attribut: die Medienabfrage in stil.css greift dann wieder.
    if (farbschema === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = farbschema === 'dunkel' ? 'dark' : 'light';
  }, [farbschema]);

  useEffect(() => {
    const flush = () => speicherer.flush();
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [speicherer]);

  useEffect(() => {
    function beiTaste(e: KeyboardEvent) {
      const zielIstEingabe = (e.target as HTMLElement | null)?.tagName === 'INPUT' || (e.target as HTMLElement | null)?.tagName === 'SELECT';
      if (zielIstEingabe && e.key !== 'z' && e.key !== 'y') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ typ: 'undo' });
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ typ: 'redo' });
      }
    }
    window.addEventListener('keydown', beiTaste);
    return () => window.removeEventListener('keydown', beiTaste);
  }, []);

  if (!jahr) {
    return (
      <div className="app">
        <p className="warnung warnung--kritisch">Der Simulationshorizont muss mindestens ein Jahr umfassen.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="kopf">
        <div className="kopf__titelzeile">
          <h1>Szenario-Rechner — Ausstiegspfad Schwimmkurse</h1>
          <div className="kopf__werkzeuge">
            {modus === 'nur_speicher' && (
              <span className="speicher-hinweis" role="status">
                Nur-Speicher-Modus: Aenderungen werden nicht dauerhaft gespeichert — Export nutzen.
              </span>
            )}
            <button type="button" className="knopf knopf--klein" onClick={() => dispatch({ typ: 'undo' })} disabled={zustand.vergangenheit.length === 0}>
              ↶ Rueckgaengig
            </button>
            <button type="button" className="knopf knopf--klein" onClick={() => dispatch({ typ: 'redo' })} disabled={zustand.zukunft.length === 0}>
              ↷ Wiederholen
            </button>
            <button
              type="button"
              className="knopf knopf--klein"
              onClick={() => setFarbschema(NAECHSTES_FARBSCHEMA[farbschema])}
              aria-label={`Farbschema: ${FARBSCHEMA_LABEL[farbschema]}. Klicken, um zu wechseln.`}
            >
              Darstellung: {FARBSCHEMA_LABEL[farbschema]}
            </button>
          </div>
        </div>
        <Zielkarte szenario={zustand.gegenwart} jahrIndex={jahrSicher} dispatch={dispatch} onStatusAendern={setZielStatus} />
        <Kennzahlenleiste jahr={jahr} ausgewaehlt={ausgewaehlteKennzahl} onAuswaehlen={setAusgewaehlteKennzahl} zielStatus={zielStatus} />
      </header>

      <main className="raster">
        <section className="spalte-ergebnisse" aria-label="Ergebnisse">
          <div className="jahr-auswahl">
            <label>
              Jahr
              <input
                type="range"
                min={0}
                max={Math.max(0, ergebnis.jahre.length - 1)}
                value={jahrSicher}
                onChange={(e) => setJahrIndex(Number(e.target.value))}
              />
              <strong className="zahl">{jahr.kalenderjahr}</strong>
            </label>
          </div>

          {ausgewaehlteKennzahl && (
            <HerleitungPanel
              kennzahl={ausgewaehlteKennzahl}
              szenario={zustand.gegenwart}
              jahr={jahr}
              onSchliessen={() => setAusgewaehlteKennzahl(null)}
            />
          )}

          <Kursplan szenario={zustand.gegenwart} jahr={jahr} />

          <WarnungenBanner warnungen={ergebnis.warnungen} />

          <TornadoDiagramm szenario={zustand.gegenwart} />
          <GesamtnettoDiagramm ergebnis={ergebnis} />
          <CashflowDiagramm monate={monateDesJahres} jahr={jahr} />
          <DeckungsbeitragDiagramm jahr={jahr} />
          <BreakEvenDiagramm szenario={zustand.gegenwart} jahrIndex={jahrSicher} />
        </section>

        <section className="spalte-eingaben" aria-label="Eingaben">
          <SzenarienVerwaltung
            aktuellesSzenario={zustand.gegenwart}
            dispatch={dispatch}
            indexVersion={indexVersion}
            onGeaendert={() => setIndexVersion((v) => v + 1)}
          />
          <EingabeSpalte
            szenario={zustand.gegenwart}
            dispatch={dispatch}
            eingeblendeteAbschnitte={eingeblendeteAbschnitte}
            onAbschnittUmschalten={abschnittUmschalten}
          />
        </section>
      </main>

      <footer className="rechtshinweis">
        Dieses Werkzeug rechnet mit vereinfachten Steuerformeln und Schätzwerten.
        Es ersetzt keine Steuer- oder Rechtsberatung. Sämtliche hinterlegten
        Rechtsgrößen sind vor Verwendung zu prüfen.
        {rechtsgroessenHinweis && <p className="rechtshinweis__dauerhinweis">{rechtsgroessenHinweis.textOhneJahr}</p>}
      </footer>
    </div>
  );
}
