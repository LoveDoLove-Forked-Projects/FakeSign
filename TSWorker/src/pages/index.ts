/**
 * Index page - Timestamp Authority Service
 * Supports: i18n (EN/ZH), Light/Dark theme toggle
 * Default: browser language + light mode
 */

export const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timestamp Authority Service</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-card: #ffffff;
      --bg-card-hover: #f1f5f9;
      --border-color: #e2e8f0;
      --border-glow: #3b82f6;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --accent-blue: #3b82f6;
      --accent-cyan: #0891b2;
      --accent-purple: #7c3aed;
      --accent-green: #059669;
      --accent-amber: #d97706;
      --gradient-main: linear-gradient(135deg, #3b82f6, #8b5cf6);
      --gradient-subtle: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06));
      --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --shadow-card-hover: 0 10px 25px rgba(0,0,0,0.08);
      --grid-color: rgba(59,130,246,0.04);
      --glow-color: rgba(59,130,246,0.05);
      --code-bg: #f1f5f9;
      --font-heading: 'Space Grotesk', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --radius: 12px;
      --radius-sm: 8px;
    }

    [data-theme="dark"] {
      --bg-primary: #0a0e17;
      --bg-secondary: #111827;
      --bg-card: #1a2332;
      --bg-card-hover: #1f2b3d;
      --border-color: #2d3a4d;
      --border-glow: #3b82f6;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-blue: #60a5fa;
      --accent-cyan: #22d3ee;
      --accent-purple: #a78bfa;
      --accent-green: #34d399;
      --accent-amber: #fbbf24;
      --gradient-main: linear-gradient(135deg, #3b82f6, #8b5cf6);
      --gradient-subtle: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1));
      --shadow-card: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-card-hover: 0 10px 25px rgba(0,0,0,0.4);
      --grid-color: rgba(59,130,246,0.03);
      --glow-color: rgba(59,130,246,0.08);
      --code-bg: #111827;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-heading);
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.6;
      transition: background 0.3s ease, color 0.3s ease;
    }

    .bg-grid {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(var(--grid-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
      z-index: 0;
    }

    .bg-glow {
      position: fixed;
      top: -30%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 600px;
      background: radial-gradient(ellipse, var(--glow-color) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 24px 60px;
    }

    /* Toolbar */
    .toolbar {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeInDown 0.6s ease-out;
    }

    .toolbar-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-card);
    }

    .toolbar-btn:hover {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
      transform: translateY(-1px);
      box-shadow: var(--shadow-card-hover);
    }

    .toolbar-btn svg {
      width: 18px;
      height: 18px;
    }

    .lang-btn {
      width: auto;
      padding: 0 12px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: var(--font-heading);
      letter-spacing: 0.02em;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 40px;
      animation: fadeInDown 0.8s ease-out;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: var(--gradient-subtle);
      border: 1px solid var(--border-color);
      border-radius: 100px;
      font-size: 0.8rem;
      color: var(--accent-blue);
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .header-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--accent-green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .header h1 {
      font-size: clamp(2.2rem, 5vw, 3.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 16px;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      max-width: 580px;
      margin: 0 auto;
      font-weight: 300;
    }

    /* Feature grid */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 36px;
      animation: fadeInUp 0.8s ease-out 0.2s both;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 22px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    .feature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--gradient-main);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .feature-card:hover {
      background: var(--bg-card-hover);
      border-color: rgba(59,130,246,0.3);
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-hover);
    }

    .feature-card:hover::before {
      opacity: 1;
    }

    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .feature-icon.blue { background: rgba(59,130,246,0.12); color: var(--accent-blue); }
    .feature-icon.purple { background: rgba(124,58,237,0.12); color: var(--accent-purple); }
    .feature-icon.cyan { background: rgba(8,145,178,0.12); color: var(--accent-cyan); }
    .feature-icon.green { background: rgba(5,150,105,0.12); color: var(--accent-green); }
    .feature-icon.amber { background: rgba(217,119,6,0.12); color: var(--accent-amber); }

    .feature-card h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .feature-card p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Algorithm section */
    .algo-section {
      margin-bottom: 36px;
      animation: fadeInUp 0.8s ease-out 0.4s both;
    }

    .algo-section h2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .algo-group {
      margin-bottom: 14px;
    }

    .algo-group-title {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .algo-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .algo-tag {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--text-secondary);
      transition: all 0.2s ease;
      font-weight: 400;
      box-shadow: var(--shadow-card);
    }

    .algo-tag:hover {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .algo-tag.highlight {
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }

    /* Usage section */
    .usage-section {
      animation: fadeInUp 0.8s ease-out 0.6s both;
      margin-bottom: 36px;
    }

    .usage-section h2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .code-block {
      background: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 20px;
      overflow-x: auto;
      position: relative;
      margin-bottom: 12px;
    }

    .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }

    .code-block-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 500;
    }

    .code-block-badge {
      font-size: 0.7rem;
      padding: 3px 8px;
      background: rgba(5,150,105,0.1);
      color: var(--accent-green);
      border-radius: 4px;
      font-weight: 500;
    }

    .code-block code {
      font-family: var(--font-mono);
      font-size: 0.825rem;
      line-height: 1.7;
      color: var(--text-secondary);
    }

    .code-block .cmd { color: var(--accent-cyan); }
    .code-block .arg { color: var(--accent-purple); }
    .code-block .url { color: var(--accent-green); }
    .code-block .comment { color: var(--text-muted); font-style: italic; }

    /* API table */
    .api-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    .api-table th,
    .api-table td {
      text-align: left;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.875rem;
    }

    .api-table th {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .api-table td { color: var(--text-secondary); }
    .api-table .method { font-family: var(--font-mono); font-weight: 500; color: var(--accent-amber); font-size: 0.8rem; }
    .api-table .path { font-family: var(--font-mono); color: var(--accent-cyan); font-size: 0.8rem; }

    /* Footer */
    .footer {
      text-align: center;
      padding-top: 28px;
      border-top: 1px solid var(--border-color);
      animation: fadeInUp 0.8s ease-out 0.8s both;
    }

    .footer p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .footer a {
      color: var(--accent-blue);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer a:hover { color: var(--accent-cyan); }

    /* Animations */
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .container { padding: 32px 16px 48px; }
      .features { grid-template-columns: 1fr; }
      .feature-card { padding: 18px; }
      .code-block { padding: 14px; }
      .api-table { font-size: 0.8rem; }
      .api-table th, .api-table td { padding: 8px 12px; }
      .toolbar { top: 12px; right: 12px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="bg-glow"></div>

  <!-- Toolbar: Theme & Language -->
  <div class="toolbar">
    <button class="toolbar-btn lang-btn" id="langToggle" onclick="toggleLang()" title="Switch Language">EN</button>
    <button class="toolbar-btn" id="themeToggle" onclick="toggleTheme()" title="Toggle Theme">
      <svg id="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      <svg id="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
    </button>
  </div>

  <div class="container">
    <header class="header">
      <div class="header-badge">
        <span data-i18n="badge">Service Active</span>
      </div>
      <h1 data-i18n="title">Timestamp Authority</h1>
      <p data-i18n="subtitle">RFC 3161 & Authenticode compatible timestamp signing service, supporting multiple cryptographic algorithms. Powered by Cloudflare Workers.</p>
    </header>

    <section class="features">
      <div class="feature-card">
        <div class="feature-icon blue">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 data-i18n="feat1_title">Dual Protocol Support</h3>
        <p data-i18n="feat1_desc">Fully compatible with RFC 3161 Timestamp Protocol and Microsoft Authenticode legacy format for PE/DLL code signing.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon cyan">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <h3 data-i18n="feat2_title">Custom Time &amp; Edge</h3>
        <p data-i18n="feat2_desc">Custom signing time via URL path. Deployed on Cloudflare Workers edge network with global low-latency and zero cold start.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon amber">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 7h3a5 5 0 015 5 5 5 0 01-5 5h-3m-6 0H6a5 5 0 01-5-5 5 5 0 015-5h3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <h3 data-i18n="feat3_title">Multi-Algorithm</h3>
        <p data-i18n="feat3_desc">Supports RSA (2048/3072/4096), ECC (P-256/P-384/P-521), SM2 with SHA-1/SHA-2/SM3 hash algorithms.</p>
      </div>
    </section>

    <section class="algo-section">
      <h2 data-i18n="algo_title">Supported Algorithms</h2>
      <div class="algo-group">
        <div class="algo-group-title" data-i18n="algo_hash">Hash / Digest</div>
        <div class="algo-tags">
          <span class="algo-tag">SHA-1</span>
          <span class="algo-tag">SHA-256</span>
          <span class="algo-tag">SHA-384</span>
          <span class="algo-tag">SHA-512</span>
          <span class="algo-tag highlight">SM3</span>
        </div>
      </div>
      <div class="algo-group">
        <div class="algo-group-title" data-i18n="algo_sign">Signing / Encryption</div>
        <div class="algo-tags">
          <span class="algo-tag">RSA 2048</span>
          <span class="algo-tag">RSA 3072</span>
          <span class="algo-tag">RSA 4096</span>
          <span class="algo-tag">ECC P-256</span>
          <span class="algo-tag">ECC P-384</span>
          <span class="algo-tag">ECC P-521</span>
          <span class="algo-tag highlight">SM2</span>
        </div>
      </div>
    </section>

    <section class="usage-section">
      <h2 data-i18n="api_title">API Endpoints</h2>

      <table class="api-table">
        <thead>
          <tr>
            <th data-i18n="col_method">Method</th>
            <th data-i18n="col_path">Path</th>
            <th data-i18n="col_desc">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="method">GET</td>
            <td class="path">/</td>
            <td data-i18n="api_index">Service info page</td>
          </tr>
          <tr>
            <td class="method">GET</td>
            <td class="path">/info</td>
            <td data-i18n="api_info">Service configuration (JSON)</td>
          </tr>
          <tr>
            <td class="method">GET</td>
            <td class="path">/health</td>
            <td data-i18n="api_health">Health check endpoint</td>
          </tr>
          <tr>
            <td class="method">POST</td>
            <td class="path">/</td>
            <td data-i18n="api_ts_real">Timestamp request (real time)</td>
          </tr>
          <tr>
            <td class="method">POST</td>
            <td class="path">/{datetime}</td>
            <td data-i18n="api_ts_fake">Timestamp request (custom time)</td>
          </tr>
        </tbody>
      </table>

      <div class="code-block">
        <div class="code-block-header">
          <span class="code-block-label">RFC 3161 Signing</span>
          <span class="code-block-badge">signtool</span>
        </div>
        <code>
<span class="comment" data-i18n="code_comment1"># Sign with real timestamp</span><br>
<span class="cmd">signtool</span> sign <span class="arg">/tr</span> <span class="url domain-url">http://your-domain/</span> <span class="arg">/td</span> SHA256 <span class="arg">/fd</span> SHA256 <span class="arg">/f</span> cert.pfx file.exe<br><br>
<span class="comment" data-i18n="code_comment2"># Sign with custom timestamp (fake time)</span><br>
<span class="cmd">signtool</span> sign <span class="arg">/tr</span> <span class="url domain-url-fake">http://your-domain/2020-01-01T00:00:00</span> <span class="arg">/td</span> SHA256 <span class="arg">/fd</span> SHA256 <span class="arg">/f</span> cert.pfx file.exe
        </code>
      </div>

      <div class="code-block">
        <div class="code-block-header">
          <span class="code-block-label">Authenticode Signing</span>
          <span class="code-block-badge">legacy</span>
        </div>
        <code>
<span class="comment" data-i18n="code_comment3"># Legacy Authenticode timestamp (SHA-1)</span><br>
<span class="cmd">signtool</span> sign <span class="arg">/t</span> <span class="url domain-url">http://your-domain/</span> <span class="arg">/f</span> cert.pfx file.exe<br><br>
<span class="comment" data-i18n="code_comment4"># Authenticode with custom time</span><br>
<span class="cmd">signtool</span> sign <span class="arg">/t</span> <span class="url domain-url-fake">http://your-domain/2020-06-15T12:00:00</span> <span class="arg">/f</span> cert.pfx file.exe
        </code>
      </div>

      <div class="code-block">
        <div class="code-block-header">
          <span class="code-block-label">cURL</span>
          <span class="code-block-badge">http</span>
        </div>
        <code>
<span class="comment" data-i18n="code_comment5"># RFC 3161 request</span><br>
<span class="cmd">curl</span> <span class="arg">-X POST</span> <span class="arg">-H</span> "Content-Type: application/timestamp-query" \\<br>
&nbsp;&nbsp;&nbsp;&nbsp; <span class="arg">--data-binary</span> @request.tsq <span class="url domain-url">http://your-domain/</span> \\<br>
&nbsp;&nbsp;&nbsp;&nbsp; <span class="arg">-o</span> response.tsr
        </code>
      </div>
    </section>

    <section class="usage-section">
      <h2 data-i18n="env_title">Environment Variables</h2>
      <table class="api-table">
        <thead>
          <tr>
            <th data-i18n="col_var">Variable</th>
            <th data-i18n="col_required">Required</th>
            <th data-i18n="col_desc">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="path">TSA_CERT</td>
            <td data-i18n="yes">Yes</td>
            <td data-i18n="env_cert">PEM-encoded TSA certificate</td>
          </tr>
          <tr>
            <td class="path">TSA_KEYS</td>
            <td data-i18n="yes">Yes</td>
            <td data-i18n="env_key">PEM-encoded private key (PKCS#8)</td>
          </tr>
          <tr>
            <td class="path">TSA_TYPE</td>
            <td data-i18n="no">No</td>
            <td data-i18n="env_keytype">Key type: RSA, EC-P256, EC-P384, EC-P521, SM2 (default: RSA)</td>
          </tr>
          <tr>
            <td class="path">TSA_FAKE</td>
            <td data-i18n="no">No</td>
            <td data-i18n="env_faketime">Allow custom timestamp: "true" or "false" (default: "false")</td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer class="footer">
      <p data-i18n="footer">Timestamp Authority Service &middot; <a href="https://github.com/PIKACHUIM/FakeSign" target="_blank" rel="noopener">Open Source</a> &middot; Built with <a href="https://hono.dev" target="_blank" rel="noopener">Hono</a> on <a href="https://workers.cloudflare.com" target="_blank" rel="noopener">Cloudflare Workers</a></p>
    </footer>
  </div>

  <script>
    // i18n translations
    const i18n = {
      en: {
        badge: 'Service Active',
        title: 'Timestamp Authority',
        subtitle: 'RFC 3161 & Authenticode compatible timestamp signing service, supporting multiple cryptographic algorithms. Powered by Cloudflare Workers.',
        feat1_title: 'Dual Protocol Support',
        feat1_desc: 'Fully compatible with RFC 3161 Timestamp Protocol and Microsoft Authenticode legacy format for PE/DLL code signing.',
        feat2_title: 'Custom Time & Edge',
        feat2_desc: 'Custom signing time via URL path. Deployed on Cloudflare Workers edge network with global low-latency and zero cold start.',
        feat3_title: 'Multi-Algorithm',
        feat3_desc: 'Supports RSA (2048/3072/4096), ECC (P-256/P-384/P-521), SM2 with SHA-1/SHA-2/SM3 hash algorithms.',
        algo_title: 'Supported Algorithms',
        algo_hash: 'Hash / Digest',
        algo_sign: 'Signing / Encryption',
        api_title: 'API Endpoints',
        col_method: 'Method',
        col_path: 'Path',
        col_desc: 'Description',
        col_var: 'Variable',
        col_required: 'Required',
        api_index: 'Service info page',
        api_info: 'Service configuration (JSON)',
        api_health: 'Health check endpoint',
        api_ts_real: 'Timestamp request (real time)',
        api_ts_fake: 'Timestamp request (custom time)',
        code_comment1: '# Sign with real timestamp',
        code_comment2: '# Sign with custom timestamp (fake time)',
        code_comment3: '# Legacy Authenticode timestamp (SHA-1)',
        code_comment4: '# Authenticode with custom time',
        code_comment5: '# RFC 3161 request',
        env_title: 'Environment Variables',
        env_cert: 'PEM-encoded TSA certificate',
        env_key: 'PEM-encoded private key (PKCS#8)',
        env_keytype: 'Key type: RSA, EC-P256, EC-P384, EC-P521, SM2 (default: RSA)',
        env_faketime: 'Allow custom timestamp: "true" or "false" (default: "false")',
        yes: 'Yes',
        no: 'No',
        footer: 'Timestamp Authority Service &middot; <a href="https://github.com/PIKACHUIM/FakeSign" target="_blank" rel="noopener">Open Source</a> &middot; Built with <a href="https://hono.dev" target="_blank" rel="noopener">Hono</a> on <a href="https://workers.cloudflare.com" target="_blank" rel="noopener">Cloudflare Workers</a>',
      },
      zh: {
        badge: '\u670d\u52a1\u8fd0\u884c\u4e2d',
        title: '\u65f6\u95f4\u6233\u7b7e\u540d\u670d\u52a1',
        subtitle: '\u517c\u5bb9 RFC 3161 \u548c Authenticode \u534f\u8bae\u7684\u65f6\u95f4\u6233\u7b7e\u540d\u670d\u52a1\uff0c\u652f\u6301\u591a\u79cd\u52a0\u5bc6\u7b97\u6cd5\u3002\u57fa\u4e8e Cloudflare Workers \u8fb9\u7f18\u8ba1\u7b97\u5e73\u53f0\u3002',
        feat1_title: '\u53cc\u534f\u8bae\u652f\u6301',
        feat1_desc: '\u5b8c\u5168\u517c\u5bb9 RFC 3161 \u65f6\u95f4\u6233\u534f\u8bae\u548c Microsoft Authenticode \u65e7\u7248\u683c\u5f0f\uff0c\u9002\u7528\u4e8e PE/DLL \u4ee3\u7801\u7b7e\u540d\u3002',
        feat2_title: '\u81ea\u5b9a\u4e49\u65f6\u95f4 & \u8fb9\u7f18\u8ba1\u7b97',
        feat2_desc: '\u652f\u6301\u901a\u8fc7 URL \u8def\u5f84\u6307\u5b9a\u7b7e\u540d\u65f6\u95f4\u3002\u90e8\u7f72\u5728 Cloudflare Workers \u5168\u7403\u8fb9\u7f18\u7f51\u7edc\uff0c\u4f4e\u5ef6\u8fdf\u3001\u96f6\u51b7\u542f\u52a8\u3002',
        feat3_title: '\u591a\u7b97\u6cd5\u652f\u6301',
        feat3_desc: '\u652f\u6301 RSA (2048/3072/4096)\u3001ECC (P-256/P-384/P-521)\u3001SM2\uff0c\u4ee5\u53ca SHA-1/SHA-2/SM3 \u6458\u8981\u7b97\u6cd5\u3002',
        algo_title: '\u652f\u6301\u7684\u7b97\u6cd5',
        algo_hash: '\u6458\u8981\u7b97\u6cd5',
        algo_sign: '\u7b7e\u540d / \u52a0\u5bc6\u7b97\u6cd5',
        api_title: 'API \u63a5\u53e3',
        col_method: '\u65b9\u6cd5',
        col_path: '\u8def\u5f84',
        col_desc: '\u8bf4\u660e',
        col_var: '\u53d8\u91cf\u540d',
        col_required: '\u5fc5\u586b',
        api_index: '\u670d\u52a1\u4ecb\u7ecd\u9875\u9762',
        api_info: '\u670d\u52a1\u914d\u7f6e\u4fe1\u606f (JSON)',
        api_health: '\u5065\u5eb7\u68c0\u67e5\u7aef\u70b9',
        api_ts_real: '\u65f6\u95f4\u6233\u8bf7\u6c42\uff08\u771f\u5b9e\u65f6\u95f4\uff09',
        api_ts_fake: '\u65f6\u95f4\u6233\u8bf7\u6c42\uff08\u81ea\u5b9a\u4e49\u65f6\u95f4\uff09',
        code_comment1: '# \u4f7f\u7528\u771f\u5b9e\u65f6\u95f4\u7b7e\u540d',
        code_comment2: '# \u4f7f\u7528\u81ea\u5b9a\u4e49\u65f6\u95f4\u7b7e\u540d\uff08\u4f2a\u9020\u65f6\u95f4\uff09',
        code_comment3: '# \u65e7\u7248 Authenticode \u65f6\u95f4\u6233 (SHA-1)',
        code_comment4: '# Authenticode \u81ea\u5b9a\u4e49\u65f6\u95f4',
        code_comment5: '# RFC 3161 \u8bf7\u6c42',
        env_title: '\u73af\u5883\u53d8\u91cf',
        env_cert: 'PEM \u683c\u5f0f\u7684 TSA \u8bc1\u4e66',
        env_key: 'PEM \u683c\u5f0f\u7684\u79c1\u94a5\uff08PKCS#8\uff09',
        env_keytype: '\u5bc6\u94a5\u7c7b\u578b: RSA, EC-P256, EC-P384, EC-P521, SM2\uff08\u9ed8\u8ba4: RSA\uff09',
        env_faketime: '\u5141\u8bb8\u81ea\u5b9a\u4e49\u65f6\u95f4\u6233: "true" \u6216 "false"\uff08\u9ed8\u8ba4: "false"\uff09',
        yes: '\u662f',
        no: '\u5426',
        footer: '\u65f6\u95f4\u6233\u7b7e\u540d\u670d\u52a1 &middot; <a href="https://github.com/PIKACHUIM/FakeSign" target="_blank" rel="noopener">\u5f00\u6e90\u4ee3\u7801</a> &middot; \u57fa\u4e8e <a href="https://hono.dev" target="_blank" rel="noopener">Hono</a> \u6784\u5efa\uff0c\u8fd0\u884c\u4e8e <a href="https://workers.cloudflare.com" target="_blank" rel="noopener">Cloudflare Workers</a>',
      }
    };

    let currentLang = 'en';
    let currentTheme = 'light';

    // Detect browser language
    function detectLang() {
      const lang = navigator.language || navigator.userLanguage || 'en';
      return lang.startsWith('zh') ? 'zh' : 'en';
    }

    // Apply language
    function applyLang(lang) {
      currentLang = lang;
      const texts = i18n[lang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key] !== undefined) {
          if (el.tagName === 'P' && key === 'footer' || key === 'footer') {
            el.innerHTML = texts[key];
          } else {
            el.textContent = texts[key];
          }
        }
      });
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
      document.getElementById('langToggle').textContent = lang === 'zh' ? '\u4e2d' : 'EN';
      localStorage.setItem('tsa-lang', lang);
    }

    // Toggle language
    function toggleLang() {
      const newLang = currentLang === 'en' ? 'zh' : 'en';
      applyLang(newLang);
    }

    // Apply theme
    function applyTheme(theme) {
      currentTheme = theme;
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('icon-sun').style.display = 'none';
        document.getElementById('icon-moon').style.display = 'block';
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('icon-sun').style.display = 'block';
        document.getElementById('icon-moon').style.display = 'none';
      }
      localStorage.setItem('tsa-theme', theme);
    }

    // Toggle theme
    function toggleTheme() {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    }

    // Initialize on load
    (function init() {
      // Theme: default light
      const savedTheme = localStorage.getItem('tsa-theme') || 'light';
      applyTheme(savedTheme);

      // Language: saved > browser detect
      const savedLang = localStorage.getItem('tsa-lang') || detectLang();
      applyLang(savedLang);

      // Replace domain placeholders with actual origin
      const origin = window.location.origin;
      document.querySelectorAll('.domain-url').forEach(el => {
        el.textContent = origin + '/';
      });
      document.querySelectorAll('.domain-url-fake').forEach(el => {
        const text = el.textContent || '';
        el.textContent = text.replace(/http:\\/\\/your-domain/, origin);
      });
    })();
  </script>
</body>
</html>`;
