import { useCanEdit } from '../../state/AuthContext'

export type TabId = 'groups' | 'koPhase' | 'scheduling' | 'results' | 'myGames'

interface TabNavigationProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'groups', label: 'Gruppenphase' },
  { id: 'koPhase', label: 'KO-Phase' },
  { id: 'scheduling', label: 'Platzplanung' },
  { id: 'results', label: 'Ergebnisse' },
  { id: 'myGames', label: 'Meine Spiele' },
]

export default function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  const canEdit = useCanEdit()
  // Der Ergebnisse-Reiter dient nur der Bearbeitung und wird im
  // ausgeloggten Zustand komplett ausgeblendet (nicht nur gesperrt).
  const visibleTabs = canEdit ? TABS : TABS.filter((tab) => tab.id !== 'results')

  return (
    <nav className="tab-nav" aria-label="Hauptnavigation">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={
            activeTab === tab.id
              ? 'tab-nav__item tab-nav__item--active'
              : 'tab-nav__item'
          }
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
