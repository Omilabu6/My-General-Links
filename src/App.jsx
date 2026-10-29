import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useLocalStorage from './hooks/useLocalStorage'
import LinkCard from './components/LinkCard'
import LinkModal from './components/LinkModal'
import GroupModal from './components/GroupModal'
import { COLORS, EMOJIS, GROUP_EMOJIS, hostOf, normalizeUrl, pick, uid } from './utils'

const DEFAULT_GROUPS = [
  { id: 'work', name: 'work', emoji: '💼', color: 'ice' },
  { id: 'school', name: 'school', emoji: '🎓', color: 'butter' },
]

const SORTS = [
  { id: 'recent', label: 'newest' },
  { id: 'clicks', label: 'most opened' },
  { id: 'az', label: 'a → z' },
]

const TICKER = ['ur links', 'ur rules', 'no cap', 'zero searching', 'main character energy', 'bookmarks who?']
const HALF = [...TICKER, ...TICKER, ...TICKER]

export default function App() {
  const [links, setLinks] = useLocalStorage('linkdump.links', [])
  const [groups, setGroups] = useLocalStorage('linkdump.groups', DEFAULT_GROUPS)
  const [activeId, setActiveId] = useLocalStorage('linkdump.active', DEFAULT_GROUPS[0].id)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | pinned
  const [sort, setSort] = useState('recent')
  const [modal, setModal] = useState(null) // null | { link: object | null }
  const [groupModal, setGroupModal] = useState(null) // null | { group: object | null }
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const fileRef = useRef(null)

  const notify = useCallback((msg, undo) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, undo, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), undo ? 6000 : 2600)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const closeModal = useCallback(() => setModal(null), [])
  const closeGroupModal = useCallback(() => setGroupModal(null), [])

  // never let the app end up with zero pages
  useEffect(() => {
    if (groups.length === 0) setGroups(DEFAULT_GROUPS)
  }, [groups, setGroups])

  // links saved before pages existed (or pointing at a deleted page) land on the first page
  useEffect(() => {
    if (groups.length === 0) return
    const ids = new Set(groups.map((g) => g.id))
    if (links.some((l) => !ids.has(l.groupId))) {
      setLinks((ls) => ls.map((l) => (ids.has(l.groupId) ? l : { ...l, groupId: groups[0].id })))
    }
  }, [groups, links, setLinks])

  const active = groups.find((g) => g.id === activeId) ?? groups[0]
  const activeGid = active?.id

  const counts = useMemo(() => {
    const c = {}
    for (const l of links) c[l.groupId] = (c[l.groupId] || 0) + 1
    return c
  }, [links])

  const pageLinks = useMemo(() => links.filter((l) => l.groupId === activeGid), [links, activeGid])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = pageLinks.filter(
      (l) =>
        (filter === 'all' || l.pinned) &&
        (!q || l.name.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)),
    )
    const by = {
      recent: (a, b) => b.createdAt - a.createdAt,
      clicks: (a, b) => b.clicks - a.clicks,
      az: (a, b) => a.name.localeCompare(b.name),
    }[sort]
    // pinned always float to the top
    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || by(a, b))
  }, [pageLinks, query, filter, sort])

  if (!active) return null

  const totalOpens = pageLinks.reduce((n, l) => n + l.clicks, 0)

  const switchPage = (id) => {
    setActiveId(id)
    setQuery('')
    setFilter('all')
  }

  /* ---------- link actions ---------- */

  // returns an error string (shown in the modal) or null on success
  const save = (data, editingId) => {
    const dup = links.find((l) => l.url === data.url && l.groupId === data.groupId && l.id !== editingId)
    if (dup) return `already saved on this page as "${dup.name}" bestie 👀`

    if (editingId) {
      setLinks((ls) => ls.map((l) => (l.id === editingId ? { ...l, ...data } : l)))
      notify('glow up complete ✨')
    } else {
      setLinks((ls) => [{ id: uid(), ...data, pinned: false, clicks: 0, createdAt: Date.now() }, ...ls])
      notify('saved. ur vault just got cooler 🔥')
    }
    if (data.groupId !== activeGid) switchPage(data.groupId) // follow the link to its page
    setModal(null)
    return null
  }

  const remove = (id) => {
    const index = links.findIndex((l) => l.id === id)
    if (index < 0) return
    const gone = links[index]
    setLinks((ls) => ls.filter((l) => l.id !== id))
    notify(`"${gone.name}" deleted 💀`, () => {
      setLinks((ls) => {
        const copy = [...ls]
        copy.splice(Math.min(index, copy.length), 0, gone)
        return copy
      })
      notify('back from the dead 🧟')
    })
  }

  const togglePin = (id) =>
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, pinned: !l.pinned } : l)))

  const bumpClicks = (id) =>
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, clicks: l.clicks + 1 } : l)))

  const copy = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url)
      notify('copied 📋')
    } catch {
      notify("couldn't copy, ur browser said no 😭")
    }
  }

  /* ---------- page actions ---------- */

  const saveGroup = (data, editingId) => {
    const clash = groups.find((g) => g.name.toLowerCase() === data.name.toLowerCase() && g.id !== editingId)
    if (clash) return 'u already have a page with that name 👀'

    if (editingId) {
      setGroups((gs) => gs.map((g) => (g.id === editingId ? { ...g, ...data } : g)))
      notify('page updated ✨')
    } else {
      const g = { id: uid(), ...data }
      setGroups((gs) => [...gs, g])
      switchPage(g.id)
      notify('new page unlocked 🔓')
    }
    setGroupModal(null)
    return null
  }

  const removeGroup = (id) => {
    const rest = groups.filter((g) => g.id !== id)
    if (rest.length === 0) return
    const target = rest[0]
    setLinks((ls) => ls.map((l) => (l.groupId === id ? { ...l, groupId: target.id } : l)))
    setGroups(rest)
    if (activeId === id) switchPage(target.id)
    setGroupModal(null)
    notify(`page deleted. links moved to "${target.name}" 📦`)
  }

  /* ---------- backup ---------- */

  const exportLinks = () => {
    const payload = { app: 'linkdump', version: 2, groups, links }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `linkdump-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    notify('backup secured 🔒')
  }

  const importLinks = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      // v2 backups are { groups, links }; v1 backups were a bare array of links
      const list = Array.isArray(raw) ? raw : raw?.links
      if (!Array.isArray(list)) throw new Error('not a list')

      // merge pages by name, create the ones we don't have
      const nextGroups = [...groups]
      const idMap = {}
      for (const g of Array.isArray(raw?.groups) ? raw.groups : []) {
        const name = String(g?.name ?? '').trim().slice(0, 20)
        if (!name) continue
        let local = nextGroups.find((x) => x.name.toLowerCase() === name.toLowerCase())
        if (!local) {
          local = {
            id: uid(),
            name,
            emoji: GROUP_EMOJIS.includes(g.emoji) ? g.emoji : '📁',
            color: COLORS.includes(g.color) ? g.color : pick(COLORS),
          }
          nextGroups.push(local)
        }
        idMap[String(g.id)] = local.id
      }

      const seen = new Set(links.map((l) => `${l.groupId}|${l.url}`))
      const fresh = []
      for (const item of list) {
        const url = normalizeUrl(item?.url) // re-validate everything from outside
        if (!url) continue
        const groupId = idMap[String(item.groupId)] ?? active.id
        const key = `${groupId}|${url}`
        if (seen.has(key)) continue
        seen.add(key)
        fresh.push({
          id: uid(),
          name: String(item.name || hostOf(url)).slice(0, 40),
          url,
          emoji: EMOJIS.includes(item.emoji) ? item.emoji : pick(EMOJIS),
          color: COLORS.includes(item.color) ? item.color : pick(COLORS),
          groupId,
          pinned: Boolean(item.pinned),
          clicks: Number(item.clicks) || 0,
          createdAt: Number(item.createdAt) || Date.now(),
        })
      }
      if (nextGroups.length !== groups.length) setGroups(nextGroups)
      setLinks((ls) => [...fresh, ...ls])
      notify(
        fresh.length ? `imported ${fresh.length} link${fresh.length > 1 ? 's' : ''} 📥` : 'nothing new to import 🤷',
      )
    } catch {
      notify("that file ain't it 💀")
    }
  }

  /* ---------- render ---------- */

  const hasLinks = pageLinks.length > 0

  return (
    <div className="min-h-screen pb-24">
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track py-2 font-display text-sm font-extrabold uppercase tracking-widest">
          {[0, 1].map((n) =>
            HALF.map((t, i) => (
              <span key={`${n}-${i}`} className="px-4">
                {t} <span className="px-2 text-bubblegum">✦</span>
              </span>
            )),
          )}
        </div>
      </div>

      <header className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-6xl font-extrabold leading-none tracking-tight sm:text-8xl">
              link
              <span className="ml-1 inline-block -rotate-3 border-[3px] border-ink bg-bubblegum px-3 shadow-[5px_5px_0_var(--color-ink)]">
                dump
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg font-medium">
              every link u need. one click. zero searching. <span className="font-extrabold">no cap.</span>
            </p>
          </div>
          <button
            type="button"
            className="btn bg-zap px-6 py-3 text-xl"
            onClick={() => setModal({ link: null })}
          >
            + drop a link
          </button>
        </div>

        {/* pages */}
        <nav
          className="-mx-1 mt-9 flex gap-3 overflow-x-auto px-1 pb-3 pr-3 pt-1"
          role="tablist"
          aria-label="pages"
        >
          {groups.map((g) => {
            const isActive = g.id === active.id
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className="tab"
                data-active={isActive}
                style={isActive ? { background: `var(--color-${g.color})` } : undefined}
                onClick={() => switchPage(g.id)}
              >
                <span aria-hidden="true">{g.emoji}</span>
                {g.name}
                <span className="tab-count">{counts[g.id] || 0}</span>
              </button>
            )
          })}
          <button
            type="button"
            className="tab border-dashed bg-transparent!"
            onClick={() => setGroupModal({ group: null })}
          >
            ＋ new page
          </button>
        </nav>

        {/* toolbar */}
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
              {active.emoji} {active.name}
            </h2>
            <button
              type="button"
              className="chip"
              onClick={() => setGroupModal({ group: active })}
              title="rename or delete this page"
            >
              ✏️ edit page
            </button>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl" aria-hidden="true">
              🔎
            </span>
            <input
              className="brut-input pl-12"
              placeholder={`search ${active.name}…`}
              aria-label="search links"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="chip" data-active={filter === 'all'} onClick={() => setFilter('all')}>
              all {pageLinks.length}
            </button>
            <button type="button" className="chip" data-active={filter === 'pinned'} onClick={() => setFilter('pinned')}>
              📌 pinned {pageLinks.filter((l) => l.pinned).length}
            </button>

            <span className="mx-1 hidden h-6 w-[3px] bg-ink sm:block" aria-hidden="true" />

            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="chip"
                data-active={sort === s.id}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                className="chip"
                onClick={exportLinks}
                disabled={links.length === 0}
                title="download a backup of every page"
              >
                ⬇ backup
              </button>
              <button type="button" className="chip" onClick={() => fileRef.current?.click()} title="restore from a backup">
                ⬆ import
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importLinks} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-6xl px-4">
        {hasLinks && (
          <p className="mb-5 font-mono text-sm font-medium">
            {visible.length} showing · {totalOpens} total opens
          </p>
        )}

        {visible.length > 0 ? (
          <section className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3" aria-label={`${active.name} links`}>
            {visible.map((l, i) => (
              <LinkCard
                key={l.id}
                link={l}
                index={i}
                onOpen={bumpClicks}
                onPin={togglePin}
                onCopy={copy}
                onEdit={(link) => setModal({ link })}
                onDelete={remove}
              />
            ))}
          </section>
        ) : (
          <div className="brut pop mx-auto max-w-lg bg-butter p-8 text-center">
            <p className="text-6xl" aria-hidden="true">
              {hasLinks ? '🕵️' : '🫥'}
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight">
              {hasLinks ? 'nothing found. weird.' : `no ${active.name} links yet bestie`}
            </h2>
            <p className="mt-2 font-medium">
              {hasLinks
                ? 'try a different search, or check ur filters.'
                : 'drop one here and never dig through tabs again.'}
            </p>
            {!hasLinks && (
              <button type="button" className="btn mt-6 bg-zap text-lg" onClick={() => setModal({ link: null })}>
                + drop the first one
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto mt-16 max-w-6xl px-4 text-center font-mono text-xs font-medium">
        saved in this browser only · hit ⬇ backup now and then so u never lose ur stuff 💅
      </footer>

      {modal && (
        <LinkModal
          link={modal.link}
          groups={groups}
          defaultGroupId={active.id}
          onClose={closeModal}
          onSave={save}
        />
      )}

      {groupModal && (
        <GroupModal
          group={groupModal.group}
          canDelete={groups.length > 1}
          moveTo={groups.find((g) => g.id !== groupModal.group?.id)}
          onClose={closeGroupModal}
          onSave={saveGroup}
          onDelete={removeGroup}
        />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="rise fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 whitespace-nowrap rounded-full border-[3px] border-ink bg-white px-5 py-3 font-bold shadow-[5px_5px_0_var(--color-ink)]"
        >
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              type="button"
              className="rounded-full border-[3px] border-ink bg-zap px-3 py-0.5 text-sm font-extrabold hover:bg-bubblegum"
              onClick={toast.undo}
            >
              undo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
