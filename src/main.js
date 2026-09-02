import { bootstrap } from './app.js'

import './styles/reset.css'
import './styles/font.css'
import './styles/global.css'
import './layouts/home/homeLayout.css'
import './layouts/tools/toolsLayout.css'
import './pages/home/home.css'
import './pages/tools/note/note.css'



document.addEventListener("DOMContentLoaded" , () => {
  bootstrap();
});