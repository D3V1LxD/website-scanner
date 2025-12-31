import * as https from 'https'
import * as tls from 'tls'
import axios from 'axios'
import { parseString } from 'xml2js'
import robotsParser from 'robots-parser'

/**
 * Fetch and parse robots.txt
 */
export async function analyzeRobotsTxt(url: string) {
  try {
    const robotsUrl = new URL('/robots.txt', url).href
    const response = await axios.get(robotsUrl, { timeout: 5000 })
    
    const robots = robotsParser(robotsUrl, response.data)
    const content = response.data
    
    // Parse rules manually for better structure
    const lines = content.split('\n')
    const rules: Array<{ userAgent: string; allow: string[]; disallow: string[] }> = []
    const sitemaps: string[] = []
    let crawlDelay: number | undefined
    
    let currentUserAgent = ''
    let currentRule: { userAgent: string; allow: string[]; disallow: string[] } | null = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        if (currentRule) rules.push(currentRule)
        currentUserAgent = trimmed.substring(11).trim()
        currentRule = { userAgent: currentUserAgent, allow: [], disallow: [] }
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        if (currentRule) {
          const path = trimmed.substring(9).trim()
          if (path) currentRule.disallow.push(path)
        }
      } else if (trimmed.toLowerCase().startsWith('allow:')) {
        if (currentRule) {
          const path = trimmed.substring(6).trim()
          if (path) currentRule.allow.push(path)
        }
      } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
        sitemaps.push(trimmed.substring(8).trim())
      } else if (trimmed.toLowerCase().startsWith('crawl-delay:')) {
        crawlDelay = parseInt(trimmed.substring(12).trim())
      }
    }
    
    if (currentRule) rules.push(currentRule)
    
    return {
      exists: true,
      content,
      rules,
      sitemaps,
      crawlDelay,
      errors: []
    }
  } catch (error: any) {
    return {
      exists: false,
      content: undefined,
      rules: [],
      sitemaps: [],
      crawlDelay: undefined,
      errors: [error.message]
    }
  }
}

/**
 * Fetch and parse sitemap.xml
 */
export async function analyzeSitemap(url: string) {
  try {
    const sitemapUrl = new URL('/sitemap.xml', url).href
    const response = await axios.get(sitemapUrl, { timeout: 5000 })
    
    return new Promise<any>((resolve) => {
      parseString(response.data, (err: any, result: any) => {
        if (err) {
          resolve({
            exists: false,
            errors: [err.message]
          })
          return
        }
        
        const urlset = result.urlset || result.sitemapindex
        if (!urlset) {
          resolve({
            exists: false,
            errors: ['Invalid sitemap format']
          })
          return
        }
        
        const urls: any[] = []
        let images = 0
        let videos = 0
        
        if (urlset.url) {
          for (const urlEntry of urlset.url) {
            urls.push({
              loc: urlEntry.loc?.[0] || '',
              lastmod: urlEntry.lastmod?.[0],
              changefreq: urlEntry.changefreq?.[0],
              priority: urlEntry.priority?.[0]
            })
            
            if (urlEntry['image:image']) images += urlEntry['image:image'].length
            if (urlEntry['video:video']) videos += urlEntry['video:video'].length
          }
        }
        
        resolve({
          exists: true,
          url: sitemapUrl,
          urlCount: urls.length,
          lastModified: response.headers['last-modified'],
          urls: urls.slice(0, 100), // Limit to first 100
          images,
          videos,
          errors: []
        })
      })
    })
  } catch (error: any) {
    return {
      exists: false,
      errors: [error.message]
    }
  }
}

/**
 * Analyze SSL/TLS certificate
 */
export async function analyzeSSLCertificate(hostname: string) {
  return new Promise<any>((resolve) => {
    const options = {
      host: hostname,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false
    }
    
    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate(true)
      const cipher = socket.getCipher()
      const protocol = socket.getProtocol()
      
      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy()
        resolve({
          valid: false,
          warnings: ['Could not retrieve certificate']
        })
        return
      }
      
      const now = new Date()
      const validFrom = new Date(cert.valid_from)
      const validTo = new Date(cert.valid_to)
      const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate grade
      let grade = 'A'
      if (daysUntilExpiry < 30) grade = 'B'
      if (daysUntilExpiry < 7) grade = 'C'
      if (protocol && protocol < 'TLSv1.2') grade = 'C'
      if (!cipher || cipher.name.includes('RC4')) grade = 'F'
      
      const chain: any[] = []
      let currentCert = cert
      while (currentCert.issuerCertificate && currentCert.issuerCertificate !== currentCert) {
        chain.push({
          issuer: currentCert.issuerCertificate.subject?.CN || 'Unknown',
          subject: currentCert.subject?.CN || 'Unknown',
          validFrom: currentCert.issuerCertificate.valid_from,
          validTo: currentCert.issuerCertificate.valid_to
        })
        currentCert = currentCert.issuerCertificate
      }
      
      const warnings: string[] = []
      if (daysUntilExpiry < 30) warnings.push('Certificate expires soon')
      if (protocol && protocol < 'TLSv1.2') warnings.push('Outdated TLS protocol')
      
      socket.destroy()
      
      resolve({
        valid: true,
        issuer: cert.issuer?.CN || 'Unknown',
        subject: cert.subject?.CN || hostname,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysUntilExpiry,
        serialNumber: cert.serialNumber || '',
        signatureAlgorithm: (cert as any).signatureAlgorithm || 'Unknown',
        keySize: cert.bits || 0,
        version: (cert as any).version || 0,
        subjectAltNames: cert.subjectaltname?.split(', ').map((s: string) => s.replace('DNS:', '')) || [],
        chain,
        cipherSuite: cipher?.name || 'Unknown',
        protocol: protocol || 'Unknown',
        grade,
        warnings
      })
    })
    
    socket.on('error', (error: any) => {
      resolve({
        valid: false,
        warnings: [error.message]
      })
    })
    
    socket.setTimeout(5000, () => {
      socket.destroy()
      resolve({
        valid: false,
        warnings: ['Connection timeout']
      })
    })
  })
}

/**
 * Calculate carbon footprint
 */
export function calculateCarbonFootprint(bytes: number) {
  // Based on https://www.websitecarbon.com methodology
  // Average energy per byte: 0.0000000018 kWh
  // Average CO2 per kWh: 475 grams
  
  const energyPerByte = 0.0000000018 // kWh
  const co2PerKwh = 475 // grams
  
  const energyPerVisit = bytes * energyPerByte
  const co2Grams = energyPerVisit * co2PerKwh
  
  // Rating based on percentile
  let rating = 'F'
  let cleaner = 0
  
  if (co2Grams < 0.095) { rating = 'A+'; cleaner = 95 }
  else if (co2Grams < 0.186) { rating = 'A'; cleaner = 85 }
  else if (co2Grams < 0.341) { rating = 'B'; cleaner = 70 }
  else if (co2Grams < 0.493) { rating = 'C'; cleaner = 50 }
  else if (co2Grams < 0.656) { rating = 'D'; cleaner = 30 }
  else if (co2Grams < 1.2) { rating = 'E'; cleaner = 10 }
  
  let comparison = 'Average'
  if (rating === 'A+' || rating === 'A') comparison = 'Excellent - Much cleaner than average'
  else if (rating === 'B') comparison = 'Good - Cleaner than average'
  else if (rating === 'C') comparison = 'Average'
  else if (rating === 'D') comparison = 'Below average'
  else comparison = 'Poor - Much worse than average'
  
  return {
    co2Grams: Math.round(co2Grams * 1000) / 1000,
    rating,
    cleaner,
    energyPerVisit: Math.round(energyPerVisit * 100000) / 100000,
    comparison
  }
}

/**
 * Analyze page weight and resource breakdown
 */
export function analyzePageWeight(
  html: string,
  scripts: string[],
  stylesheets: string[],
  images: string[]
) {
  const htmlSize = new TextEncoder().encode(html).length
  
  return {
    total: htmlSize, // Approximate, real size needs network data
    html: htmlSize,
    css: stylesheets.length * 50000, // Estimate 50KB per stylesheet
    javascript: scripts.length * 100000, // Estimate 100KB per script
    images: images.length * 200000, // Estimate 200KB per image
    fonts: 0,
    videos: 0,
    other: 0,
    requests: scripts.length + stylesheets.length + images.length + 1,
    largestResources: []
  }
}

/**
 * Generate social media previews
 */
export function generateSocialPreviews(seo: any) {
  return {
    facebook: {
      title: seo.ogTags['title'] || seo.title,
      description: seo.ogTags['description'] || seo.description,
      image: seo.ogTags['image'],
      type: seo.ogTags['type'] || 'website',
      url: seo.ogTags['url']
    },
    twitter: {
      title: seo.twitterTags['title'] || seo.title,
      description: seo.twitterTags['description'] || seo.description,
      image: seo.twitterTags['image'] || seo.ogTags['image'],
      card: seo.twitterTags['card'] || 'summary_large_image',
      site: seo.twitterTags['site']
    },
    linkedin: {
      title: seo.ogTags['title'] || seo.title,
      description: seo.ogTags['description'] || seo.description,
      image: seo.ogTags['image']
    }
  }
}

/**
 * Categorize third-party services
 */
export function categorizeThirdPartyServices(scripts: string[], html: string) {
  const services = {
    total: 0,
    analytics: [] as string[],
    advertising: [] as string[],
    socialMedia: [] as string[],
    contentDelivery: [] as string[],
    customerSupport: [] as string[],
    payments: [] as string[],
    other: [] as string[]
  }
  
  const allSources = [...scripts, html].join(' ').toLowerCase()
  
  // Analytics
  if (allSources.includes('google-analytics') || allSources.includes('gtag')) services.analytics.push('Google Analytics')
  if (allSources.includes('googletagmanager')) services.analytics.push('Google Tag Manager')
  if (allSources.includes('hotjar')) services.analytics.push('Hotjar')
  if (allSources.includes('mixpanel')) services.analytics.push('Mixpanel')
  if (allSources.includes('segment')) services.analytics.push('Segment')
  
  // Advertising
  if (allSources.includes('doubleclick') || allSources.includes('googlesyndication')) services.advertising.push('Google Ads')
  if (allSources.includes('facebook.net/en_us/fbevents')) services.advertising.push('Facebook Pixel')
  if (allSources.includes('adroll')) services.advertising.push('AdRoll')
  
  // Social Media
  if (allSources.includes('platform.twitter.com')) services.socialMedia.push('Twitter')
  if (allSources.includes('connect.facebook.net')) services.socialMedia.push('Facebook')
  if (allSources.includes('platform.linkedin.com')) services.socialMedia.push('LinkedIn')
  
  // CDN
  if (allSources.includes('cloudflare')) services.contentDelivery.push('Cloudflare')
  if (allSources.includes('akamai')) services.contentDelivery.push('Akamai')
  if (allSources.includes('fastly')) services.contentDelivery.push('Fastly')
  
  // Customer Support
  if (allSources.includes('intercom')) services.customerSupport.push('Intercom')
  if (allSources.includes('zendesk')) services.customerSupport.push('Zendesk')
  if (allSources.includes('drift')) services.customerSupport.push('Drift')
  
  // Payments
  if (allSources.includes('stripe')) services.payments.push('Stripe')
  if (allSources.includes('paypal')) services.payments.push('PayPal')
  if (allSources.includes('braintree')) services.payments.push('Braintree')
  
  services.total = services.analytics.length + services.advertising.length + 
                  services.socialMedia.length + services.contentDelivery.length +
                  services.customerSupport.length + services.payments.length
  
  return services
}
