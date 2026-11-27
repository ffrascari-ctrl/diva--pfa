import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const lesson = {
  id: 'pfa-video-027',
  title: 'Inveja e inconsciente',
  summary: 'Como a inveja pode agir sem que a pessoa a reconheça em si.',
  content: '',
  video: 'https://www.youtube.com/watch?v=a77RQd0VQ8k',
  pdf: '',
  duration: '8min08s',
  pages: [],
  origin: 'aulas-gravadas',
  thumbnail: '/inveja-e-inconsciente.webp',
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'aulas-gravadas',
      transformIndexHtml(html) {
        const catalog = 'let catalog=load(STORAGE.course,null);'
        const addLesson = `CORE_COURSE.modules.find(m=>m.id===VIDEO_MODULE_ID).lessons.push(${JSON.stringify(lesson)});`
        return html
          .replace(catalog, addLesson + '\n' + catalog)
          .replace('thumb=vid?', 'thumb=l.thumbnail?escapeHtml(l.thumbnail):vid?')
      },
    },
  ],
})
