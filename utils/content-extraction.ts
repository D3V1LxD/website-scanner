import * as cheerio from 'cheerio'
import { franc } from 'franc'

// Extract contact information from HTML
export function extractContactInfo(html: string, $: cheerio.CheerioAPI) {
  const emails: string[] = []
  const phones: string[] = []
  const addresses: string[] = []
  const contactForms: Array<{ url: string; method: string; fields: string[] }> = []
  const socialMediaLinks: Array<{ platform: string; url: string }> = []

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emailMatches = html.match(emailRegex) || []
  emails.push(...new Set(emailMatches.filter(email => 
    !email.includes('@example.') && 
    !email.includes('@placeholder.') &&
    !email.includes('@domain.')
  )))

  // Extract phone numbers (international format)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g
  const phoneMatches = html.match(phoneRegex) || []
  phones.push(...new Set(phoneMatches.filter(phone => phone.replace(/\D/g, '').length >= 10)))

  // Extract addresses (basic pattern)
  const addressRegex = /\d+\s+[\w\s,]+(?:street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/gi
  const addressMatches = html.match(addressRegex) || []
  addresses.push(...new Set(addressMatches))

  // Extract contact forms
  $('form').each((_, form) => {
    const action = $(form).attr('action') || ''
    const method = $(form).attr('method') || 'GET'
    const fields: string[] = []
    
    $(form).find('input, textarea, select').each((_, input) => {
      const name = $(input).attr('name') || $(input).attr('id') || 'unnamed'
      const type = $(input).attr('type') || 'text'
      fields.push(`${name} (${type})`)
    })

    if (fields.length > 0 && (
      action.includes('contact') ||
      action.includes('form') ||
      fields.some(f => f.includes('email') || f.includes('message'))
    )) {
      contactForms.push({ url: action, method: method.toUpperCase(), fields })
    }
  })

  // Social media detection
  const socialPlatforms = [
    { name: 'Facebook', pattern: /facebook\.com\/[a-zA-Z0-9.]+/ },
    { name: 'Twitter', pattern: /twitter\.com\/[a-zA-Z0-9_]+/ },
    { name: 'X', pattern: /x\.com\/[a-zA-Z0-9_]+/ },
    { name: 'LinkedIn', pattern: /linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+/ },
    { name: 'Instagram', pattern: /instagram\.com\/[a-zA-Z0-9._]+/ },
    { name: 'YouTube', pattern: /youtube\.com\/(channel|c|user)\/[a-zA-Z0-9_-]+/ },
    { name: 'TikTok', pattern: /tiktok\.com\/@[a-zA-Z0-9._]+/ },
    { name: 'Pinterest', pattern: /pinterest\.com\/[a-zA-Z0-9_]+/ },
    { name: 'GitHub', pattern: /github\.com\/[a-zA-Z0-9-]+/ },
  ]

  $('a[href]').each((_, link) => {
    const href = $(link).attr('href') || ''
    for (const platform of socialPlatforms) {
      if (platform.pattern.test(href)) {
        socialMediaLinks.push({ platform: platform.name, url: href })
      }
    }
  })

  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    addresses: [...new Set(addresses)],
    contactForms,
    socialMediaLinks: [...new Map(socialMediaLinks.map(item => [item.url, item])).values()]
  }
}

// Detect social media presence
export function detectSocialMedia($: cheerio.CheerioAPI) {
  const platforms: Array<{ name: string; url: string; handle?: string; verified?: boolean }> = []
  
  const socialPlatforms = [
    { name: 'Facebook', domains: ['facebook.com', 'fb.com'] },
    { name: 'Twitter', domains: ['twitter.com'] },
    { name: 'X', domains: ['x.com'] },
    { name: 'LinkedIn', domains: ['linkedin.com'] },
    { name: 'Instagram', domains: ['instagram.com'] },
    { name: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
    { name: 'TikTok', domains: ['tiktok.com'] },
    { name: 'Pinterest', domains: ['pinterest.com'] },
    { name: 'Snapchat', domains: ['snapchat.com'] },
    { name: 'Reddit', domains: ['reddit.com'] },
    { name: 'GitHub', domains: ['github.com'] },
    { name: 'Discord', domains: ['discord.gg', 'discord.com'] },
    { name: 'Telegram', domains: ['t.me', 'telegram.me'] },
    { name: 'WhatsApp', domains: ['wa.me', 'whatsapp.com'] },
  ]

  $('a[href]').each((_, link) => {
    const href = $(link).attr('href') || ''
    const text = $(link).text().trim()
    
    for (const platform of socialPlatforms) {
      if (platform.domains.some(domain => href.includes(domain))) {
        // Extract handle from URL
        const handleMatch = href.match(/(?:@|\/)([\w.-]+)\/?$/)
        const handle = handleMatch ? handleMatch[1] : undefined
        
        platforms.push({
          name: platform.name,
          url: href,
          handle,
          verified: text.includes('✓') || text.includes('verified')
        })
        break
      }
    }
  })

  // Remove duplicates
  const uniquePlatforms = [...new Map(platforms.map(p => [p.url, p])).values()]

  return {
    platforms: uniquePlatforms,
    totalPlatforms: uniquePlatforms.length,
    hasOfficialLinks: uniquePlatforms.some(p => p.verified)
  }
}

// Analyze structured data (JSON-LD, Microdata)
export function analyzeStructuredData(html: string, $: cheerio.CheerioAPI) {
  const schemas: Array<{ type: string; data: any }> = []
  const types: string[] = []

  // Extract JSON-LD
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const content = $(script).html() || ''
      const data = JSON.parse(content)
      
      if (data['@type']) {
        const type = Array.isArray(data['@type']) ? data['@type'].join(', ') : data['@type']
        types.push(type)
        schemas.push({ type, data })
      } else if (data['@graph']) {
        // Handle graph notation
        data['@graph'].forEach((item: any) => {
          if (item['@type']) {
            const type = Array.isArray(item['@type']) ? item['@type'].join(', ') : item['@type']
            types.push(type)
            schemas.push({ type, data: item })
          }
        })
      }
    } catch (error) {
      // Invalid JSON-LD
    }
  })

  // Detect Microdata (simplified)
  const hasMicrodata = $('[itemscope]').length > 0

  return {
    hasStructuredData: schemas.length > 0 || hasMicrodata,
    types: [...new Set(types)],
    schemas,
    validationErrors: [],
    richSnippetsEligible: schemas.length > 0
  }
}

// Detect languages and internationalization
export function detectLanguages(html: string, $: cheerio.CheerioAPI) {
  const hreflangTags: Array<{ lang: string; url: string }> = []
  
  // Extract hreflang tags
  $('link[rel="alternate"]').each((_, link) => {
    const hreflang = $(link).attr('hreflang')
    const href = $(link).attr('href')
    if (hreflang && href) {
      hreflangTags.push({ lang: hreflang, url: href })
    }
  })

  // Get primary language from html tag
  const primaryLanguage = $('html').attr('lang') || undefined

  // Detect language from text content (using franc library)
  const bodyText = $('body').text().slice(0, 1000) // Sample first 1000 chars
  const detectedLang = franc(bodyText, { minLength: 10 })
  const detectedLanguages = detectedLang !== 'und' ? [detectedLang] : []

  // Check for RTL support
  const rtlSupport = $('html').attr('dir') === 'rtl' || 
                     $('body').attr('dir') === 'rtl' ||
                     $('[dir="rtl"]').length > 0

  return {
    primaryLanguage,
    detectedLanguages: primaryLanguage ? [primaryLanguage, ...detectedLanguages] : detectedLanguages,
    hasHreflang: hreflangTags.length > 0,
    hreflangTags,
    hasTranslations: hreflangTags.length > 1,
    rtlSupport
  }
}

// Enhanced technology detection
export function detectEnhancedTechStack(html: string, headers: Record<string, string>, scripts: string[]) {
  const backend: { language?: string; framework?: string; detectedFrom: string[] } = { detectedFrom: [] }
  const database: { type?: string; evidence: string[] } = { evidence: [] }
  const server: { software?: string; version?: string; os?: string } = {}
  const security: { waf?: string; ddosProtection?: string; ssl?: string } = {}
  const marketing: { analytics: string[]; tagManager: string[]; advertising: string[]; email: string[] } = {
    analytics: [],
    tagManager: [],
    advertising: [],
    email: []
  }

  // Detect backend from headers and HTML
  const poweredBy = headers['x-powered-by'] || headers['X-Powered-By']
  if (poweredBy) {
    if (poweredBy.includes('PHP')) {
      backend.language = 'PHP'
      backend.detectedFrom.push('X-Powered-By header')
    } else if (poweredBy.includes('ASP.NET')) {
      backend.language = 'ASP.NET'
      backend.framework = 'ASP.NET'
      backend.detectedFrom.push('X-Powered-By header')
    } else if (poweredBy.includes('Express')) {
      backend.language = 'Node.js'
      backend.framework = 'Express'
      backend.detectedFrom.push('X-Powered-By header')
    }
  }

  // Detect from meta tags
  if (html.includes('generator') && html.includes('WordPress')) {
    backend.framework = 'WordPress'
    backend.language = 'PHP'
    backend.detectedFrom.push('Meta generator tag')
  } else if (html.includes('generator') && html.includes('Drupal')) {
    backend.framework = 'Drupal'
    backend.language = 'PHP'
    backend.detectedFrom.push('Meta generator tag')
  }

  // Server detection
  const serverHeader = headers['server'] || headers['Server']
  if (serverHeader) {
    const serverMatch = serverHeader.match(/^([^\s/]+)(?:\/([^\s]+))?/)
    if (serverMatch) {
      server.software = serverMatch[1]
      server.version = serverMatch[2]
    }
  }

  // Security detection
  if (headers['cf-ray']) security.waf = 'Cloudflare'
  if (headers['x-sucuri-id']) security.waf = 'Sucuri'
  if (headers['x-akamai-transformed']) security.waf = 'Akamai'

  // Marketing tools
  scripts.forEach(script => {
    if (script.includes('google-analytics.com') || script.includes('gtag')) {
      marketing.analytics.push('Google Analytics')
    }
    if (script.includes('googletagmanager.com')) {
      marketing.tagManager.push('Google Tag Manager')
    }
    if (script.includes('facebook.net/en_US/fbevents.js')) {
      marketing.analytics.push('Facebook Pixel')
    }
    if (script.includes('googleadservices.com')) {
      marketing.advertising.push('Google Ads')
    }
    if (script.includes('doubleclick.net')) {
      marketing.advertising.push('Google DoubleClick')
    }
    if (script.includes('mailchimp.com')) {
      marketing.email.push('Mailchimp')
    }
  })

  return {
    backend,
    database,
    server,
    security,
    marketing
  }
}
