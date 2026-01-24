import { GridItem } from 'scripting'

const getLength = (w: number, def: number, breakpoints: [number, number][]) => {
  for (const [minWidth, value] of breakpoints) {
    if (w >= minWidth) return value
  }
  return def
}
export const getGridItem = (w: number, def: number, list: [number, number][]) =>
  Array.from<GridItem>({ length: getLength(w, def, list) }).fill({
    size: { type: 'flexible', max: 'infinity' },
  })
