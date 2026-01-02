import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio'
import lighthouse from 'lighthouse'
import { applyStealthMeasures, navigateWithBypass } from '@/utils/cloudflare-bypass'

// Dynamic import for puppeteer with Cloudflare bypass - use different packages for local vs production
async function getBrowser() {
  // Try local puppeteer first, fallback to puppeteer-core + chromium
  try {
    const puppeteer = await import('puppeteer-extra')
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
    puppeteer.default.use(StealthPlugin())
    
    return await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    })
  } catch {
    // Production environment (Vercel/Render) - use serverless chromium with stealth
    const puppeteerExtra = await import('puppeteer-extra')
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
    const chromium = await import('@sparticuz/chromium')
    
    puppeteerExtra.default.use(StealthPlugin())
    
    return await puppeteerExtra.default.launch({
      args: [
        ...chromium.default.args,
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })
  }
}

import { 
  detectTechnologies, 
  detectSEO, 
  detectAccessibility, 
  detectPrivacy, 
  detectMobileAndPWA, 
  detectEcommerce 
} from '@/utils/detectors'
import {
  analyzeRobotsTxt,
  analyzeSitemap,
  analyzeSSLCertificate,
  calculateCarbonFootprint,
  analyzePageWeight,
  generateSocialPreviews,
  categorizeThirdPartyServices
} from '@/utils/advanced-features'
import {
  analyzeWhois,
  analyzeDNS,
  analyzeServerInfo,
  analyzeUptime
} from '@/utils/domain-analysis'
import { analyzeSecurityHeaders } from '@/utils/security-analysis'
import {
  extractContactInfo,
  detectSocialMedia,
  analyzeStructuredData,
  detectLanguages,
  detectEnhancedTechStack
} from '@/utils/content-extraction'
import {
  analyzeExternalLinks,
  analyzeInternalLinks
} from '@/utils/link-analysis'
import { WebsiteOverview } from '@/pages/index'

interface ApiDetail {
  url: string
  method?: string
  parameters: {
    query: string[]
    path: string[]
    body?: string[]
  }
  headers?: Record<string, string>
}

interface ScanResult {
  url: string
  html: string
  apis: string[]
  backendUrls: string[]
  scripts: string[]
  stylesheets: string[]
  images: string[]
  links: string[]
  metadata: {
    title: string
    description: string
  }
  networkRequests: string[]
  apiDetails?: ApiDetail[]
  backendUrlDetails?: ApiDetail[]
  overview?: WebsiteOverview
}

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

      // Extract potential path parameters
      const pathSegments = url.pathname.split('/').filter(s => s)
      pathSegments.forEach(segment => {
        if (/^\d+$/.test(segment) || 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(segment) && segment.length > 2) {
          pathParams.push(segment)
        }
      })

      // Detect HTTP method
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

// Generate comprehensive website overview using detection utilities
function generateOverview(
  $: cheerio.CheerioAPI,
  html: string,
  targetUrl: URL,
  scripts: string[],
  stylesheets: string[],
  images: string[],
  cookies: any[],
  performanceMetrics?: any,
  webVitals?: any
): WebsiteOverview {
  // Use detection utilities for comprehensive analysis
  const technologies = detectTechnologies($, html, scripts, stylesheets)
  const seo = detectSEO($, html)
  const accessibility = detectAccessibility($)
  const privacy = detectPrivacy($, html, cookies)
  const mobileAndPWA = detectMobileAndPWA($, html)
  const ecommerce = detectEcommerce($, html)

  // Extract security headers (will be populated from response headers)
  const securityHeaders: Record<string, string> = {}

  // Extract social links
  const socialLinks: Record<string, string> = {}
  $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="github.com"]').each((_, elem) => {
    const href = $(elem).attr('href') || ''
    if (href.includes('facebook.com')) socialLinks['Facebook'] = href
    if (href.includes('twitter.com') || href.includes('x.com')) socialLinks['Twitter/X'] = href
    if (href.includes('linkedin.com')) socialLinks['LinkedIn'] = href
    if (href.includes('instagram.com')) socialLinks['Instagram'] = href
    if (href.includes('youtube.com')) socialLinks['YouTube'] = href
    if (href.includes('github.com')) socialLinks['GitHub'] = href
  })

  // Extract contacts
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
  const emails = [...new Set(html.match(emailRegex) || [])]
  const phones = [...new Set(html.match(phoneRegex) || [])]

  // Detect forms
  const forms: { type: string; action: string; method: string }[] = []
  $('form').each((_, elem) => {
    const action = $(elem).attr('action') || ''
    const method = $(elem).attr('method') || 'GET'
    let type = 'generic'
    
    const formHtml = $(elem).html()?.toLowerCase() || ''
    if (formHtml.includes('login') || formHtml.includes('sign in')) type = 'login'
    else if (formHtml.includes('search')) type = 'search'
    else if (formHtml.includes('contact') || formHtml.includes('email')) type = 'contact'
    else if (formHtml.includes('subscribe') || formHtml.includes('newsletter')) type = 'newsletter'
    
    forms.push({ type, action, method })
  })

  // Count media
  const videos = $('video').length
  const audios = $('audio').length
  const iframes = $('iframe').length

  // Detect API types
  const apiTypes: string[] = []
  const htmlLower = html.toLowerCase()
  if (htmlLower.includes('graphql') || htmlLower.includes('/graphql')) apiTypes.push('GraphQL')
  if (htmlLower.includes('websocket') || htmlLower.includes('ws://') || htmlLower.includes('wss://')) apiTypes.push('WebSocket')
  if (htmlLower.includes('/api/') || htmlLower.includes('/rest/')) apiTypes.push('REST')
  if (htmlLower.includes('grpc')) apiTypes.push('gRPC')

  // Performance recommendations
  const performanceRecommendations: string[] = []
  if (images.length > 20) performanceRecommendations.push('Consider lazy loading images')
  if (scripts.length > 10) performanceRecommendations.push('Minimize JavaScript files')
  if (stylesheets.length > 5) performanceRecommendations.push('Combine CSS files')
  if (!html.includes('defer') && !html.includes('async')) performanceRecommendations.push('Use async/defer for scripts')

  // Build comprehensive overview
  const overview: WebsiteOverview = {
    technologies,
    security: {
      headers: securityHeaders,
      https: targetUrl.protocol === 'https:',
      certificates: [],
      mixedContent: []
    },
    performance: {
      loadTime: 0,
      resourceCount: {
        scripts: scripts.length,
        styles: stylesheets.length,
        images: images.length,
        total: scripts.length + stylesheets.length + images.length
      },
      recommendations: {
        imageOptimization: performanceRecommendations.filter(r => r.includes('image')),
        minificationOpportunities: performanceRecommendations.filter(r => r.includes('Minimize') || r.includes('Combine')),
        compressionSuggestions: [],
        cachingImprovements: [],
        renderBlockingResources: performanceRecommendations.filter(r => r.includes('async') || r.includes('defer')),
        unusedCSS: [],
        unusedJS: []
      },
      coreWebVitals: webVitals
    },
    seo,
    accessibility,
    privacy,
    mobile: mobileAndPWA.mobile,
    pwa: mobileAndPWA.pwa,
    ecommerce,
    social: {
      links: socialLinks,
      meta: seo.ogTags
    },
    structure: {
      hasRobotsTxt: false,
      hasSitemap: false,
      responsive: mobileAndPWA.mobile.viewport ? mobileAndPWA.mobile.viewport.includes('width=device-width') : false,
      language: $('html').attr('lang') || 'en'
    },
    content: {
      wordCount: seo.wordCount,
      readingTime: seo.readingTime,
      headingHierarchy: true
    },
    contacts: {
      emails: emails.slice(0, 5),
      phones: phones.slice(0, 5),
      addresses: [],
      socialLinks
    },
    forms: {
      total: forms.length,
      loginForms: forms.filter(f => f.type === 'login').length,
      searchForms: forms.filter(f => f.type === 'search').length,
      contactForms: forms.filter(f => f.type === 'contact').length,
      newsletterForms: forms.filter(f => f.type === 'newsletter').length
    },
    apis: {
      hasGraphQL: apiTypes.includes('GraphQL'),
      hasWebSocket: apiTypes.includes('WebSocket'),
      hasREST: apiTypes.includes('REST')
    }
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

  const { url, deepScan = false, skipScreenshots = false, skipWhois = true } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  let browser = null

  try {
    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Launch browser with environment-specific setup
    browser = await getBrowser()

    const page = await browser.newPage()

    // Apply comprehensive stealth measures for Cloudflare bypass
    await applyStealthMeasures(page)

    // Track network requests and response headers
    const networkRequests: string[] = []
    const apiCalls: Set<string> = new Set()
    let responseHeaders: Record<string, string> = {}
    const consoleMessages: Array<{ type: string; message: string; timestamp: number }> = []
    const networkErrors: Array<{ url: string; status: number; statusText: string }> = []

    page.on('request', (request) => {
      const requestUrl = request.url()
      networkRequests.push(requestUrl)

      // Detect API calls
      if (requestUrl.includes('/api/') || requestUrl.includes('/graphql') ||
          requestUrl.includes('/rest/') || requestUrl.includes('.json') ||
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        apiCalls.add(requestUrl)
      }
    })

    // Capture response headers and network errors
    page.on('response', async (response) => {
      if (response.url() === url) {
        const headers = response.headers()
        responseHeaders = headers
      }
      
      // Capture failed requests
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        })
      }
    })

    // Capture console messages
    page.on('console', (msg) => {
      const type = msg.type()
      if (['error', 'warning', 'info'].includes(type)) {
        consoleMessages.push({
          type,
          message: msg.text(),
          timestamp: Date.now()
        })
      }
    })

    // Capture page errors
    page.on('pageerror', (error: unknown) => {
      consoleMessages.push({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      })
    })

    // Navigate to the page with Cloudflare bypass
    const navigationStart = Date.now()
    
    await navigateWithBypass(page, url, {
      waitUntil: 'networkidle2',
      timeout: 45000
    })
    
    const navigationEnd = Date.now()
    const loadTime = navigationEnd - navigationStart

    // Get cookies
    const cookies = await page.cookies()

    // Wait a bit for dynamic content and measure Core Web Vitals
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Measure Core Web Vitals and Performance Metrics
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {
          lcp: null,
          fid: null,
          cls: null,
          fcp: null,
          ttfb: null,
          tti: null
        }

        // Get performance timing
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (perfData) {
          vitals.ttfb = Math.round(perfData.responseStart - perfData.requestStart)
          vitals.fcp = Math.round(perfData.responseEnd - perfData.fetchStart)
        }

        // LCP - Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          vitals.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime)
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            vitals.fid = Math.round(entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ type: 'first-input', buffered: true })

        // CLS - Cumulative Layout Shift
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
              vitals.cls = Math.round(clsValue * 1000) / 1000
            }
          }
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })

        // Give some time for metrics to be captured
        setTimeout(() => {
          resolve(vitals)
        }, 1000)
      })
    })

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (!perfData) return null

      return {
        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
        request: Math.round(perfData.responseStart - perfData.requestStart),
        response: Math.round(perfData.responseEnd - perfData.responseStart),
        dom: Math.round(perfData.domContentLoadedEventEnd - perfData.responseEnd),
        load: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
        total: Math.round(perfData.loadEventEnd - perfData.fetchStart)
      }
    })

    // Check for broken links (sample check on first 20 links)
    const brokenLinks: string[] = []
    const internalLinks = await page.$$eval('a[href]', (links, origin) => {
      return links
        .map((link: any) => link.href)
        .filter((href: string) => href.startsWith(origin))
        .slice(0, 20)
    }, targetUrl.origin)

    // Capture screenshots (optional - heavy on memory)
    let desktopScreenshot: string | undefined
    let mobileScreenshot: string | undefined
    
    if (!skipScreenshots) {
      desktopScreenshot = await page.screenshot({ 
        encoding: 'base64',
        fullPage: false,
        type: 'jpeg',
        quality: 60
      }) as string
      
      // Mobile screenshot
      await page.setViewport({ width: 375, height: 667 })
      mobileScreenshot = await page.screenshot({ 
        encoding: 'base64',
        fullPage: false,
        type: 'jpeg',
        quality: 60
      }) as string
      
      // Reset viewport
      await page.setViewport({ width: 1920, height: 1080 })
    }

    // Get the HTML content
    const html = await page.content()

    // Close browser ASAP to free memory
    await browser.close()
    browser = null

    // Parse with cheerio
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

    // Extract API endpoints from JavaScript and network requests
    const apis: string[] = []
    const backendUrls: string[] = []
    
    // Add detected API calls from network monitoring
    apiCalls.forEach(api => apis.push(api))

    // Patterns to match API calls in script content
    const apiPatterns = [
      /fetch\s*\(\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /axios\.[a-z]+\s*\(\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"](https?:\/\/[^'"]+|\/[^'"]+)['"]/gi,
      /['"]https?:\/\/[^'"]*api[^'"]*['"]/gi,
      /['"]\/api\/[^'"]+['"]/gi
    ]

    // Get all script content
    const scriptContents: string[] = []
    $('script:not([src])').each((_, elem) => {
      scriptContents.push($(elem).html() || '')
    })

    // Analyze script contents
    scriptContents.forEach(content => {
      apiPatterns.forEach(pattern => {
        const matches = content.matchAll(pattern)
        for (const match of matches) {
          let apiUrl = match[1] || match[0].replace(/['"]/g, '')
          apiUrl = apiUrl.replace(/fetch\s*\(\s*/, '')
                        .replace(/axios\.[a-z]+\s*\(\s*/, '')
                        .replace(/['"`]/g, '')
                        .trim()
          
          if (apiUrl) {
            try {
              if (apiUrl.startsWith('/')) {
                apiUrl = new URL(apiUrl, targetUrl.origin).href
              }
              
              if (apiUrl.includes('/api/') || apiUrl.includes('/graphql') || 
                  apiUrl.includes('/rest/') || apiUrl.includes('.json')) {
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

    // Extract backend URLs from network requests
    networkRequests.forEach(requestUrl => {
      try {
        const reqUrl = new URL(requestUrl)
        if (reqUrl.origin !== targetUrl.origin) {
          const origin = reqUrl.origin
          if (!backendUrls.includes(origin) && !origin.includes('google') && 
              !origin.includes('facebook') && !origin.includes('analytics')) {
            backendUrls.push(origin)
          }
        }
      } catch {}
    })

    const result: ScanResult = {
      url: targetUrl.href,
      html: html.substring(0, 50000),
      apis: [...new Set(apis)],
      backendUrls: [...new Set(backendUrls)],
      scripts: [...new Set(scripts)],
      stylesheets: [...new Set(stylesheets)],
      images: [...new Set(images)].slice(0, 50),
      links: [...new Set(links)].slice(0, 100),
      metadata: {
        title,
        description
      },
      networkRequests: [...new Set(networkRequests)].slice(0, 50)
    }

    // Generate comprehensive website overview with Puppeteer-captured metrics
    result.overview = generateOverview($, html, targetUrl, scripts, stylesheets, images, cookies, performanceMetrics, webVitals)
    
    // Add security headers from response
    if (result.overview.security) {
      result.overview.security.headers = {
        'Content-Security-Policy': responseHeaders['content-security-policy'] || '',
        'Strict-Transport-Security': responseHeaders['strict-transport-security'] || '',
        'X-Frame-Options': responseHeaders['x-frame-options'] || '',
        'X-Content-Type-Options': responseHeaders['x-content-type-options'] || '',
        'Referrer-Policy': responseHeaders['referrer-policy'] || '',
        'Permissions-Policy': responseHeaders['permissions-policy'] || ''
      }
    }

    // Add screenshots (if captured)
    if (desktopScreenshot && mobileScreenshot) {
      result.overview.screenshots = {
        desktop: `data:image/jpeg;base64,${desktopScreenshot}`,
        mobile: `data:image/jpeg;base64,${mobileScreenshot}`,
        capturedAt: new Date().toISOString()
      }
    }

    // Add console errors
    result.overview.consoleErrors = {
      errors: consoleMessages,
      errorCount: consoleMessages.filter(m => m.type === 'error').length,
      warningCount: consoleMessages.filter(m => m.type === 'warning').length,
      networkErrors
    }

    // Analyze robots.txt and sitemap (async operations)
    try {
      const [robotsData, sitemapData, sslData] = await Promise.all([
        analyzeRobotsTxt(targetUrl.href),
        analyzeSitemap(targetUrl.href),
        targetUrl.protocol === 'https:' ? analyzeSSLCertificate(targetUrl.hostname) : Promise.resolve(null)
      ])
      
      result.overview.robotsTxt = robotsData
      result.overview.sitemap = sitemapData
      if (sslData) result.overview.sslCertificate = sslData
    } catch (error) {
      console.error('Error analyzing robots/sitemap/ssl:', error)
    }

    // Calculate carbon footprint
    const htmlSize = new TextEncoder().encode(html).length
    result.overview.carbonFootprint = calculateCarbonFootprint(htmlSize)

    // Analyze page weight
    result.overview.pageWeight = analyzePageWeight(html, scripts, stylesheets, images)

    // Generate social previews
    if (result.overview.seo) {
      result.overview.socialPreviews = generateSocialPreviews(result.overview.seo)
    }

    // Categorize third-party services
    result.overview.thirdPartyServices = categorizeThirdPartyServices(scripts, html)

    // NEW FEATURES: Run all async operations in parallel with timeouts
    const featureTimeout = (promise: Promise<any>, timeoutMs: number = 10000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
      ]).catch(() => undefined)
    }

    // Run async features in parallel (skip WHOIS by default - it's slow)
    const [whoisData, dnsRecords, serverInfo, securityHeaders, uptime] = await Promise.all([
      skipWhois ? Promise.resolve(undefined) : featureTimeout(analyzeWhois(url), 6000),
      featureTimeout(analyzeDNS(url), 4000),
      featureTimeout(analyzeServerInfo(url, responseHeaders), 2000),
      featureTimeout(analyzeSecurityHeaders(url, responseHeaders), 2000),
      featureTimeout(analyzeUptime(url), 5000)
    ])

    // Assign async results
    if (whoisData) result.overview.whoisData = whoisData
    if (dnsRecords) result.overview.dnsRecords = dnsRecords
    if (serverInfo) result.overview.serverInfo = serverInfo
    if (securityHeaders) result.overview.securityHeaders = securityHeaders
    if (uptime) result.overview.uptime = uptime

    // Synchronous features (fast, no timeout needed)
    result.overview.contactInfo = extractContactInfo(html, $)
    result.overview.socialMedia = detectSocialMedia($)
    result.overview.structuredData = analyzeStructuredData(html, $)
    result.overview.i18n = detectLanguages(html, $)
    result.overview.externalLinks = analyzeExternalLinks($, url, links)
    result.overview.internalLinks = analyzeInternalLinks($, url, links)
    result.overview.enhancedTechStack = detectEnhancedTechStack(html, responseHeaders, scripts)

    // Add broken links if any were detected
    if (brokenLinks.length > 0) {
      result.overview.brokenLinks = {
        internal404: brokenLinks,
        externalBroken: [],
        redirectChains: []
      }
    }

    // Override load time with actual measurement
    if (result.overview.performance) {
      result.overview.performance.loadTime = loadTime
    }

    // Deep scan: Extract parameters
    if (deepScan) {
      result.apiDetails = extractParameters([...new Set(apis)])
      result.backendUrlDetails = extractParameters([...new Set(backendUrls)])
    }

    res.status(200).json(result)
  } catch (error: any) {
    // Make sure browser is closed
    if (browser) {
      try {
        await browser.close()
      } catch {}
    }

    console.error('Advanced scan error:', error)
    
    if (error.name === 'TimeoutError') {
      return res.status(408).json({ 
        error: 'Request timeout. The website took too long to load. Try the basic scan instead.' 
      })
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to scan website. Try the basic scan mode instead.' 
    })
  }
}
