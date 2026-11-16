import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'
import { DEFAULT_NEWS_PUSH_TIME, NEWS_CATEGORY_LABELS, NEWS_CATEGORY_ORDER } from '../constants'
import {
  applyNewsResult,
  generateNewsDigest,
  newsTargetDate,
} from '../services/news'
import { showNotification } from '../services/storage'
import { useAppStore } from '../store/AppStore'

/** 发送桌面通知，失败只记录日志，不影响调度器 */
async function notify(payload: { title: string; body: string }) {
  try {
    await showNotification(payload)
  } catch (error) {
    console.error('发送桌面通知失败', error)
  }
}

/**
 * 本地定时推送：
 * - 应用启动后检查是否已过推送时间；
 * - 每分钟检查一次；
 * - 如果当天尚未生成昨日日报，则自动抓取、检索并生成；
 * - 应用在 9 点前未启动时，下次启动会自动补生成。
 */
export function useNewsScheduler() {
  const { data, mutate, loading } = useAppStore()
  const dataRef = useRef(data)
  const runningRef = useRef(false)
  const attemptedDateRef = useRef('')

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    if (loading) return
    let disposed = false

    const check = async () => {
      if (runningRef.current || disposed) return
      const current = dataRef.current
      const settings = current.settings
      if (settings.newsEnabled === false) return

      const pushTime = settings.newsPushTime || DEFAULT_NEWS_PUSH_TIME
      const [hour, minute] = pushTime.split(':').map((value) => Number(value))
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) return

      const now = dayjs()
      const due =
        now.hour() > hour || (now.hour() === hour && now.minute() >= minute)
      if (!due) return

      const targetDate = newsTargetDate()
      if (attemptedDateRef.current === targetDate) return
      const pending = NEWS_CATEGORY_ORDER.filter(
        (category) =>
          !current.newsDigests.some(
            (digest) => digest.date === targetDate && (digest.category ?? 'storage') === category,
          ),
      )
      if (pending.length === 0) return

      attemptedDateRef.current = targetDate
      runningRef.current = true

      try {
        for (const category of pending) {
          const label = NEWS_CATEGORY_LABELS[category]
          const result = await generateNewsDigest({
            targetDate,
            settings: dataRef.current.settings,
            existingArticles: dataRef.current.newsArticles,
            category,
          })
          if (disposed) return
          mutate((draft) =>
            applyNewsResult(draft, result, settings.newsRetentionDays ?? 90),
          )
          if (result.digest.status === 'failed') {
            await notify({
              title: `${label}日报生成失败`,
              body: `${targetDate}：${result.digest.error ?? '资讯抓取或摘要生成异常'}（下次启动会自动补生成）`,
            })
          } else {
            await notify({
              title: `${label}日报已生成`,
              body: `${targetDate} · ${result.digest.articleIds.length} 条资讯`,
            })
          }
        }
      } catch (error) {
        console.error('自动生成行业资讯失败', error)
        await notify({
          title: '行业资讯日报生成失败',
          body: `${targetDate}：${error instanceof Error ? error.message : String(error)}（下次启动会自动补生成）`,
        })
      } finally {
        runningRef.current = false
      }
    }

    void check()
    const timer = window.setInterval(() => {
      void check()
    }, 60000)

    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [loading, mutate])
}
