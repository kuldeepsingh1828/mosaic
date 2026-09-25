'use client'

import { calculateGridLayout, chunkIntoRows, CELL_GAP } from '@/lib/grid-layout'
import { useElementSize } from '@/lib/use-element-size'

// Renders `cellKeys` as a responsive, self-balancing tile grid (think a
// video-conferencing grid, not a fixed-position pixel canvas): the number
// of rows/columns and each cell's size are recomputed from scratch on every
// render from however much space this component has and how many cells
// exist — no fixed grid_size, no placeholder cells, no fake tiles.
export function PixelGrid({
  cellKeys,
  cells,
  animatingCells,
  firstCellKey,
}: {
  cellKeys: string[]
  cells: Record<string, string>
  animatingCells: Set<string>
  firstCellKey: string | null
}) {
  const [wrapperRef, size] = useElementSize<HTMLDivElement>()
  const layout = calculateGridLayout(cellKeys.length, size.width, size.height)
  const rows = chunkIntoRows(cellKeys, layout.columns)

  return (
    // Absolutely positioned against the (relatively-positioned) parent so
    // this wrapper's box always exactly matches the available space,
    // regardless of the parent's own flex alignment rules (a flex item
    // sized via `size-full` under `align-items: center` would otherwise
    // collapse to its content size — i.e. zero, before any cells exist).
    <div ref={wrapperRef} className="absolute inset-0 flex items-center justify-center">
      {layout.gridSize > 0 ? (
        <div
          className="flex flex-col items-center justify-center"
          style={{ width: layout.gridSize, height: layout.gridSize, gap: CELL_GAP }}
          role="grid"
          aria-label={`${cellKeys.length} painted cells`}
          aria-busy={cellKeys.length === 0}
        >
          {rows.map((rowKeys, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-center" style={{ gap: CELL_GAP }}>
              {rowKeys.map((key) => {
                const color = cells[key]
                const isAnimating = animatingCells.has(key)
                const isFirst = isAnimating && firstCellKey === key
                return (
                  <span
                    key={key}
                    role="gridcell"
                    aria-label="Painted cell"
                    className={`shrink-0 rounded-[2px] ${isAnimating ? 'relative z-10' : ''} ${isFirst ? 'animate-cell-pop-first' : isAnimating ? 'animate-cell-pop' : ''}`}
                    style={{ width: layout.cellWidth, height: layout.cellHeight, backgroundColor: color ?? '#ffffff' }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
