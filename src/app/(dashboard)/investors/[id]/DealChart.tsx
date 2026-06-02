'use client'

import { useEffect, useRef } from 'react'

type Props = {
  years: string[]
  amounts: number[]
  investorName: string
}

export default function DealChart({ years, amounts, investorName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || years.length === 0) return

    let chartInstance: unknown = null

    async function init() {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      const canvas = canvasRef.current
      if (!canvas) return

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      const textColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'

      chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [{
            label: 'Amount ($M)',
            data: amounts,
            backgroundColor: '#3864C8',
            borderRadius: 3,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: (c) => ` $${c.raw}M` }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 11 } },
              border: { display: false }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 11 }, callback: (v) => `$${v}M` },
              border: { display: false }
            }
          }
        }
      })
    }

    init()

    return () => {
      if (chartInstance && typeof (chartInstance as { destroy?: () => void }).destroy === 'function') {
        (chartInstance as { destroy: () => void }).destroy()
      }
    }
  }, [years, amounts])

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.07em', color: 'rgba(26,24,20,0.35)', fontWeight: 500, marginBottom: '12px' }}>
        DEAL VOLUME BY YEAR
      </div>
      <div style={{ position: 'relative', width: '100%', height: '160px' }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Bar chart of deal volume by year for ${investorName}`}
        />
      </div>
    </div>
  )
}
