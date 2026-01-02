import type { Page } from 'puppeteer'

/**
 * Enhanced stealth configurations for bypassing Cloudflare and other bot detection
 */

export const stealthArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-web-security',
  '--disable-features=site-per-process',
  '--window-size=1920,1080',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

/**
 * Inject advanced evasion scripts
 */
async function injectEvasionScripts(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `navigator.webdriver` property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    })

    // Pass the Chrome Test
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol

    // Pass the Permissions Test
    const originalQuery = window.navigator.permissions.query
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
        : originalQuery(parameters)

    // Pass the Plugins Length Test
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          name: 'Chrome PDF Plugin'
        },
        {
          0: { type: 'application/pdf', suffixes: 'pdf', description: '' },
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          name: 'Chrome PDF Viewer'
        },
        {
          0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
          1: { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
          description: '',
          filename: 'internal-nacl-plugin',
          length: 2,
          name: 'Native Client'
        }
      ],
    })

    // Pass the Languages Test
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    })

    // Pass the Chrome Test
    // @ts-ignore
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    }

    // Mock notifications permission
    Object.defineProperty(Notification, 'permission', {
      get: () => 'default'
    })
  })
}

/**
 * Apply advanced stealth measures to a Puppeteer page
 */
export async function applyStealthMeasures(page: Page): Promise<void> {
  // Inject evasion scripts first
  await injectEvasionScripts(page)
  
  // Remove webdriver flags and modify navigator properties
  await page.evaluateOnNewDocument(() => {
    // Override the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    })

    // Override the `languages` property to use a custom getter.
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    })

    // Override the `chrome` property
    // @ts-ignore
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    }

    // Override permissions
    const originalQuery = window.navigator.permissions.query
    window.navigator.permissions.query = (parameters: any) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission } as any) :
        originalQuery(parameters)
    )

    // Override the `Connection` property
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 100,
        downlink: 10,
        saveData: false
      })
    })

    // Override screen properties with common values
    Object.defineProperty(screen, 'colorDepth', {
      get: () => 24
    })

    Object.defineProperty(screen, 'pixelDepth', {
      get: () => 24
    })

    // Mock hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8
    })

    // Mock device memory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8
    })

    // Override getBattery to simulate real device
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1
      })
    })

    // Spoof WebGL vendor and renderer
    const getParameter = WebGLRenderingContext.prototype.getParameter
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.'
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine'
      }
      return getParameter.call(this, parameter)
    }
  })

  // Set realistic viewport
  await page.setViewport({ 
    width: 1920, 
    height: 1080,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false
  })

  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  })
}

/**
 * Detect if page is showing Cloudflare challenge
 */
export async function isCloudflareChallenge(page: Page): Promise<boolean> {
  try {
    const indicators = await page.evaluate(() => {
      const title = document.title.toLowerCase()
      const bodyText = document.body.innerText.toLowerCase()
      const html = document.documentElement.innerHTML.toLowerCase()
      
      // Check for Cloudflare challenge indicators
      const titleCheck = 
        title.includes('just a moment') ||
        title.includes('attention required') ||
        title.includes('please wait')
      
      const bodyCheck = 
        bodyText.includes('checking your browser') ||
        bodyText.includes('checking if the site connection is secure') ||
        bodyText.includes('please wait') ||
        bodyText.includes('ddos protection') ||
        bodyText.includes('enable javascript and cookies') ||
        bodyText.includes('verify you are human')
      
      const htmlCheck = 
        html.includes('cf-browser-verification') ||
        html.includes('cf-challenge-form') ||
        html.includes('cf-wrapper') ||
        html.includes('turnstile') ||
        html.includes('cloudflare') ||
        html.includes('ray id')
      
      // Check for Turnstile iframe
      const hasTurnstile = document.querySelector('iframe[src*="challenges.cloudflare.com"]') !== null
      
      return {
        hasChallenge: titleCheck || bodyCheck || htmlCheck || hasTurnstile,
        titleCheck,
        bodyCheck,
        htmlCheck,
        hasTurnstile
      }
    })
    
    return indicators.hasChallenge
  } catch (e) {
    return false
  }
}

/**
 * Wait for Cloudflare challenge to complete with enhanced detection
 */
export async function waitForCloudflare(page: Page, timeout: number = 30000): Promise<boolean> {
  const startTime = Date.now()
  const checkInterval = 500
  
  try {
    // Initial check
    const hasChallenge = await isCloudflareChallenge(page)
    if (!hasChallenge) {
      return true // No challenge present
    }
    
    console.log('Cloudflare challenge detected, waiting...')
    
    // Wait for challenge to resolve
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      
      // Check if challenge is complete
      const stillChallenged = await isCloudflareChallenge(page)
      if (!stillChallenged) {
        console.log('Cloudflare challenge passed!')
        // Wait a bit more for page to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000))
        return true
      }
      
      // Check for manual verification requirement
      const needsManual = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase()
        return bodyText.includes('verify you are human') ||
               bodyText.includes('complete the security check') ||
               document.querySelector('input[type="checkbox"]') !== null
      })
      
      if (needsManual) {
        console.warn('Manual verification required - cannot auto-bypass')
        return false
      }
    }
    
    console.warn('Cloudflare challenge timeout')
    return false
  } catch (e) {
    console.error('Error waiting for Cloudflare:', e)
    return false
  }
}

/**
 * Navigate to a URL with Cloudflare bypass
 */
export async function navigateWithBypass(
  page: Page, 
  url: string, 
  options: { 
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2',
    timeout?: number,
    retries?: number
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const { waitUntil = 'networkidle2', timeout = 60000, retries = 2 } = options
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retries}`)
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      // Random delay before navigation (simulate human behavior)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
      
      // Navigate to page
      try {
        await page.goto(url, {
          waitUntil,
          timeout
        })
      } catch (navError: any) {
        // Continue even if navigation times out, page might have loaded
        if (!navError.message.includes('timeout')) {
          throw navError
        }
        console.warn('Navigation timeout, checking if page loaded...')
      }
      
      // Check for Cloudflare challenge
      const hasChallenge = await isCloudflareChallenge(page)
      
      if (hasChallenge) {
        console.log('Cloudflare challenge detected, waiting up to 30s...')
        const bypassSuccessful = await waitForCloudflare(page, 30000)
        
        if (!bypassSuccessful) {
          if (attempt === retries) {
            return { 
              success: false, 
              error: 'Cloudflare challenge could not be bypassed automatically. Manual verification may be required.' 
            }
          }
          continue // Retry
        }
      }
      
      // Additional wait for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return { success: true }
    } catch (error: any) {
      if (attempt === retries) {
        return { 
          success: false, 
          error: `Navigation failed: ${error.message}` 
        }
      }
    }
  }
  
  return { success: false, error: 'Max retries exceeded' }
}

/**
 * Random mouse movements to simulate human behavior
 */
export async function simulateHumanBehavior(page: Page): Promise<void> {
  // Random mouse movements
  const movements = Math.floor(Math.random() * 3) + 2
  for (let i = 0; i < movements; i++) {
    await page.mouse.move(
      Math.random() * 1920,
      Math.random() * 1080,
      { steps: 10 }
    )
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
  }
  
  // Random scroll
  await page.evaluate(() => {
    window.scrollBy(0, Math.random() * 500)
  })
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
}
