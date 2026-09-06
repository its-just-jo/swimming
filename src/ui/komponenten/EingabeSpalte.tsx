/**
 * Eingabespalte: alle Abschnitte aus AP 13, "Rechtliche Parameter" eingeklappt.
 */
import type { Dispatch } from 'react';
import type { Szenario } from '../../model/typen';
import type { Aktion } from '../../state/szenarioReducer';
import { Abschnitt } from './Abschnitt';
import {
  ANSTELLUNG_FELDER,
  FAHRTKOSTEN_FELDER,
  FIXKOSTEN_FELDER,
  INVESTITION_FELDER,
  LEHRE_FELDER,
  PRODUKT_FELDER,
  SIMULATION_FELDER,
  STEUER_FELDER,
  WASSER_FELDER,
} from '../feldKonfiguration';
import { ArrayFelder, SkalarFelder } from './Formulare';
import { RechtlicheParameter } from './RechtlicheParameter';

export function EingabeSpalte({ szenario, dispatch }: { readonly szenario: Szenario; readonly dispatch: Dispatch<Aktion> }) {
  return (
    <>
      <Abschnitt titel="Anstellung" kennung="anstellung">
        <SkalarFelder basisPfad="anstellung" objekt={szenario.anstellung} felder={ANSTELLUNG_FELDER} dispatch={dispatch} />
        <div className="stufen-auswahl">
          {[1.0, 0.8, 0.6, 0.5, 0.0].map((stufe) => (
            <button
              key={stufe}
              type="button"
              className={`knopf knopf--klein ${szenario.anstellung.beschaeftigungsgrad === stufe ? 'knopf--aktiv' : ''}`}
              onClick={() => dispatch({ typ: 'setze', pfad: 'anstellung.beschaeftigungsgrad', wert: stufe })}
            >
              {Math.round(stufe * 100)} %
            </button>
          ))}
        </div>
      </Abschnitt>

      <Abschnitt titel="Wasserkapazitaet" kennung="wasser">
        <SkalarFelder basisPfad="wasser" objekt={szenario.wasser} felder={WASSER_FELDER} dispatch={dispatch} />
      </Abschnitt>

      <Abschnitt titel="Kursprodukte" kennung="produkte">
        <ArrayFelder
          basisPfad="produkte"
          items={szenario.produkte}
          felder={PRODUKT_FELDER}
          dispatch={dispatch}
          onLoeschen={(id) => dispatch({ typ: 'produkt_loeschen', id })}
          onHinzufuegen={() => dispatch({ typ: 'produkt_hinzufuegen' })}
          beschriftung={(item) => (item as { bezeichnung: string }).bezeichnung}
          hinzufuegenBeschriftung="Produkt hinzufuegen"
          leerHinweis="Noch keine Kursprodukte."
        />
      </Abschnitt>

      <Abschnitt titel="Fixkosten und Fahrtkosten" kennung="fixkosten">
        <ArrayFelder
          basisPfad="fixkosten"
          items={szenario.fixkosten}
          felder={FIXKOSTEN_FELDER}
          dispatch={dispatch}
          onLoeschen={(id) => dispatch({ typ: 'fixkosten_loeschen', id })}
          onHinzufuegen={() => dispatch({ typ: 'fixkosten_hinzufuegen' })}
          beschriftung={(item) => (item as { bezeichnung: string }).bezeichnung}
          hinzufuegenBeschriftung="Position hinzufuegen"
          leerHinweis="Keine Fixkostenpositionen."
        />
        <h4 className="unterabschnitt-titel">Fahrtkosten</h4>
        <SkalarFelder basisPfad="fahrtkosten" objekt={szenario.fahrtkosten} felder={FAHRTKOSTEN_FELDER} dispatch={dispatch} />
      </Abschnitt>

      <Abschnitt titel="Einmalinvestitionen" kennung="investitionen">
        <ArrayFelder
          basisPfad="investitionen"
          items={szenario.investitionen}
          felder={INVESTITION_FELDER}
          dispatch={dispatch}
          onLoeschen={(id) => dispatch({ typ: 'investition_loeschen', id })}
          onHinzufuegen={() => dispatch({ typ: 'investition_hinzufuegen' })}
          beschriftung={(item) => (item as { bezeichnung: string }).bezeichnung}
          hinzufuegenBeschriftung="Investition hinzufuegen"
          leerHinweis="Keine Investitionen geplant."
        />
      </Abschnitt>

      <Abschnitt titel="Steuer- und Sozialversicherungsschalter" kennung="steuer">
        <SkalarFelder basisPfad="steuer" objekt={szenario.steuer} felder={STEUER_FELDER} dispatch={dispatch} />
      </Abschnitt>

      <Abschnitt titel="Lehre" kennung="lehre">
        <SkalarFelder basisPfad="lehre" objekt={szenario.lehre} felder={LEHRE_FELDER} dispatch={dispatch} />
      </Abschnitt>

      <Abschnitt titel="Simulationsparameter" kennung="simulation">
        <SkalarFelder basisPfad="simulation" objekt={szenario.simulation} felder={SIMULATION_FELDER} dispatch={dispatch} />
      </Abschnitt>

      <Abschnitt titel="Rechtliche Parameter" kennung="rechtliche-parameter" startOffen={false}>
        <RechtlicheParameter ueberschreibungen={szenario.rechtlicheUeberschreibungen} dispatch={dispatch} />
      </Abschnitt>

      <div className="zuruecksetzen-global">
        <button
          type="button"
          className="knopf knopf--klein"
          onClick={() => {
            if (confirm('Alle Eingaben dieses Szenarios auf die Defaults zuruecksetzen?')) {
              dispatch({ typ: 'zuruecksetzen', bereich: 'alle' });
            }
          }}
        >
          Alles zuruecksetzen
        </button>
      </div>
    </>
  );
}
