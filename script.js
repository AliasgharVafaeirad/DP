// script.js
document.addEventListener('DOMContentLoaded', function () {

  /* ==========================
     1) NAV: مخفی/نمایان شدن در دسکتاپ فقط
     ========================== */

  (function setupNavObserverResponsive() {
    const nav = document.querySelector('.nav');
    const kalu = document.querySelector('.kalu-magazine');
    if (!nav || !kalu) return;

    let io = null;
    const mql = window.matchMedia('(min-width: 769px)'); // مطابقت با @media شما

    function createObserver() {
      if (io) return; // قبلاً ساخته شده
      io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) nav.classList.add('hidden');
          else nav.classList.remove('hidden');
        });
      }, { root: null, threshold: 0.08 });
      io.observe(kalu);
    }

    function destroyObserver() {
      if (io) {
        io.disconnect();
        io = null;
      }
      // وقتی موبایل/کوچکتر شد مطمئن شو nav دیده می‌شه
      nav.classList.remove('hidden');
    }

    // اجرا بر اساس حالت اولیه
    if (mql.matches) createObserver();
    else destroyObserver();

    // پاسخ به تغییر viewport
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', (e) => {
        if (e.matches) createObserver();
        else destroyObserver();
      });
    } else {
      // fallback برای مرورگرهای قدیمی
      mql.addListener((e) => {
        if (e.matches) createObserver();
        else destroyObserver();
      });
    }
  })();


  /* ==========================
     2) KALU MAGAZINE SLIDER
     ========================== */

  (function setupMagazineSlider() {
    const section = document.querySelector('.kalu-magazine');
    if (!section) return; // اگر مجله در صفحه نیست کاری انجام نده

    // پیکره‌بندی اسلایدها (در صورت نیاز این آرایه را از سرور/HTML تولیدی کنید)
    const slides = [
      { src: 'img/magazine/slide1.svg', alt: 'عکس مقاله اول', title: 'عنوان مقاله اول' },
      { src: 'img/magazine/slide2.svg', alt: 'عکس مقاله دوم', title: 'عنوان مقاله دوم' },
      { src: 'img/magazine/slide3.svg', alt: 'عکس مقاله سوم', title: 'عنوان مقاله سوم' }
    ];

    const imgEl = section.querySelector('.magazine-img img');
    const caption = section.querySelector('.magazine-content p');
    const btnRight = section.querySelector('.right-arrow');   // معمولاً برای اسلاید بعدی
    const btnLeft = section.querySelector('.left-arow');     // معمولاً برای اسلاید قبلی

    // اگر تصویر اصلی وجود نداشته باشه، دکمه‌ها رو مخفی کن و خارج شو
    if (!imgEl || slides.length === 0) {
      if (btnRight) btnRight.style.display = 'none';
      if (btnLeft) btnLeft.style.display = 'none';
      return;
    }

    // پیش‌بارگذاری تصاویر
    slides.forEach(s => {
      const i = new Image();
      i.src = s.src;
    });

    let current = 0;
    let animating = false;
    const TRANS_MS = 300;

    function setSlideImmediate(index) {
      const idx = (index + slides.length) % slides.length;
      imgEl.src = slides[idx].src;
      imgEl.alt = slides[idx].alt || slides[idx].title || '';
      if (caption) caption.textContent = slides[idx].title || '';
      current = idx;
    }

    function goTo(index) {
      if (animating) return;
      const newIndex = (index + slides.length) % slides.length;
      if (newIndex === current) return;
      animating = true;

      // کلاس fading در CSS تعریف شده تا opacity انیمیشن بده
      imgEl.classList.add('fading');

      // بعد از بخش کوچکی از زمان، منبع تصویر را عوض کن و دوباره نمایش بده
      setTimeout(() => {
        imgEl.src = slides[newIndex].src;
        imgEl.alt = slides[newIndex].alt || slides[newIndex].title || '';
        if (caption) caption.textContent = slides[newIndex].title || '';

        // در یک رفرش فریم کلاس fading را برمی‌داریم تا transition عمل کند
        requestAnimationFrame(() => {
          imgEl.classList.remove('fading');
          // اطمینان از پایان انیمیشن قبل از بازنشانی حالت متغیر
          setTimeout(() => {
            current = newIndex;
            animating = false;
          }, TRANS_MS);
        });
      }, Math.round(TRANS_MS * 0.7));
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    // رویدادهای کلیک
    if (btnRight) btnRight.addEventListener('click', function (e) { e.preventDefault(); next(); resetAutoplay(); });
    if (btnLeft)  btnLeft.addEventListener('click',  function (e) { e.preventDefault(); prev(); resetAutoplay(); });

    // کیبورد (اگر input یا textarea فعال بود از کار باز می‌مانیم)
    document.addEventListener('keydown', function (e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
      if (e.key === 'ArrowLeft')  { prev(); resetAutoplay(); }
    });

    // مقدار اولیه اسلاید
    setSlideImmediate(0);

    // autoplay
    let autoplayInterval = setInterval(next, 6000);
    function resetAutoplay() {
      clearInterval(autoplayInterval);
      autoplayInterval = setInterval(next, 6000);
    }

    // لمس / سوایپ موبایل
    (function addSwipe() {
      let startX = 0;
      let dist = 0;
      const threshold = 40;
      const mc = section.querySelector('.magazine-img');
      if (!mc) return;

      mc.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dist = 0; }, { passive: true });
      mc.addEventListener('touchmove',  e => { dist = e.touches[0].clientX - startX; }, { passive: true });
      mc.addEventListener('touchend', () => {
        if (dist > threshold) { prev(); resetAutoplay(); }
        else if (dist < -threshold) { next(); resetAutoplay(); }
        startX = 0; dist = 0;
      });
    })();

    // (اختیاری) نمایش/مخفی کردن دکمه‌ها بر حسب تعداد اسلاید
    if (slides.length <= 1) {
      if (btnRight) btnRight.style.display = 'none';
      if (btnLeft)  btnLeft.style.display = 'none';
    }

  })();

});
