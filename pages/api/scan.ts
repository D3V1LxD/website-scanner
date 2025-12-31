import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { WebsiteOverview, ApiDetail, ScanResult } from '@/pages/index'
import { 
  detectTechnologies, 
  detectSEO, 
  detectAccessibility, 
  detectPrivacy, 
  detectMobileAndPWA, 
  detectEcommerce 
} from '@/utils/detectors'

// Helper function to extract parameters from URLs
function extractParameters(urls: string[]): ApiDetail[] {
  const apiDetails: ApiDetail[] = []

  urls.forEach(urlString => {
    try {
      const url = new URL(urlString)
      const queryParams: string[] = []
      const pathParams: string[] = []

      // Extract query parameters
      url.searchParams.forEach((value, key) => {
        queryParams.push(`${key}=${value}`)
      })

      // Extract potential path parameters (segments that look like IDs or variables)
      const pathSegments = url.pathname.split('/').filter(s => s)
      pathSegments.forEach(segment => {
        // Detect numeric IDs, UUIDs, or variable-like segments
        if (/^\d+$/.test(segment) || 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(segment) && segment.length > 2) {
          pathParams.push(segment)
        }
      })

      // Detect HTTP method from URL patterns
      let method = 'GET'
      const lowercasePath = url.pathname.toLowerCase()
      if (lowercasePath.includes('/create') || lowercasePath.includes('/add') || lowercasePath.includes('/post')) {
        method = 'POST'
      } else if (lowercasePath.includes('/update') || lowercasePath.includes('/edit') || lowercasePath.includes('/put')) {
        method = 'PUT'
      } else if (lowercasePath.includes('/delete') || lowercasePath.includes('/remove')) {
        method = 'DELETE'
      }

      apiDetails.push({
        url: urlString,
        method,
        parameters: {
          query: queryParams,
          path: pathParams
        }
      })
    } catch (e) {
      // Invalid URL, skip
    }
  })

  return apiDetails
}

// Helper function to scan discovered links for additional APIs
async function scanLinksForApis(links: string[], origin: string): Promise<ApiDetail[]> {
  const foundApis: ApiDetail[] = []
  const uniqueLinks = [...new Set(links.filter(link => {
    try {
      const linkUrl = new URL(link)
      return linkUrl.origin === origin // Only scan same-origin links
    } catch {
      return false
    }
  }))].slice(0, 10) // Limit to 10 links to avoid long delays

  for (const link of uniqueLinks) {
    try {
      const response = await axios.get(link, {
        timeout: 5000,
        maxRedirects: 2,
        validateStatus: (status) => status < 500
      })

      if (response.status >= 200 && response.status < 400) {
        const html = response.data
        const $ = cheerio.load(html)

        // Quick scan for API patterns in this page
        const scriptContents: string[] = []
        $('script:not([src])').each((_, elem) => {
          scriptContents.push($(elem).html() || '')
        })

        const apiPatterns = [
          /fetch\s*\(\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
          /axios\.[a-z]+\s*\(\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
          /['"]\/api\/[^'"]+['"]/gi
        ]

        scriptContents.forEach(content => {
          apiPatterns.forEach(pattern => {
            const matches = content.matchAll(pattern)
            for (const match of matches) {
              let apiUrl = match[1] || match[0].replace(/['"]/g, '')
              apiUrl = apiUrl.replace(/fetch\s*\(\s*/, '')
                            .replace(/axios\.[a-z]+\s*\(\s*/, '')
                            .replace(/['"`]/g, '')
                            .trim()
              
              if (apiUrl && apiUrl.includes('/api/')) {
                try {
                  if (apiUrl.startsWith('/')) {
                    apiUrl = new URL(apiUrl, origin).href
                  }
                  foundApis.push(...extractParameters([apiUrl]))
                } catch {}
              }
            }
          })
        })
      }
    } catch {
      // Skip failed requests
    }
  }

  return foundApis
}

// Helper function to generate website overview
function generateOverview(
  $: cheerio.CheerioAPI,
  html: string,
  targetUrl: URL,
  scripts: string[],
  stylesheets: string[],
  images: string[],
  responseHeaders: any,
  cookies: any[] = []
): WebsiteOverview {
  // Use comprehensive detectors
  const technologies = detectTechnologies($, html, scripts, stylesheets)
  const seo = detectSEO($, html)
  const accessibility = detectAccessibility($)
  const privacy = detectPrivacy($, html, cookies)
  const { mobile, pwa } = detectMobileAndPWA($, html)
  const ecommerce = detectEcommerce($, html)

  const overview: WebsiteOverview = {
    technologies,
    security: {
      headers: {},
      https: targetUrl.protocol === 'https:',
      certificates: [],
      detailedHeaders: {},
      mixedContent: [],
      subresourceIntegrity: $('script[integrity], link[integrity]').length > 0
    },
    performance: {
      resourceCount: {
        scripts: scripts.length,
        styles: stylesheets.length,
        images: images.length,
        total: scripts.length + stylesheets.length + images.length
      },
      compression: responseHeaders && responseHeaders['content-encoding'] !== undefined,
      caching: {},
      recommendations: {
        imageOptimization: [],
        minificationOpportunities: [],
        compressionSuggestions: [],
        cachingImprovements: [],
        renderBlockingResources: [],
        unusedCSS: [],
        unusedJS: []
      }
    },
    social: {
      links: {},
      meta: seo.ogTags
    },
    structure: {
      hasRobotsTxt: false,
      hasSitemap: false,
      responsive: mobile.responsiveDesign,
      language: $('html').attr('lang') || 'en'
    },
    seo,
    accessibility,
    privacy,
    mobile,
    pwa,
    ecommerce
  }

  // Detect mixed content
  if (targetUrl.protocol === 'https:') {
    $('script[src^="http:"], link[href^="http:"], img[src^="http:"]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href')
      if (src && !overview.security.mixedContent!.includes(src)) {
        overview.security.mixedContent!.push(src)
      }
    })
  }

  // Security headers analysis
  if (responseHeaders) {
    const securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy'
    ]
    
    Object.keys(responseHeaders).forEach(key => {
      const keyLower = key.toLowerCase()
      if (securityHeaders.includes(keyLower)) {
        overview.security.headers[key] = responseHeaders[key]
        
        // Store in detailed headers
        if (keyLower === 'content-security-policy') {
          overview.security.detailedHeaders!.CSP = responseHeaders[key]
        } else if (keyLower === 'strict-transport-security') {
          overview.security.detailedHeaders!.HSTS = responseHeaders[key]
        } else if (keyLower === 'x-frame-options') {
          overview.security.detailedHeaders!.xFrameOptions = responseHeaders[key]
        } else if (keyLower === 'x-content-type-options') {
          overview.security.detailedHeaders!.xContentTypeOptions = responseHeaders[key]
        } else if (keyLower === 'referrer-policy') {
          overview.security.detailedHeaders!.referrerPolicy = responseHeaders[key]
        } else if (keyLower === 'permissions-policy') {
          overview.security.detailedHeaders!.permissionsPolicy = responseHeaders[key]
        }
      }
    })

    // Check caching headers
    if (responseHeaders['cache-control']) {
      overview.performance.caching!['cache-control'] = responseHeaders['cache-control']
    }
    if (responseHeaders['etag']) {
      overview.performance.caching!['etag'] = responseHeaders['etag']
    }
  }

  // Performance recommendations
  if (images.length > 20) {
    overview.performance.recommendations!.imageOptimization.push(`${images.length} images found - consider lazy loading and compression`)
  }
  
  if (!overview.performance.compression) {
    overview.performance.recommendations!.compressionSuggestions.push('Enable Gzip or Brotli compression')
  }

  if (!responseHeaders || !responseHeaders['cache-control']) {
    overview.performance.recommendations!.cachingImprovements.push('Add cache-control headers for static assets')
  }

  // Detect render-blocking resources
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && !$(el).attr('media')) {
      overview.performance.recommendations!.renderBlockingResources.push(href)
    }
  })

  // Social media links
  $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="github.com"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      const url = new URL(href)
      const platform = url.hostname.replace('www.', '').split('.')[0]
      overview.social.links[platform] = href
    }
  })

  // Extract contact information
  overview.contacts = {
    emails: [],
    phones: [],
    addresses: [],
    socialLinks: overview.social.links
  }

  const bodyText = $('body').text()
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  
  const emails = bodyText.match(emailRegex) || []
  overview.contacts.emails = [...new Set(emails)].slice(0, 10)
  
  const phones = bodyText.match(phoneRegex) || []
  overview.contacts.phones = [...new Set(phones)].slice(0, 10)

  // Detect forms
  overview.forms = {
    total: $('form').length,
    loginForms: $('form:has([type="password"])').length,
    searchForms: $('form:has([type="search"]), form:has(input[name*="search"], input[name*="query"])').length,
    contactForms: $('form:has([type="email"]), form:has(input[name*="email"], textarea[name*="message"])').length,
    newsletterForms: $('form:has(input[name*="newsletter"], input[name*="subscribe"])').length
  }

  // Media detection
  overview.media = {
    videos: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
    audio: $('audio').length,
    iframes: $('iframe').length,
    embeds: []
  }

  $('iframe').each((_, el) => {
    const src = $(el).attr('src')
    if (src) overview.media!.embeds.push(src)
  })

  // API detection
  overview.apis = {
    hasGraphQL: html.includes('graphql') || html.includes('/graphql'),
    hasWebSocket: html.includes('WebSocket') || html.includes('ws://') || html.includes('wss://'),
    hasREST: html.includes('/api/') || html.includes('rest'),
    swaggerUrl: html.match(/['"]([^'"]*swagger[^'"]*)['"]/)?.[1],
    apiDocumentation: html.match(/['"]([^'"]*\/docs?[^'"]*)['"]/)?.[1]
  }

  // Content analysis (from SEO)
  overview.content = {
    wordCount: seo.wordCount || 0,
    readingTime: seo.readingTime || 0,
    headingHierarchy: seo.headings.h1 === 1,
    duplicateContent: false
  }

  return overview
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, deepScan = false } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Enhanced headers to appear more like a real browser
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ]
    
    // Randomly select a User-Agent
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
    
    // Fetch the website with enhanced headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': targetUrl.origin
      },
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500 // Accept 4xx errors to handle them gracefully
      }
    })

    // Check if we got a valid response
    if (response.status === 403) {
      return res.status(403).json({ 
        error: 'Access denied. The website is blocking automated requests. Try a different website or check if it requires authentication.' 
      })
    } else if (response.status === 404) {
      return res.status(404).json({ 
        error: 'Website not found. Please check the URL and try again.' 
      })
    } else if (response.status >= 400) {
      return res.status(response.status).json({ 
        error: `The website returned an error (${response.status}). Please try again later.` 
      })
    }
    
    const html = response.data
    const $ = cheerio.load(html)

    // Extract metadata
    const title = $('title').text() || ''
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || ''

    // Extract scripts
    const scripts: string[] = []
    $('script').each((_, elem) => {
      const src = $(elem).attr('src')
      if (src) {
        const absoluteUrl = new URL(src, targetUrl.origin).href
        scripts.push(absoluteUrl)
      }
    })

    // Extract stylesheets
    const stylesheets: string[] = []
    $('link[rel="stylesheet"]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (href) {
        const absoluteUrl = new URL(href, targetUrl.origin).href
        stylesheets.push(absoluteUrl)
      }
    })

    // Extract images
    const images: string[] = []
    $('img').each((_, elem) => {
      const src = $(elem).attr('src')
      if (src) {
        try {
          const absoluteUrl = new URL(src, targetUrl.origin).href
          images.push(absoluteUrl)
        } catch {}
      }
    })

    // Extract all links
    const links: string[] = []
    $('a').each((_, elem) => {
      const href = $(elem).attr('href')
      if (href) {
        try {
          const absoluteUrl = new URL(href, targetUrl.origin).href
          if (!links.includes(absoluteUrl)) {
            links.push(absoluteUrl)
          }
        } catch {}
      }
    })

    // Extract API endpoints and backend URLs from JavaScript
    const apis: string[] = []
    const backendUrls: string[] = []
    
    // Patterns to match API calls
    const apiPatterns = [
      /fetch\s*\(\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /axios\.[a-z]+\s*\(\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /XMLHttpRequest[\s\S]*?open\s*\(\s*['"][A-Z]+['"]\s*,\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /['"]https?:\/\/[^'"]*api[^'"]*['"]/gi,
      /['"]\/api\/[^'"]+['"]/gi
    ]

    // Get all script content (inline and external)
    const scriptContents: string[] = []
    
    // Inline scripts
    $('script:not([src])').each((_, elem) => {
      scriptContents.push($(elem).html() || '')
    })

    // Analyze script contents for API patterns
    scriptContents.forEach(content => {
      apiPatterns.forEach(pattern => {
        const matches = content.matchAll(pattern)
        for (const match of matches) {
          let apiUrl = match[1] || match[0].replace(/['"]/g, '')
          
          // Clean up the URL
          apiUrl = apiUrl.replace(/fetch\s*\(\s*/, '')
                        .replace(/axios\.[a-z]+\s*\(\s*/, '')
                        .replace(/['"`]/g, '')
                        .trim()
          
          if (apiUrl) {
            try {
              // Make relative URLs absolute
              if (apiUrl.startsWith('/')) {
                apiUrl = new URL(apiUrl, targetUrl.origin).href
              }
              
              // Categorize as API or backend URL
              if (apiUrl.includes('/api/') || apiUrl.includes('/graphql') || 
                  apiUrl.includes('/rest/') || apiUrl.includes('/v1/') ||
                  apiUrl.includes('/v2/') || apiUrl.includes('.json')) {
                if (!apis.includes(apiUrl)) {
                  apis.push(apiUrl)
                }
              } else if (apiUrl.startsWith('http')) {
                if (!backendUrls.includes(apiUrl)) {
                  backendUrls.push(apiUrl)
                }
              }
            } catch {}
          }
        }
      })
    })

    // Look for API endpoints in external script URLs
    scripts.forEach(scriptUrl => {
      if (scriptUrl.includes('/api/') || scriptUrl.includes('api.') || 
          scriptUrl.includes('backend.') || scriptUrl.includes('service.')) {
        const baseUrl = new URL(scriptUrl).origin
        if (!backendUrls.includes(baseUrl)) {
          backendUrls.push(baseUrl)
        }
      }
    })

    const result: ScanResult = {
      url: targetUrl.href,
      html: html.substring(0, 50000), // Limit HTML size
      apis: [...new Set(apis)],
      backendUrls: [...new Set(backendUrls)],
      scripts: [...new Set(scripts)],
      stylesheets: [...new Set(stylesheets)],
      images: [...new Set(images)].slice(0, 50), // Limit to 50 images
      links: [...new Set(links)].slice(0, 100), // Limit to 100 links
      metadata: {
        title,
        description
      }
    }

    // Generate website overview
    result.overview = generateOverview($, html, targetUrl, scripts, stylesheets, images, response.headers, [])

    // Check for robots.txt and sitemap
    try {
      const robotsResponse = await axios.get(`${targetUrl.origin}/robots.txt`, { timeout: 3000, validateStatus: () => true })
      result.overview.structure.hasRobotsTxt = robotsResponse.status === 200
    } catch {}

    try {
      const sitemapResponse = await axios.get(`${targetUrl.origin}/sitemap.xml`, { timeout: 3000, validateStatus: () => true })
      result.overview.structure.hasSitemap = sitemapResponse.status === 200
    } catch {}

    // Deep scan: Extract parameters from APIs and backend URLs
    if (deepScan) {
      result.apiDetails = extractParameters([...new Set(apis)])
      result.backendUrlDetails = extractParameters([...new Set(backendUrls)])
      
      // Optionally scan discovered links for more APIs
      if (links.length > 0) {
        const additionalApis = await scanLinksForApis(links.slice(0, 20), targetUrl.origin)
        result.apiDetails.push(...additionalApis)
      }
    }

    res.status(200).json(result)
  } catch (error: any) {
    console.error('Scan error:', error)
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status
      if (status === 403) {
        return res.status(403).json({ 
          error: 'Access denied. The website is blocking automated requests. Try a different website or check if it requires authentication.' 
        })
      } else if (status === 404) {
        return res.status(404).json({ 
          error: 'Website not found. Please check the URL and try again.' 
        })
      } else if (status >= 500) {
        return res.status(502).json({ 
          error: `The target website is experiencing issues (Error ${status}). Please try again later.` 
        })
      }
    }
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(400).json({ 
        error: 'Cannot connect to website. Please check the URL and your internet connection.' 
      })
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(408).json({ 
        error: 'Request timeout. The website took too long to respond. Please try again.' 
      })
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to scan website. Please check the URL and try again.' 
    })
  }
}
