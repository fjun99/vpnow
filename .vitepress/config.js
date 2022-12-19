import { GuideNav, TutorialsNav } from "./nav"
import { sidebarGuide } from "./sidebars"

// tutorial & report sidebars
import { sidebarTutNFTMarket } from "./tut-sidebar"
import { sidebarReportEIP4337 } from "./report-sidebar"

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
      '/tutorial/build-an-nft-marketplace/':sidebarTutNFTMarket,     
      '/report/eip-4337-practice':sidebarReportEIP4337  
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present Evan You'
    }
        
  },  
}
