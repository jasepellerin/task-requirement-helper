export function assetUrl(path: string): string {
  const relative = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${relative}`
}
