export function buildDisplayName(player1Name: string, player2Name: string): string {
  const p1 = player1Name.trim()
  const p2 = player2Name.trim()
  if (!p1 && !p2) return ''
  if (!p1 || !p2) return p1 || p2
  return `${p1} / ${p2}`
}
