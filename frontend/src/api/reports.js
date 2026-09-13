import client from './client'

const REPORT_ENDPOINTS = {
  SHIPMENTS: '/reports/shipments',
  DELIVERY: '/reports/delivery',
  ROUTE_PERFORMANCE: '/reports/routes',
  DELAY_ANALYSIS: '/reports/delay-analysis',
}

export const REPORT_TYPES = [
  { value: 'SHIPMENTS', label: 'Shipment Report' },
  { value: 'DELIVERY', label: 'Delivery Report' },
  { value: 'ROUTE_PERFORMANCE', label: 'Route Performance Report' },
  { value: 'DELAY_ANALYSIS', label: 'Delay Analysis Report' },
]

/**
 * Downloads a report and saves it via a throwaway link element - the standard way to turn
 * an axios blob response into an actual file save without navigating away from the page.
 * Reads the filename the backend chose from Content-Disposition rather than inventing one
 * client-side, so it always matches what the server actually generated.
 */
export async function downloadReport(reportType, format) {
  const endpoint = REPORT_ENDPOINTS[reportType]
  if (!endpoint) throw new Error(`Unknown report type: ${reportType}`)

  try {
    const response = await client.get(endpoint, {
      params: { format },
      responseType: 'blob',
    })

    const disposition = response.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match ? match[1] : `${reportType.toLowerCase()}.${format === 'excel' ? 'xlsx' : 'pdf'}`

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    // With responseType: 'blob', a failed request's error body is ALSO a Blob rather than
    // parsed JSON - err.response.data.message would be undefined without this conversion.
    if (err.response?.data instanceof Blob) {
      const text = await err.response.data.text()
      try {
        const parsed = JSON.parse(text)
        err.response.data = parsed
      } catch {
        // Not JSON - leave err.response.data as-is; caller falls back to a generic message.
      }
    }
    throw err
  }
}
