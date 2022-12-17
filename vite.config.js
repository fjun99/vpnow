import WindiCSS from 'vite-plugin-windicss'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default {
  plugins: [
    Components({
      dirs: [
        './.vitepress/theme/components',
        // './.vitepress/@slidev/client/builtin',
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