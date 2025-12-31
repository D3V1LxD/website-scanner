import axios from 'axios'

// Analyze HTTP security headers
export async function analyzeSecurityHeaders(url: string, headers: Record<string, string>) {
  const securityHeaders = {
    strictTransportSecurity: analyzeHSTS(headers),
    contentSecurityPolicy: analyzeCSP(headers),
    xFrameOptions: analyzeXFrameOptions(headers),
    xContentTypeOptions: analyzeXContentTypeOptions(headers),
    referrerPolicy: analyzeReferrerPolicy(headers),
    permissionsPolicy: analyzePermissionsPolicy(headers),
    xXssProtection: analyzeXXSSProtection(headers),
    expectCt: analyzeExpectCT(headers)
  }

  // Calculate security score
  let score = 0
  let maxScore = 80 // 10 points per header
  
  if (securityHeaders.strictTransportSecurity.present) score += 15 // Most important
  if (securityHeaders.contentSecurityPolicy.present) score += 15 // Most important
  if (securityHeaders.xFrameOptions.present) score += 10
  if (securityHeaders.xContentTypeOptions.present) score += 10
  if (securityHeaders.referrerPolicy.present) score += 10
  if (securityHeaders.permissionsPolicy.present) score += 10
  if (securityHeaders.xXssProtection.present) score += 5
  if (securityHeaders.expectCt.present) score += 5

  // Determine grade
  let grade = 'F'
  if (score >= 75) grade = 'A+'
  else if (score >= 65) grade = 'A'
  else if (score >= 55) grade = 'B'
  else if (score >= 45) grade = 'C'
  else if (score >= 30) grade = 'D'
  else if (score >= 15) grade = 'E'

  // Identify missing headers
  const missingHeaders: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  if (!securityHeaders.strictTransportSecurity.present) {
    missingHeaders.push('Strict-Transport-Security')
    recommendations.push('Add HSTS header to enforce HTTPS connections')
  } else if (!securityHeaders.strictTransportSecurity.preload) {
    recommendations.push('Consider adding "preload" directive to HSTS')
  }

  if (!securityHeaders.contentSecurityPolicy.present) {
    missingHeaders.push('Content-Security-Policy')
    recommendations.push('Implement CSP to prevent XSS and data injection attacks')
  }

  if (!securityHeaders.xFrameOptions.present) {
    missingHeaders.push('X-Frame-Options')
    warnings.push('Site may be vulnerable to clickjacking attacks')
  }

  if (!securityHeaders.xContentTypeOptions.present) {
    missingHeaders.push('X-Content-Type-Options')
    recommendations.push('Set X-Content-Type-Options to "nosniff"')
  }

  if (!securityHeaders.referrerPolicy.present) {
    missingHeaders.push('Referrer-Policy')
    recommendations.push('Define a referrer policy to control referrer information')
  }

  if (!securityHeaders.permissionsPolicy.present) {
    missingHeaders.push('Permissions-Policy')
    recommendations.push('Use Permissions-Policy to control browser features')
  }

  return {
    score,
    grade,
    headers: securityHeaders,
    missingHeaders,
    warnings,
    recommendations
  }
}

function analyzeHSTS(headers: Record<string, string>) {
  const hsts = headers['strict-transport-security'] || headers['Strict-Transport-Security']
  
  if (!hsts) {
    return { present: false }
  }

  const maxAgeMatch = hsts.match(/max-age=(\d+)/)
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0
  const includeSubDomains = hsts.includes('includeSubDomains')
  const preload = hsts.includes('preload')

  return {
    present: true,
    value: hsts,
    maxAge,
    includeSubDomains,
    preload
  }
}

function analyzeCSP(headers: Record<string, string>) {
  const csp = headers['content-security-policy'] || headers['Content-Security-Policy']
  
  if (!csp) {
    return { present: false }
  }

  const directives = csp.split(';').map(d => d.trim().split(' ')[0]).filter(d => d)

  return {
    present: true,
    value: csp,
    directives
  }
}

function analyzeXFrameOptions(headers: Record<string, string>) {
  const xfo = headers['x-frame-options'] || headers['X-Frame-Options']
  
  return {
    present: !!xfo,
    value: xfo
  }
}

function analyzeXContentTypeOptions(headers: Record<string, string>) {
  const xcto = headers['x-content-type-options'] || headers['X-Content-Type-Options']
  
  return {
    present: !!xcto,
    value: xcto
  }
}

function analyzeReferrerPolicy(headers: Record<string, string>) {
  const rp = headers['referrer-policy'] || headers['Referrer-Policy']
  
  return {
    present: !!rp,
    value: rp
  }
}

function analyzePermissionsPolicy(headers: Record<string, string>) {
  const pp = headers['permissions-policy'] || headers['Permissions-Policy'] || 
             headers['feature-policy'] || headers['Feature-Policy']
  
  return {
    present: !!pp,
    value: pp
  }
}

function analyzeXXSSProtection(headers: Record<string, string>) {
  const xxp = headers['x-xss-protection'] || headers['X-XSS-Protection']
  
  return {
    present: !!xxp,
    value: xxp
  }
}

function analyzeExpectCT(headers: Record<string, string>) {
  const ect = headers['expect-ct'] || headers['Expect-CT']
  
  return {
    present: !!ect,
    value: ect
  }
}
