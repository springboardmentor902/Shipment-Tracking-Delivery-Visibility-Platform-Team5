import React from 'react'

/**
 * The signature element of ShipTrack Pro: a dashed transit line with stamped
 * circular nodes, one per shipment status. Reused as the hero on the public
 * tracking page, inside shipment detail, and (compact) in list rows.
 */
const STAGES = [
  { key: 'CREATED', label: 'Created' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
]

const TERMINAL_NEGATIVE = new Set(['CANCELLED', 'FAILED_DELIVERY'])

export default function RouteLine({ status, compact = false }) {
  const isNegative = TERMINAL_NEGATIVE.has(status)
  const currentIndex = STAGES.findIndex((s) => s.key === status)
  const activeIndex = currentIndex === -1 ? (isNegative ? STAGES.length - 1 : 0) : currentIndex

  return (
    <div className={compact ? 'w-full' : 'w-full py-4'}>
      <div className="relative flex items-center justify-between">
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-dashed-line"
          aria-hidden="true"
        />
        {isNegative ? (
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px]"
            style={{ backgroundColor: '#C1483D' }}
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-cleared transition-all duration-500"
            style={{
              width: STAGES.length > 1 ? `${(activeIndex / (STAGES.length - 1)) * 100}%` : '0%',
            }}
            aria-hidden="true"
          />
        )}

        {STAGES.map((stage, idx) => {
          const reached = !isNegative && idx <= activeIndex
          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
              <div
                className={[
                  'flex items-center justify-center rounded-full border-2 font-mono transition-colors',
                  compact ? 'w-3.5 h-3.5' : 'w-8 h-8 text-[11px]',
                  reached
                    ? 'bg-cleared border-cleared text-paper'
                    : 'bg-paper border-manifest text-slate',
                ].join(' ')}
              >
                {!compact && (reached ? '\u2713' : idx + 1)}
              </div>
              {!compact && (
                <span
                  className={[
                    'eyebrow text-center leading-tight',
                    reached ? 'text-ink' : 'text-slate/70',
                  ].join(' ')}
                >
                  {stage.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {isNegative && !compact && (
        <div className="mt-3 flex items-center gap-2 justify-center">
          <span className="w-2 h-2 rounded-full bg-flag" />
          <span className="eyebrow text-flag">
            {status === 'CANCELLED' ? 'Shipment cancelled' : 'Delivery attempt failed'}
          </span>
        </div>
      )}
    </div>
  )
}
