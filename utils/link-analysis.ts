import * as cheerio from 'cheerio'
import { URL } from 'url'

// Analyze external links
export function analyzeExternalLinks($: cheerio.CheerioAPI, baseUrl: string, links: string[]) {
  const baseDomain = new URL(baseUrl).hostname
  const external: string[] = []
  const domains: string[] = []
  const categorized = {
    social: [] as string[],
    cdn: [] as string[],
    analytics: [] as string[],
    advertising: [] as string[],
    affiliate: [] as string[],
    sponsored: [] as string[],
    other: [] as string[]
  }

  let followedLinks = 0
  let nofollowLinks = 0

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href') || ''
    const rel = $(element).attr('rel') || ''
    
    try {
      // Skip internal links, anchors, and javascript
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      let fullUrl: string
      if (href.startsWith('http://') || href.startsWith('https://')) {
        fullUrl = href
      } else if (href.startsWith('//')) {
        fullUrl = 'https:' + href
      } else {
        // Relative URL
        return
      }

      const linkUrl = new URL(fullUrl)
      const linkDomain = linkUrl.hostname

      // Check if external
      if (linkDomain !== baseDomain && !linkDomain.endsWith('.' + baseDomain)) {
        external.push(fullUrl)
        domains.push(linkDomain)

        // Categorize
        if (categorizeLink(fullUrl, 'social')) categorized.social.push(fullUrl)
        else if (categorizeLink(fullUrl, 'cdn')) categorized.cdn.push(fullUrl)
        else if (categorizeLink(fullUrl, 'analytics')) categorized.analytics.push(fullUrl)
        else if (categorizeLink(fullUrl, 'advertising')) categorized.advertising.push(fullUrl)
        else if (categorizeLink(fullUrl, 'affiliate')) categorized.affiliate.push(fullUrl)
        else if (categorizeLink(fullUrl, 'sponsored') || rel.includes('sponsored')) categorized.sponsored.push(fullUrl)
        else categorized.other.push(fullUrl)

        // Check if nofollow
        if (rel.includes('nofollow')) {
          nofollowLinks++
        } else {
          followedLinks++
        }
      }
    } catch (error) {
      // Invalid URL
    }
  })

  return {
    total: external.length,
    domains: [...new Set(domains)],
    categorized: {
      social: [...new Set(categorized.social)],
      cdn: [...new Set(categorized.cdn)],
      analytics: [...new Set(categorized.analytics)],
      advertising: [...new Set(categorized.advertising)],
      affiliate: [...new Set(categorized.affiliate)],
      sponsored: [...new Set(categorized.sponsored)],
      other: [...new Set(categorized.other)]
    },
    followedLinks,
    nofollowLinks
  }
}

// Analyze internal links
export function analyzeInternalLinks($: cheerio.CheerioAPI, baseUrl: string, links: string[]) {
  const baseDomain = new URL(baseUrl).hostname
  const internal: Set<string> = new Set()
  const linkDepth: Map<string, number> = new Map()
  const redirects: Array<{ from: string; to: string; hops: number }> = []

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href') || ''
    
    try {
      // Skip anchors, javascript, mailto, tel
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      let fullUrl: string
      if (href.startsWith('http://') || href.startsWith('https://')) {
        fullUrl = href
      } else if (href.startsWith('//')) {
        fullUrl = 'https:' + href
      } else {
        // Relative URL - make absolute
        const base = new URL(baseUrl)
        if (href.startsWith('/')) {
          fullUrl = base.origin + href
        } else {
          fullUrl = new URL(href, baseUrl).href
        }
      }

      const linkUrl = new URL(fullUrl)
      const linkDomain = linkUrl.hostname

      // Check if internal
      if (linkDomain === baseDomain || linkDomain.endsWith('.' + baseDomain)) {
        internal.add(fullUrl)
        
        // Calculate depth based on path segments
        const pathSegments = linkUrl.pathname.split('/').filter(s => s.length > 0)
        const depth = pathSegments.length
        linkDepth.set(fullUrl, depth)
      }
    } catch (error) {
      // Invalid URL
    }
  })

  // Calculate max depth
  const depths = Array.from(linkDepth.values())
  const maxDepth = depths.length > 0 ? Math.max(...depths) : 0

  // Orphan pages detection would require crawling all pages (skip for now)
  // Broken internal links detection would require checking each link (skip for now)

  return {
    total: internal.size,
    unique: internal.size,
    maxDepth,
    orphanPages: [], // Would require full site crawl
    brokenInternal: [], // Would require checking each link
    redirectChains: [] // Would require following redirects
  }
}

// Helper function to categorize links
function categorizeLink(url: string, category: string): boolean {
  const urlLower = url.toLowerCase()
  
  const patterns: Record<string, string[]> = {
    social: [
      'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com',
      'youtube.com', 'tiktok.com', 'pinterest.com', 'snapchat.com', 'reddit.com',
      'tumblr.com', 'vimeo.com', 'flickr.com', 'medium.com'
    ],
    cdn: [
      'cloudflare.com', 'akamai.net', 'fastly.net', 'cloudfront.net',
      'jsdelivr.net', 'unpkg.com', 'cdnjs.com', 'bootstrapcdn.com',
      'googleapis.com', 'gstatic.com'
    ],
    analytics: [
      'google-analytics.com', 'googletagmanager.com', 'hotjar.com',
      'mixpanel.com', 'segment.com', 'amplitude.com', 'heap.io',
      'fullstory.com', 'mouseflow.com', 'crazyegg.com'
    ],
    advertising: [
      'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
      'adroll.com', 'adsrvr.org', 'criteo.com', 'outbrain.com',
      'taboola.com', 'media.net', 'adnxs.com'
    ],
    affiliate: [
      'amazon.com/gp/product', 'amzn.to', 'shareasale.com', 'cj.com',
      'clickbank.com', 'rakuten.com', 'impact.com', 'awin1.com',
      'partnerize.com', 'linksynergy.com'
    ],
    sponsored: [
      'sponsor', 'affiliate', 'partner', 'ref=', 'aff=', 'click='
    ]
  }

  if (patterns[category]) {
    return patterns[category].some(pattern => urlLower.includes(pattern))
  }

  return false
}
