// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import './custom.css'

import ShowCases from './components/ShowCases.vue'
import ShowCaseInfo from './components/ShowCaseInfo.vue'

import 'virtual:windi.css'
// import 'windi-base.css'
// import 'windi-components.css'
// import 'windi-utilities.css'

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    // extend default theme custom behaviour.
    DefaultTheme.enhanceApp(ctx)

    // register your custom global components
    ctx.app.component('ShowCases',ShowCases /* ... */)
    ctx.app.component('ShowCaseInfo',ShowCaseInfo /* ... */)
  }
}