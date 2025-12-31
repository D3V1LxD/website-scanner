import { promises as dns } from 'dns'
import axios from 'axios'

// Dynamic imports for packages without types
let whoiser: any
let geoip: any

// Load packages asynchronously
async function loadDependencies() {
  if (!whoiser) {
    whoiser = await import('whoiser')
  }
  if (!geoip) {
    geoip = await import('geoip-lite')
  }
}

// Analyze WHOIS data for domain
export async function analyzeWhois(domain: string) {
  await loadDependencies()
  
  try {
    // Remove protocol and path from domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0]
    
    const whoisData = await whoiser(cleanDomain, { timeout: 10000 })
    
    // Extract data from WHOIS response (format varies by registrar)
    const firstResult = whoisData[Object.keys(whoisData)[0]] as any
    
    if (!firstResult || typeof firstResult === 'string') {
      return {
        domainName: cleanDomain,
        registrar: 'Unknown',
        creationDate: undefined,
        expirationDate: undefined,
        nameServers: [],
        status: []
      }
    }

    // Calculate domain age and days until expiry
    let domainAge: number | undefined
    let daysUntilExpiry: number | undefined
    
    const creationDate = firstResult['Created Date'] || firstResult['Creation Date'] || firstResult['created']
    const expirationDate = firstResult['Registry Expiry Date'] || firstResult['Expiration Date'] || firstResult['expires']
    
    if (creationDate) {
      const created = new Date(creationDate)
      domainAge = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    }
    
    if (expirationDate) {
      const expires = new Date(expirationDate)
      daysUntilExpiry = Math.floor((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }

    return {
      domainName: firstResult['Domain Name'] || cleanDomain,
      registrar: firstResult['Registrar'] || firstResult['registrar'] || 'Unknown',
      registrantName: firstResult['Registrant Name'] || firstResult['registrant'],
      registrantOrganization: firstResult['Registrant Organization'] || firstResult['org'],
      registrantCountry: firstResult['Registrant Country'] || firstResult['country'],
      creationDate: creationDate || undefined,
      expirationDate: expirationDate || undefined,
      updatedDate: firstResult['Updated Date'] || firstResult['updated'] || undefined,
      domainAge,
      daysUntilExpiry,
      nameServers: firstResult['Name Server'] || firstResult['nserver'] || [],
      status: firstResult['Domain Status'] || firstResult['status'] || [],
      emails: firstResult['Registrar Abuse Contact Email'] ? [firstResult['Registrar Abuse Contact Email']] : [],
      registrarUrl: firstResult['Registrar URL'] || undefined
    }
  } catch (error) {
    console.error('WHOIS lookup error:', error)
    return {
      domainName: domain,
      registrar: 'Unavailable',
      creationDate: undefined,
      expirationDate: undefined,
      nameServers: [],
      status: []
    }
  }
}

// Analyze DNS records
export async function analyzeDNS(domain: string) {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0]
    
    const [aRecords, aaaaRecords, mxRecords, txtRecords, nsRecords] = await Promise.allSettled([
      dns.resolve4(cleanDomain).catch(() => []),
      dns.resolve6(cleanDomain).catch(() => []),
      dns.resolveMx(cleanDomain).catch(() => []),
      dns.resolveTxt(cleanDomain).catch(() => []),
      dns.resolveNs(cleanDomain).catch(() => [])
    ])

    // Extract SPF and DMARC from TXT records
    let spf: string | undefined
    let dmarc: string | undefined
    
    if (txtRecords.status === 'fulfilled') {
      const txtValues = txtRecords.value.flat()
      spf = txtValues.find((txt: string) => txt.startsWith('v=spf1'))
      
      // Check for DMARC at _dmarc subdomain
      try {
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${cleanDomain}`)
        dmarc = dmarcRecords.flat().find((txt: string) => txt.startsWith('v=DMARC1'))
      } catch {
        dmarc = undefined
      }
    }

    return {
      a: aRecords.status === 'fulfilled' ? aRecords.value : [],
      aaaa: aaaaRecords.status === 'fulfilled' ? aaaaRecords.value : [],
      mx: mxRecords.status === 'fulfilled' ? mxRecords.value : [],
      txt: txtRecords.status === 'fulfilled' ? txtRecords.value.flat() : [],
      ns: nsRecords.status === 'fulfilled' ? nsRecords.value : [],
      spf: spf,
      dmarc: dmarc,
      dnssec: false // Would require DNSSEC-specific query
    }
  } catch (error) {
    console.error('DNS lookup error:', error)
    return {
      a: [],
      aaaa: [],
      mx: [],
      txt: [],
      ns: [],
      dnssec: false
    }
  }
}

// Analyze server information including geolocation
export async function analyzeServerInfo(domain: string, headers: Record<string, string>) {
  await loadDependencies()
  
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0]
    
    // Get IP address
    const ipAddresses = await dns.resolve4(cleanDomain).catch(() => [])
    const ipv6Addresses = await dns.resolve6(cleanDomain).catch(() => [])
    
    const ipAddress = ipAddresses[0] || undefined
    const ipv6Address = ipv6Addresses[0] || undefined
    
    // Get geolocation data
    let geoData: any = null
    if (ipAddress) {
      geoData = geoip.lookup(ipAddress)
    }
    
    // Detect server software from headers
    const serverSoftware = headers['server'] || headers['Server'] || undefined
    const poweredBy = headers['x-powered-by'] || headers['X-Powered-By'] || undefined
    
    // Detect CDN
    let cdnDetected = false
    let cdnProvider: string | undefined
    
    const cdnHeaders = [
      { header: 'cf-ray', name: 'Cloudflare' },
      { header: 'x-amz-cf-id', name: 'Amazon CloudFront' },
      { header: 'x-akamai-transformed', name: 'Akamai' },
      { header: 'x-fastly-request-id', name: 'Fastly' },
      { header: 'x-cdn', name: headers['x-cdn'] || 'CDN' }
    ]
    
    for (const cdn of cdnHeaders) {
      if (headers[cdn.header] || headers[cdn.header.toLowerCase()]) {
        cdnDetected = true
        cdnProvider = cdn.name
        break
      }
    }

    return {
      ipAddress,
      ipv6Address,
      hostname: cleanDomain,
      isp: geoData?.isp || undefined,
      continent: geoData?.continent || undefined,
      country: geoData?.country || undefined,
      countryCode: geoData?.countryCode || undefined,
      region: geoData?.region || undefined,
      city: geoData?.city || undefined,
      latitude: geoData?.ll?.[0] || undefined,
      longitude: geoData?.ll?.[1] || undefined,
      timezone: geoData?.timezone || undefined,
      serverSoftware,
      poweredBy,
      cdnDetected,
      cdnProvider
    }
  } catch (error) {
    console.error('Server info analysis error:', error)
    return {
      hostname: domain
    }
  }
}

// Check uptime and historical data via Wayback Machine
export async function analyzeUptime(url: string) {
  try {
    const startTime = Date.now()
    
    // Check if site is currently online
    const response = await axios.head(url, { 
      timeout: 10000,
      validateStatus: () => true 
    })
    
    const responseTime = Date.now() - startTime
    
    // Check Wayback Machine
    let historicalData: any = {
      waybackAvailable: false
    }
    
    try {
      const cleanUrl = url.replace(/^https?:\/\//, '')
      const waybackResponse = await axios.get(
        `https://archive.org/wayback/available?url=${cleanUrl}`,
        { timeout: 5000 }
      )
      
      if (waybackResponse.data?.archived_snapshots?.closest) {
        const snapshot = waybackResponse.data.archived_snapshots.closest
        historicalData = {
          waybackAvailable: true,
          lastSnapshot: snapshot.timestamp,
          archiveUrl: snapshot.url
        }
        
        // Get total snapshots (simplified - would need CDX API for exact count)
        try {
          const cdxResponse = await axios.get(
            `https://web.archive.org/cdx/search/cdx?url=${cleanUrl}&output=json&limit=1`,
            { timeout: 5000 }
          )
          if (cdxResponse.data?.length > 1) {
            historicalData.firstSnapshot = cdxResponse.data[1][1]
          }
        } catch {
          // CDX API unavailable
        }
      }
    } catch {
      // Wayback Machine unavailable
    }

    return {
      isOnline: response.status < 400,
      responseCode: response.status,
      responseTime,
      lastChecked: new Date().toISOString(),
      historicalData
    }
  } catch (error) {
    return {
      isOnline: false,
      responseCode: 0,
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      historicalData: {
        waybackAvailable: false
      }
    }
  }
}
