export type CardData = {
  name?: string
} & ({ img: string; videos?: string[] } | { videos: string[]; img?: string })
export type ItemData = {
  name: string
  showExample?: boolean
  disabled?: boolean
  data: CardData[]
}
