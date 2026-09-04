// import { bootstrap } from './app.js'

// import './styles/reset.css'
// import './styles/font.css'
// import './styles/global.css'
// import './layouts/home/homeLayout.css'
// import './layouts/tools/toolsLayout.css'
// import './pages/home/home.css'
// import './pages/tools/note/note.css'
// import './pages/auth/auth.css';




// document.addEventListener("DOMContentLoaded" , () => {
//   bootstrap();
// });





// src/main.js

import { bootstrap } from './app.js';

import './styles/reset.css';
import './styles/font.css';
import './styles/global.css';
import './layouts/home/homeLayout.css';
import './layouts/tools/toolsLayout.css';
import './pages/home/home.css';
import './pages/tools/note/note.css';
import './pages/tools/customerInfo/customerInfo.css'
import './pages/auth/auth.css';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error('[App] Bootstrap failed:', error);

    const root = document.getElementById('app');

    if (root) {
      root.innerHTML = `
        <section style="padding:40px;text-align:center">
          <h1>خطا در راه‌اندازی برنامه</h1>
          <p>لطفاً Console مرورگر را بررسی کنید.</p>
        </section>
      `;
    }
  }
});
