import { useEffect, useRef, useState } from 'react'
import { COLORS, EMOJIS, hostOf, normalizeUrl, pick } from '../utils'

export default function LinkModal({ link, groups, defaultGroupId, onClose, onSave }) {
  const editing = Boolean(link)
  const [url, setUrl] = useState(link?.url ?? '')
  const [name, setName] = useState(link?.name ?? '')
  const [emoji, setEmoji] = useState(() => link?.emoji ?? pick(EMOJIS))
  const [color, setColor] = useState(() => link?.color ?? pick(COLORS))
  const [groupId, setGroupId] = useState(link?.groupId ?? defaultGroupId)
  const [error, setError] = useState('')
  const urlRef = useRef(null)

  // focus the first field once, on open
  useEffect(() => {
    urlRef.current?.focus()
  }, [])

  // esc to close
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    const clean = normalizeUrl(url)
    if (!clean) {
      setError("that link ain't linking 💀 try something like github.com")
      return
    }
    const err = onSave(
      { url: clean, name: name.trim() || hostOf(clean), emoji, color, groupId },
      link?.id,
    )
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
        aria-label={editing ? 'edit link' : 'add link'}
      >
        <h2 className="font-display text-3xl font-extrabold leading-none">
          {editing ? 'glow up this link ✏️' : 'drop a new link 🔗'}
        </h2>

        <label className="mt-5 block text-sm font-extrabold" htmlFor="url">
          the link
        </label>
        <input
          id="url"
          ref={urlRef}
          className="brut-input mt-1.5"
          placeholder="paste it here (github.com/...)"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError('')
          }}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
        />

        <label className="mt-4 block text-sm font-extrabold" htmlFor="name">
          name it something u'll remember
        </label>
        <input
          id="name"
          className="brut-input mt-1.5"
          placeholder="e.g. my portfolio, hackathon docs"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />

        <p className="mt-4 text-sm font-extrabold">which page</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className="chip"
              data-active={g.id === groupId}
              onClick={() => setGroupId(g.id)}
              aria-pressed={g.id === groupId}
            >
              {g.emoji} {g.name}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-extrabold">vibe (emoji)</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              className="pick"
              data-active={em === emoji}
              onClick={() => setEmoji(em)}
              aria-label={`emoji ${em}`}
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

        <div
          className="mt-5 flex items-center gap-3 rounded-2xl border-[3px] border-ink p-3"
          style={{ background: `var(--color-${color})` }}
          aria-hidden="true"
        >
          <span className="emoji-tile">{emoji}</span>
          <span className="min-w-0 truncate font-display text-xl font-extrabold">
            {name.trim() || 'ur link name'}
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border-[3px] border-ink bg-white px-3 py-2 text-sm font-bold">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="submit" className="btn flex-1 bg-zap text-lg">
            {editing ? 'save it ✨' : 'add it 🔥'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            nvm
          </button>
        </div>
      </form>
    </div>
  )
}
