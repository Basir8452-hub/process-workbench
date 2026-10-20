import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { message } from 'antd'
import { createEmptyStore } from '../constants'
import { loadStore, saveStore } from '../services/storage'
import type { StoreData } from '../types'

interface AppStoreValue {
  data: StoreData
  loading: boolean
  error: string | null
  mutate: (updater: (draft: StoreData) => StoreData) => void
  replaceStore: (data: StoreData) => Promise<void>
  reload: () => Promise<void>
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(createEmptyStore)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRef = useRef(data)
  const saveChain = useRef<Promise<unknown>>(Promise.resolve())

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loaded = await loadStore()
      dataRef.current = loaded
      setData(loaded)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '数据加载失败')
      message.error('数据加载失败，已使用空数据启动')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const mutate = useCallback((updater: (draft: StoreData) => StoreData) => {
    const next = updater(dataRef.current)
    dataRef.current = next
    setData(next)
    saveChain.current = saveChain.current
      .then(() => saveStore(next))
      .catch((err) => {
        console.error(err)
        message.error('数据保存失败，请检查磁盘权限')
      })
  }, [])

  const replaceStore = useCallback(async (next: StoreData) => {
    dataRef.current = next
    setData(next)
    await saveStore(next)
  }, [])

  return (
    <AppStoreContext.Provider value={{ data, loading, error, mutate, replaceStore, reload }}>
      {children}
    </AppStoreContext.Provider>
  )
}

export function useAppStore(): AppStoreValue {
  const value = useContext(AppStoreContext)
  if (!value) throw new Error('useAppStore must be used inside AppStoreProvider')
  return value
}
