import { GridItem } from 'scripting'

const getLength = (w: number) => {
  const breakpoints = [
    [2700, 10],
    [2400, 9],
    [2100, 8],
    [1800, 7],
    [1500, 6],
    [1200, 5],
    [900, 4],
    [500, 3],
  ]
  for (const [minWidth, value] of breakpoints) {
    if (w >= minWidth) return value
  }
  return 2
}
export const getGridItem = (w: number) =>
  Array.from<GridItem>({ length: getLength(w) }).fill({
    size: { type: 'flexible', max: 'infinity' },
  })
