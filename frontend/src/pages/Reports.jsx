import React, { useState } from 'react'
import { downloadReport, REPORT_TYPES } from '../api/reports'
import ErrorNote from '../components/ErrorNote'

export default function Reports() {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value)
  const [format, setFormat] = useState('pdf')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleDownload = async () => {
    setError('')
    setSuccess('')
    setDownloading(true)
    try {
      await downloadReport(reportType, format)
      setSuccess('Download started - check your browser\u2019s downloads.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate that report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <p className="eyebrow text-slate mb-1">Reports & Export</p>
      <h1 className="font-display font-semibold text-2xl mb-2">Download a report</h1>
      <p className="text-sm text-slate mb-8">
        Reports are scoped to what you can see elsewhere in the app {'\u2014'} your own shipments,
        your business's shipments, or platform-wide if you're an administrator.
      </p>

      <ErrorNote message={error} />
      {success && (
        <div className="stamp-card border-cleared px-4 py-3 mb-4">
          <p className="text-sm text-ink">{success}</p>
        </div>
      )}

      <div className="stamp-card p-6 space-y-6">
        <div>
          <label className="field-label">Report type</label>
          <div className="grid grid-cols-1 gap-2">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setReportType(t.value)}
                className={[
                  'text-left px-4 py-3 border transition-colors',
                  reportType === t.value
                    ? 'bg-ink text-paper border-ink'
                    : 'border-manifest text-ink hover:border-ink',
                ].join(' ')}
              >
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Format</label>
          <div className="flex gap-3">
            {['pdf', 'excel'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={[
                  'eyebrow px-4 py-2 border transition-colors',
                  format === f ? 'bg-ink text-paper border-ink' : 'border-manifest text-slate hover:border-ink',
                ].join(' ')}
              >
                {f === 'pdf' ? 'PDF' : 'Excel'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleDownload} disabled={downloading} className="btn-primary w-full">
          {downloading ? 'Generating\u2026' : 'Download'}
        </button>
      </div>
    </div>
  )
}
