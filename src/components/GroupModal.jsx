import { useEffect, useRef, useState } from 'react'
import { COLORS, GROUP_EMOJIS, pick } from '../utils'

export default function GroupModal({ group, canDelete, moveTo, onClose, onSave, onDelete }) {
  const editing = Boolean(group)
  const [name, setName] = useState(group?.name ?? '')
  const [emoji, setEmoji] = useState(() => group?.emoji ?? '📁')
  const [color, setColor] = useState(() => group?.color ?? pick(COLORS))
  const [error, setError] = useState('')
  const [sure, setSure] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setError('give it a name bestie')
      return
    }
    const err = onSave({ name: clean, emoji, color }, group?.id)
    if (err) setError(err)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="brut pop w-full max-w-md bg-paper p-5 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'edit page' : 'new page'}
      >
        <h2 className="font-display text-3xl font-extrabold leading-none">
          {editing ? 'edit this page ✏️' : 'new page 📄'}
        </h2>

        <label className="mt-5 block text-sm font-extrabold" htmlFor="gname">
          page name
        </label>
        <input
          id="gname"
          ref={nameRef}
          className="brut-input mt-1.5"
          placeholder="e.g. work, school, side quests"
          value={name}
          maxLength={20}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          autoComplete="off"
        />

        <p className="mt-4 text-sm font-extrabold">icon</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {GROUP_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              className="pick"
              data-active={em === emoji}
              onClick={() => setEmoji(em)}
              aria-label={`icon ${em}`}
              aria-pressed={em === emoji}
            >
              {em}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-extrabold">color</p>
        <div className="mt-1.5 flex flex-wrap gap-3 p-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="swatch"
              data-active={c === color}
              style={{ background: `var(--color-${c})` }}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
              aria-pressed={c === color}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border-[3px] border-ink bg-white px-3 py-2 text-sm font-bold">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="submit" className="btn flex-1 bg-zap text-lg">
            {editing ? 'save it ✨' : 'create 🔥'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            nvm
          </button>
        </div>

        {editing && canDelete && (
          <div className="mt-5 border-t-[3px] border-ink pt-4">
            {sure ? (
              <button type="button" className="btn w-full bg-bubblegum" onClick={() => onDelete(group.id)}>
                yes delete it (links move to "{moveTo?.name}")
              </button>
            ) : (
              <button type="button" className="btn w-full" onClick={() => setSure(true)}>
                🗑️ delete this page
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
