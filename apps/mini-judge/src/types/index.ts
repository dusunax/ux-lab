import { z } from 'zod'

export const JudgeProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
})
export type JudgeProfile = z.infer<typeof JudgeProfileSchema>

export const TeamInputSchema = z.object({
  id: z.string(),
  teamNumber: z.string(),
  title: z.string().min(1, '팀/프로젝트명을 입력해주세요'),
  description: z.string(),
  githubUrl: z.string().url('유효한 URL을 입력해주세요').or(z.literal('')),
  notionUrl: z.string(),
  manualReadme: z.string(),
  notionImage: z.string(),
})
export type TeamInput = z.infer<typeof TeamInputSchema>

export type ParseStatus = 'idle' | 'loading' | 'success' | 'failed'

export interface ParseResult {
  githubContent: string
  notionContent: string
  githubStatus: ParseStatus
  notionStatus: ParseStatus
}

export interface EvalQuestion {
  type: 'tech' | 'general'
  question: string
}

export interface EvalResult {
  projectSummary: string
  techStack: string[]
  checklist: string[]
  questions: {
    junior: EvalQuestion[]
    mid: EvalQuestion[]
    senior: EvalQuestion[]
  }
}

export type TeamStatus = 'pending' | 'parsing' | 'generating' | 'done' | 'error'

export interface Team {
  input: TeamInput
  parseResult?: ParseResult
  evalResult?: EvalResult
  status: TeamStatus
  error?: string
}
