import { useJudgeStore } from './hooks/useJudgeStore'
import { SetupScreen } from './features/setup/SetupScreen'
import { TeamList } from './features/teams/TeamList'
import type { JudgeProfile } from './types'

export default function App() {
  const { profile, setProfile, teams, addTeam, removeTeam, updateTeamInput, runTeam } =
    useJudgeStore()

  function handleReset() {
    setProfile(null)
  }

  function handleFallback(id: string, field: 'manualReadme' | 'manualNotion', value: string) {
    updateTeamInput(id, { [field]: value })
  }

  if (!profile) {
    return <SetupScreen onDone={(p: JudgeProfile) => setProfile(p)} />
  }

  return (
    <TeamList
      profile={profile}
      teams={teams}
      onAdd={addTeam}
      onRemove={removeTeam}
      onRun={runTeam}
      onFallback={handleFallback}
      onReset={handleReset}
    />
  )
}
