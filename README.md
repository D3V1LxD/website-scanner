# Website Scanner

A powerful Next.js application that can scan any website, clone its content, and discover all APIs and backend URLs.

## Features

- 🔍 **URL Scanning**: Enter any website URL to analyze
- 🌐 **Website Cloning**: Downloads and displays the complete HTML structure
- 🔗 **API Discovery**: Automatically detects API endpoints from JavaScript code
- 🖥️ **Backend URL Detection**: Finds backend services and external URLs
- 📦 **Resource Extraction**: Lists all scripts, stylesheets, images, and links
- 📊 **Interactive Results**: Tabbed interface to explore different aspects
- 💾 **Export Options**: Download HTML source or export results as JSON
- 👁️ **Live Preview**: View the cloned website in an iframe
- ⚡ **Dual Scan Modes**:
  - **Basic Scan**: Fast HTTP requests with enhanced headers
  - **Advanced Scan**: Full browser rendering with Puppeteer + Stealth mode

## Scanning Modes

### Basic Scan (⚡ Fast)
- Uses enhanced HTTP requests with realistic browser headers
- User-Agent rotation for better compatibility
- Multiple browser profiles (Chrome, Firefox, Safari)
- Browser-like headers (Accept-Language, DNT, Referer, etc.)
- Best for: Static websites, fast scanning, API discovery
- Speed: ~1-3 seconds

### Advanced Scan (🚀 Powerful)
- Uses Puppeteer with Stealth Plugin
- Full browser rendering (Chrome headless)
- JavaScript execution and dynamic content loading
- Real network request monitoring
- Bypasses basic bot detection
- Best for: JavaScript-heavy sites (React, Vue, Angular), protected sites
- Speed: ~10-30 seconds

## Anti-Detection Features

The scanner includes several techniques to appear more like a real browser:

1. **User-Agent Rotation**: Randomly selects from multiple modern browser User-Agents
2. **Realistic Headers**: Includes Accept-Language, DNT, Sec-Fetch-* headers
3. **Stealth Mode**: Puppeteer-extra with stealth plugin to avoid detection
4. **Network Monitoring**: Captures all XHR/Fetch requests in real-time
5. **Browser Fingerprinting**: Mimics real Chrome/Firefox behavior
6. **Connection Management**: Proper keep-alive and connection handling

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **HTML Parsing**: Cheerio
- **Browser Automation**: Puppeteer 24 with Stealth Plugin
- **UI Components**: React with custom components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### Scanning Process

1. **URL Validation**: Validates the entered URL format
2. **Content Fetching**: Downloads the website HTML using Axios
3. **HTML Parsing**: Uses Cheerio to parse and extract elements
4. **API Detection**: Analyzes JavaScript code for:
   - `fetch()` calls
   - `axios` requests
   - jQuery AJAX calls
   - XMLHttpRequest patterns
   - API-like URL patterns
5. **Resource Extraction**: Collects scripts, stylesheets, images, and links
6. **Result Display**: Shows organized results in a tabbed interface

### API Detection Patterns

The scanner looks for:
- Direct API calls: `fetch('/api/users')`
- Axios requests: `axios.get('https://api.itsmahim.me')`
- jQuery AJAX: `$.ajax({ url: '/api/data' })`
- URLs containing: `/api/`, `/graphql`, `/rest/`, `/v1/`, `.json`
- Backend domains: `api.*`, `backend.*`, `service.*`

## Features Breakdown

### 1. Main Dashboard
- Clean, modern interface with gradient background
- URL input with validation
- Loading states and error handling

### 2. Scan Results
- **Metadata Display**: Shows title, description, and URL
- **Statistics**: Quick overview of findings
- **Export Options**: Download HTML or JSON data

### 3. Tabs

#### API Endpoints Tab
- Lists all discovered API endpoints
- Copy-to-clipboard functionality
- Organized display with hover effects

#### Backend URLs Tab
- Shows backend service URLs
- Identifies external services
- Easy copying for further investigation

#### Resources Tab
- **Scripts**: All JavaScript files
- **Stylesheets**: All CSS files
- **Images**: Visual grid with thumbnails
- Scrollable sections for large lists

#### Preview Tab
- Live iframe preview of cloned website
- Toggle between preview and HTML source code
- Sandboxed for security

## API Routes

### POST `/api/scan` (Basic Mode)

Fast scanning using enhanced HTTP requests.

**Request Body:**
```json
{
  "url": "https://itsmahim.me"
}
```

**Response:**
```json
{
  "url": "https://itsmahim.me",
  "html": "<!DOCTYPE html>...",
  "apis": ["https://api.itsmahim.me/users"],
  "backendUrls": ["https://backend.itsmahim.me"],
  "scripts": ["https://itsmahim.me/script.js"],
  "stylesheets": ["https://itsmahim.me/style.css"],
  "images": ["https://itsmahim.me/image.jpg"],
  "links": ["https://itsmahim.me/about"],
  "metadata": {
    "title": "Example Site",
    "description": "Example description"
  }
}
```

### POST `/api/advanced-scan` (Advanced Mode)

Full browser rendering with network monitoring.

**Additional features:**
- Real browser rendering with Puppeteer
- JavaScript execution
- Network request interception
- Stealth mode to bypass detection

**Response includes all basic scan data plus:**
```json
{
  ...basicScanData,
  "networkRequests": ["https://api.itsmahim.me/v1/data", "..."]
}
```

## Security Considerations

- Network request monitoring respects same-origin policies
- Iframe preview is sandboxed for security
- External scripts are not executed during basic scanning
- Enhanced User-Agent and headers for legitimate scraping
- Timeout limits prevent hanging requests
- Stealth mode for bypassing basic bot detection (Advanced mode)

**Ethical Usage:**
- This tool is designed for legitimate web analysis and testing
- Always respect website Terms of Service
- Use responsibly for security research, testing, and education
- Consider rate limiting when scanning multiple URLs
- Some websites explicitly forbid automated access

## Limitations

- Cannot scan websites behind authentication
- May not detect dynamically loaded APIs (SPAs)
- CORS restrictions may prevent some scans
- Limited to client-side detectable patterns

## Future Enhancements

- [ ] Support for authenticated scanning
- [ ] Headless browser integration for SPAs
- [ ] WebSocket detection
- [ ] API endpoint testing
- [ ] Historical scan tracking
- [ ] Batch URL scanning
- [ ] Advanced filtering options
- [ ] Export to various formats (CSV, PDF)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for learning and development.

## Troubleshooting

### Common Issues

**CORS Errors**: Some websites block cross-origin requests. This is a browser security feature.

**Timeout Errors**: Large websites may take longer to load. The timeout is set to 15 seconds.

**No APIs Detected**: The website may not have client-side API calls, or they may be obfuscated.

## Support

For issues or questions, please open an issue on the repository.
