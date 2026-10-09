import { useRef, type ReactNode } from 'react'
import Select from 'react-select'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useStore } from '../store/index'
import type { Asset, FaultCode, ViewMode, Filters, ISODate } from '../data/types'
import { formatPeriodText } from '../lib/dates'

const selectStyles = {
  control: (base: object) => ({ ...base, background: '#1C1C1E', border: '1px solid #3A3A3C', borderRadius: 8, minHeight: 48, cursor: 'pointer', boxShadow: 'none' }),
  menu: (base: object) => ({ ...base, background: '#1C1C1E', border: '1px solid #3A3A3C' }),
  option: (base: object, state: { isFocused: boolean }) => ({ ...base, background: state.isFocused ? '#2A2A2C' : '#1C1C1E', color: '#FFFFFF', cursor: 'pointer' }),
  multiValue: (base: object) => ({ ...base, background: '#2A2A2C' }),
  multiValueLabel: (base: object) => ({ ...base, color: '#FFFFFF' }),
  multiValueRemove: (base: object) => ({ ...base, color: '#A1A1AA', ':hover': { background: '#3A3A3C', color: '#FFFFFF' } }),
  input: (base: object) => ({ ...base, color: '#FFFFFF' }),
  placeholder: (base: object) => ({ ...base, color: '#A1A1AA' }),
  singleValue: (base: object) => ({ ...base, color: '#FFFFFF' }),
  indicatorSeparator: (base: object) => ({ ...base, background: '#3A3A3C' }),
  dropdownIndicator: (base: object) => ({ ...base, color: '#A1A1AA' }),
  clearIndicator: (base: object) => ({ ...base, color: '#A1A1AA' }),
  valueContainer: (base: object) => ({ ...base, paddingLeft: 12 }),
}

interface AssetOption {
  value: string
  label: string
  asset: Asset
}

interface FaultCodeOption {
  value: string
  label: string
  faultCode: FaultCode
}

function LabeledControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <span style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 2, paddingLeft: 12 }}>{label}</span>
      {children}
    </div>
  )
}

function CheckboxPair({
  labelA, labelB,
  checkedA, checkedB,
  onChangeA, onChangeB,
}: {
  a?: keyof Filters; b?: keyof Filters
  labelA: string; labelB: string
  checkedA: boolean; checkedB: boolean
  onChangeA: (v: boolean) => void; onChangeB: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checkedA}
          onChange={e => onChangeA(e.target.checked)}
          style={{
            width: 18,
            height: 18,
            accentColor: '#FFFFFF',
            cursor: 'pointer',
            borderRadius: 3,
          }}
        />
        <span style={{ color: '#FFFFFF', fontSize: 14 }}>{labelA}</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checkedB}
          onChange={e => onChangeB(e.target.checked)}
          style={{
            width: 18,
            height: 18,
            accentColor: '#FFFFFF',
            cursor: 'pointer',
            borderRadius: 3,
          }}
        />
        <span style={{ color: '#FFFFFF', fontSize: 14 }}>{labelB}</span>
      </label>
    </div>
  )
}

export default function FilterBar({ periodStart, periodEnd }: { periodStart: ISODate; periodEnd: ISODate }) {
  const {
    data,
    view,
    end,
    selectedAssets,
    selectedCodes,
    filters,
    setView,
    setEnd,
    navigatePeriod,
    setSelectedAssets,
    setSelectedCodes,
    setFilter,
  } = useStore()

  const dateInputRef = useRef<HTMLInputElement>(null)

  const assets: Asset[] = data?.assets ?? []
  const faultCodes: FaultCode[] = data?.faultCodes ?? []

  const assetOptions: AssetOption[] = assets.map(a => ({
    value: a.id,
    label: a.label,
    asset: a,
  }))

  const faultCodeOptions: FaultCodeOption[] = faultCodes.map(fc => ({
    value: fc.code,
    label: `${fc.code} — ${fc.description}`,
    faultCode: fc,
  }))

  const selectedAssetOptions = assetOptions.filter(o => selectedAssets.includes(o.value))
  const selectedCodeOptions = faultCodeOptions.filter(o => selectedCodes.includes(o.value))

  const periodText = formatPeriodText(periodStart, periodEnd)

  function formatAssetValue(options: readonly AssetOption[]) {
    if (options.length === 0) return null
    if (options.length === 1) return options[0].label
    return `${options.length} assets`
  }

  function formatCodeValue(options: readonly FaultCodeOption[]) {
    if (options.length === 0) return 'All'
    if (options.length === 1) return options[0].faultCode.code
    return `${options.length} fault codes`
  }

  const assetControlStyles = {
    ...selectStyles,
    valueContainer: (base: object) => ({
      ...selectStyles.valueContainer(base),
      flexWrap: 'nowrap' as const,
    }),
  }

  const codeControlStyles = {
    ...selectStyles,
    valueContainer: (base: object) => ({
      ...selectStyles.valueContainer(base),
      flexWrap: 'nowrap' as const,
    }),
  }

  return (
    <div
      style={{
        height: 96,
        background: '#2A2A2C',
        paddingLeft: 40,
        paddingRight: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Asset select */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <LabeledControl label="Asset">
          <Select<AssetOption, true>
            isMulti
            options={assetOptions}
            value={selectedAssetOptions}
            onChange={opts => setSelectedAssets(opts.map(o => o.value))}
            placeholder="Select..."
            styles={assetControlStyles as object}
            controlShouldRenderValue={false}
            formatOptionLabel={(option: AssetOption) => (
              <span>{option.asset.label}</span>
            )}
            components={{
              ValueContainer: ({ children, ...props }) => {
                const selected = props.getValue()
                const displayText = formatAssetValue(selected as readonly AssetOption[])
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 12,
                      flex: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {displayText ? (
                        <span style={{ color: '#FFFFFF', fontSize: 14 }}>{displayText}</span>
                      ) : (
                        <span style={{ color: '#A1A1AA', fontSize: 14 }}>Select...</span>
                      )}
                      {/* Keep the input for search */}
                      {Array.isArray(children) ? children[children.length - 1] : null}
                    </div>
                  </div>
                )
              },
            }}
          />
        </LabeledControl>
      </div>

      {/* Fault codes select */}
      <div style={{ width: 420, flexShrink: 0 }}>
        <LabeledControl label="Fault codes">
          <Select<FaultCodeOption, true>
            isMulti
            options={faultCodeOptions}
            value={selectedCodeOptions}
            onChange={opts => setSelectedCodes(opts.map(o => o.value))}
            placeholder="All"
            styles={codeControlStyles as object}
            controlShouldRenderValue={false}
            filterOption={(option, inputValue) => {
              const fc = option.data.faultCode
              const q = inputValue.toLowerCase()
              return (
                fc.code.toLowerCase().includes(q) ||
                fc.description.toLowerCase().includes(q)
              )
            }}
            formatOptionLabel={(option: FaultCodeOption) => (
              <span>{option.faultCode.code} — {option.faultCode.description}</span>
            )}
            components={{
              ValueContainer: ({ children, ...props }) => {
                const selected = props.getValue()
                const displayText = formatCodeValue(selected as readonly FaultCodeOption[])
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 12,
                      flex: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <span style={{ color: selected.length === 0 ? '#A1A1AA' : '#FFFFFF', fontSize: 14 }}>
                        {displayText}
                      </span>
                      {Array.isArray(children) ? children[children.length - 1] : null}
                    </div>
                  </div>
                )
              },
            }}
          />
        </LabeledControl>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
        <CheckboxPair
          a="validated" b="notValidated"
          labelA="Validated" labelB="Not validated"
          checkedA={filters.validated} checkedB={filters.notValidated}
          onChangeA={v => setFilter('validated', v)}
          onChangeB={v => setFilter('notValidated', v)}
        />
        <CheckboxPair
          a="interesting" b="notInteresting"
          labelA="Interesting" labelB="Not interesting"
          checkedA={filters.interesting} checkedB={filters.notInteresting}
          onChangeA={v => setFilter('interesting', v)}
          onChangeB={v => setFilter('notInteresting', v)}
        />
        <CheckboxPair
          a="abnormal" b="normal"
          labelA="Abnormal" labelB="Normal"
          checkedA={filters.abnormal} checkedB={filters.normal}
          onChangeA={v => setFilter('abnormal', v)}
          onChangeB={v => setFilter('normal', v)}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Period selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Segmented 1W / 1M */}
        <div
          style={{
            display: 'flex',
            border: '1px solid #3A3A3C',
            borderRadius: 10,
            overflow: 'hidden',
            height: 48,
          }}
        >
          {(['1W', '1M'] as ViewMode[]).map((v, i) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                width: 48,
                height: 48,
                background: view === v ? '#FFFFFF' : 'transparent',
                color: view === v ? '#000000' : '#FFFFFF',
                fontWeight: view === v ? 700 : 400,
                fontSize: 14,
                border: 'none',
                borderLeft: i > 0 ? '1px solid #3A3A3C' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Prev arrow */}
        <button
          onClick={() => navigatePeriod(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Period text */}
        <span style={{ fontSize: 20, color: '#FFFFFF', whiteSpace: 'nowrap', minWidth: 180, textAlign: 'center' }}>
          {periodText}
        </span>

        {/* Calendar icon — opens native date input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => dateInputRef.current?.showPicker?.()}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <Calendar size={20} />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={end}
            onChange={e => {
              if (e.target.value) setEnd(e.target.value)
            }}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: 0,
              height: 0,
            }}
          />
        </div>

        {/* Next arrow */}
        <button
          onClick={() => navigatePeriod(1)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#FFFFFF',
            opacity: 1,
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
