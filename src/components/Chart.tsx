import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export function Chart({ option, height = 260 }: { option: EChartsOption; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const optionRef = useRef(option)

  useEffect(() => {
    optionRef.current = option
    chartRef.current?.setOption(option, true)
  }, [option])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ensureChart = () => {
      if (!chartRef.current && container.clientWidth > 0) {
        chartRef.current = echarts.init(container)
        chartRef.current.setOption(optionRef.current, true)
      }
      chartRef.current?.resize()
    }

    ensureChart()
    const observer = new ResizeObserver(ensureChart)
    observer.observe(container)

    return () => {
      observer.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}
