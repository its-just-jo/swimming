/**
 * Ueberschreibungen der Rechtsgroessen (§ 32a-Tarif ausgenommen — der bleibt
 * strukturell an konstanten.ts gebunden). Eingeklappt per Default (AP 13).
 */
import type { Dispatch } from 'react';
import { RECHTSGROESSEN_2025 } from '../../model/konstanten';
import type { RechtlicheUeberschreibungen } from '../../model/typen';
import type { Aktion } from '../../state/szenarioReducer';
import { UmschalterZeile } from './Formulare';

const BESCHRIFTUNGEN: Record<string, string> = {
  grundfreibetrag: 'Grundfreibetrag (EUR)',
  soliSatz: 'Soli-Satz',
  soliFreigrenzeEinzel: 'Soli-Freigrenze (EUR)',
  soliMilderungssatz: 'Soli-Milderungssatz',
  kirchensteuersatz: 'Kirchensteuersatz',
  arbeitnehmerPauschbetrag: 'Arbeitnehmer-Pauschbetrag (EUR)',
  sonderausgabenPauschbetrag: 'Sonderausgaben-Pauschbetrag (EUR)',
  kinderfreibetragJeKind: 'Kinderfreibetrag je Kind (EUR)',
  bbgKvPv: 'BBG KV/PV (EUR)',
  bbgRvAlv: 'BBG RV/ALV (EUR)',
  jaeg: 'Jahresarbeitsentgeltgrenze (EUR)',
  kvAllgemeinerSatz: 'KV allgemeiner Satz',
  kvZusatzbeitragDurchschnitt: 'KV Zusatzbeitrag (Durchschnitt)',
  pvSatz: 'PV-Satz',
  pvKinderlosZuschlag: 'PV Kinderlosenzuschlag',
  rvSatz: 'RV-Satz',
  alvSatz: 'ALV-Satz',
  geringfuegigkeitsgrenzeMonat: 'Geringfuegigkeitsgrenze (EUR/Monat)',
  mindestbemessungsgrundlageFreiwilligKvMonat: 'Mindestbemessung freiwillige KV (EUR/Monat)',
  ustRegelsatz: 'USt-Regelsatz',
  kleinunternehmerVorjahresgrenze: 'Kleinunternehmer Vorjahresgrenze (EUR)',
  kleinunternehmerLaufendesJahrGrenze: 'Kleinunternehmer laufendes Jahr (EUR)',
  gewerbesteuerFreibetrag: 'Gewerbesteuer-Freibetrag (EUR)',
  gewerbesteuerMesszahl: 'Gewerbesteuer-Messzahl',
  gewerbesteuerAnrechnungsfaktor: 'Gewerbesteuer-Anrechnungsfaktor',
  uebungsleiterpauschale: 'Uebungsleiterpauschale (EUR)',
  durchschnittsentgeltRv: 'Durchschnittsentgelt RV (EUR)',
  rentenwertProEntgeltpunktMonat: 'Rentenwert je Entgeltpunkt (EUR/Monat)',
};

const NICHT_UEBERSCHREIBBAR = new Set(['jahr', 'estTarif', 'gewerbesteuerHebesatzDefault']);

function istZahl(wert: unknown): wert is number {
  return typeof wert === 'number';
}

/** Einziges bedingt sichtbares Feld dieser Ansicht (design.md 7.2): wirkt nur bei Kirchensteuerpflicht. */
const BEDINGT_SICHTBAR: Record<string, { readonly wennFeld: string; readonly hinweis: string }> = {
  kirchensteuersatz: { wennFeld: 'kirchensteuerpflichtig', hinweis: 'wirkt erst bei Kirchensteuerpflicht' },
};

export function RechtlicheParameter({
  ueberschreibungen,
  kirchensteuerpflichtig,
  dispatch,
  eingeblendet,
  onEinblenden,
}: {
  readonly ueberschreibungen: RechtlicheUeberschreibungen;
  readonly kirchensteuerpflichtig: boolean;
  readonly dispatch: Dispatch<Aktion>;
  readonly eingeblendet: boolean;
  readonly onEinblenden: () => void;
}) {
  const alleFelder = Object.entries(RECHTSGROESSEN_2025).filter(
    ([schluessel, wert]) => istZahl(wert) && !NICHT_UEBERSCHREIBBAR.has(schluessel),
  ) as readonly [string, number][];

  const bedingung: Record<string, boolean> = { kirchensteuerpflichtig };
  const sichtbar = alleFelder.filter(([schluessel]) => {
    const bedingt = BEDINGT_SICHTBAR[schluessel];
    return !bedingt || bedingung[bedingt.wennFeld];
  });
  const ausgeblendet = alleFelder.filter(([schluessel]) => {
    const bedingt = BEDINGT_SICHTBAR[schluessel];
    return bedingt && !bedingung[bedingt.wennFeld];
  });
  const anzuzeigen = eingeblendet ? alleFelder : sichtbar;

  return (
    <div className="feld-raster">
      <p className="abschnitt__hinweis">
        Rechtsstand 2025. Jeder Wert ist vor Nutzung gegen die Primaerquelle zu pruefen (siehe{' '}
        <code>konstanten.ts</code>). Leer lassen = Standardwert gilt.
      </p>
      {anzuzeigen.map(([schluessel, standard]) => {
        const aktuell = ueberschreibungen[schluessel];
        const gedaempft = eingeblendet && Boolean(BEDINGT_SICHTBAR[schluessel]);
        return (
          <label className={gedaempft ? 'feld feld--gedaempft' : 'feld'} key={schluessel}>
            <span className="feld__label">
              {BESCHRIFTUNGEN[schluessel] ?? schluessel}
              <span className="feld__marke" aria-label="Rechtsgroesse">
                {' '}
                §
              </span>
            </span>
            {gedaempft && <span className="feld__hinweis">{BEDINGT_SICHTBAR[schluessel]?.hinweis}</span>}
            <span className="feld__eingabe">
              <input
                type="text"
                inputMode="decimal"
                className="zahl"
                placeholder={String(standard)}
                value={aktuell === undefined ? '' : String(aktuell).replace('.', ',')}
                onChange={(e) => {
                  const text = e.target.value.trim();
                  if (text === '') {
                    dispatch({
                      typ: 'setze',
                      pfad: `rechtlicheUeberschreibungen.${schluessel}`,
                      wert: undefined,
                    });
                    return;
                  }
                  const zahl = Number(text.replace(/\./g, '').replace(',', '.'));
                  if (Number.isFinite(zahl)) {
                    dispatch({ typ: 'setze', pfad: `rechtlicheUeberschreibungen.${schluessel}`, wert: zahl });
                  }
                }}
              />
            </span>
          </label>
        );
      })}
      <UmschalterZeile anzahl={ausgeblendet.length} eingeblendet={eingeblendet} onUmschalten={onEinblenden} />
    </div>
  );
}
