
export function createHomePage (ctx) {
  let root = null


  function render () {
  return `
  <div class="mainPage-root">
    <section class="main-hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-icon"></span> نسخه جدید ۲.۰ منتشر شد ✨
        </div>
        <h1 class="hero-title">
          پایانِ عصرِ پراکندگی؛ <br>
          به <span class="text-gradient">سیستم عصبیِ</span> کسب‌وکار خود خوش آمدید
        </h1>
        <p class="hero-caption">
          <span class="vixora-brand">ViXoRa</span> صرفاً یک مجموعه ابزار نیست؛ یک هسته‌ی پردازشیِ بی‌نقص است که حسابداری، مدیریت و CRM شما را در یک جریانِ یکپارچه متحد می‌کند. امپراتوری خود را از یک نقطه فرماندهی کنید.
        </p>
        <div class="hero-actions">
          <a href="#" class="btn-primary">شروع رایگان</a>
          <a href="#" class="btn-glass">مشاهده دمو هوشمند</a>
        </div>
      </div>

      <div class="hero-visual">
        <div class="hero-image-wrapper">
          <img src="/src/global/images/bento.png" alt="ViXoRa Dashboard" class="hero-img">
        </div>
      </div>
    </section>

    <!-- The Eye Section -->
    <section class="main-eye">
      <div class="eye-header">
        <h2 class="eye-title">دیدِ ۳۶۰ درجه؛ فراتر از یک نظارتِ ساده</h2>
        <p class="eye-description">
          در ویکسورا، داده‌ها فقط عدد نیستند؛ آن‌ها با شما صحبت می‌کنند. با ابزارهای رصد لحظه‌ای، گلوگاه‌های کسب‌وکارتان را پیش از تبدیل شدن به بحران، شناسایی کنید.
        </p>
        <div class="eye-actions">
          <button class="btn-primary" type="button">کاوش در ابزارها</button>
          <button class="btn-glass" type="button">ابزارهای رایگان</button>
        </div>
      </div>
      
      <div class="eye-visual">
        <div class="eye-image-wrapper">
          <img class="eye-img" src="/src/global/images/eye.png" alt="ViXoRa Visual Observatory">
          <div class="eye-glow"></div>
        </div>
      </div>
    </section>

    <section class="bento-section">
        <div class="bento-header">
          <div class="bento-badge">اکوسیستم یکپارچه</div>
          <h2 class="bento-title">چهار رکنِ قدرت؛ همه در یک فرماندهیِ واحد</h2>
          <p class="bento-subtitle">
            نیازی به سوئیچ بین ده‌ها برنامه و پردازش‌های سنگین نیست. ویکسورا ابزارهای حیاتی کسب‌وکار شما را در یک معماریِ چابک و همگام گرد هم آورده است.
          </p>
        </div>

        <div class="bento-grid">
          <!-- کارت ۱: مالی (بزرگ) -->
          <div class="bento-card card-financial">
            <div class="bento-card-content">
              <div class="bento-icon">💰</div>
              <h3 class="bento-card-title">حسابداریِ خودکار و رصد نقدینگی</h3>
              <p class="bento-card-text">
                مدیریت تراکنش‌ها، صدور فاکتورهای هوشمند و تحلیل سود و زیان لحظه‌ای بدون حتی یک خطای انسانی. مالیه‌ی کسب‌وکار شما روی خلبان خودکار قرار می‌گیرد تا روی توسعه محصول تمرکز کنید.
              </p>
            </div>
            <div class="bento-card-footer">
              <span class="bento-link">مدیریت مالی ←</span>
            </div>
          </div>

          <!-- کارت ۲: CRM -->
          <div class="bento-card card-crm">
            <div class="bento-card-content">
              <div class="bento-icon">🤝</div>
              <h3 class="bento-card-title">مدیریت هوشمند مشتریان (CRM)</h3>
              <p class="bento-card-text">
                ثبت کامل تعاملات، تاریخچه خرید، دسته‌بندی خودکار مخاطبان و تبدیل ساده‌ترین سرنخ‌ها به مشتریان وفادار با تکیه بر تحلیل‌های هوشمند.
              </p>
            </div>
            <div class="bento-card-footer">
              <span class="bento-link">تحلیل رفتار ←</span>
            </div>
          </div>

          <!-- کارت ۳: پروژه‌ها -->
          <div class="bento-card card-project">
            <div class="bento-card-content">
              <div class="bento-icon">⚡</div>
              <h3 class="bento-card-title">کنترل پروژه‌ها و کارها</h3>
              <p class="bento-card-text">
                تخصیص هوشمند وظایف به اعضا و مانیتورینگ پیشرفت کارها در جریان‌های کاری منعطف.
              </p>
            </div>
            <div class="bento-card-footer">
              <span class="bento-link">مدیریت پروژه ←</span>
            </div>
          </div>

          <!-- کارت ۴: هسته پردازشی (عریض) -->
          <div class="bento-card card-engine">
            <div class="bento-card-content">
              <div class="bento-icon">🚀</div>
              <h3 class="bento-card-title">سرعتِ بنچمارک؛ معماری بدون تاخیر (Zero-Lag)</h3>
              <p class="bento-card-text">
                توسعه داده‌شده با Vanilla JS خالص؛ بارگذاری ابزارها زیر ۵۰ میلی‌ثانیه بدون هیچ فریم‌ورک سنگین. بالاترین کارایی با کمترین مصرف منابع سیستم و مرورگر برای کاربر نهایی.
              </p>
            </div>
            <div class="bento-card-footer">
              <span class="bento-link">مشاهده بنچمارک‌ها ←</span>
            </div>
          </div>
        </div>
      </section>
      </div>
  `
    
  }

  function afterRender () {
    root = document.querySelector(".mainPage-root")
    if (!root) return

    
  }

  function destroy () {

  }

  return {
    render,
    afterRender,
    destroy
  }
}