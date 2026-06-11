// 福島県GeoJSON投影・パス生成の共通ユーティリティ
// FukushimaMap と VisitRecordModal の両方で使用

const W = 900, H = 600, PADDING = 30
const MIN_LNG = 139.1648, MAX_LNG = 141.0420
const MIN_LAT = 36.7918, MAX_LAT = 37.9756

function mercY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
}

const mercMinY = mercY(MIN_LAT)
const mercMaxY = mercY(MAX_LAT)
const scaleX = (W - PADDING * 2) / ((MAX_LNG - MIN_LNG) * Math.PI / 180)
const scaleY = (H - PADDING * 2) / (mercMaxY - mercMinY)
const SCALE = Math.min(scaleX, scaleY)
const CENTER_LNG = (MIN_LNG + MAX_LNG) / 2
const CENTER_MERC_Y = mercY((MIN_LAT + MAX_LAT) / 2)

export function project(lng: number, lat: number): [number, number] {
  const x = (lng - CENTER_LNG) * (Math.PI / 180) * SCALE + W / 2
  const y = (CENTER_MERC_Y - mercY(lat)) * SCALE + H / 2
  return [x, y]
}

export function getBBox(rings: number[][][]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const ring of rings) {
    for (const coord of ring) {
      const [x, y] = project(coord[0], coord[1])
      if (x < minX) minX = x; if (y < minY) minY = y
      if (x > maxX) maxX = x; if (y > maxY) maxY = y
    }
  }
  return { minX, minY, maxX, maxY }
}

export function getCentroid(rings: number[][][]) {
  let totalX = 0, totalY = 0, count = 0
  for (const ring of rings) {
    for (const coord of ring) {
      const [x, y] = project(coord[0], coord[1])
      totalX += x; totalY += y; count++
    }
  }
  return { x: totalX / count, y: totalY / count }
}

export function coordsToPath(rings: number[][][]): string {
  return rings.map(ring =>
    ring.map((coord, i) => {
      const [x, y] = project(coord[0], coord[1])
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join('') + 'Z'
  ).join('')
}

// 市町村のパスを任意のビューポートサイズに正規化（モーダルのオーバーレイ用）
export function normalizeMunicipalityPath(
  rings: number[][][],
  vpW: number,
  vpH: number,
  padding = 12
): string {
  const bbox = getBBox(rings)
  const bboxW = bbox.maxX - bbox.minX
  const bboxH = bbox.maxY - bbox.minY
  const scale = Math.min((vpW - padding * 2) / bboxW, (vpH - padding * 2) / bboxH)
  const ox = (vpW - bboxW * scale) / 2 - bbox.minX * scale
  const oy = (vpH - bboxH * scale) / 2 - bbox.minY * scale

  return rings.map(ring =>
    ring.map((coord, i) => {
      const [px, py] = project(coord[0], coord[1])
      return `${i === 0 ? 'M' : 'L'}${(px * scale + ox).toFixed(1)},${(py * scale + oy).toFixed(1)}`
    }).join('') + 'Z'
  ).join('')
}
