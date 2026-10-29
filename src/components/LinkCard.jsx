import { hostOf } from '../utils'

export default function LinkCard({ link, index, onOpen, onPin, onCopy, onEdit, onDelete }) {
  const actions = [
    { key: 'pin', label: link.pinned ? 'unpin' : 'pin', icon: link.pinned ? '📌' : '📍', run: () => onPin(link.id) },
    { key: 'copy', label: 'copy', icon: '📋', run: () => onCopy(link) },
    { key: 'edit', label: 'edit', icon: '✏️', run: () => onEdit(link) },
    { key: 'del', label: 'delete', icon: '🗑️', run: () => onDelete(link.id) },
  ]

  return (
    <article
      className="card pop relative"
      style={{
        background: `var(--color-${link.color})`,
        '--tilt': index % 2 === 0 ? '-0.8deg' : '0.8deg',
        animationDelay: `${Math.min(index, 8) * 40}ms`,
      }}
    >
      {link.pinned && (
        <span
          className="absolute right-3 top-3 text-xl"
          title="pinned"
          aria-label="pinned"
        >
          📌
        </span>
      )}

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onOpen(link.id)}
        className="block p-4 pb-3 outline-none focus-visible:bg-white/40"
        aria-label={`open ${link.name}`}
      >
        <div className="flex items-start gap-3">
          <span className="emoji-tile">{link.emoji}</span>
          <div className={`min-w-0 flex-1 ${link.pinned ? 'pr-7' : ''}`}>
            <h3 className="font-display text-2xl font-extrabold leading-tight wrap-break-word">
              {link.name}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs font-medium">{hostOf(link.url)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold">
          ↗ {link.clicks === 0 ? 'never opened (yet)' : `opened ${link.clicks}x`}
        </p>
      </a>

      <div className="flex divide-x-[3px] divide-ink border-t-[3px] border-ink">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            className="card-action"
            onClick={a.run}
            aria-label={`${a.label} ${link.name}`}
          >
            <span aria-hidden="true">{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
    </article>
  )
}
