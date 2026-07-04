// WordBuildr™ content: goals, panel maze, and hostile copy. Pure data so
// the flavor pass can make it worse (better) without touching the mini-game.
export const BRAND = {
  name: 'WordBuildr™',
  tagline: 'Websites made simple. Simple made impossible.',
  mascot: 'Buildy',
  mascotGreeting: 'Hi! I’m Buildy! Click me if you get stuck! (Clicking me does nothing.)',
}

export const SAVE_LABELS = ['Save', 'Sync', 'Publish', 'Push Live', 'Save?']

export const MODAL_COPY = [
  'Are you sure? Unsaved changes may or may not be saved.',
  'This action can’t be undone. Neither could the last one.',
  'Applying this change requires re-rendering the page. Proceed?',
  'Buildy noticed you changed something. Allow?',
]

export const SAVE_FAIL_COPY = [
  'Sync failed. Your changes are safe*. (*citation needed)',
  'Could not reach the WordBuildr cloud. It’s not you, it’s us. It’s you.',
]

export const COLORS = [
  { id: 'blue', label: 'Serenity Blue', css: '#2563eb' },
  { id: 'red', label: 'Passion Red', css: '#dc2626' },
  { id: 'green', label: 'Organic Green', css: '#16a34a' },
  { id: 'purple', label: 'Synergy Purple', css: '#9333ea' },
  { id: 'orange', label: 'Disruptor Orange', css: '#ea580c' },
  { id: 'teal', label: 'Mindful Teal', css: '#0d9488' },
]

export const ALIGNMENTS = [
  { id: 'left', label: 'Start-Adjacent' },
  { id: 'center', label: 'Harmonized' },
  { id: 'right', label: 'End-Forward' },
]

// The panel maze. Only leaves with a `control` do anything; the rest exist
// to be opened, regretted, and counted as rage.
export const PANELS = [
  {
    id: 'design',
    label: 'Design',
    children: [
      { id: 'elements', label: 'Elements', children: [
        { id: 'button', label: 'Button', children: [
          { id: 'button-appearance', label: 'Appearance', children: [
            { id: 'button-color', label: 'Colour Options', control: 'buttonColor' },
            { id: 'button-shadow', label: 'Shadow Studio', decoy: true },
          ]},
          { id: 'button-behavior', label: 'Behaviour', decoy: true },
        ]},
        { id: 'heading', label: 'Heading', children: [
          { id: 'heading-typography', label: 'Typography Suite', children: [
            { id: 'heading-size', label: 'Size Harmonizer', control: 'headingSize' },
            { id: 'heading-kerning', label: 'Kerning Feelings', decoy: true },
          ]},
        ]},
        { id: 'logo', label: 'Logo', children: [
          { id: 'logo-placement', label: 'Placement Studio', children: [
            { id: 'logo-align', label: 'Alignment Intentions', control: 'logoAlign' },
          ]},
        ]},
      ]},
      { id: 'globals', label: 'Global Styles', decoy: true },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'settings-general', label: 'General', children: [
        { id: 'settings-gear', label: 'Settings', children: [
          { id: 'settings-gear-2', label: 'Settings (Advanced)', decoy: true },
        ]},
      ]},
      { id: 'seo-sparkle', label: 'SEO Sparkle', decoy: true },
    ],
  },
  { id: 'ai-magic', label: '✨ AI Magic', decoy: true },
]

// Goal templates; a clientRequest ticket rolls 2 of these with targets.
export const GOAL_TEMPLATES = [
  {
    id: 'buttonColor',
    text: (t) => `Make the button ${t.label}`,
    roll: () => COLORS[Math.floor(Math.random() * COLORS.length)],
    check: (site, t) => site.buttonColor === t.id,
  },
  {
    id: 'headingSize',
    text: (t) => `Make the heading bigger (at least ${t.min}px)`,
    roll: () => ({ min: 30 + Math.floor(Math.random() * 3) * 4 }),
    check: (site, t) => site.headingSize >= t.min,
  },
  {
    id: 'logoAlign',
    text: (t) => `Move the logo to the ${t.id}`,
    roll: () => ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)],
    check: (site, t) => site.logoAlign === t.id,
  },
]

export const RAGE_MAX = 6
export const REWRITE_COPY = 'REWRITE IT FROM SCRATCH'
