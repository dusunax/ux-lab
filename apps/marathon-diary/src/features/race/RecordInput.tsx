import { useCallback, memo } from 'react'

export interface RecordValues {
  date: string
  distance: number
  finishTime: string
  raceName: string
}

interface TimeFields {
  hh: string
  mm: string
  ss: string
}

function parseFinishTime(finishTime: string): TimeFields {
  const parts = finishTime.split(':')
  return {
    hh: parts[0] ?? '00',
    mm: parts[1] ?? '00',
    ss: parts[2] ?? '00',
  }
}

function buildFinishTime(fields: TimeFields): string {
  return `${fields.hh.padStart(2, '0')}:${fields.mm.padStart(2, '0')}:${fields.ss.padStart(2, '0')}`
}

function clampTimeField(value: string, max: number): string {
  const num = parseInt(value, 10)
  if (isNaN(num)) return '00'
  return String(Math.min(Math.max(0, num), max)).padStart(2, '0')
}

interface Props {
  values: RecordValues
  onChange: (values: RecordValues) => void
}

export default memo(function RecordInput({ values, onChange }: Props) {
  const timeFields = parseFinishTime(values.finishTime)

  const handleTimeFieldChange = useCallback(
    (field: keyof TimeFields, raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2)
      const newFields = { ...timeFields, [field]: digits }
      onChange({ ...values, finishTime: buildFinishTime(newFields) })
    },
    [timeFields, values, onChange]
  )

  const handleTimeFieldBlur = useCallback(
    (field: keyof TimeFields, raw: string, max: number) => {
      const clamped = clampTimeField(raw, max)
      const newFields = { ...timeFields, [field]: clamped }
      onChange({ ...values, finishTime: buildFinishTime(newFields) })
    },
    [timeFields, values, onChange]
  )

  const handleDistanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      onChange({ ...values, distance: isNaN(val) ? 0 : val })
    },
    [values, onChange]
  )

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, date: e.target.value })
    },
    [values, onChange]
  )

  const handleRaceNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, raceName: e.target.value })
    },
    [values, onChange]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* 날짜 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="race-date" className="text-bark text-sm font-medium">
          레이스 날짜
        </label>
        <input
          id="race-date"
          type="date"
          value={values.date}
          onChange={handleDateChange}
          className="border border-bark/30 rounded-lg px-4 py-2.5 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-gold"
          aria-required="true"
        />
      </div>

      {/* 거리 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="race-distance" className="text-bark text-sm font-medium">
          거리 <span className="text-bark-light font-normal">(km)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="race-distance"
            type="number"
            min="0"
            max="500"
            step="0.1"
            value={values.distance || ''}
            onChange={handleDistanceChange}
            placeholder="42.195"
            className="flex-1 border border-bark/30 rounded-lg px-4 py-2.5 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-gold"
            aria-required="true"
          />
          <span className="text-bark-light text-sm shrink-0">km</span>
        </div>
      </div>

      {/* 완주 시간 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-bark text-sm font-medium" id="finish-time-label">
          완주 시간
        </span>
        <div
          className="flex items-center gap-2"
          role="group"
          aria-labelledby="finish-time-label"
        >
          <TimeField
            id="finish-time-hh"
            label="시간"
            value={timeFields.hh}
            max={99}
            onChange={(v) => handleTimeFieldChange('hh', v)}
            onBlur={(v) => handleTimeFieldBlur('hh', v, 99)}
          />
          <span className="text-bark-light text-xl font-medium" aria-hidden="true">:</span>
          <TimeField
            id="finish-time-mm"
            label="분"
            value={timeFields.mm}
            max={59}
            onChange={(v) => handleTimeFieldChange('mm', v)}
            onBlur={(v) => handleTimeFieldBlur('mm', v, 59)}
          />
          <span className="text-bark-light text-xl font-medium" aria-hidden="true">:</span>
          <TimeField
            id="finish-time-ss"
            label="초"
            value={timeFields.ss}
            max={59}
            onChange={(v) => handleTimeFieldChange('ss', v)}
            onBlur={(v) => handleTimeFieldBlur('ss', v, 59)}
          />
        </div>
      </div>

      {/* 대회명 (선택) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="race-name" className="text-bark text-sm font-medium">
          대회명 <span className="text-bark-light font-normal">(선택)</span>
        </label>
        <input
          id="race-name"
          type="text"
          value={values.raceName}
          onChange={handleRaceNameChange}
          placeholder="예: 서울마라톤 2026"
          maxLength={50}
          className="border border-bark/30 rounded-lg px-4 py-2.5 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>
    </div>
  )
})

interface TimeFieldProps {
  id: string
  label: string
  value: string
  max: number
  onChange: (v: string) => void
  onBlur: (v: string) => void
}

function TimeField({ id, label, value, onChange, onBlur }: TimeFieldProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        maxLength={2}
        className="w-full border border-bark/30 rounded-lg px-2 py-2.5 text-center text-2xl font-handwriting text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-gold"
        aria-label={label}
      />
      <span className="text-bark-light text-xs">{label}</span>
    </div>
  )
}
