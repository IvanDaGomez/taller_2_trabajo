import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title === 'Orbix' ? 'Orbix' : `${title} | Orbix`
  }, [title])
}
