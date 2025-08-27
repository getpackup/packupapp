import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

type GlobalState = {
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void
}

const createMemoryStorage = () => {
  const storage: Record<string, string> = {}
  return {
    getItem: (name: string) => storage[name] || null,
    setItem: (name: string, value: string) => {
      storage[name] = value
    },
    removeItem: (name: string) => {
      delete storage[name]
    },
  }
}

const storageOption =
  typeof process !== 'undefined' && process.env.VITE_APP_ENV === 'E2E'
    ? createJSONStorage(() => createMemoryStorage())
    : createJSONStorage(() =>
        typeof window !== 'undefined' && window.sessionStorage
          ? window.sessionStorage
          : createMemoryStorage()
      )

const useGlobalState = create<GlobalState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
    }),
    {
      name: 'packup-global-state',
      storage: storageOption,
    }
  )
)

export const useSidebarState = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      isSidebarCollapsed: false,
      setIsSidebarCollapsed: () => {},
    }
  }
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useGlobalState(
    useShallow((state) => ({
      isSidebarCollapsed: state.isSidebarCollapsed,
      setIsSidebarCollapsed: state.setIsSidebarCollapsed,
    }))
  )
  return { isSidebarCollapsed, setIsSidebarCollapsed }
}
