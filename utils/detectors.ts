// Technology Detection Utilities
import * as cheerio from 'cheerio'

export function detectTechnologies($: cheerio.CheerioAPI, html: string, scripts: string[], stylesheets: string[]) {
  const htmlLower = html.toLowerCase()
  const scriptSources = scripts.join(' ').toLowerCase()
  const styleSources = stylesheets.join(' ').toLowerCase()

  const tech = {
    frameworks: [] as string[],
    libraries: [] as string[],
    cms: [] as string[],
    analytics: [] as string[],
    hosting: [] as string[],
    cdnProvider: undefined as string | undefined,
    cmsVersion: undefined as string | undefined,
    paymentGateways: [] as string[],
    chatWidgets: [] as string[],
    tagManagers: [] as string[],
    abTesting: [] as string[],
    fonts: [] as string[],
    mapServices: [] as string[],
    videoPlayers: [] as string[],
    ecommercePlatform: undefined as string | undefined,
    emailServices: [] as string[]
  }

  // Frameworks
  if (htmlLower.includes('react') || scriptSources.includes('react')) tech.frameworks.push('React')
  if (htmlLower.includes('vue') || scriptSources.includes('vue')) tech.frameworks.push('Vue.js')
  if (htmlLower.includes('angular') || scriptSources.includes('angular')) tech.frameworks.push('Angular')
  if (htmlLower.includes('next') || scriptSources.includes('_next')) tech.frameworks.push('Next.js')
  if (htmlLower.includes('nuxt') || scriptSources.includes('nuxt')) tech.frameworks.push('Nuxt.js')
  if (htmlLower.includes('svelte') || scriptSources.includes('svelte')) tech.frameworks.push('Svelte')
  if (htmlLower.includes('ember') || scriptSources.includes('ember')) tech.frameworks.push('Ember.js')
  if (htmlLower.includes('backbone') || scriptSources.includes('backbone')) tech.frameworks.push('Backbone.js')
  
  // Libraries
  if (htmlLower.includes('jquery') || scriptSources.includes('jquery')) tech.libraries.push('jQuery')
  if (htmlLower.includes('bootstrap') || styleSources.includes('bootstrap')) tech.libraries.push('Bootstrap')
  if (htmlLower.includes('tailwind') || styleSources.includes('tailwind')) tech.libraries.push('Tailwind CSS')
  if (scriptSources.includes('lodash')) tech.libraries.push('Lodash')
  if (scriptSources.includes('axios')) tech.libraries.push('Axios')
  if (scriptSources.includes('moment')) tech.libraries.push('Moment.js')
  if (scriptSources.includes('dayjs')) tech.libraries.push('Day.js')
  if (scriptSources.includes('chart')) tech.libraries.push('Chart.js')
  if (scriptSources.includes('d3')) tech.libraries.push('D3.js')
  if (scriptSources.includes('three')) tech.libraries.push('Three.js')

  // CMS
  if (htmlLower.includes('wordpress') || htmlLower.includes('wp-content')) {
    tech.cms.push('WordPress')
    const wpVersion = html.match(/wordpress\s*([\d.]+)/i)
    if (wpVersion) tech.cmsVersion = wpVersion[1]
  }
  if (htmlLower.includes('drupal')) tech.cms.push('Drupal')
  if (htmlLower.includes('joomla')) tech.cms.push('Joomla')
  if (htmlLower.includes('wix.com')) tech.cms.push('Wix')
  if (htmlLower.includes('squarespace')) tech.cms.push('Squarespace')
  if (htmlLower.includes('shopify')) {
    tech.cms.push('Shopify')
    tech.ecommercePlatform = 'Shopify'
  }
  if (htmlLower.includes('webflow')) tech.cms.push('Webflow')
  if (htmlLower.includes('contentful')) tech.cms.push('Contentful')
  if (htmlLower.includes('ghost')) tech.cms.push('Ghost')
  if (htmlLower.includes('strapi')) tech.cms.push('Strapi')

  // Analytics
  if (scriptSources.includes('google-analytics') || scriptSources.includes('gtag')) tech.analytics.push('Google Analytics')
  if (scriptSources.includes('googletagmanager')) tech.tagManagers.push('Google Tag Manager')
  if (scriptSources.includes('facebook.net/en_us/fbevents')) tech.analytics.push('Facebook Pixel')
  if (scriptSources.includes('hotjar')) tech.analytics.push('Hotjar')
  if (scriptSources.includes('mixpanel')) tech.analytics.push('Mixpanel')
  if (scriptSources.includes('segment')) {
    tech.analytics.push('Segment')
    tech.tagManagers.push('Segment')
  }
  if (scriptSources.includes('amplitude')) tech.analytics.push('Amplitude')
  if (scriptSources.includes('matomo') || scriptSources.includes('piwik')) tech.analytics.push('Matomo')
  if (scriptSources.includes('plausible')) tech.analytics.push('Plausible')
  if (scriptSources.includes('heap')) tech.analytics.push('Heap')
  if (scriptSources.includes('clarity.ms')) tech.analytics.push('Microsoft Clarity')

  // CDN Detection
  if (scriptSources.includes('cloudflare') || styleSources.includes('cloudflare')) tech.cdnProvider = 'Cloudflare'
  else if (scriptSources.includes('akamai')) tech.cdnProvider = 'Akamai'
  else if (scriptSources.includes('fastly')) tech.cdnProvider = 'Fastly'
  else if (scriptSources.includes('amazonaws.com/cloudfront')) tech.cdnProvider = 'AWS CloudFront'
  else if (scriptSources.includes('azureedge.net')) tech.cdnProvider = 'Azure CDN'
  else if (scriptSources.includes('jsdelivr')) tech.cdnProvider = 'jsDelivr'
  else if (scriptSources.includes('unpkg')) tech.cdnProvider = 'unpkg'
  else if (scriptSources.includes('cdnjs')) tech.cdnProvider = 'cdnjs'

  // Payment Gateways
  if (scriptSources.includes('stripe')) tech.paymentGateways.push('Stripe')
  if (scriptSources.includes('paypal')) tech.paymentGateways.push('PayPal')
  if (scriptSources.includes('square')) tech.paymentGateways.push('Square')
  if (scriptSources.includes('braintree')) tech.paymentGateways.push('Braintree')
  if (scriptSources.includes('authorize.net')) tech.paymentGateways.push('Authorize.net')
  if (scriptSources.includes('razorpay')) tech.paymentGateways.push('Razorpay')
  if (scriptSources.includes('mollie')) tech.paymentGateways.push('Mollie')

  // Chat Widgets
  if (scriptSources.includes('intercom')) tech.chatWidgets.push('Intercom')
  if (scriptSources.includes('drift')) tech.chatWidgets.push('Drift')
  if (scriptSources.includes('tawk.to')) tech.chatWidgets.push('Tawk.to')
  if (scriptSources.includes('zendesk')) tech.chatWidgets.push('Zendesk')
  if (scriptSources.includes('livechat')) tech.chatWidgets.push('LiveChat')
  if (scriptSources.includes('crisp')) tech.chatWidgets.push('Crisp')
  if (scriptSources.includes('freshchat') || scriptSources.includes('freshworks')) tech.chatWidgets.push('Freshchat')
  if (scriptSources.includes('messenger')) tech.chatWidgets.push('Facebook Messenger')

  // A/B Testing
  if (scriptSources.includes('optimizely')) tech.abTesting.push('Optimizely')
  if (scriptSources.includes('vwo')) tech.abTesting.push('VWO')
  if (scriptSources.includes('ab-tasty')) tech.abTesting.push('AB Tasty')
  if (scriptSources.includes('google-optimize')) tech.abTesting.push('Google Optimize')

  // Fonts
  if (styleSources.includes('fonts.googleapis') || scriptSources.includes('fonts.googleapis')) tech.fonts.push('Google Fonts')
  if (styleSources.includes('typekit') || scriptSources.includes('typekit')) tech.fonts.push('Adobe Fonts (Typekit)')
  if (styleSources.includes('fonts.com')) tech.fonts.push('Fonts.com')
  if (styleSources.includes('fontawesome')) tech.fonts.push('Font Awesome')

  // Map Services
  if (scriptSources.includes('maps.googleapis')) tech.mapServices.push('Google Maps')
  if (scriptSources.includes('mapbox')) tech.mapServices.push('Mapbox')
  if (scriptSources.includes('openstreetmap') || scriptSources.includes('leaflet')) tech.mapServices.push('OpenStreetMap')

  // Video Players
  if (scriptSources.includes('youtube') || htmlLower.includes('youtube.com/embed')) tech.videoPlayers.push('YouTube')
  if (scriptSources.includes('vimeo') || htmlLower.includes('player.vimeo')) tech.videoPlayers.push('Vimeo')
  if (scriptSources.includes('wistia')) tech.videoPlayers.push('Wistia')
  if (scriptSources.includes('jwplayer')) tech.videoPlayers.push('JW Player')
  if (scriptSources.includes('videojs') || scriptSources.includes('video-js')) tech.videoPlayers.push('Video.js')

  // Email Services
  if (scriptSources.includes('mailchimp')) tech.emailServices.push('Mailchimp')
  if (scriptSources.includes('sendgrid')) tech.emailServices.push('SendGrid')
  if (scriptSources.includes('mailgun')) tech.emailServices.push('Mailgun')
  if (scriptSources.includes('klaviyo')) tech.emailServices.push('Klaviyo')
  if (scriptSources.includes('convertkit')) tech.emailServices.push('ConvertKit')

  // E-commerce Platforms
  if (htmlLower.includes('woocommerce')) {
    tech.ecommercePlatform = 'WooCommerce'
    tech.cms.push('WooCommerce')
  }
  if (htmlLower.includes('magento')) tech.ecommercePlatform = 'Magento'
  if (htmlLower.includes('bigcommerce')) tech.ecommercePlatform = 'BigCommerce'
  if (htmlLower.includes('prestashop')) tech.ecommercePlatform = 'PrestaShop'

  return tech
}

export function detectSEO($: cheerio.CheerioAPI, html: string) {
  const seo = {
    title: $('title').text() || '',
    description: $('meta[name="description"]').attr('content') || '',
    keywords: [] as string[],
    canonicalUrl: $('link[rel="canonical"]').attr('href'),
    ogTags: {} as Record<string, string>,
    twitterTags: {} as Record<string, string>,
    structuredData: [] as any[],
    headings: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
    imageAltTags: 0,
    internalLinks: 0,
    externalLinks: 0,
    metaRobots: $('meta[name="robots"]').attr('content'),
    hreflang: {} as Record<string, string>,
    pagination: {} as { next?: string; prev?: string },
    breadcrumbs: false,
    schemaTypes: [] as string[],
    wordCount: 0,
    readingTime: 0,
    duplicateTitles: false,
    duplicateDescriptions: false
  }

  // Extract keywords
  const keywordsContent = $('meta[name="keywords"]').attr('content')
  if (keywordsContent) {
    seo.keywords = keywordsContent.split(',').map(k => k.trim()).filter(k => k)
  }

  // Open Graph tags
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property')
    const content = $(el).attr('content')
    if (property && content) {
      seo.ogTags[property] = content
    }
  })

  // Twitter Card tags
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name')
    const content = $(el).attr('content')
    if (name && content) {
      seo.twitterTags[name] = content
    }
  })

  // Structured Data (JSON-LD)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}')
      seo.structuredData.push(data)
      if (data['@type']) {
        seo.schemaTypes.push(data['@type'])
      }
      if (data['@type'] === 'BreadcrumbList') {
        seo.breadcrumbs = true
      }
    } catch (e) {}
  })

  // Headings count
  seo.headings.h1 = $('h1').length
  seo.headings.h2 = $('h2').length
  seo.headings.h3 = $('h3').length
  seo.headings.h4 = $('h4').length
  seo.headings.h5 = $('h5').length
  seo.headings.h6 = $('h6').length

  // Images with alt tags
  seo.imageAltTags = $('img[alt]').length

  // Hreflang
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const hreflang = $(el).attr('hreflang')
    const href = $(el).attr('href')
    if (hreflang && href) {
      seo.hreflang[hreflang] = href
    }
  })

  // Pagination
  const nextLink = $('link[rel="next"]').attr('href')
  const prevLink = $('link[rel="prev"]').attr('href')
  if (nextLink) seo.pagination.next = nextLink
  if (prevLink) seo.pagination.prev = prevLink

  // Word count and reading time
  const bodyText = $('body').text()
  const words = bodyText.trim().split(/\s+/).filter(w => w.length > 0)
  seo.wordCount = words.length
  seo.readingTime = Math.ceil(words.length / 200) // Assuming 200 words per minute

  return seo
}

export function detectAccessibility($: cheerio.CheerioAPI) {
  const accessibility = {
    hasAriaLabels: $('[aria-label]').length > 0,
    hasAltText: $('img[alt]').length > 0,
    colorContrast: 'Unknown',
    keyboardNavigable: $('[tabindex]').length > 0,
    wcag: {
      levelA: false,
      levelAA: false,
      levelAAA: false
    },
    formLabels: $('input, select, textarea').length === $('label').length,
    headingStructure: $('h1').length === 1,
    landmarkRoles: $('[role="main"], [role="navigation"], [role="banner"]').length >= 3,
    focusIndicators: true,
    skipLinks: $('a[href^="#"]').first().text().toLowerCase().includes('skip'),
    lang: $('html').attr('lang') !== undefined,
    touchTargets: {
      size: 'Medium',
      count: $('button, a, input[type="button"], input[type="submit"]').length
    }
  }

  // Basic WCAG compliance checks
  accessibility.wcag.levelA = accessibility.hasAltText && accessibility.lang
  accessibility.wcag.levelAA = accessibility.wcag.levelA && accessibility.formLabels
  accessibility.wcag.levelAAA = accessibility.wcag.levelAA && accessibility.landmarkRoles

  return accessibility
}

export function detectPrivacy($: cheerio.CheerioAPI, html: string, cookies: any[]) {
  const privacy = {
    hasCookieConsent: false,
    hasPrivacyPolicy: false,
    hasTermsOfService: false,
    gdprCompliant: false,
    cookies: cookies.length,
    cookieCategories: {
      essential: 0,
      analytics: 0,
      marketing: 0,
      preferences: 0
    },
    thirdPartyTrackers: [] as string[],
    dataProcessors: [] as string[],
    privacyShield: false,
    ccpaCompliant: false,
    privacyPolicyUrl: undefined as string | undefined,
    termsOfServiceUrl: undefined as string | undefined
  }

  const htmlLower = html.toLowerCase()
  const bodyText = $('body').text().toLowerCase()

  // Cookie consent
  privacy.hasCookieConsent = htmlLower.includes('cookie') && (
    htmlLower.includes('consent') || 
    htmlLower.includes('accept') || 
    htmlLower.includes('agree')
  )

  // Privacy policy
  $('a').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().toLowerCase()
    
    if (text.includes('privacy') && (text.includes('policy') || href.includes('privacy'))) {
      privacy.hasPrivacyPolicy = true
      privacy.privacyPolicyUrl = href
    }
    
    if (text.includes('terms') && (text.includes('service') || href.includes('terms'))) {
      privacy.hasTermsOfService = true
      privacy.termsOfServiceUrl = href
    }
  })

  // GDPR compliance indicators
  privacy.gdprCompliant = bodyText.includes('gdpr') || 
                          bodyText.includes('general data protection') ||
                          (privacy.hasCookieConsent && privacy.hasPrivacyPolicy)

  // CCPA compliance
  privacy.ccpaCompliant = bodyText.includes('ccpa') || 
                          bodyText.includes('california consumer privacy')

  // Categorize cookies (basic heuristic)
  cookies.forEach(cookie => {
    const nameLower = cookie.name.toLowerCase()
    if (nameLower.includes('session') || nameLower.includes('csrf')) {
      privacy.cookieCategories.essential++
    } else if (nameLower.includes('analytics') || nameLower.includes('_ga') || nameLower.includes('utm')) {
      privacy.cookieCategories.analytics++
    } else if (nameLower.includes('ad') || nameLower.includes('marketing') || nameLower.includes('fb')) {
      privacy.cookieCategories.marketing++
    } else {
      privacy.cookieCategories.preferences++
    }
  })

  // Detect third-party trackers
  const trackerDomains = ['google-analytics', 'facebook.net', 'doubleclick', 'hotjar', 'mixpanel']
  trackerDomains.forEach(domain => {
    if (htmlLower.includes(domain)) {
      privacy.thirdPartyTrackers.push(domain)
    }
  })

  return privacy
}

export function detectMobileAndPWA($: cheerio.CheerioAPI, html: string) {
  const mobile = {
    viewport: $('meta[name="viewport"]').attr('content'),
    mobileFriendly: false,
    touchOptimized: false,
    responsiveDesign: false,
  }

  const pwa = {
    hasManifest: $('link[rel="manifest"]').length > 0,
    hasServiceWorker: html.includes('serviceWorker') || html.includes('service-worker'),
    isInstallable: false,
    manifestData: undefined as any,
    offlineSupport: false
  }

  // Check for mobile-friendly indicators
  mobile.mobileFriendly = mobile.viewport !== undefined && 
                          mobile.viewport.includes('width=device-width')
  
  mobile.responsiveDesign = html.includes('@media') || 
                           html.includes('responsive') ||
                           mobile.mobileFriendly

  mobile.touchOptimized = html.includes('touch') || html.includes('ontouchstart')

  pwa.isInstallable = pwa.hasManifest && pwa.hasServiceWorker
  pwa.offlineSupport = pwa.hasServiceWorker

  return { mobile, pwa }
}

export function detectEcommerce($: cheerio.CheerioAPI, html: string) {
  const ecommerce = {
    isEcommerce: false,
    platform: undefined as string | undefined,
    productCount: 0,
    hasCart: false,
    paymentMethods: [] as string[],
    currency: undefined as string | undefined,
    hasProductSchema: false,
    hasReviews: false
  }

  const htmlLower = html.toLowerCase()
  const bodyText = $('body').text()

  // Detect e-commerce indicators
  ecommerce.hasCart = htmlLower.includes('add to cart') || 
                     htmlLower.includes('shopping cart') ||
                     htmlLower.includes('basket')

  ecommerce.hasReviews = htmlLower.includes('review') || 
                        htmlLower.includes('rating') ||
                        htmlLower.includes('★')

  // Detect products from schema
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}')
      if (data['@type'] === 'Product' || data['@type'] === 'ItemList') {
        ecommerce.hasProductSchema = true
        ecommerce.isEcommerce = true
        if (data['@type'] === 'ItemList' && data.numberOfItems) {
          ecommerce.productCount = data.numberOfItems
        }
      }
    } catch (e) {}
  })

  // Detect currency
  const currencyMatch = bodyText.match(/[$€£¥₹]/g)
  if (currencyMatch) {
    ecommerce.currency = currencyMatch[0]
    ecommerce.isEcommerce = true
  }

  // Estimate product count
  if (!ecommerce.productCount) {
    ecommerce.productCount = $('.product, [itemtype*="Product"]').length
  }

  if (ecommerce.hasCart || ecommerce.hasProductSchema || ecommerce.productCount > 0) {
    ecommerce.isEcommerce = true
  }

  return ecommerce
}
