import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FakeSign',
  description: 'Self-built Timestamp Server for Driver Signing',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  locales: {
    'zh': {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/introduction' },
          { text: '开发', link: '/zh/dev/build' },
          { text: 'GitHub', link: 'https://github.com/PIKACHUIM/FakeSign' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '入门',
              items: [
                { text: '项目介绍', link: '/zh/guide/introduction' },
                { text: '快速开始', link: '/zh/guide/quick-start' },
                { text: '驱动签名', link: '/zh/guide/driver-signing' },
              ]
            },
            {
              text: '进阶',
              items: [
                { text: '技术原理', link: '/zh/guide/principles' },
                { text: '自建服务', link: '/zh/guide/deploy-tsa' },
                { text: '免责声明', link: '/zh/guide/disclaimer' },
              ]
            }
          ],
          '/zh/dev/': [
            {
              text: '开发指南',
              items: [
                { text: '编译构建', link: '/zh/dev/build' },
                { text: 'TSA Worker 开发', link: '/zh/dev/tsa-worker' },
                { text: 'HookSigntool', link: '/zh/dev/hook-signtool' },
              ]
            }
          ]
        },
        outline: { label: '目录' },
        docFooter: { prev: '上一页', next: '下一页' },
      }
    },
    'en': {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/introduction' },
          { text: 'Dev', link: '/en/dev/build' },
          { text: 'GitHub', link: 'https://github.com/PIKACHUIM/FakeSign' },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/en/guide/introduction' },
                { text: 'Quick Start', link: '/en/guide/quick-start' },
                { text: 'Driver Signing', link: '/en/guide/driver-signing' },
              ]
            },
            {
              text: 'Advanced',
              items: [
                { text: 'Principles', link: '/en/guide/principles' },
                { text: 'Deploy TSA', link: '/en/guide/deploy-tsa' },
                { text: 'Disclaimer', link: '/en/guide/disclaimer' },
              ]
            }
          ],
          '/en/dev/': [
            {
              text: 'Development',
              items: [
                { text: 'Build', link: '/en/dev/build' },
                { text: 'TSA Worker', link: '/en/dev/tsa-worker' },
                { text: 'HookSigntool', link: '/en/dev/hook-signtool' },
              ]
            }
          ]
        },
      }
    }
  },

  themeConfig: {
    logo: '/logo.png',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/PIKACHUIM/FakeSign' }
    ],
    search: { provider: 'local' },
  },

  appearance: true, // 支持暗黑模式，默认跟随系统（light）
})
