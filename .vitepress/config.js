const Guide = [
    { text: 'VitePress Tutorial', link: 'tut' },
    { text: 'What is VitePress?', link: '/guide/what-is-vitepress' },
    { text: 'Getting Started', link: '/guide/getting-started' },
    { text: 'Configuration', link: '/guide/configuration' },
    { text: 'Deploying', link: '/guide/deploying' },
  ]

export default {
  title: 'KKNOW',
  description: 'KKNOW research',
  appearance: 'dark',
  head: [
  ],
  themeConfig: {
    logo: '/logo.png',

    outline: 'deep',
    outlineTitle: 'Content',

    nav: [
      {
        text: 'Guide',
        items: Guide,
      },
      {
        text: 'Showcases',
        link: '/showcases', activeMatch: '/showcases'
      }
    ],

    sidebar: {
      '/guide/':  sidebarGuide(),      
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present Evan You'
    }
    
    
  },  
}


function sidebarGuide() {
  return [
    {
      text: 'VitePress',
      collapsible: false,
      items: [
        { text: 'What is VitePress?', link: '/guide/what-is-vitepress' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Configuration', link: '/guide/configuration' },
        { text: 'Deploying', link: '/guide/deploying' }
      ]
    }
  ]
}