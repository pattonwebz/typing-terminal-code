import { useMemo, useState } from 'react'
import {
  BRAND,
  SAVE_LABELS,
  MODAL_COPY,
  SAVE_FAIL_COPY,
  COLORS,
  ALIGNMENTS,
  PANELS,
  GOAL_TEMPLATES,
  RAGE_MAX,
  REWRITE_COPY,
} from './data/wordbuildr.js'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// The deliberately awful builder. Own stylesheet vibe (bright SaaS), exempt
// from era theming on purpose — the whiplash is the joke.
export default function WordBuildr({ ticket, onComplete, onRewrite }) {
  // Tickets persist only { id, target }; rebuild text/check from templates.
  const goals = useMemo(
    () =>
      ticket.builderGoals.map(({ id, target }) => {
        const tpl = GOAL_TEMPLATES.find((g) => g.id === id)
        return {
          text: tpl.text(target),
          check: (site) => tpl.check(site, target),
        }
      }),
    [ticket.id] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const [site, setSite] = useState({
    buttonColor: 'red',
    headingSize: 16,
    logoAlign: 'center',
  })
  const [openPanels, setOpenPanels] = useState([])
  const [rage, setRage] = useState(0)
  const [modal, setModal] = useState(null) // { text, apply }
  const [saveClicks, setSaveClicks] = useState(0)
  const [saveCorner, setSaveCorner] = useState(0)
  const [notice, setNotice] = useState(null)

  const goalsMet = goals.every((g) => g.check(site))
  const saveLabel = SAVE_LABELS[saveClicks % SAVE_LABELS.length]

  function addRage(n = 1) {
    setRage((r) => Math.min(RAGE_MAX, r + n))
  }

  function togglePanel(node) {
    const isOpen = openPanels.includes(node.id)
    setOpenPanels((p) =>
      isOpen ? p.filter((id) => id !== node.id) : [...p, node.id]
    )
    if (!isOpen && node.decoy) {
      addRage()
      setNotice(`"${node.label}" requires WordBuildr Pro.`)
    }
  }

  // Half the control changes demand a pointless confirmation first.
  function requestChange(apply) {
    if (Math.random() < 0.5) {
      setModal({ text: pick(MODAL_COPY), apply })
      addRage()
    } else {
      apply()
    }
  }

  function clickSave() {
    setSaveCorner((c) => (c + 1) % 4)
    setSaveClicks((n) => n + 1)
    if (!goalsMet) {
      addRage()
      setNotice('Saved! (The client’s requests are still not done.)')
      return
    }
    // First successful-save attempt fails, because of course it does.
    if (saveClicks === 0 || Math.random() < 0.35) {
      addRage()
      setNotice(pick(SAVE_FAIL_COPY))
      return
    }
    onComplete()
  }

  function renderPanel(node, depth = 0) {
    const open = openPanels.includes(node.id)
    return (
      <div key={node.id} className="wb-panel" style={{ marginLeft: depth * 12 }}>
        <button className="wb-panel-header" onClick={() => togglePanel(node)}>
          {open ? '▾' : '▸'} {node.label}
        </button>
        {open && node.children?.map((c) => renderPanel(c, depth + 1))}
        {open && node.control === 'buttonColor' && (
          <div className="wb-control">
            {COLORS.map((c) => (
              <button
                key={c.id}
                className="wb-swatch"
                style={{ background: c.css }}
                title={c.label}
                onClick={() =>
                  requestChange(() => setSite((s) => ({ ...s, buttonColor: c.id })))
                }
              />
            ))}
          </div>
        )}
        {open && node.control === 'headingSize' && (
          <div className="wb-control">
            {/* A slider where a number input should be. Naturally. */}
            <input
              type="range"
              min="12"
              max="48"
              value={site.headingSize}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSite((s) => ({ ...s, headingSize: v }))
              }}
            />
            <span className="wb-size-label">{site.headingSize}px-ish</span>
          </div>
        )}
        {open && node.control === 'logoAlign' && (
          <div className="wb-control">
            <select
              value={site.logoAlign}
              onChange={(e) =>
                requestChange(() =>
                  setSite((s) => ({ ...s, logoAlign: e.target.value }))
                )
              }
            >
              {ALIGNMENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    )
  }

  const savePos = [
    { top: 8, right: 8 },
    { bottom: 8, right: 8 },
    { bottom: 8, left: 8 },
    { top: 8, left: 8 },
  ][saveCorner]

  return (
    <div className="wordbuildr">
      <div className="wb-titlebar">
        <strong>{BRAND.name}</strong> <em>{BRAND.tagline}</em>
        <span className="wb-mascot" title={BRAND.mascotGreeting} onClick={() => addRage()}>
          ● {BRAND.mascot}
        </span>
      </div>

      <div className="wb-goals">
        {goals.map((g, i) => (
          <span key={i} className={g.check(site) ? 'wb-goal-done' : ''}>
            ☐ {g.text}
          </span>
        ))}
      </div>

      <div className="wb-body">
        <div className="wb-sidebar">{PANELS.map((p) => renderPanel(p))}</div>

        <div className="wb-canvas">
          <div className="wb-site">
            <div className="wb-site-logo" style={{ textAlign: site.logoAlign }}>
              ◆ LOGO
            </div>
            <div className="wb-site-heading" style={{ fontSize: site.headingSize }}>
              Welcome to Our Website
            </div>
            <button
              className="wb-site-button"
              style={{
                background: COLORS.find((c) => c.id === site.buttonColor)?.css,
              }}
            >
              Learn More
            </button>
          </div>
          <button className="wb-save" style={savePos} onClick={clickSave}>
            {saveLabel}
          </button>
        </div>
      </div>

      <div className="wb-rage">
        <span>rage</span>
        <div className="wb-rage-bar">
          <div
            className="wb-rage-fill"
            style={{ width: `${(rage / RAGE_MAX) * 100}%` }}
          />
        </div>
        {rage >= RAGE_MAX && (
          <button className="wb-rewrite" onClick={onRewrite}>
            {REWRITE_COPY}
          </button>
        )}
      </div>

      {notice && (
        <div className="wb-notice" onClick={() => setNotice(null)}>
          {notice} <em>(dismiss)</em>
        </div>
      )}

      {modal && (
        <div className="wb-modal-backdrop">
          <div className="wb-modal">
            <p>{modal.text}</p>
            <button
              onClick={() => {
                modal.apply()
                setModal(null)
              }}
            >
              Proceed Anyway
            </button>
            <button
              onClick={() => {
                addRage()
                setModal(null)
              }}
            >
              Cancel (loses the change)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
