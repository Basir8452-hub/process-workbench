import { describe, expect, it } from 'vitest'
import { createEmptyStore } from '../constants'
import { normalizeStore } from './storage'

describe('normalizeStore（数据兼容层）', () => {
  it('空输入返回空 Store', () => {
    const store = normalizeStore(null)
    expect(store.toeflRecords).toEqual([])
    expect(store.settings.expiryWarningDays).toBe(30)
    expect(store.tasks).toEqual([])
  })

  it('非法输入返回空 Store', () => {
    const store = normalizeStore('bad' as unknown as null)
    expect(store.issues).toEqual([])
  })

  it('保留合法数组字段并补齐缺失字段', () => {
    const input = { tasks: [{ id: 'x', title: 't' }] }
    const store = normalizeStore(input as never)
    expect(store.tasks).toHaveLength(1)
    expect(store.toeflRecords).toEqual([])
    expect(store.newsDigests).toEqual([])
  })

  it('settings 与默认值合并', () => {
    const store = normalizeStore({ settings: { ownerName: '蔡晨潇' } } as never)
    expect(store.settings.ownerName).toBe('蔡晨潇')
    expect(store.settings.expiryWarningDays).toBe(30)
  })

  it('非法数组字段回退为空数组', () => {
    const store = normalizeStore({ toeflRecords: 'bad' } as never)
    expect(store.toeflRecords).toEqual([])
  })

  it('createEmptyStore 与 normalizeStore 结构一致', () => {
    const empty = createEmptyStore()
    const normalized = normalizeStore(undefined)
    expect(Object.keys(normalized).sort()).toEqual(Object.keys(empty).sort())
  })
})
