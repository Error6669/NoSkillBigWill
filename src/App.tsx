import { useEffect, useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import TabNavigation, { type TabId } from './components/navigation/TabNavigation'
import GroupsView from './features/groups/GroupsView'
import KoPhaseView from './features/kophase/KoPhaseView'
import SchedulingView from './features/scheduling/SchedulingView'
import ResultsView from './features/results/ResultsView'
import MyGamesView from './features/mygames/MyGamesView'
import { exportStateToFile, importStateFromFile } from './lib/storage'
import { downloadMyGamesHtml } from './lib/htmlExport'
import { publishStateToGithub } from './lib/publish'
import ExternalDisplayView from './features/scheduling/ExternalDisplayView'
import { AppStateProvider, useAppState } from './state/AppStateContext'
import { AuthProvider, useCanEdit } from './state/AuthContext'

const isExternalDisplay = new URLSearchParams(window.location.search).has('display')

function App() {
  return (
    <AuthProvider>
      <AppStateProvider>{isExternalDisplay ? <ExternalDisplayView /> : <AppShell />}</AppStateProvider>
    </AuthProvider>
  )
}

function AppShell() {
  const { state, setState, resetAll, loadSampleData } = useAppState()
  const canEdit = useCanEdit()
  const [activeTab, setActiveTab] = useState<TabId>('groups')

  // Der Ergebnisse-Reiter ist im ausgeloggten Zustand ausgeblendet - falls
  // man beim Ausloggen gerade dort war, auf einen sichtbaren Reiter wechseln.
  useEffect(() => {
    if (!canEdit && activeTab === 'results') {
      setActiveTab('groups')
    }
  }, [canEdit, activeTab])

  const handleImport = async (file: File) => {
    try {
      const imported = await importStateFromFile(file)
      setState(imported)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Import fehlgeschlagen.')
    }
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      'Wirklich alle Turnierdaten löschen? Dies kann nicht rückgängig gemacht werden. Exportiere vorher ggf. ein Backup.',
    )
    if (confirmed) {
      resetAll()
    }
  }

  const handleLoadSampleData = () => {
    const confirmed = window.confirm(
      'Testdaten laden? Dabei werden alle aktuellen Teams, Ergebnisse und Platzplanungen überschrieben. Exportiere vorher ggf. ein Backup.',
    )
    if (confirmed) {
      loadSampleData()
    }
  }

  return (
    <div className="app">
      <AppHeader
        onExport={() => exportStateToFile(state)}
        onImport={handleImport}
        onDownloadMyGames={() => downloadMyGamesHtml(state)}
        onLoadSampleData={handleLoadSampleData}
        onReset={handleReset}
        onPublish={(token) => publishStateToGithub(state, token)}
      />
      <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
      <main className="app-content">
        {activeTab === 'groups' && <GroupsView />}
        {activeTab === 'koPhase' && <KoPhaseView />}
        {activeTab === 'scheduling' && <SchedulingView />}
        {activeTab === 'results' && canEdit && <ResultsView />}
        {activeTab === 'myGames' && <MyGamesView />}
      </main>
    </div>
  )
}

export default App
