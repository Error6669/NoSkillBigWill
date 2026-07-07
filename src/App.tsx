import { useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import TabNavigation, { type TabId } from './components/navigation/TabNavigation'
import GroupsView from './features/groups/GroupsView'
import KoPhaseView from './features/kophase/KoPhaseView'
import SchedulingView from './features/scheduling/SchedulingView'
import ResultsView from './features/results/ResultsView'
import MyGamesView from './features/mygames/MyGamesView'
import { exportStateToFile, importStateFromFile } from './lib/storage'
import { downloadMyGamesHtml } from './lib/htmlExport'
import { AppStateProvider, useAppState } from './state/AppStateContext'

function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}

function AppShell() {
  const { state, setState, resetAll, loadSampleData } = useAppState()
  const [activeTab, setActiveTab] = useState<TabId>('groups')

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
      />
      <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
      <main className="app-content">
        {activeTab === 'groups' && <GroupsView />}
        {activeTab === 'koPhase' && <KoPhaseView />}
        {activeTab === 'scheduling' && <SchedulingView />}
        {activeTab === 'results' && <ResultsView />}
        {activeTab === 'myGames' && <MyGamesView />}
      </main>
    </div>
  )
}

export default App
