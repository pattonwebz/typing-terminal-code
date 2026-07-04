// Ticket type definitions.
//   moneyPerChar — base Money paid on completion per snippet character
//   spawnWeight  — relative frequency on the board (0 = not yet implemented;
//                  bugfix arrives step 4, clientRequest step 6, rush/refactor step 2+)
//   enabled      — feature-flag while later steps land
export const TICKET_TYPES = [
  {
    id: 'feature',
    name: 'Feature',
    moneyPerChar: 0.5,
    spawnWeight: 10,
    enabled: true,
  },
  {
    id: 'bugfix',
    name: 'Bug Fix',
    moneyPerChar: 1.5,
    spawnWeight: 0,
    enabled: false,
  },
  {
    id: 'clientRequest',
    name: 'Client Request',
    moneyPerChar: 4,
    spawnWeight: 0,
    enabled: false,
  },
  {
    id: 'rush',
    name: 'Rush',
    moneyPerChar: 1.5,
    spawnWeight: 0,
    enabled: false,
  },
  {
    id: 'refactor',
    name: 'Refactor',
    moneyPerChar: 0.75,
    spawnWeight: 0,
    enabled: false,
  },
]

export function getTicketType(id) {
  return TICKET_TYPES.find((t) => t.id === id)
}
