import { createContext, useContext } from 'react'

export const DocContext = createContext({ fields: {}, set: () => {}, edit: false })

export function useDoc() {
  return useContext(DocContext)
}
