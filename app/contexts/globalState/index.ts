import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

type GlobalState = {
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void
  activePackingListFilter: 'All' | 'Packed' | 'Unpacked'
  setActivePackingListFilter: (activePackingListFilter: 'All' | 'Packed' | 'Unpacked') => void
  packingListSearchValue: string
  setPackingListSearchValue: (packingListSearchValue: string) => void
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
      activePackingListFilter: 'All',
      setActivePackingListFilter: (activePackingListFilter) => set({ activePackingListFilter }),
      packingListSearchValue: '',
      setPackingListSearchValue: (packingListSearchValue) => set({ packingListSearchValue }),
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

export const usePackingListState = () => {
  return useGlobalState(
    useShallow((state) => ({
      activePackingListFilter: state.activePackingListFilter,
      setActivePackingListFilter: state.setActivePackingListFilter,
      packingListSearchValue: state.packingListSearchValue,
      setPackingListSearchValue: state.setPackingListSearchValue,
    }))
  )
}
