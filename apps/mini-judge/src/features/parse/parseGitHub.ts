export async function parseGitHub(githubUrl: string): Promise<string> {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) throw new Error('GitHub URL 형식이 올바르지 않습니다')

  const owner = match[1]
  const repo = match[2].replace(/\.git$/, '')

  for (const branch of ['main', 'master']) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`
    const res = await fetch(rawUrl)
    if (res.ok) return res.text()
  }

  throw new Error('README.md를 찾을 수 없습니다 (main/master 브랜치 확인)')
}
