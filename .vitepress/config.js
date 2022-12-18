import { sidebarTutNFTMarket } from "./tut-sidebar"
import { sidebarGuide } from "./sidebars"
import { GuideNav, TutorialsNav } from "./nav"

export default {
  title: 'KKNOW',
  description: 'KKNOW research',
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],  
  ],
  themeConfig: {
    logo: '/logo.png',

    outline: 'deep',
    outlineTitle: 'Content',

    nav: [
      {
        text: 'Guide',
        items: GuideNav,
      },
      {
        text: 'Showcases',
        link: '/showcases', activeMatch: '/showcases'
      },
      {
        text: 'Tutorials',
        items: TutorialsNav
      }
    ],

    sidebar: {
      '/guide/':  sidebarGuide,
      '/tutorials/build-an-nft-marketplace/':sidebarTutNFTMarket     
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present Evan You'
    }
    
    
  },  
}
