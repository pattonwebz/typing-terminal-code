// Tiny imperative juice layer: floating feedback text over the typing pane.
// Kept out of React so the typing hot path never re-renders for effects.
// Flavor text for effects lives with the callers (data-driven), not here.
let container = null
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)')

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'fx-layer'
    document.body.appendChild(container)
  }
  return container
}

export function floatText(text, kind = 'gain', anchorEl = null) {
  if (reducedMotion && reducedMotion.matches) return
  const el = document.createElement('span')
  el.className = `fx-float fx-${kind}`
  el.textContent = text
  const rect = anchorEl?.getBoundingClientRect()
  const x = rect
    ? rect.left + rect.width * (0.2 + Math.random() * 0.6)
    : window.innerWidth * (0.3 + Math.random() * 0.2)
  const y = rect ? rect.top + rect.height * 0.3 : window.innerHeight * 0.4
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  getContainer().appendChild(el)
  el.addEventListener('animationend', () => el.remove())
}
