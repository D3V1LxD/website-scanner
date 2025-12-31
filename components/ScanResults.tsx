import { useState } from 'react'
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

interface Props {
  result: ScanResult
}

export default function ScanResults({ result }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'screenshots' | 'technologies' | 'performance' | 'apis' | 'backend' | 'seo' | 'accessibility' | 'privacy' | 'ssl' | 'robots' | 'console' | 'social' | 'carbon' | 'pageweight' | 'thirdparty' | 'mobile' | 'ecommerce' | 'content' | 'contacts' | 'forms' | 'resources' | 'preview' | 'domain' | 'dns' | 'server' | 'security' | 'sociallinks' | 'schema' | 'languages' | 'externallinks' | 'internallinks' | 'uptime' | 'techstack'>('overview')
  const [showHtml, setShowHtml] = useState(false)
  const [previewMode, setPreviewMode] = useState<'static' | 'live'>('live')
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(result.url)
  const [iframeKey, setIframeKey] = useState(0)
  const [proxyError, setProxyError] = useState(false)

  const tabs = [
    { id: 'overview' as const, label: 'Overview', count: 0 },
    { id: 'screenshots' as const, label: 'Screenshots', count: result.overview?.screenshots ? 1 : 0 },
    { id: 'technologies' as const, label: 'Technologies', count: result.overview?.technologies ? 1 : 0 },
    { id: 'performance' as const, label: 'Performance', count: result.overview?.performance ? 1 : 0 },
    { id: 'apis' as const, label: 'API Endpoints', count: result.apis.length },
    { id: 'backend' as const, label: 'Backend URLs', count: result.backendUrls.length },
    { id: 'seo' as const, label: 'SEO', count: result.overview?.seo ? 1 : 0 },
    { id: 'accessibility' as const, label: 'Accessibility', count: result.overview?.accessibility ? 1 : 0 },
    { id: 'privacy' as const, label: 'Privacy', count: result.overview?.privacy?.cookies || 0 },
    { id: 'ssl' as const, label: 'SSL Certificate', count: result.overview?.sslCertificate ? 1 : 0 },
    { id: 'robots' as const, label: 'Robots & Sitemap', count: result.overview?.robotsTxt || result.overview?.sitemap ? 1 : 0 },
    { id: 'console' as const, label: 'Console', count: result.overview?.consoleErrors?.errorCount || 0 },
    { id: 'social' as const, label: 'Social Preview', count: result.overview?.socialPreviews ? 1 : 0 },
    { id: 'carbon' as const, label: 'Carbon Footprint', count: result.overview?.carbonFootprint ? 1 : 0 },
    { id: 'pageweight' as const, label: 'Page Weight', count: result.overview?.pageWeight ? 1 : 0 },
    { id: 'thirdparty' as const, label: 'Third-Party', count: result.overview?.thirdPartyServices?.total || 0 },
    { id: 'domain' as const, label: 'Domain Info', count: result.overview?.whoisData ? 1 : 0 },
    { id: 'dns' as const, label: 'DNS Records', count: result.overview?.dnsRecords ? 1 : 0 },
    { id: 'server' as const, label: 'Server Info', count: result.overview?.serverInfo ? 1 : 0 },
    { id: 'security' as const, label: 'Security Headers', count: result.overview?.securityHeaders ? 1 : 0 },
    { id: 'sociallinks' as const, label: 'Social Media', count: result.overview?.socialMedia?.totalPlatforms || 0 },
    { id: 'schema' as const, label: 'Structured Data', count: result.overview?.structuredData?.types.length || 0 },
    { id: 'languages' as const, label: 'Languages', count: result.overview?.i18n?.detectedLanguages.length || 0 },
    { id: 'externallinks' as const, label: 'External Links', count: result.overview?.externalLinks?.total || 0 },
    { id: 'internallinks' as const, label: 'Internal Links', count: result.overview?.internalLinks?.total || 0 },
    { id: 'uptime' as const, label: 'Uptime', count: result.overview?.uptime ? 1 : 0 },
    { id: 'techstack' as const, label: 'Tech Stack', count: result.overview?.enhancedTechStack ? 1 : 0 },
    { id: 'mobile' as const, label: 'Mobile & PWA', count: result.overview?.mobile || result.overview?.pwa ? 1 : 0 },
    { id: 'ecommerce' as const, label: 'E-commerce', count: result.overview?.ecommerce?.isEcommerce ? 1 : 0 },
    { id: 'content' as const, label: 'Content', count: result.overview?.content ? 1 : 0 },
    { id: 'contacts' as const, label: 'Contacts', count: result.overview?.contacts ? (result.overview.contacts.emails.length + result.overview.contacts.phones.length) : 0 },
    { id: 'forms' as const, label: 'Forms', count: result.overview?.forms?.total || 0 },
    { id: 'resources' as const, label: 'Resources', count: result.scripts.length + result.stylesheets.length },
    { id: 'preview' as const, label: 'Preview', count: 0 }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1)
    setProxyError(false)
  }

  const openInNewTab = () => {
    window.open(currentPreviewUrl, '_blank')
  }

  const switchToStaticMode = () => {
    setPreviewMode('static')
    setProxyError(false)
  }

  const downloadHtml = () => {
    const blob = new Blob([result.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cloned-website.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadJson = () => {
    const data = {
      url: result.url,
      metadata: result.metadata,
      apis: result.apis,
      backendUrls: result.backendUrls,
      scripts: result.scripts,
      stylesheets: result.stylesheets,
      images: result.images,
      links: result.links,
      overview: result.overview,
      brokenLinks: result.brokenLinks,
      cookies: result.cookies
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scan-results.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    const csvRows = [
      ['Type', 'URL', 'Method', 'Parameters'],
      ...result.apis.map(api => ['API', api, 'GET', '']),
      ...result.backendUrls.map(url => ['Backend', url, '', '']),
      ...result.scripts.map(script => ['Script', script, '', '']),
      ...result.stylesheets.map(css => ['Stylesheet', css, '', ''])
    ]
    
    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scan-results.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Website Scan Report - ${result.metadata.title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #4f46e5; margin-top: 30px; }
          .section { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .badge { background: #dbeafe; color: #1e40af; padding: 5px 10px; border-radius: 5px; margin: 2px; display: inline-block; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          .score { font-size: 48px; font-weight: bold; color: #10b981; }
        </style>
      </head>
      <body>
        <h1>🔍 Website Scan Report</h1>
        <div class="section">
          <h2>Website Information</h2>
          <p><strong>URL:</strong> ${result.url}</p>
          <p><strong>Title:</strong> ${result.metadata.title}</p>
          <p><strong>Description:</strong> ${result.metadata.description}</p>
          <p><strong>Scan Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <h2>📊 Statistics</h2>
          <p><strong>API Endpoints:</strong> ${result.apis.length}</p>
          <p><strong>Backend URLs:</strong> ${result.backendUrls.length}</p>
          <p><strong>Scripts:</strong> ${result.scripts.length}</p>
          <p><strong>Stylesheets:</strong> ${result.stylesheets.length}</p>
          <p><strong>Images:</strong> ${result.images.length}</p>
          <p><strong>Links:</strong> ${result.links.length}</p>
        </div>

        ${result.overview?.seo ? `
        <div class="section">
          <h2>🎯 SEO Analysis</h2>
          ${result.overview.seo.seoScore ? `<p class="score">${result.overview.seo.seoScore}/100</p>` : ''}
          <p><strong>H1 Tags:</strong> ${result.overview.seo.headings.h1}</p>
          <p><strong>H2 Tags:</strong> ${result.overview.seo.headings.h2}</p>
          <p><strong>Internal Links:</strong> ${result.overview.seo.internalLinks}</p>
          <p><strong>External Links:</strong> ${result.overview.seo.externalLinks}</p>
        </div>
        ` : ''}

        ${result.apis.length > 0 ? `
        <div class="section">
          <h2>🔌 API Endpoints</h2>
          <table>
            <tr><th>Method</th><th>URL</th></tr>
            ${result.apiDetails?.map(api => `<tr><td>${api.method}</td><td>${api.url}</td></tr>`).join('') || ''}
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2>Generated by Website Scanner Pro</h2>
          <p>Advanced website analysis tool</p>
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scan-report.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Metadata Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{result.metadata.title || 'Untitled'}</h2>
            <p className="text-gray-600 mb-3">{result.metadata.description || 'No description available'}</p>
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              {result.url}
            </a>
          </div>
          <div className="flex flex-wrap gap-2 ml-6">
            <button
              onClick={downloadHtml}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              HTML
            </button>
            <button
              onClick={downloadJson}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              JSON
            </button>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              CSV
            </button>
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{result.apis.length}</div>
            <div className="text-sm text-gray-600 mt-1">API Endpoints</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{result.backendUrls.length}</div>
            <div className="text-sm text-gray-600 mt-1">Backend URLs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{result.scripts.length}</div>
            <div className="text-sm text-gray-600 mt-1">Scripts</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{result.stylesheets.length}</div>
            <div className="text-sm text-gray-600 mt-1">Stylesheets</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && result.overview && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Website Overview</h3>
              
              {/* Technologies Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">
                  Technologies Detected
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.overview.technologies.frameworks.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Frameworks:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.overview.technologies.frameworks.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-900 text-sm rounded border border-gray-200 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.overview.technologies.libraries.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Libraries:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.overview.technologies.libraries.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-900 text-sm rounded border border-gray-200 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.overview.technologies.cms.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">CMS:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.overview.technologies.cms.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-900 text-sm rounded border border-gray-200 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.overview.technologies.analytics.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Analytics:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.overview.technologies.analytics.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-900 text-sm rounded border border-gray-200 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">
                  Security Analysis
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-900">HTTPS Encryption:</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.security.https 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.security.https ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {Object.keys(result.overview.security.headers).length > 0 && (
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-900 block mb-2">Security Headers:</span>
                      <div className="bg-white rounded p-3 space-y-1 max-h-48 overflow-y-auto border border-gray-200">
                        {Object.entries(result.overview.security.headers).map(([key, value], i) => (
                          <div key={i} className="text-xs border-b border-gray-100 pb-1 last:border-0">
                            <span className="font-semibold text-gray-900">{key}:</span>{' '}
                            <span className="text-gray-600">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.scripts}</div>
                    <div className="text-sm text-gray-600 mt-2">Scripts</div>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.styles}</div>
                    <div className="text-sm text-gray-600 mt-2">Stylesheets</div>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.images}</div>
                    <div className="text-sm text-gray-600 mt-2">Images</div>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.total}</div>
                    <div className="text-sm text-gray-600 mt-2">Total Resources</div>
                  </div>
                </div>
                {result.overview.performance.loadTime && (
                  <div className="mt-4 p-4 bg-gray-50 rounded text-center border border-gray-200">
                    <span className="text-sm text-gray-600 block mb-1">Page Load Time</span>
                    <span className="text-3xl font-bold text-gray-900">{result.overview.performance.loadTime}</span>
                    <span className="text-lg font-medium text-gray-600 ml-1">ms</span>
                  </div>
                )}
              </div>

              {/* Structure Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">
                  Website Structure
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <span className="text-2xl block mb-2">{result.overview.structure.hasRobotsTxt ? '✓' : '×'}</span>
                    <span className="text-sm text-gray-700 font-medium">robots.txt</span>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <span className="text-2xl block mb-2">{result.overview.structure.hasSitemap ? '✓' : '×'}</span>
                    <span className="text-sm text-gray-700 font-medium">sitemap.xml</span>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <span className="text-2xl block mb-2">{result.overview.structure.responsive ? '✓' : '×'}</span>
                    <span className="text-sm text-gray-700 font-medium">Responsive</span>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-center border border-gray-200">
                    <span className="text-sm font-bold text-gray-900 block">{result.overview.structure.language || 'N/A'}</span>
                    <div className="text-xs text-gray-600 mt-1">Language</div>
                  </div>
                </div>
              </div>

              {/* Social Section */}
              {(Object.keys(result.overview.social.links).length > 0 || Object.keys(result.overview.social.meta).length > 0) && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    Social Media & SEO
                  </h4>
                  {Object.keys(result.overview.social.links).length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700 block mb-2">Social Profiles:</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.overview.social.links).map(([platform, url], i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded font-medium hover:bg-gray-800 transition-colors"
                          >
                            {platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(result.overview.social.meta).length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-2">Open Graph Metadata:</span>
                      <div className="bg-gray-50 rounded p-3 space-y-2 max-h-40 overflow-y-auto border border-gray-200">
                        {Object.entries(result.overview.social.meta).map(([key, value], i) => (
                          <div key={i} className="text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold text-gray-900">{key}:</span>{' '}
                            <span className="text-gray-600">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* API Endpoints Tab */}
          {activeTab === 'apis' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">API Endpoints</h3>
              {result.apis.length > 0 ? (
                <div className="space-y-3">
                  {result.apiDetails && result.apiDetails.length > 0 ? (
                    // Detailed view with parameters
                    result.apiDetails.map((apiDetail, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`px-3 py-1 text-xs font-semibold rounded ${
                              apiDetail.method === 'GET' ? 'bg-gray-900 text-white' :
                              apiDetail.method === 'POST' ? 'bg-gray-700 text-white' :
                              apiDetail.method === 'PUT' ? 'bg-gray-600 text-white' :
                              apiDetail.method === 'DELETE' ? 'bg-gray-800 text-white' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                              {apiDetail.method}
                            </span>
                            <code className="text-sm text-gray-800 break-all flex-1">{apiDetail.url}</code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(apiDetail.url)}
                            className="ml-4 px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors flex-shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                        
                        {/* Parameters */}
                        {(apiDetail.parameters.query.length > 0 || apiDetail.parameters.path.length > 0) && (
                          <div className="mt-4 space-y-3 bg-white rounded-xl p-4 border border-gray-200">
                            {apiDetail.parameters.query.length > 0 && (
                              <div>
                                <span className="text-sm font-bold text-gray-800 block mb-2">🔍 Query Parameters:</span>
                                <div className="flex flex-wrap gap-2">
                                  {apiDetail.parameters.query.map((param, i) => (
                                    <span key={i} className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm rounded-lg font-semibold shadow-sm">
                                      {param}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {apiDetail.parameters.path.length > 0 && (
                              <div>
                                <span className="text-sm font-bold text-gray-800 block mb-2">📏 Path Parameters:</span>
                                <div className="flex flex-wrap gap-2">
                                  {apiDetail.parameters.path.map((param, i) => (
                                    <span key={i} className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm rounded-lg font-semibold shadow-sm">
                                      {param}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    // Simple view without parameters
                    result.apis.map((api, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:bg-gray-100 transition-colors">
                        <code className="text-sm text-gray-800 break-all flex-1">{api}</code>
                        <button
                          onClick={() => copyToClipboard(api)}
                          className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg">No API endpoints detected</p>
                  <p className="text-sm mt-2">Try scanning a more dynamic website</p>
                </div>
              )}
            </div>
          )}

          {/* Backend URLs Tab */}
          {activeTab === 'backend' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Backend URLs</h3>
              {result.backendUrls.length > 0 ? (
                <div className="space-y-3">
                  {result.backendUrlDetails && result.backendUrlDetails.length > 0 ? (
                    // Detailed view with parameters
                    result.backendUrlDetails.map((urlDetail, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              urlDetail.method === 'GET' ? 'bg-gray-900 text-white' :
                              urlDetail.method === 'POST' ? 'bg-gray-700 text-white' :
                              urlDetail.method === 'PUT' ? 'bg-gray-600 text-white' :
                              urlDetail.method === 'DELETE' ? 'bg-gray-800 text-white' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                              {urlDetail.method}
                            </span>
                            <code className="text-sm text-gray-800 break-all flex-1">{urlDetail.url}</code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(urlDetail.url)}
                            className="ml-4 px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors flex-shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                        
                        {/* Parameters */}
                        {(urlDetail.parameters.query.length > 0 || urlDetail.parameters.path.length > 0) && (
                          <div className="mt-3 space-y-2">
                            {urlDetail.parameters.query.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-gray-600">Query Parameters:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {urlDetail.parameters.query.map((param, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-900 text-xs rounded border border-gray-200">
                                      {param}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {urlDetail.parameters.path.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-gray-600">Path Parameters:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {urlDetail.parameters.path.map((param, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-900 text-xs rounded border border-gray-200">
                                      {param}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    // Simple view without parameters
                    result.backendUrls.map((url, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:bg-gray-100 transition-colors">
                        <code className="text-sm text-gray-800 break-all flex-1">{url}</code>
                        <button
                          onClick={() => copyToClipboard(url)}
                          className="ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <p className="text-lg">No backend URLs detected</p>
                </div>
              )}
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && result.overview?.seo && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">SEO Analysis</h3>
                {result.overview.seo.seoScore && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.seo.seoScore}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Heading Structure
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">H1 Tags:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.headings.h1}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">H2 Tags:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.headings.h2}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">H3 Tags:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.headings.h3}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">H4 Tags:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.headings.h4}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Link Analysis
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Internal Links:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.internalLinks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">External Links:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.externalLinks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Images with Alt:</span>
                      <span className="font-semibold text-gray-900">{result.overview.seo.imageAltTags}</span>
                    </div>
                  </div>
                </div>

                {result.overview.seo.keywords.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Meta Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.seo.keywords.map((keyword, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white rounded text-sm font-medium">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && result.overview?.contacts && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-pink-900 bg-clip-text text-transparent">Contact Information</h3>
                  <p className="text-sm text-gray-600 mt-1">Extracted emails, phones, and addresses</p>
                </div>
              </div>

              <div className="space-y-6">
                {result.overview.contacts.emails.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📧</span>
                      Email Addresses ({result.overview.contacts.emails.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.overview.contacts.emails.map((email, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
                          <code className="text-sm text-gray-800">{email}</code>
                          <button
                            onClick={() => copyToClipboard(email)}
                            className="ml-3 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 font-semibold"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.contacts.phones.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📞</span>
                      Phone Numbers ({result.overview.contacts.phones.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.overview.contacts.phones.map((phone, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
                          <code className="text-sm text-gray-800">{phone}</code>
                          <button
                            onClick={() => copyToClipboard(phone)}
                            className="ml-3 px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 font-semibold"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.contacts.addresses.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📍</span>
                      Addresses ({result.overview.contacts.addresses.length})
                    </h4>
                    <div className="space-y-3">
                      {result.overview.contacts.addresses.map((address, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                          <p className="text-sm text-gray-800">{address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forms Tab */}
          {activeTab === 'forms' && result.overview?.forms && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Forms Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.forms.total}</div>
                  <div className="text-sm text-gray-600 mt-2">Total Forms</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.forms.loginForms}</div>
                  <div className="text-sm text-gray-600 mt-2">Login Forms</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.forms.searchForms}</div>
                  <div className="text-sm text-gray-600 mt-2">Search Forms</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.forms.contactForms}</div>
                  <div className="text-sm text-gray-600 mt-2">Contact Forms</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.forms.newsletterForms}</div>
                  <div className="text-sm text-gray-600 mt-2">Newsletter Forms</div>
                </div>
              </div>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && result.overview?.accessibility && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Accessibility Check</h3>
                {result.overview.accessibility.accessibilityScore && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.accessibility.accessibilityScore}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">ARIA Labels</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.accessibility.hasAriaLabels ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.accessibility.hasAriaLabels ? 'Present' : 'Missing'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Alt Text</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.accessibility.hasAltText ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.accessibility.hasAltText ? 'Present' : 'Missing'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Keyboard Navigation</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.accessibility.keyboardNavigable ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.accessibility.keyboardNavigable ? 'Supported' : 'Limited'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Color Contrast</span>
                    <span className="px-3 py-1 bg-gray-900 text-white rounded text-sm font-semibold">
                      {result.overview.accessibility.colorContrast}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && result.overview?.privacy && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Cookie Consent</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.privacy.hasCookieConsent ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.privacy.hasCookieConsent ? 'Present' : 'Missing'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Privacy Policy</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.privacy.hasPrivacyPolicy ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.privacy.hasPrivacyPolicy ? 'Found' : 'Not Found'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Terms of Service</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.privacy.hasTermsOfService ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.privacy.hasTermsOfService ? 'Found' : 'Not Found'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">GDPR Compliant</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.overview.privacy.gdprCompliant ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.overview.privacy.gdprCompliant ? 'Compliant' : 'Check Required'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Cookies Detected: {result.overview.privacy.cookies}
                </h4>
                {result.cookies && result.cookies.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {result.cookies.map((cookie, i) => (
                      <div key={i} className="bg-gray-50 rounded p-3 border border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Name:</span>
                            <p className="text-gray-600 break-all">{cookie.name}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Domain:</span>
                            <p className="text-gray-600 break-all">{cookie.domain}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Secure:</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              cookie.secure ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {cookie.secure ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Value:</span>
                            <p className="text-gray-600 break-all truncate">{cookie.value.substring(0, 20)}...</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              {/* Scripts */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Scripts ({result.scripts.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.scripts.map((script, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <code className="text-xs text-gray-700 break-all">{script}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stylesheets */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Stylesheets ({result.stylesheets.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.stylesheets.map((css, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <code className="text-xs text-gray-700 break-all">{css}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              {result.images.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Images ({result.images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {result.images.map((img, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2 border border-gray-200">
                        <img src={img} alt="" className="w-full h-32 object-cover rounded mb-2" onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }} />
                        <code className="text-xs text-gray-600 break-all block">{img}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Tab */}
          {/* Technologies Tab */}
          {activeTab === 'technologies' && result.overview?.technologies && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Technology Stack</h3>
              
              {/* All Technologies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.overview.technologies.frameworks.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Frameworks & Libraries</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.frameworks.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.technologies.cms.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Content Management</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.cms.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.technologies.analytics.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Analytics & Tracking</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.analytics.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.technologies.cdnProvider && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">CDN Provider</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                        {result.overview.technologies.cdnProvider}
                      </span>
                    </div>
                  </div>
                )}

                {result.overview.technologies.paymentGateways && result.overview.technologies.paymentGateways.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Payment Gateways</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.paymentGateways.map((tech: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.technologies.chatWidgets && result.overview.technologies.chatWidgets.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Chat Widgets</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.chatWidgets.map((tech: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.technologies.fonts && result.overview.technologies.fonts.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Fonts</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.fonts.map((tech: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.technologies.videoPlayers && result.overview.technologies.videoPlayers.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Video Players</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.technologies.videoPlayers.map((tech: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 text-white text-sm rounded font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && result.overview?.performance && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
              
              {/* Core Web Vitals */}
              {result.overview.performance.coreWebVitals && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Core Web Vitals</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {result.overview.performance.coreWebVitals.LCP && (
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-gray-900">{result.overview.performance.coreWebVitals.LCP}ms</div>
                        <div className="text-sm text-gray-600 mt-1">LCP (Largest Contentful Paint)</div>
                      </div>
                    )}
                    {result.overview.performance.coreWebVitals.FID && (
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-gray-900">{result.overview.performance.coreWebVitals.FID}ms</div>
                        <div className="text-sm text-gray-600 mt-1">FID (First Input Delay)</div>
                      </div>
                    )}
                    {result.overview.performance.coreWebVitals.CLS && (
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-gray-900">{result.overview.performance.coreWebVitals.CLS}</div>
                        <div className="text-sm text-gray-600 mt-1">CLS (Cumulative Layout Shift)</div>
                      </div>
                    )}
                    {result.overview.performance.coreWebVitals.FCP && (
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-gray-900">{result.overview.performance.coreWebVitals.FCP}ms</div>
                        <div className="text-sm text-gray-600 mt-1">FCP (First Contentful Paint)</div>
                      </div>
                    )}
                    {result.overview.performance.coreWebVitals.TTFB && (
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-gray-900">{result.overview.performance.coreWebVitals.TTFB}ms</div>
                        <div className="text-sm text-gray-600 mt-1">TTFB (Time to First Byte)</div>
                      </div>
                    )}
                    {result.overview.performance.coreWebVitals.TTI && (
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-gray-900">{result.overview.performance.coreWebVitals.TTI}ms</div>
                        <div className="text-sm text-gray-600 mt-1">TTI (Time to Interactive)</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resource Count */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Resource Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.scripts}</div>
                    <div className="text-sm text-gray-600 mt-1">JavaScript Files</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.styles}</div>
                    <div className="text-sm text-gray-600 mt-1">CSS Files</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.images}</div>
                    <div className="text-sm text-gray-600 mt-1">Images</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.performance.resourceCount.total}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Resources</div>
                  </div>
                </div>
              </div>

              {/* Performance Recommendations */}
              {result.overview.performance.recommendations && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Recommendations</h4>
                  <div className="space-y-4">
                    {result.overview.performance.recommendations.imageOptimization.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Image Optimization</h5>
                        <ul className="space-y-1">
                          {result.overview.performance.recommendations.imageOptimization.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-gray-900 font-bold">•</span>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.overview.performance.recommendations.minificationOpportunities.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Minification Opportunities</h5>
                        <ul className="space-y-1">
                          {result.overview.performance.recommendations.minificationOpportunities.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-gray-900 font-bold">•</span>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.overview.performance.recommendations.compressionSuggestions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Compression Suggestions</h5>
                        <ul className="space-y-1">
                          {result.overview.performance.recommendations.compressionSuggestions.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-gray-900 font-bold">•</span>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.overview.performance.recommendations.cachingImprovements.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Caching Improvements</h5>
                        <ul className="space-y-1">
                          {result.overview.performance.recommendations.cachingImprovements.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-gray-900 font-bold">•</span>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Load Time */}
              {result.overview.performance.loadTime && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Load Time</h4>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900">{(result.overview.performance.loadTime / 1000).toFixed(2)}s</div>
                    <div className="text-sm text-gray-600 mt-2">Total Page Load Time</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile & PWA Tab */}
          {activeTab === 'mobile' && (result.overview?.mobile || result.overview?.pwa) && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Mobile & PWA Analysis</h3>
              
              {result.overview.mobile && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Mobile Optimization</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Viewport Meta Tag</span>
                      <span className="text-sm font-semibold text-gray-900">{result.overview.mobile.viewport || 'Not found'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Mobile Friendly</span>
                      <span className={`text-sm font-semibold ${result.overview.mobile.mobileFriendly ? 'text-green-600' : 'text-red-600'}`}>
                        {result.overview.mobile.mobileFriendly ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Touch Optimized</span>
                      <span className={`text-sm font-semibold ${result.overview.mobile.touchOptimized ? 'text-green-600' : 'text-red-600'}`}>
                        {result.overview.mobile.touchOptimized ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {result.overview.pwa && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Progressive Web App (PWA)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Has Manifest</span>
                      <span className={`text-sm font-semibold ${result.overview.pwa.hasManifest ? 'text-green-600' : 'text-red-600'}`}>
                        {result.overview.pwa.hasManifest ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Service Worker</span>
                      <span className={`text-sm font-semibold ${result.overview.pwa.hasServiceWorker ? 'text-green-600' : 'text-red-600'}`}>
                        {result.overview.pwa.hasServiceWorker ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Installable</span>
                      <span className={`text-sm font-semibold ${result.overview.pwa.isInstallable ? 'text-green-600' : 'text-red-600'}`}>
                        {result.overview.pwa.isInstallable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E-commerce Tab */}
          {activeTab === 'ecommerce' && result.overview?.ecommerce && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">E-commerce Analysis</h3>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">E-commerce Platform Detected</span>
                    <span className={`text-sm font-semibold ${result.overview.ecommerce.isEcommerce ? 'text-green-600' : 'text-gray-600'}`}>
                      {result.overview.ecommerce.isEcommerce ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {result.overview.ecommerce.platform && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Platform</span>
                      <span className="text-sm font-semibold text-gray-900">{result.overview.ecommerce.platform}</span>
                    </div>
                  )}

                  {result.overview.ecommerce.currency && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Currency</span>
                      <span className="text-sm font-semibold text-gray-900">{result.overview.ecommerce.currency}</span>
                    </div>
                  )}

                  {result.overview.ecommerce.productCount !== undefined && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Products Found</span>
                      <span className="text-sm font-semibold text-gray-900">{result.overview.ecommerce.productCount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">Shopping Cart</span>
                    <span className={`text-sm font-semibold ${result.overview.ecommerce.hasCart ? 'text-green-600' : 'text-gray-600'}`}>
                      {result.overview.ecommerce.hasCart ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">Product Reviews</span>
                    <span className={`text-sm font-semibold ${result.overview.ecommerce.hasReviews ? 'text-green-600' : 'text-gray-600'}`}>
                      {result.overview.ecommerce.hasReviews ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && result.overview?.content && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Content Analysis</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {result.overview.content.wordCount && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.content.wordCount}</div>
                    <div className="text-sm text-gray-600 mt-1">Words</div>
                  </div>
                )}
                {result.overview.content.readingTime && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-gray-900">{result.overview.content.readingTime} min</div>
                    <div className="text-sm text-gray-600 mt-1">Reading Time</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Screenshots Tab */}
          {activeTab === 'screenshots' && result.overview?.screenshots && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Website Screenshots</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.overview.screenshots.desktop && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Desktop View (1920x1080)</h4>
                    <img src={result.overview.screenshots.desktop} alt="Desktop screenshot" className="w-full rounded border border-gray-300" />
                  </div>
                )}
                {result.overview.screenshots.mobile && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Mobile View (375x667)</h4>
                    <img src={result.overview.screenshots.mobile} alt="Mobile screenshot" className="w-full rounded border border-gray-300" />
                  </div>
                )}
              </div>
              {result.overview.screenshots.capturedAt && (
                <div className="text-sm text-gray-600 text-center">
                  Captured at: {new Date(result.overview.screenshots.capturedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* SSL Certificate Tab */}
          {activeTab === 'ssl' && result.overview?.sslCertificate && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">SSL/TLS Certificate</h3>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg ${result.overview.sslCertificate.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <span className="text-2xl font-bold">{result.overview.sslCertificate.grade || 'N/A'}</span>
                      <span className="ml-2 text-sm font-semibold">{result.overview.sslCertificate.valid ? 'Valid Certificate' : 'Invalid Certificate'}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Issuer</div>
                    <div className="font-semibold text-gray-900">{result.overview.sslCertificate.issuer}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Subject</div>
                    <div className="font-semibold text-gray-900">{result.overview.sslCertificate.subject}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Valid From</div>
                    <div className="font-semibold text-gray-900">{new Date(result.overview.sslCertificate.validFrom).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Valid To</div>
                    <div className="font-semibold text-gray-900">{new Date(result.overview.sslCertificate.validTo).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Days Until Expiry</div>
                    <div className={`font-semibold ${result.overview.sslCertificate.daysUntilExpiry < 30 ? 'text-red-600' : 'text-green-600'}`}>
                      {result.overview.sslCertificate.daysUntilExpiry} days
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Protocol</div>
                    <div className="font-semibold text-gray-900">{result.overview.sslCertificate.protocol || 'N/A'}</div>
                  </div>

                  {result.overview.sslCertificate.warnings && result.overview.sslCertificate.warnings.length > 0 && (
                    <div className="col-span-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="text-sm font-semibold text-yellow-800 mb-2">Warnings:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {result.overview.sslCertificate.warnings.map((warning: string, i: number) => (
                          <li key={i} className="text-sm text-yellow-700">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Robots & Sitemap Tab */}
          {activeTab === 'robots' && (result.overview?.robotsTxt || result.overview?.sitemap) && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Robots.txt & Sitemap</h3>
              
              {result.overview.robotsTxt && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Robots.txt</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Status</span>
                      <span className={`text-sm font-semibold ${result.overview.robotsTxt.exists ? 'text-green-600' : 'text-red-600'}`}>
                        {result.overview.robotsTxt.exists ? 'Found' : 'Not Found'}
                      </span>
                    </div>
                    {result.overview.robotsTxt.sitemaps && result.overview.robotsTxt.sitemaps.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-700 mb-2">Sitemaps:</div>
                        {result.overview.robotsTxt.sitemaps.map((sitemap: string, i: number) => (
                          <div key={i} className="text-sm text-blue-600">{sitemap}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.overview.sitemap && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Sitemap.xml</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <div className="text-2xl font-bold text-gray-900">{result.overview.sitemap.urlCount || 0}</div>
                      <div className="text-sm text-gray-600">URLs</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <div className="text-2xl font-bold text-gray-900">{result.overview.sitemap.images || 0}</div>
                      <div className="text-sm text-gray-600">Images</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                      <div className="text-2xl font-bold text-gray-900">{result.overview.sitemap.videos || 0}</div>
                      <div className="text-sm text-gray-600">Videos</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Console Errors Tab */}
          {activeTab === 'console' && result.overview?.consoleErrors && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Console Messages & Errors</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                  <div className="text-3xl font-bold text-red-600">{result.overview.consoleErrors.errorCount}</div>
                  <div className="text-sm text-red-700 mt-1">Errors</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                  <div className="text-3xl font-bold text-yellow-600">{result.overview.consoleErrors.warningCount}</div>
                  <div className="text-sm text-yellow-700 mt-1">Warnings</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.overview.consoleErrors.networkErrors?.length || 0}</div>
                  <div className="text-sm text-blue-700 mt-1">Network Errors</div>
                </div>
              </div>

              {result.overview.consoleErrors.errors.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Console Messages</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.overview.consoleErrors.errors.map((error: any, i: number) => (
                      <div key={i} className={`p-3 rounded border ${
                        error.type === 'error' ? 'bg-red-50 border-red-200' :
                        error.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            error.type === 'error' ? 'bg-red-200 text-red-800' :
                            error.type === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {error.type.toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-700 flex-1">{error.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Social Preview Tab */}
          {activeTab === 'social' && result.overview?.socialPreviews && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Social Media Previews</h3>
              
              <div className="grid grid-cols-1 gap-6">
                {result.overview.socialPreviews.facebook && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Facebook / Open Graph</h4>
                    <div className="border border-gray-300 rounded-lg overflow-hidden max-w-md">
                      {result.overview.socialPreviews.facebook.image && (
                        <img src={result.overview.socialPreviews.facebook.image} alt="Facebook preview" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-4 bg-gray-50">
                        <div className="font-semibold text-gray-900">{result.overview.socialPreviews.facebook.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{result.overview.socialPreviews.facebook.description}</div>
                        <div className="text-xs text-gray-500 mt-2">{result.overview.socialPreviews.facebook.url}</div>
                      </div>
                    </div>
                  </div>
                )}

                {result.overview.socialPreviews.twitter && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Twitter / X Card</h4>
                    <div className="border border-gray-300 rounded-lg overflow-hidden max-w-md">
                      {result.overview.socialPreviews.twitter.image && (
                        <img src={result.overview.socialPreviews.twitter.image} alt="Twitter preview" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-4 bg-gray-50">
                        <div className="font-semibold text-gray-900">{result.overview.socialPreviews.twitter.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{result.overview.socialPreviews.twitter.description}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Carbon Footprint Tab */}
          {activeTab === 'carbon' && result.overview?.carbonFootprint && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Carbon Footprint</h3>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold ${
                  result.overview.carbonFootprint.rating === 'A+' || result.overview.carbonFootprint.rating === 'A' ? 'bg-green-100 text-green-800' :
                  result.overview.carbonFootprint.rating === 'B' ? 'bg-yellow-100 text-yellow-800' :
                  result.overview.carbonFootprint.rating === 'C' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.overview.carbonFootprint.rating}
                </div>
                <div className="mt-6 text-lg text-gray-700">{result.overview.carbonFootprint.comparison}</div>
                <div className="mt-4 text-sm text-gray-600">
                  Cleaner than {result.overview.carbonFootprint.cleaner}% of pages tested
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.carbonFootprint.co2Grams}g</div>
                  <div className="text-sm text-gray-600 mt-1">CO₂ per visit</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.carbonFootprint.energyPerVisit.toFixed(5)}</div>
                  <div className="text-sm text-gray-600 mt-1">kWh per visit</div>
                </div>
              </div>
            </div>
          )}

          {/* Page Weight Tab */}
          {activeTab === 'pageweight' && result.overview?.pageWeight && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Page Weight Analysis</h3>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <div className="text-5xl font-bold text-gray-900">{(result.overview.pageWeight.total / 1024).toFixed(0)} KB</div>
                <div className="text-sm text-gray-600 mt-2">Total Page Size (Estimated)</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{(result.overview.pageWeight.html / 1024).toFixed(0)} KB</div>
                  <div className="text-sm text-gray-600 mt-1">HTML</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{(result.overview.pageWeight.css / 1024).toFixed(0)} KB</div>
                  <div className="text-sm text-gray-600 mt-1">CSS</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{(result.overview.pageWeight.javascript / 1024).toFixed(0)} KB</div>
                  <div className="text-sm text-gray-600 mt-1">JavaScript</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{(result.overview.pageWeight.images / 1024).toFixed(0)} KB</div>
                  <div className="text-sm text-gray-600 mt-1">Images</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{result.overview.pageWeight.requests}</div>
                  <div className="text-sm text-gray-600 mt-1">HTTP Requests</div>
                </div>
              </div>
            </div>
          )}

          {/* Third-Party Services Tab */}
          {activeTab === 'thirdparty' && result.overview?.thirdPartyServices && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Third-Party Services</h3>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center mb-6">
                <div className="text-5xl font-bold text-gray-900">{result.overview.thirdPartyServices.total}</div>
                <div className="text-sm text-gray-600 mt-2">Total Services Detected</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.overview.thirdPartyServices.analytics.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Analytics</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.thirdPartyServices.analytics.map((service: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded font-medium">{service}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.thirdPartyServices.advertising.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Advertising</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.thirdPartyServices.advertising.map((service: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded font-medium">{service}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.thirdPartyServices.socialMedia.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Social Media</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.thirdPartyServices.socialMedia.map((service: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded font-medium">{service}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.overview.thirdPartyServices.payments.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Payment Processors</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.overview.thirdPartyServices.payments.map((service: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded font-medium">{service}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Domain Info Tab */}
          {activeTab === 'domain' && result.overview?.whoisData && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Domain Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Registration Details</h4>
                  <div className="space-y-3">
                    <div><span className="font-medium">Domain:</span> {result.overview.whoisData.domainName}</div>
                    <div><span className="font-medium">Registrar:</span> {result.overview.whoisData.registrar}</div>
                    {result.overview.whoisData.registrantOrganization && (
                      <div><span className="font-medium">Organization:</span> {result.overview.whoisData.registrantOrganization}</div>
                    )}
                    {result.overview.whoisData.registrantCountry && (
                      <div><span className="font-medium">Country:</span> {result.overview.whoisData.registrantCountry}</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Timeline</h4>
                  <div className="space-y-3">
                    {result.overview.whoisData.creationDate && (
                      <div><span className="font-medium">Created:</span> {new Date(result.overview.whoisData.creationDate).toLocaleDateString()}</div>
                    )}
                    {result.overview.whoisData.expirationDate && (
                      <div><span className="font-medium">Expires:</span> {new Date(result.overview.whoisData.expirationDate).toLocaleDateString()}</div>
                    )}
                    {result.overview.whoisData.domainAge && (
                      <div><span className="font-medium">Domain Age:</span> {Math.floor(result.overview.whoisData.domainAge / 365)} years</div>
                    )}
                    {result.overview.whoisData.daysUntilExpiry !== undefined && (
                      <div className={result.overview.whoisData.daysUntilExpiry < 30 ? 'text-red-600 font-semibold' : ''}>
                        <span className="font-medium">Days Until Expiry:</span> {result.overview.whoisData.daysUntilExpiry}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {result.overview.whoisData.nameServers && result.overview.whoisData.nameServers.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Name Servers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.overview.whoisData.nameServers.map((ns: string, i: number) => (
                      <div key={i} className="text-sm font-mono text-gray-700">{ns}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DNS Records Tab */}
          {activeTab === 'dns' && result.overview?.dnsRecords && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">DNS Records</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.overview.dnsRecords.a && result.overview.dnsRecords.a.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">A Records (IPv4)</h4>
                    {result.overview.dnsRecords.a.map((ip: string, i: number) => (
                      <div key={i} className="font-mono text-sm text-gray-700">{ip}</div>
                    ))}
                  </div>
                )}

                {result.overview.dnsRecords.aaaa && result.overview.dnsRecords.aaaa.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">AAAA Records (IPv6)</h4>
                    {result.overview.dnsRecords.aaaa.map((ip: string, i: number) => (
                      <div key={i} className="font-mono text-sm text-gray-700">{ip}</div>
                    ))}
                  </div>
                )}

                {result.overview.dnsRecords.mx && result.overview.dnsRecords.mx.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">MX Records (Mail)</h4>
                    {result.overview.dnsRecords.mx.map((mx: any, i: number) => (
                      <div key={i} className="text-sm text-gray-700">
                        <span className="font-medium">{mx.priority}</span> - {mx.exchange}
                      </div>
                    ))}
                  </div>
                )}

                {result.overview.dnsRecords.ns && result.overview.dnsRecords.ns.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">NS Records</h4>
                    {result.overview.dnsRecords.ns.map((ns: string, i: number) => (
                      <div key={i} className="font-mono text-sm text-gray-700">{ns}</div>
                    ))}
                  </div>
                )}
              </div>

              {result.overview.dnsRecords.spf && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">SPF Record</h4>
                  <div className="font-mono text-sm text-gray-700 break-all">{result.overview.dnsRecords.spf}</div>
                </div>
              )}

              {result.overview.dnsRecords.dmarc && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">DMARC Record</h4>
                  <div className="font-mono text-sm text-gray-700 break-all">{result.overview.dnsRecords.dmarc}</div>
                </div>
              )}
            </div>
          )}

          {/* Server Info Tab */}
          {activeTab === 'server' && result.overview?.serverInfo && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Server Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Network</h4>
                  <div className="space-y-2">
                    {result.overview.serverInfo.ipAddress && (
                      <div><span className="font-medium">IPv4:</span> <span className="font-mono">{result.overview.serverInfo.ipAddress}</span></div>
                    )}
                    {result.overview.serverInfo.ipv6Address && (
                      <div><span className="font-medium">IPv6:</span> <span className="font-mono text-xs">{result.overview.serverInfo.ipv6Address}</span></div>
                    )}
                    {result.overview.serverInfo.hostname && (
                      <div><span className="font-medium">Hostname:</span> {result.overview.serverInfo.hostname}</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Location</h4>
                  <div className="space-y-2">
                    {result.overview.serverInfo.city && (
                      <div><span className="font-medium">City:</span> {result.overview.serverInfo.city}</div>
                    )}
                    {result.overview.serverInfo.country && (
                      <div><span className="font-medium">Country:</span> {result.overview.serverInfo.country}</div>
                    )}
                    {result.overview.serverInfo.timezone && (
                      <div><span className="font-medium">Timezone:</span> {result.overview.serverInfo.timezone}</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Server Software</h4>
                  <div className="space-y-2">
                    {result.overview.serverInfo.serverSoftware && (
                      <div><span className="font-medium">Server:</span> {result.overview.serverInfo.serverSoftware}</div>
                    )}
                    {result.overview.serverInfo.poweredBy && (
                      <div><span className="font-medium">Powered By:</span> {result.overview.serverInfo.poweredBy}</div>
                    )}
                  </div>
                </div>

                {result.overview.serverInfo.cdnDetected && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">CDN</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚀</span>
                      <span className="font-medium">{result.overview.serverInfo.cdnProvider}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Headers Tab */}
          {activeTab === 'security' && result.overview?.securityHeaders && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Security Headers</h3>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold px-6 py-3 rounded-lg ${
                    result.overview.securityHeaders.grade === 'A+' || result.overview.securityHeaders.grade === 'A' ? 'bg-green-100 text-green-800' :
                    result.overview.securityHeaders.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                    result.overview.securityHeaders.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.overview.securityHeaders.grade}
                  </div>
                  <div className="text-sm text-gray-600">Score: {result.overview.securityHeaders.score}/80</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.overview.securityHeaders.headers).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${value.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {value.present ? '✓ Present' : '✗ Missing'}
                      </span>
                    </div>
                    {value.value && (
                      <div className="text-xs font-mono text-gray-600 break-all mt-2">{value.value}</div>
                    )}
                  </div>
                ))}
              </div>

              {result.overview.securityHeaders.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Warnings</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.overview.securityHeaders.warnings.map((warning: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-800">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.overview.securityHeaders.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.overview.securityHeaders.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm text-blue-800">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Social Media Links Tab */}
          {activeTab === 'sociallinks' && result.overview?.socialMedia && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Social Media Presence</h3>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{result.overview.socialMedia.totalPlatforms}</div>
                  <div className="text-sm text-gray-600 mt-2">Social Media Platforms</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.overview.socialMedia.platforms.map((platform: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{platform.name}</span>
                      {platform.verified && <span className="text-blue-500">✓</span>}
                    </div>
                    {platform.handle && (
                      <div className="text-sm text-gray-600 mb-2">@{platform.handle}</div>
                    )}
                    <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                      {platform.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured Data Tab */}
          {activeTab === 'schema' && result.overview?.structuredData && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Structured Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className={`text-3xl mb-2 ${result.overview.structuredData.hasStructuredData ? 'text-green-600' : 'text-red-600'}`}>
                    {result.overview.structuredData.hasStructuredData ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Structured Data</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.structuredData.types.length}</div>
                  <div className="text-sm text-gray-600">Schema Types</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className={`text-3xl mb-2 ${result.overview.structuredData.richSnippetsEligible ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.overview.structuredData.richSnippetsEligible ? '⭐' : '○'}
                  </div>
                  <div className="text-sm text-gray-600">Rich Snippets</div>
                </div>
              </div>

              {result.overview.structuredData.types.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Schema Types Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.overview.structuredData.types.map((type: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded font-medium">{type}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.overview.structuredData.schemas.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-gray-900">Schema Details</h4>
                  {result.overview.structuredData.schemas.slice(0, 3).map((schema: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="font-semibold text-gray-900 mb-2">{schema.type}</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(schema.data, null, 2).slice(0, 500)}...
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Languages Tab */}
          {activeTab === 'languages' && result.overview?.i18n && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Languages & Internationalization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Primary Language</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {result.overview.i18n.primaryLanguage || 'Not specified'}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={result.overview.i18n.hasHreflang ? 'text-green-600' : 'text-gray-400'}>
                        {result.overview.i18n.hasHreflang ? '✓' : '✗'}
                      </span>
                      <span>Hreflang Tags</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={result.overview.i18n.hasTranslations ? 'text-green-600' : 'text-gray-400'}>
                        {result.overview.i18n.hasTranslations ? '✓' : '✗'}
                      </span>
                      <span>Translations Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={result.overview.i18n.rtlSupport ? 'text-green-600' : 'text-gray-400'}>
                        {result.overview.i18n.rtlSupport ? '✓' : '✗'}
                      </span>
                      <span>RTL Support</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.overview.i18n.hreflangTags.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Hreflang Tags ({result.overview.i18n.hreflangTags.length})</h4>
                  <div className="space-y-2">
                    {result.overview.i18n.hreflangTags.slice(0, 10).map((tag: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tag.lang}</span>
                        <span className="text-gray-600 truncate">{tag.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* External Links Tab */}
          {activeTab === 'externallinks' && result.overview?.externalLinks && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">External Links Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.externalLinks.total}</div>
                  <div className="text-sm text-gray-600">Total Links</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.externalLinks.domains.length}</div>
                  <div className="text-sm text-gray-600">Unique Domains</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{result.overview.externalLinks.followedLinks}</div>
                  <div className="text-sm text-gray-600">Followed</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-500 mb-2">{result.overview.externalLinks.nofollowLinks}</div>
                  <div className="text-sm text-gray-600">Nofollow</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.overview.externalLinks.categorized).map(([category, links]: [string, any]) => (
                  links.length > 0 && (
                    <div key={category} className="bg-white rounded-lg p-6 border border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-3 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()} ({links.length})</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {links.slice(0, 10).map((link: string, i: number) => (
                          <div key={i} className="text-xs text-gray-600 truncate">{link}</div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Internal Links Tab */}
          {activeTab === 'internallinks' && result.overview?.internalLinks && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Internal Links Structure</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.internalLinks.total}</div>
                  <div className="text-sm text-gray-600">Total Links</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.internalLinks.unique}</div>
                  <div className="text-sm text-gray-600">Unique Pages</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.internalLinks.maxDepth}</div>
                  <div className="text-sm text-gray-600">Max Depth</div>
                </div>
              </div>
            </div>
          )}

          {/* Uptime Tab */}
          {activeTab === 'uptime' && result.overview?.uptime && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Uptime & Historical Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className={`text-4xl mb-2 ${result.overview.uptime.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {result.overview.uptime.isOnline ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-xs text-gray-500 mt-1">HTTP {result.overview.uptime.responseCode}</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{result.overview.uptime.responseTime}ms</div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                  <div className="text-sm text-gray-600 mb-1">Last Checked</div>
                  <div className="text-xs text-gray-500">{new Date(result.overview.uptime.lastChecked).toLocaleString()}</div>
                </div>
              </div>

              {result.overview.uptime.historicalData?.waybackAvailable && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Wayback Machine</h4>
                  <div className="space-y-2">
                    <div><span className="font-medium">Available:</span> ✓ Yes</div>
                    {result.overview.uptime.historicalData.firstSnapshot && (
                      <div><span className="font-medium">First Snapshot:</span> {result.overview.uptime.historicalData.firstSnapshot}</div>
                    )}
                    {result.overview.uptime.historicalData.lastSnapshot && (
                      <div><span className="font-medium">Last Snapshot:</span> {result.overview.uptime.historicalData.lastSnapshot}</div>
                    )}
                    {result.overview.uptime.historicalData.archiveUrl && (
                      <a href={result.overview.uptime.historicalData.archiveUrl} target="_blank" rel="noopener noreferrer" 
                         className="inline-block mt-2 text-blue-600 hover:underline text-sm">
                        View in Wayback Machine →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Tech Stack Tab */}
          {activeTab === 'techstack' && result.overview?.enhancedTechStack && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Enhanced Technology Stack</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.overview.enhancedTechStack.backend && result.overview.enhancedTechStack.backend.language && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Backend</h4>
                    <div className="space-y-2">
                      <div><span className="font-medium">Language:</span> {result.overview.enhancedTechStack.backend.language}</div>
                      {result.overview.enhancedTechStack.backend.framework && (
                        <div><span className="font-medium">Framework:</span> {result.overview.enhancedTechStack.backend.framework}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Detected from: {result.overview.enhancedTechStack.backend.detectedFrom.join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {result.overview.enhancedTechStack.server && result.overview.enhancedTechStack.server.software && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Server</h4>
                    <div className="space-y-2">
                      <div><span className="font-medium">Software:</span> {result.overview.enhancedTechStack.server.software}</div>
                      {result.overview.enhancedTechStack.server.version && (
                        <div><span className="font-medium">Version:</span> {result.overview.enhancedTechStack.server.version}</div>
                      )}
                    </div>
                  </div>
                )}

                {result.overview.enhancedTechStack.security && Object.keys(result.overview.enhancedTechStack.security).length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Security</h4>
                    <div className="space-y-2">
                      {result.overview.enhancedTechStack.security.waf && (
                        <div><span className="font-medium">WAF:</span> {result.overview.enhancedTechStack.security.waf}</div>
                      )}
                      {result.overview.enhancedTechStack.security.ddosProtection && (
                        <div><span className="font-medium">DDoS Protection:</span> {result.overview.enhancedTechStack.security.ddosProtection}</div>
                      )}
                    </div>
                  </div>
                )}

                {result.overview.enhancedTechStack.marketing && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Marketing Tools</h4>
                    <div className="space-y-3">
                      {result.overview.enhancedTechStack.marketing.analytics.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Analytics</div>
                          <div className="flex flex-wrap gap-1">
                            {result.overview.enhancedTechStack.marketing.analytics.map((tool: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{tool}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.overview.enhancedTechStack.marketing.tagManager.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Tag Manager</div>
                          <div className="flex flex-wrap gap-1">
                            {result.overview.enhancedTechStack.marketing.tagManager.map((tool: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{tool}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div>
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Website Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode(previewMode === 'live' ? 'static' : 'live')}
                      className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                    >
                      {previewMode === 'live' ? 'Live Mode' : 'Static Mode'}
                    </button>
                    <button
                      onClick={() => setShowHtml(!showHtml)}
                      className="px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    >
                      {showHtml ? 'Show Preview' : 'Show HTML'}
                    </button>
                  </div>
                </div>

                {/* Browser Controls */}
                {!showHtml && previewMode === 'live' && (
                  <div className="bg-gray-50 rounded p-3 flex items-center gap-3 border border-gray-200">
                    <div className="flex gap-2">
                      <button
                        onClick={refreshPreview}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        title="Refresh"
                      >
                        🔄
                      </button>
                      <button
                        onClick={openInNewTab}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        title="Open in new tab"
                      >
                        🔗
                      </button>
                    </div>
                    <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-3 py-2">
                      <span className="text-gray-400 mr-2">🔒</span>
                      <input
                        type="text"
                        value={currentPreviewUrl}
                        onChange={(e) => setCurrentPreviewUrl(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            refreshPreview()
                          }
                        }}
                        className="flex-1 outline-none text-sm text-gray-700"
                        placeholder="Enter URL..."
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Interactive browsing enabled
                    </div>
                  </div>
                )}

                {!showHtml && previewMode === 'static' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ Static mode: Showing saved HTML. Links and interactions may not work. Switch to Live Mode for full browsing.
                  </div>
                )}

                {proxyError && previewMode === 'live' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 text-lg">⚠️</span>
                      <div className="flex-1">
                        <p className="text-red-800 font-semibold">Live preview failed to load</p>
                        <p className="text-red-700 mt-1">The website may be blocking proxied access.</p>
                        <button
                          onClick={switchToStaticMode}
                          className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          Switch to Static Mode
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {showHtml ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-green-400 text-xs">
                    <code>{result.html}</code>
                  </pre>
                </div>
              ) : (
                <div className="border-4 border-gray-300 rounded-lg overflow-hidden bg-white shadow-xl">
                  {previewMode === 'live' ? (
                    <iframe
                      key={iframeKey}
                      src={`/api/proxy?url=${encodeURIComponent(currentPreviewUrl)}`}
                      title="Website Preview"
                      className="w-full h-[700px] bg-white"
                      sandbox="allow-scripts allow-forms allow-popups"
                      onError={() => setProxyError(true)}
                    />
                  ) : (
                    <iframe
                      srcDoc={result.html}
                      title="Website Preview"
                      className="w-full h-[700px] bg-white"
                      sandbox="allow-scripts"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
