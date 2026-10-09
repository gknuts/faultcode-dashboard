import { scaleSqrt } from 'd3-scale'

export function makeBubbleScale(maxCount: number, W: number) {
  const rMin = 3
  const rMax = Math.min(14, 0.4 * W)
  if (maxCount <= 1) {
    return (_count: number) => rMin
  }
  const scale = scaleSqrt().domain([1, maxCount]).range([rMin, rMax]).clamp(true)
  return (count: number) => scale(count)
}
