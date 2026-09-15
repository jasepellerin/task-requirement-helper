export type SkillLevelReq = {
  skill: string
  level: number
  ironman?: boolean
}

export function skillReqKey(req: SkillLevelReq): string {
  return `${req.skill}:${req.level}:${req.ironman ? 'im' : ''}`
}
