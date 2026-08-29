/**
 * Anwendungsrahmen.
 *
 * Zweispaltig auf dem Desktop: links die Eingaben in aufklappbaren
 * Abschnitten, rechts die Ergebnisse. Auf dem Handy gestapelt mit fixierter
 * Kennzahlenleiste. Der Rechtshinweis im Fussbereich ist dauerhaft sichtbar
 * und darf nicht ausblendbar sein (Abschnitt 9 der Spezifikation).
 *
 * Dieses Geruest ist absichtlich minimal: es belegt Struktur und Rechtshinweis,
 * die Fuellung erfolgt in den Arbeitspaketen 12 bis 16.
 */
export function App() {
  return (
    <div className="app">
      <header className="kopf">
        <h1>Szenario-Rechner — Ausstiegspfad Schwimmkurse</h1>
        {/* AP 13: Kennzahlenleiste, auf dem Handy fixiert */}
      </header>

      <main className="raster">
        <section className="spalte-eingaben" aria-label="Eingaben">
          {/* AP 12: Eingabeabschnitte */}
        </section>
        <section className="spalte-ergebnisse" aria-label="Ergebnisse">
          {/* AP 13-15: Kennzahlen, Diagramme, Warnungen, Herleitung */}
        </section>
      </main>

      <footer className="rechtshinweis">
        Dieses Werkzeug rechnet mit vereinfachten Steuerformeln und Schätzwerten.
        Es ersetzt keine Steuer- oder Rechtsberatung. Sämtliche hinterlegten
        Rechtsgrößen sind vor Verwendung zu prüfen.
      </footer>
    </div>
  );
}
