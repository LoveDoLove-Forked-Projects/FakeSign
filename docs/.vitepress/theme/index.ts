import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    // Auto-redirect to locale based on browser language (client-side only)
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      // Only redirect from root
      if (path === '/' || path === '/index.html') {
        const lang = navigator.language || 'en'
        if (lang.startsWith('zh')) {
          window.location.replace('/zh/')
        } else {
          window.location.replace('/en/')
        }
      }
    }
  }
}
