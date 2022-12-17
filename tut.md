# vitepress tutorial

[[toc]]

## 1. init project

### 1.1 install 

- `yarn init -y`
- `yarn add --dev vitepress vue`


```json
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs"
  },  
```

### 1.2 docs

index.md
public/logo.png


### 1.3 config <Badge type="tip" text="config" />

```js
const Guide = [
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

    nav: [
      {
        text: 'Guide',
        items: Guide,
      },
    ],

    sidebar: {
    },
  },  
}
```

### 1.4 themes

extending [link](https://vitepress.vuejs.org/guide/theme-introduction#extending-the-default-theme)

```js
// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import ShowCases from './components/ShowCases.vue'
import ShowCaseInfo from './components/ShowCaseInfo.vue'

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
```

### 1.5 docs

```
tree -a -I 'node_modules|cache|.DS_Store|yarn.lock'
```

```
.
├── .vitepress
│   ├── config.js
│   ├── showcases.ts
│   └── theme
│       ├── components
│       │   ├── ShowCaseInfo.vue
│       │   └── ShowCases.vue
│       └── index.js
├── index.md
├── package.json
└── public
    └── logo.png
```

## 2. theme and css

### 2.1 windicss

`vite-plugin-windicss` https://windicss.org/integrations/vite.html

```
yarn add --dev vite-plugin-windicss windicss
```

### 2.2 windi.config.js

```js
import { defineConfig } from 'vite-plugin-windicss'
import aspectRatio from 'windicss/plugin/aspect-ratio'

export default defineConfig({
  extract: {
    include: [
      '**/*.md',
      '.vitepress/theme/**/*.{md,vue}',
      // '.vitepress/@slidev/client/internals/SlideContainer.vue',
      // '.vitepress/@slidev/client/layouts/*.vue',
      // '.vitepress/@slidev/theme-default/layouts/*.vue',
    ]
  },
  attributify: true,
  plugins: [
    aspectRatio,
  ],
  shortcuts: {
    'bg-main': 'bg-white dark:bg-[#111]',
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3AB9D4',
          deep: '#2082A6',
        },
      },
      fontFamily: {
        mono: '\'IBM Plex Mono\', source-code-pro, Menlo, Monaco, Consolas, \'Courier New\', monospace',
      },
    },
  },
})
```


### 2.2 icon and plugins

install

```
yarn add --dev unplugin-vue-components
yarn add --dev unplugin-icons
yarn add --dev @iconify/json
```

vite.config

```js
import WindiCSS from 'vite-plugin-windicss'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default {
  plugins: [
    Components({
      dirs: [
        './.vitepress/theme/components',
        './.vitepress/@slidev/client/builtin',
      ],
      extensions: ['vue', 'md'],
      include: [
        /\.(vue|md)$/,
      ],
      resolvers: [
        IconsResolver({
          prefix: '',
        }),
      ],
    }),
    Icons(),
    WindiCSS({preflight: false,}),
  ],
}
```
