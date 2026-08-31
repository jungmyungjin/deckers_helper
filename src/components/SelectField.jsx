import { useEffect, useId, useRef, useState } from 'react'

// options[].color 를 주면 그 색을 글자에 입힌다. 덱커처럼 항목 자체가 고유색을
// 가진 목록에서, 색을 배경으로 칠하면 여섯 줄이 알록달록해져 오히려 읽기 나쁘다.
export default function SelectField({ ariaLabel, className = '', disabled = false, onChange, options, style, value }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const listId = useId()
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return undefined
    function closeWhenOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeWhenOutside)
    return () => document.removeEventListener('pointerdown', closeWhenOutside)
  }, [open])

  function showList(nextIndex = selectedIndex) {
    setActiveIndex(nextIndex)
    setOpen(true)
  }

  function choose(nextValue) {
    onChange(nextValue)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      showList(event.key === 'ArrowDown' ? Math.min(selectedIndex + 1, options.length - 1) : Math.max(selectedIndex - 1, 0))
    }
    if (event.key === 'Escape') setOpen(false)
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => event.key === 'ArrowDown'
        ? Math.min(current + 1, options.length - 1)
        : Math.max(current - 1, 0))
    }
  }

  return (
    <div className={'select-field ' + className} ref={rootRef} style={style}>
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger"
        role="combobox"
        aria-label={ariaLabel}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : showList())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="select-value" style={selected?.color ? { color: selected.color } : undefined}>
          {selected?.label}
        </span>
        <svg className="select-chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="select-menu" id={listId} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={'select-option' + (option.value === value ? ' selected' : '')}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => choose(option.value)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              style={option.color ? { color: option.color } : undefined}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
