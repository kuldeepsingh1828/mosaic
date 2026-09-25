// Pure layout math for the dynamic "video-tile" style canvas: given how many
// cells exist and how much square-ish space is available, decide how many
// rows/columns to use and how big each cell should be. Deliberately has no
// knowledge of rendering — see components/pixel-grid.tsx for that.

export type GridLayout = {
  rows: number
  columns: number
  /** Side length of the square grid area (gridWidth === gridHeight). */
  gridSize: number
  cellWidth: number
  cellHeight: number
}

export const CELL_GAP = 4

/**
 * Balanced rows/columns for `cellCount` items, minimizing the difference
 * between rows and columns (cols = ceil(sqrt(n)), rows = ceil(n/cols)).
 * The grid area itself is always the largest square that fits within
 * `availableWidth` x `availableHeight` — individual cells may end up
 * rectangular (e.g. 1x2, 2x3) when rows !== columns, which is expected:
 * the container stays square, not every cell.
 */
export function calculateGridLayout(
  cellCount: number,
  availableWidth: number,
  availableHeight: number,
  gap: number = CELL_GAP,
): GridLayout {
  const gridSize = Math.max(0, Math.floor(Math.min(availableWidth, availableHeight)))

  if (cellCount <= 0 || gridSize <= 0) {
    return { rows: 0, columns: 0, gridSize, cellWidth: 0, cellHeight: 0 }
  }

  const columns = Math.ceil(Math.sqrt(cellCount))
  const rows = Math.ceil(cellCount / columns)

  const cellWidth = Math.max(0, (gridSize - gap * (columns - 1)) / columns)
  const cellHeight = Math.max(0, (gridSize - gap * (rows - 1)) / rows)

  return { rows, columns, gridSize, cellWidth, cellHeight }
}

/**
 * Splits an ordered list into row-chunks of `columns` length. Rendering
 * each chunk as its own centered flex row is what lets an incomplete last
 * row (e.g. 3 cells at 2 columns) center itself without placeholder cells.
 */
export function chunkIntoRows<T>(items: readonly T[], columns: number): T[][] {
  if (columns <= 0) return []
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns))
  }
  return rows
}
