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

  it('v0.7.0 迁移：旧文件台账 process/line 并入 tags', () => {
    const store = normalizeStore({
      documents: [
        {
          id: 'doc1',
          code: 'SOP-001',
          name: '焊接 SOP',
          type: 'SOP',
          version: 'A',
          status: 'controlled',
          process: '焊接',
          line: 'SMT-01',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    } as never)
    expect(store.documents[0].tags).toEqual(['工序:焊接', '产线:SMT-01'])
  })

  it('v0.7.0 迁移：已有 tags 的文件不重复迁移', () => {
    const store = normalizeStore({
      documents: [
        {
          id: 'doc2',
          code: 'SOP-002',
          name: '装配 SOP',
          type: 'SOP',
          version: 'A',
          status: 'controlled',
          tags: ['工序:装配', '储能产品'],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    } as never)
    expect(store.documents[0].tags).toEqual(['工序:装配', '储能产品'])
  })

  it('v0.7.0 迁移：旧知识 content 字符串 → 单个 text 块', () => {
    const store = normalizeStore({
      knowledge: [
        {
          id: 'k1',
          title: '虚焊排查',
          type: 'case',
          tags: ['焊接'],
          content: '先查参数再查工装',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    } as never)
    expect(store.knowledge[0].blocks).toEqual([{ type: 'text', text: '先查参数再查工装' }])
  })

  it('v0.7.0 迁移：问题补齐 batchNo/rootCauseCategory 空值', () => {
    const store = normalizeStore({
      issues: [
        {
          id: 'i1',
          code: 'Q-20260101-001',
          title: '虚焊',
          severity: 'normal',
          status: 'analyzing',
          foundDate: '2026-01-01',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    } as never)
    expect(store.issues[0].batchNo).toBeUndefined()
    expect(store.issues[0].rootCauseCategory).toBeUndefined()
  })
})
