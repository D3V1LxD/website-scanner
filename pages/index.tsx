import { useState } from 'react'
import Head from 'next/head'
import axios from 'axios'
import ScanResults from '@/components/ScanResults'

export interface ApiDetail {
  url: string
  method?: string
  parameters: {
    query: string[]
    path: string[]
    body?: string[]
  }
  headers?: Record<string, string>
}

export interface WebsiteOverview {
  technologies: {
    frameworks: string[]
    libraries: string[]
    cms: string[]
    analytics: string[]
    hosting: string[]
    serverInfo?: string
    cdnProvider?: string
    cmsVersion?: string
    paymentGateways?: string[]
    chatWidgets?: string[]
    tagManagers?: string[]
    abTesting?: string[]
    fonts?: string[]
    mapServices?: string[]
    videoPlayers?: string[]
    ecommercePlatform?: string
    emailServices?: string[]
  }
  security: {
    headers: Record<string, string>
    https: boolean
    certificates: string[]
    sslInfo?: {
      issuer: string
      validFrom: string
      validTo: string
      protocol: string
      daysUntilExpiry?: number
      grade?: string
    }
    vulnerabilities?: string[]
    securityScore?: number
    detailedHeaders?: {
      CSP?: string
      HSTS?: string
      xFrameOptions?: string
      xContentTypeOptions?: string
      referrerPolicy?: string
      permissionsPolicy?: string
    }
    mixedContent?: string[]
    subresourceIntegrity?: boolean
    corsConfiguration?: string
  }
  performance: {
    loadTime?: number
    resourceCount: {
      scripts: number
      styles: number
      images: number
      total: number
    }
    compression?: boolean
    minification?: {
      scripts: number
      styles: number
    }
    caching?: Record<string, string>
    performanceScore?: number
    coreWebVitals?: {
      LCP?: number // Largest Contentful Paint
      FID?: number // First Input Delay
      CLS?: number // Cumulative Layout Shift
      TTFB?: number // Time to First Byte
      TTI?: number // Time to Interactive
      FCP?: number // First Contentful Paint
    }
    recommendations?: {
      imageOptimization: string[]
      minificationOpportunities: string[]
      compressionSuggestions: string[]
      cachingImprovements: string[]
      renderBlockingResources: string[]
      unusedCSS: string[]
      unusedJS: string[]
    }
  }
  social: {
    links: Record<string, string>
    meta: Record<string, string>
  }
  structure: {
    hasRobotsTxt: boolean
    hasSitemap: boolean
    responsive: boolean
    language: string
  }
  seo?: {
    title: string
    description: string
    keywords: string[]
    canonicalUrl?: string
    ogTags: Record<string, string>
    twitterTags: Record<string, string>
    structuredData: any[]
    headings: {
      h1: number
      h2: number
      h3: number
      h4: number
      h5: number
      h6: number
    }
    imageAltTags: number
    internalLinks: number
    externalLinks: number
    seoScore?: number
    metaRobots?: string
    hreflang?: Record<string, string>
    pagination?: {
      next?: string
      prev?: string
    }
    breadcrumbs?: boolean
    schemaTypes?: string[]
    wordCount?: number
    readingTime?: number
    duplicateTitles?: boolean
    duplicateDescriptions?: boolean
  }
  contacts?: {
    emails: string[]
    phones: string[]
    addresses: string[]
    socialLinks: Record<string, string>
  }
  forms?: {
    total: number
    loginForms: number
    searchForms: number
    contactForms: number
    newsletterForms: number
  }
  dns?: {
    ipAddress: string
    nameServers: string[]
    mxRecords: string[]
    txtRecords?: string[]
    cnameRecords?: Record<string, string>
    aRecords?: string[]
    aaaaRecords?: string[]
    serverLocation?: string
    hostingProvider?: string
    domainAge?: string
    registrar?: string
    reverseDNS?: string
  }
  accessibility?: {
    hasAriaLabels: boolean
    hasAltText: boolean
    colorContrast: string
    keyboardNavigable: boolean
    accessibilityScore?: number
    wcag?: {
      levelA: boolean
      levelAA: boolean
      levelAAA: boolean
    }
    formLabels?: boolean
    headingStructure?: boolean
    landmarkRoles?: boolean
    focusIndicators?: boolean
    skipLinks?: boolean
    lang?: boolean
    touchTargets?: {
      size: string
      count: number
    }
  }
  privacy?: {
    hasCookieConsent: boolean
    hasPrivacyPolicy: boolean
    hasTermsOfService: boolean
    gdprCompliant: boolean
    cookies: number
    cookieCategories?: {
      essential: number
      analytics: number
      marketing: number
      preferences: number
    }
    thirdPartyTrackers?: string[]
    dataProcessors?: string[]
    privacyShield?: boolean
    ccpaCompliant?: boolean
    privacyPolicyUrl?: string
    termsOfServiceUrl?: string
  }
  media?: {
    videos: number
    audio: number
    iframes: number
    embeds: string[]
  }
  apis?: {
    hasGraphQL: boolean
    hasWebSocket: boolean
    hasREST: boolean
    swaggerUrl?: string
    apiDocumentation?: string
  }
  mobile?: {
    viewport?: string
    mobileFriendly: boolean
    touchOptimized: boolean
    responsiveDesign: boolean
    mobileScore?: number
  }
  pwa?: {
    hasManifest: boolean
    hasServiceWorker: boolean
    isInstallable: boolean
    manifestData?: any
    offlineSupport?: boolean
  }
  content?: {
    wordCount: number
    readingTime: number
    contentQuality?: number
    headingHierarchy: boolean
    internalLinkingScore?: number
    duplicateContent?: boolean
  }
  ecommerce?: {
    isEcommerce: boolean
    platform?: string
    productCount?: number
    hasCart: boolean
    paymentMethods?: string[]
    currency?: string
    hasProductSchema: boolean
    hasReviews: boolean
  }
  brokenLinks?: {
    internal404: string[]
    externalBroken: string[]
    redirectChains: Array<{ url: string; chain: string[] }>
    orphanedPages?: string[]
  }
  screenshots?: {
    desktop?: string // base64 or URL
    mobile?: string // base64 or URL
    fullPage?: string
    capturedAt?: string
  }
  lighthouse?: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
    pwa: number
    totalScore?: number
    metrics?: {
      firstContentfulPaint?: number
      largestContentfulPaint?: number
      totalBlockingTime?: number
      cumulativeLayoutShift?: number
      speedIndex?: number
    }
    opportunities?: Array<{
      title: string
      description: string
      savings: string
    }>
  }
  sslCertificate?: {
    valid: boolean
    issuer: string
    subject: string
    validFrom: string
    validTo: string
    daysUntilExpiry: number
    serialNumber: string
    signatureAlgorithm: string
    keySize: number
    version: number
    subjectAltNames?: string[]
    chain?: Array<{
      issuer: string
      subject: string
      validFrom: string
      validTo: string
    }>
    cipherSuite?: string
    protocol?: string
    grade?: string // A+, A, B, C, F
    warnings?: string[]
  }
  robotsTxt?: {
    exists: boolean
    content?: string
    rules?: Array<{
      userAgent: string
      allow: string[]
      disallow: string[]
    }>
    sitemaps?: string[]
    crawlDelay?: number
    errors?: string[]
  }
  sitemap?: {
    exists: boolean
    url?: string
    urlCount?: number
    lastModified?: string
    urls?: Array<{
      loc: string
      lastmod?: string
      changefreq?: string
      priority?: string
    }>
    images?: number
    videos?: number
    errors?: string[]
  }
  consoleErrors?: {
    errors: Array<{
      type: string // error, warning, info
      message: string
      source?: string
      lineNumber?: number
      timestamp: number
    }>
    errorCount: number
    warningCount: number
    networkErrors?: Array<{
      url: string
      status: number
      statusText: string
    }>
  }
  socialPreviews?: {
    facebook?: {
      title: string
      description: string
      image?: string
      type?: string
      url?: string
    }
    twitter?: {
      title: string
      description: string
      image?: string
      card?: string
      site?: string
    }
    linkedin?: {
      title: string
      description: string
      image?: string
    }
  }
  carbonFootprint?: {
    co2Grams: number
    rating: string // A+, A, B, C, D, E, F
    cleaner: number // percentage of tested sites
    energyPerVisit: number // kWh
    comparison: string
  }
  pageWeight?: {
    total: number // bytes
    html: number
    css: number
    javascript: number
    images: number
    fonts: number
    videos: number
    other: number
    uncompressed?: number
    compressed?: number
    requests: number
    largestResources?: Array<{
      url: string
      size: number
      type: string
    }>
  }
  thirdPartyServices?: {
    total: number
    analytics: string[]
    advertising: string[]
    socialMedia: string[]
    contentDelivery: string[]
    customerSupport: string[]
    payments: string[]
    other: string[]
  }
  whoisData?: {
    domainName?: string
    registrar?: string
    registrantName?: string
    registrantOrganization?: string
    registrantCountry?: string
    creationDate?: string
    expirationDate?: string
    updatedDate?: string
    domainAge?: number
    daysUntilExpiry?: number
    nameServers?: string[]
    status?: string[]
    emails?: string[]
    registrarUrl?: string
  }
  dnsRecords?: {
    a?: string[]
    aaaa?: string[]
    mx?: Array<{ priority: number; exchange: string }>
    txt?: string[]
    cname?: string[]
    ns?: string[]
    soa?: {
      mname: string
      rname: string
      serial: number
      refresh: number
      retry: number
      expire: number
      minimum: number
    }
    spf?: string
    dmarc?: string
    dnssec?: boolean
  }
  serverInfo?: {
    ipAddress?: string
    ipv6Address?: string
    hostname?: string
    isp?: string
    asn?: string
    continent?: string
    country?: string
    countryCode?: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
    timezone?: string
    serverSoftware?: string
    poweredBy?: string
    responseTime?: number
    uptime?: string
    cdnDetected?: boolean
    cdnProvider?: string
  }
  securityHeaders?: {
    score: number
    grade: string
    headers: {
      strictTransportSecurity?: { present: boolean; value?: string; maxAge?: number; includeSubDomains?: boolean; preload?: boolean }
      contentSecurityPolicy?: { present: boolean; value?: string; directives?: string[] }
      xFrameOptions?: { present: boolean; value?: string }
      xContentTypeOptions?: { present: boolean; value?: string }
      referrerPolicy?: { present: boolean; value?: string }
      permissionsPolicy?: { present: boolean; value?: string }
      xXssProtection?: { present: boolean; value?: string }
      expectCt?: { present: boolean; value?: string }
    }
    missingHeaders: string[]
    warnings: string[]
    recommendations: string[]
  }
  contactInfo?: {
    emails: string[]
    phones: string[]
    addresses: string[]
    contactForms: Array<{ url: string; method: string; fields: string[] }>
    socialMediaLinks: Array<{ platform: string; url: string }>
  }
  socialMedia?: {
    platforms: Array<{
      name: string
      url: string
      handle?: string
      verified?: boolean
    }>
    totalPlatforms: number
    hasOfficialLinks: boolean
  }
  structuredData?: {
    hasStructuredData: boolean
    types: string[]
    schemas: Array<{
      type: string
      data: any
    }>
    validationErrors?: string[]
    richSnippetsEligible: boolean
  }
  i18n?: {
    primaryLanguage?: string
    detectedLanguages: string[]
    hasHreflang: boolean
    hreflangTags: Array<{ lang: string; url: string }>
    hasTranslations: boolean
    rtlSupport: boolean
  }
  externalLinks?: {
    total: number
    domains: string[]
    categorized: {
      social: string[]
      cdn: string[]
      analytics: string[]
      advertising: string[]
      affiliate: string[]
      sponsored: string[]
      other: string[]
    }
    followedLinks: number
    nofollowLinks: number
  }
  internalLinks?: {
    total: number
    unique: number
    maxDepth: number
    orphanPages: string[]
    brokenInternal: string[]
    redirectChains: Array<{ from: string; to: string; hops: number }>
  }
  uptime?: {
    isOnline: boolean
    responseCode: number
    responseTime: number
    lastChecked: string
    historicalData?: {
      waybackAvailable: boolean
      firstSnapshot?: string
      lastSnapshot?: string
      totalSnapshots?: number
      archiveUrl?: string
    }
  }
  enhancedTechStack?: {
    backend?: {
      language?: string
      framework?: string
      detectedFrom: string[]
    }
    database?: {
      type?: string
      evidence: string[]
    }
    server?: {
      software?: string
      version?: string
      os?: string
    }
    security?: {
      waf?: string
      ddosProtection?: string
      ssl?: string
    }
    marketing?: {
      analytics: string[]
      tagManager: string[]
      advertising: string[]
      email: string[]
    }
  }
}

export interface ScanResult {
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
  apiDetails?: ApiDetail[]
  backendUrlDetails?: ApiDetail[]
  overview?: WebsiteOverview
  brokenLinks?: string[]
  redirects?: Array<{ from: string; to: string; status: number }>
  cookies?: Array<{ name: string; value: string; domain: string; secure: boolean }>
  localStorage?: Record<string, string>
  console?: string[]
  statusCode?: number
  responseTime?: number
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [scanMode, setScanMode] = useState<'basic' | 'advanced'>('basic')
  const [deepScan, setDeepScan] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [advancedOptions, setAdvancedOptions] = useState({
    checkBrokenLinks: false,
    extractContacts: false,
    analyzeSEO: false,
    detectForms: false,
    checkAccessibility: false,
    analyzeSecurity: false
  })

  const handleScan = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const endpoint = scanMode === 'advanced' ? '/api/advanced-scan' : '/api/scan'
      const response = await axios.post(endpoint, { 
        url, 
        deepScan,
        ...advancedOptions
      })
      setResult(response.data)
      
      // Add to scan history
      setScanHistory(prev => [response.data, ...prev].slice(0, 10))
    } catch (err: any) {
      const status = err.response?.status
      let errorMessage = err.response?.data?.error || 'Failed to scan website'
      
      // Add helpful suggestions based on error type
      if (status === 403) {
        errorMessage += '\n\nTip: Try using Advanced Scan mode for better success with protected websites.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Website Scanner - Clone & Analyze Websites</title>
        <meta name="description" content="Scan any website to discover APIs, backend URLs, and clone the content" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center mb-8">
              <img src="/icon.png" alt="Website Scanner Logo" className="w-20 h-20 rounded-lg shadow" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Website Scanner
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional website analysis and API discovery tool
            </p>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Recent Scans
                </h3>
                <div className="space-y-2">
                  {scanHistory.slice(0, 5).map((scan, index) => (
                    <div 
                      key={index}
                      onClick={() => setResult(scan)}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{scan.metadata.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500 truncate">{scan.url}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {scan.apis.length} APIs
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setScanHistory(prev => prev.filter((_, i) => i !== index))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scan Form */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
              <label htmlFor="url" className="block text-sm font-semibold text-gray-900 mb-3">
                Website URL
              </label>
              
              {/* Scan Mode Toggle */}
              <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setScanMode('basic')}
                  className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
                    scanMode === 'basic'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={loading}
                >
                  Basic Scan
                  <span className="block text-xs font-normal mt-1 text-gray-500">Fast analysis</span>
                </button>
                <button
                  onClick={() => setScanMode('advanced')}
                  className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
                    scanMode === 'advanced'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={loading}
                >
                  Advanced Scan
                  <span className="block text-xs font-normal mt-1 text-gray-500">Browser rendering</span>
                </button>
              </div>
              
              <div className="flex gap-3">
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 text-gray-900"
                  disabled={loading}
                />
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </span>
                  ) : (
                    'Scan'
                  )}
                </button>
              </div>
              
              {/* Deep Scan Option */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="deepScan"
                    checked={deepScan}
                    onChange={(e) => setDeepScan(e.target.checked)}
                    className="w-4 h-4 text-gray-900 bg-white border-gray-300 rounded focus:ring-gray-900 focus:ring-1 mt-0.5"
                    disabled={loading}
                  />
                  <label htmlFor="deepScan" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Deep scan</span>
                    <span className="block text-gray-500 mt-1">Analyze all discovered links and extract detailed API information</span>
                  </label>
                </div>
              </div>
              
              {/* Advanced Analysis Options */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Advanced Options
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={advancedOptions.checkBrokenLinks}
                      onChange={(e) => setAdvancedOptions({...advancedOptions, checkBrokenLinks: e.target.checked})}
                      className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <span className="text-gray-700">Broken links</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={advancedOptions.extractContacts}
                      onChange={(e) => setAdvancedOptions({...advancedOptions, extractContacts: e.target.checked})}
                      className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <span className="text-gray-700">Contacts</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={advancedOptions.analyzeSEO}
                      onChange={(e) => setAdvancedOptions({...advancedOptions, analyzeSEO: e.target.checked})}
                      className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <span className="text-gray-700">SEO analysis</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={advancedOptions.detectForms}
                      onChange={(e) => setAdvancedOptions({...advancedOptions, detectForms: e.target.checked})}
                      className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <span className="text-gray-700">Forms</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={advancedOptions.checkAccessibility}
                      onChange={(e) => setAdvancedOptions({...advancedOptions, checkAccessibility: e.target.checked})}
                      className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <span className="text-gray-700">Accessibility</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={advancedOptions.analyzeSecurity}
                      onChange={(e) => setAdvancedOptions({...advancedOptions, analyzeSecurity: e.target.checked})}
                      className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <span className="text-gray-700">Security</span>
                  </label>
                </div>
              </div>
              
              {/* Info about scan modes */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                {scanMode === 'basic' ? (
                  <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">Basic:</span> Fast HTTP analysis for static websites</p>
                ) : (
                  <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">Advanced:</span> Full browser rendering for JavaScript-heavy sites</p>
                )}
              </div>
              
              {/* Example URLs */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Example sites:</p>
                <div className="flex flex-wrap gap-2">
                  {['https://github.com', 'https://itsmahim.me', 'https://thedailywanted.qzz.io'].map((exampleUrl) => (
                    <button
                      key={exampleUrl}
                      onClick={() => setUrl(exampleUrl)}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:border-gray-400 transition-colors"
                      disabled={loading}
                    >
                      {exampleUrl.replace('https://', '')}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-700 font-semibold mb-1">Scan Failed</p>
                      <p className="text-red-600 text-sm whitespace-pre-wrap">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {result && <ScanResults result={result} />}
        </div>
      </main>
    </>
  )
}
