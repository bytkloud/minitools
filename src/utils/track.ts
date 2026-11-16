type Event = { type: 'pageview' | 'download'; path: string; tool?: string; format?: string; ref?: string }

function send(e: Event) {
  try {
    const body = JSON.stringify(e)
    if (!navigator.sendBeacon?.('/api/e', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/e', { method: 'POST', body, keepalive: true }).catch(() => {})
    }
  } catch { /* analytics must never break the app */ }
}

export function trackPageview(path: string) {
  let ref = ''
  try { ref = document.referrer ? new URL(document.referrer).hostname : '' } catch { /* ignore */ }
  if (ref === location.hostname) ref = ''
  send({ type: 'pageview', path, ref })
}

export function trackDownload(format: 'docx' | 'pdf') {
  send({ type: 'download', path: location.pathname, tool: location.pathname.replace(/^\/|\/$/g, ''), format })
}
