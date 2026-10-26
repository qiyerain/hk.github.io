/**
 * Butterfly
 * ramdom cover
 */

'use strict'

hexo.extend.filter.register('before_post_render', data => {
  const imgTestReg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i
  let { cover: coverVal, top_img: topImg } = data

  // curated images were moved to OSS during the 0904 migration. Keep old
  // front-matter paths working, including posts published before that move.
  const curatedOss = /^\/img\/curated\/(anime\/(?:anime-(?:0[1-9]|1[01])\.(?:webp|jpg))|technology\/technology-(?:3[2-6])\.jpg)$/i
  const resolveCuratedPath = value => {
    if (typeof value !== 'string') return value
    const match = value.match(curatedOss)
    if (match) return `https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/${match[1].split('/').pop()}`
    if (/^\/img\/curated\//i.test(value)) return '/img/covers/cover-1.webp'
    return value
  }
  coverVal = resolveCuratedPath(coverVal)
  topImg = resolveCuratedPath(topImg)
  if (data.cover) data.cover = coverVal
  if (data.top_img) data.top_img = topImg

  // Add path to top_img and cover if post_asset_folder is enabled
  if (hexo.config.post_asset_folder) {
    if (topImg && topImg.indexOf('/') === -1 && imgTestReg.test(topImg)) data.top_img = `${data.path}${topImg}`
    if (coverVal && coverVal.indexOf('/') === -1 && imgTestReg.test(coverVal)) data.cover = `${data.path}${coverVal}`
  }

  const randomCoverFn = () => {
    const { cover: { default_cover: defaultCover } } = hexo.theme.config
    if (!defaultCover) return false
    if (!Array.isArray(defaultCover)) return defaultCover
    const num = Math.floor(Math.random() * defaultCover.length)
    return defaultCover[num]
  }

  if (coverVal === false) return data

  const uuid = () => {
    var timestamp = new Date().getTime()
    return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (timestamp + Math.random() * 16) % 16 | 0
      timestamp = Math.floor(timestamp / 16)
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  const addUuidToUrl = (url) => {
    try {
      let urlParts = new URL(url)
      let params = urlParts.searchParams
      if (params.size > 0) {
        params.append('_r_', uuid())
      } else {
        params.set('_r_', uuid())
      }
      return urlParts.toString()
    } catch (error) {
      return url
    }
  }

  // If cover is not set, use random cover
  if (!coverVal) {
    const randomCover = randomCoverFn()
    const cover = randomCover ? addUuidToUrl(randomCover) : randomCover
    data.cover = cover
    coverVal = cover // update coverVal
  }

  if (coverVal && (coverVal.indexOf('//') !== -1 || imgTestReg.test(coverVal))) {
    data.cover_type = 'img'
  }

  return data
})
