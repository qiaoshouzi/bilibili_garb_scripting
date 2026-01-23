export const handleHDSLBUrl = (url: string) => {
  return url.split('@')[0].replace('http://', 'https://')
}
