import { bootstrap } from './app.js'

import './styles/reset.css'
import './styles/font.css'
import './styles/global.css'
import './layouts/home/homeLayout.css'
import './layouts/tools/toolsLayout.css'
import './pages/home/home.css'
import './pages/tools/note/note.css'
import './pages/auth/auth.css';
import './layouts/dashboard/dashboardLayout.css'




// // document.addEventListener("DOMContentLoaded" , () => {
// //   bootstrap();
// // });





// src/main.js

// import { bootstrap } from './app.js';

// import './styles/reset.css';
// import './styles/font.css';
// import './styles/global.css';
// import './layouts/home/homeLayout.css';
// import './layouts/tools/toolsLayout.css';
// import './pages/home/home.css';
// import './pages/tools/note/note.css';
// import './pages/tools/customerInfo/customerInfo.css'
// import './pages/auth/auth.css';

// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     await bootstrap();
//   } catch (error) {
//     console.error('[App] Bootstrap failed:', error);

//     const root = document.getElementById('app');

//     if (root) {
//       root.innerHTML = `
//         <section style="padding:40px;text-align:center">
//           <h1>خطا در راه‌اندازی برنامه</h1>
//           <p>لطفاً Console مرورگر را بررسی کنید.</p>
//         </section>
//       `;
//     }
//   }
// });


// import { bootstrap } from './app.js';
// import './styles/global.css'; // فقط استایل‌های گلوبال و پایه

/**
 * راه‌اندازی امن اپلیکیشن همراه با Fallback UI در صورت بروز خطای بحرانی
 */
async function initApp() {
  try {
    await bootstrap();
  } catch (error) {
    console.error('[App] Critical Bootstrap Failure:', error);

    // Fallback UI در صورت بروز خطای مرگبار در لود اپلیکیشن
    const root = document.getElementById('app');
    if (root) {
      root.innerHTML = `
        <main style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; text-align:center; padding:20px;">
          <h1 style="color:#e11d48; margin-bottom:8px;">خطا در راه‌اندازی برنامه</h1>
          <p style="color:#64748b; max-width:400px; line-height:1.6;">
            متأسفانه در راه‌اندازی سیستم مشکلی پیش آمده است. لطفاً صفحه را رفرش کنید یا با پشتیبانی تماس بگیرید.
          </p>
        </main>
      `;
    }
  }
}

// چک کردن وضعیت آماده بودن DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
  // اگر در این ماژول از Top-Level Await پشتیبانی می‌شود، یا به صورت مستقیم:
  initApp();
}


// import x from './app'


// const xx = await x('2')
// console.log(xx.default);

// const routes = {
//   load: async () => {
//     await import('./styles/global.css')

//     const module = await import('./app.js')

//     return module.default || module
//   }
// }


// const com = await routes.load()
// console.log(com);


// const i = await com.y('2')
// console.log(i.render());


// const x = {
//   component : () => import('./app.js')
// }

// const yy = x.component
// console.log(yy);

// const t = await 


