interface TiebreakInfoModalProps {
  open: boolean
  onClose: () => void
}

export default function TiebreakInfoModal({ open, onClose }: TiebreakInfoModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Wie wird die Tabelle sortiert?"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <h3>Wie wird die Tabelle sortiert?</h3>
          <button type="button" className="modal-card__close" aria-label="Schließen" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-card__body">
          <h4>1. Punkte</h4>
          <p>
            Alle Teams der Gruppe werden zuerst nach Siegen/Punkten sortiert. Wer mehr Punkte
            hat, steht weiter oben — fertig. Nur wer gleich viele Punkte hat, braucht eine
            Tiebreak-Regel.
          </p>

          <h4>2. Wie viele Teams sind gleichauf?</h4>
          <p>
            <strong>Fall A: Genau 2 Teams gleichauf</strong> (z.B. nur B1 und B2 haben beide 2
            Punkte, alle anderen unterscheiden sich)
            <br />
            → Es zählt einzig und allein, wer das direkte Spiel zwischen diesen beiden gewonnen
            hat. Fertig, keine weiteren Kriterien nötig.
          </p>
          <p>
            <strong>Fall B: 3 oder 4 Teams gleichauf</strong> (z.B. B1, B2, B3 haben alle 2
            Punkte)
            <br />
            → Hier reicht "direktes Duell" nicht, weil es potenziell 3 verschiedene direkte
            Duelle gibt (B1–B2, B1–B3, B2–B3) und die sich im Kreis schlagen können (B1 schlägt
            B2, B2 schlägt B3, B3 schlägt B1 — jeder hat also ein Duell gewonnen und eins
            verloren, es gibt keinen eindeutigen "Sieger" unter den dreien). Deshalb wird
            stattdessen eine Mini-Tabelle aufgemacht:
          </p>
          <ul>
            <li>
              <strong>Was ist die Mini-Tabelle konkret?</strong> Man blendet alle Spiele gegen
              die nicht betroffenen Teams (hier: gegen B4) komplett aus und schaut sich nur die
              Spiele B1 vs. B2, B1 vs. B3 und B2 vs. B3 an.
            </li>
            <li>
              In dieser Mini-Tabelle zählt man erneut die Siege — aber nur aus diesen 3 Spielen,
              nicht aus der ganzen Saison.
            </li>
            <li>Wer in dieser Mini-Tabelle die meisten Siege hat, steht oben.</li>
          </ul>
          <p>
            Wenn auch die Mini-Tabelle keinen klaren Sieger zeigt (wie im
            Rock-Paper-Scissors-Fall: jeder gewinnt 1, verliert 1 → alle wieder gleich), geht es
            weiter zu:
          </p>

          <h4>3. Gesamt-Gamedifferenz der ganzen Gruppe</h4>
          <p>
            Jetzt zählen wieder alle Spiele der Saison (auch gegen B4), nicht nur die
            Mini-Tabelle. Gewonnene Spiele minus verlorene Spiele, über alle Partien hinweg. Wer
            die beste Differenz hat, steht oben.
          </p>

          <h4>4. Gesamt-gewonnene Spiele der ganzen Gruppe</h4>
          <p>
            Falls sogar die Gesamt-Gamedifferenz identisch ist: Es zählt, wer über die ganze
            Saison die meisten Spiele (nicht Siege, sondern einzelne Spielgewinne wie "4:2")
            gesammelt hat.
          </p>

          <h4>5. Alphabetisch (technischer Notnagel)</h4>
          <p>
            Nur falls buchstäblich alles exakt gleich ist — kommt in der Praxis quasi nie vor.
          </p>

          <p className="modal-card__summary">
            <strong>Zusammengefasst als Kette:</strong> Punkte → (bei 2er-Gleichstand: direktes
            Duell, fertig) → (bei 3er/4er-Gleichstand: nur-Siege-untereinander) →
            Gesamt-Gamedifferenz → Gesamt-gewonnene Spiele.
          </p>
        </div>
      </div>
    </div>
  )
}
