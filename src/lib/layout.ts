/** Place overlapping blocks of one day side by side. Returns lane index and lane count per item. */
export interface LaneInput {
  id: string
  start: number
  end: number
}

export interface LanePlacement {
  lane: number
  lanes: number
}

export function assignLanes(items: LaneInput[]): Map<string, LanePlacement> {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end)
  const result = new Map<string, LanePlacement>()
  let group: { id: string; lane: number }[] = []
  let laneEnds: number[] = []
  let groupEnd = -Infinity

  const flush = () => {
    for (const g of group) result.set(g.id, { lane: g.lane, lanes: laneEnds.length })
    group = []
    laneEnds = []
  }

  for (const item of sorted) {
    if (item.start >= groupEnd) {
      flush()
      groupEnd = -Infinity
    }
    let lane = laneEnds.findIndex((end) => end <= item.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.end)
    } else {
      laneEnds[lane] = item.end
    }
    group.push({ id: item.id, lane })
    groupEnd = Math.max(groupEnd, item.end)
  }
  flush()
  return result
}
