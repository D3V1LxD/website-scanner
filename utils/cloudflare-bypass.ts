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
 * Apply advanced stealth measures to a Puppeteer page
 */
export async function applyStealthMeasures(page: Page): Promise<void> {
  // Remove webdriver flags and modify navigator properties
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    })

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
 * Wait for Cloudflare challenge to complete
 */
export async function waitForCloudflare(page: Page, timeout: number = 15000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const title = document.title.toLowerCase()
        const bodyText = document.body.innerText.toLowerCase()
        
        // Check for common Cloudflare challenge indicators
        const hasChallenge = 
          title.includes('just a moment') ||
          title.includes('attention required') ||
          bodyText.includes('checking your browser') ||
          bodyText.includes('please wait') ||
          bodyText.includes('ddos protection') ||
          bodyText.includes('cloudflare')
        
        return !hasChallenge
      },
      { timeout }
    )
    return true
  } catch (e) {
    // Timeout reached, challenge might still be present
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
    timeout?: number 
  } = {}
): Promise<void> {
  const { waitUntil = 'networkidle2', timeout = 45000 } = options
  
  // Random delay before navigation (simulate human behavior)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
  
  // Navigate to page
  await page.goto(url, {
    waitUntil,
    timeout
  })
  
  // Wait for Cloudflare challenge if present
  const bypassSuccessful = await waitForCloudflare(page, 15000)
  
  if (!bypassSuccessful) {
    console.warn('Cloudflare challenge detection timeout - may still be challenged')
  }
  
  // Additional wait for dynamic content
  await new Promise(resolve => setTimeout(resolve, 2000))
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
