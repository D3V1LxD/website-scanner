import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    // Validate URL
    const targetUrl = new URL(url)

    // Fetch the website
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 500
    })

    // Handle error responses with 200 status so iframe can display them
    if (response.status >= 400) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error ${response.status}</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .error-box {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              h1 { color: #dc2626; margin: 0 0 10px 0; font-size: 48px; }
              p { color: #666; font-size: 18px; }
              .code { color: #dc2626; font-weight: bold; }
              .url { color: #2563eb; word-break: break-all; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h1>⚠️ ${response.status}</h1>
              <p class="code">${response.status === 403 ? 'Access Denied' : response.status === 404 ? 'Not Found' : 'Error Loading Page'}</p>
              <p>Unable to load the requested page.</p>
              <p class="url">${url}</p>
              <p style="margin-top: 20px; font-size: 14px; color: #888;">Try opening the URL directly in a new tab.</p>
            </div>
          </body>
        </html>
      `)
    }

    let html = response.data

    // Rewrite relative URLs to absolute URLs
    html = html.replace(
      /(<link[^>]+href=["'])(?!http|\/\/|data:)([^"']+)(["'])/gi,
      `$1${targetUrl.origin}$2$3`
    )
    html = html.replace(
      /(<script[^>]+src=["'])(?!http|\/\/|data:)([^"']+)(["'])/gi,
      `$1${targetUrl.origin}$2$3`
    )
    html = html.replace(
      /(<img[^>]+src=["'])(?!http|\/\/|data:)([^"']+)(["'])/gi,
      `$1${targetUrl.origin}$2$3`
    )
    html = html.replace(
      /(<a[^>]+href=["'])(?!http|\/\/|#|mailto:|tel:)([^"']+)(["'])/gi,
      `$1${targetUrl.origin}$2$3`
    )
    html = html.replace(
      /(url\(["']?)(?!http|\/\/|data:)([^"')]+)(["']?\))/gi,
      `$1${targetUrl.origin}$2$3`
    )

    // Add base tag to handle any remaining relative URLs
    const baseTag = `<base href="${targetUrl.origin}/">`
    html = html.replace(/<head>/i, `<head>${baseTag}`)

    // Set appropriate content type
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.status(200).send(html)
  } catch (error: any) {
    console.error('Proxy error:', error)
    
    // Return a friendly error page
    const errorMessage = error.message || 'Failed to fetch website'
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proxy Error</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .error-box {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #dc2626; margin: 0 0 10px 0; font-size: 48px; }
            p { color: #666; font-size: 16px; line-height: 1.6; }
            .error-msg { color: #dc2626; font-weight: 500; font-size: 14px; background: #fee; padding: 10px; border-radius: 8px; margin: 20px 0; }
            .url { color: #2563eb; word-break: break-all; font-size: 14px; margin-top: 20px; }
            .suggestions { text-align: left; margin-top: 20px; }
            .suggestions li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="error-box">
            <h1>🚫</h1>
            <p style="font-size: 20px; font-weight: 600; color: #dc2626;">Unable to Load Website</p>
            <div class="error-msg">${errorMessage}</div>
            <p class="url">${url}</p>
            <div class="suggestions">
              <p style="font-weight: 600; color: #333;">Possible solutions:</p>
              <ul style="color: #666; font-size: 14px;">
                <li>The website may be blocking automated requests</li>
                <li>Check if the URL is correct and accessible</li>
                <li>Try switching to Static Mode to view the saved HTML</li>
                <li>Open the URL directly in a new browser tab</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(errorHtml)
  }
}
