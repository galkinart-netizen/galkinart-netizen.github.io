// Анимации сайта. Класс .motion ставится ещё в <head>, если в системе не включено «уменьшить движение».
// Без этого скрипта сайт остаётся обычным статичным: всё видно сразу.
(function () {
  var root = document.documentElement;
  var motion = root.classList.contains('motion') && 'IntersectionObserver' in window && !!Element.prototype.animate;
  var header = document.querySelector('.top');
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);

  // Шапка становится матовой после начала прокрутки, сверху растёт полоска прогресса
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 8);
    if (motion) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (!motion) return;

  // Блоки проявляются по очереди, когда до них долистали
  function stagger(selector, step) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      el.classList.add('rv');
      el.style.setProperty('--d', (i % 4) * step + 'ms');
    });
  }
  stagger('.section .h2', 0);
  stagger('.section .intro', 0);
  stagger('.tile.wide', 0);
  stagger('.featured .tile', 110);
  stagger('.how > div', 90);
  stagger('.facts > div', 90);
  stagger('.inside, .contact .actions', 0);

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv, .contact').forEach(function (el) { seen.observe(el); });

  // Подсветка карточки под курсором
  document.querySelectorAll('.tile').forEach(function (tile) {
    tile.addEventListener('pointermove', function (e) {
      var r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', e.clientX - r.left + 'px');
      tile.style.setProperty('--my', e.clientY - r.top + 'px');
    });
    tile.addEventListener('pointerleave', function () {
      tile.style.removeProperty('--mx');
      tile.style.removeProperty('--my');
    });
  });

  // ---------- Лестница карьеры ----------
  var stairs = document.querySelector('.stairs');
  if (!stairs) return;
  var steps = Array.prototype.slice.call(stairs.querySelectorAll('.step'));
  stairs.classList.add('armed');

  // Числа в итогах шагов («150 человек», «350+ млн ₽», «$0.5M+») считаются с нуля
  var counters = steps.map(function (step) {
    return Array.prototype.slice.call(step.querySelectorAll('.win b')).map(function (b) {
      var text = b.textContent;
      var m = text.match(/\d+(?:[.,]\d+)?/);
      // «Топ-3» — это место в рейтинге, его не считаем
      if (!m || /-$/.test(text.slice(0, m.index))) return null;
      var c = {
        el: b, final: text, pre: text.slice(0, m.index), post: text.slice(m.index + m[0].length),
        num: parseFloat(m[0].replace(',', '.')), dec: (m[0].split(/[.,]/)[1] || '').length,
        sep: m[0].indexOf(',') > -1 ? ',' : '.'
      };
      b.textContent = c.pre + (0).toFixed(c.dec).replace('.', c.sep) + c.post;
      return c;
    }).filter(Boolean);
  });

  function countUp(c, delay, duration) {
    setTimeout(function () {
      var t0 = performance.now();
      (function tick(now) {
        var p = Math.min(1, (now - t0) / duration);
        var v = c.num * (1 - Math.pow(1 - p, 3));
        c.el.textContent = p < 1 ? c.pre + v.toFixed(c.dec).replace('.', c.sep) + c.post : c.final;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, delay);
  }

  // Точка-«прыгун»: запрыгивает на каждую ступень, когда та вырастет
  var hopper = document.createElement('span');
  hopper.className = 'hopper';
  hopper.setAttribute('aria-hidden', 'true');
  stairs.appendChild(hopper);

  function spot(i) {
    var t = steps[i].querySelector('.tread');
    return { x: t.offsetLeft + t.offsetWidth / 2, y: t.offsetTop };
  }
  function at(p, sx, sy) {
    return 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + (sx || 1) + ',' + (sy || 1) + ')';
  }

  function hop(from, to, delay) {
    var peak = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 34 };
    hopper.animate([
      { transform: at(from), easing: 'cubic-bezier(.2,.6,.35,1)' },
      { transform: at(peak, 0.9, 1.12), offset: 0.42, easing: 'cubic-bezier(.65,0,.85,.45)' },
      { transform: at(to, 1.3, 0.7), offset: 0.82 },
      { transform: at(to) }
    ], { duration: 520, delay: delay, fill: 'forwards' });
  }

  function burst(p) {
    var colors = ['var(--accent)', '#6f8cff', 'var(--warm)', '#9fb3ff'];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      stairs.appendChild(s);
      var a = (Math.PI * 2 * i) / 14 - Math.PI / 2;
      var d = 46 + Math.random() * 40;
      var from = 'translate(' + p.x + 'px,' + (p.y - 11) + 'px) scale(1)';
      var to = 'translate(' + (p.x + Math.cos(a) * d) + 'px,' + (p.y - 11 + Math.sin(a) * d) + 'px) scale(0)';
      s.animate([{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }],
        { duration: 800 + Math.random() * 300, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = (function (el) {
          return function () { el.remove(); };
        })(s);
    }
  }

  function play() {
    var vertical = window.matchMedia('(max-width: 960px)').matches;
    var STEP = vertical ? 260 : 440;

    steps.forEach(function (step, i) {
      var T = i * STEP;
      step.querySelector('.tread').animate(
        [{ transform: vertical ? 'scaleX(0)' : 'scaleY(0)' }, { transform: 'none' }],
        { duration: 620, delay: T, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'forwards' });
      step.querySelector('.step-text').animate(
        [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 500, delay: T + 200, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
      counters[i].forEach(function (c) { countUp(c, T + 260, 900); });
    });

    var last = steps.length - 1;
    var end = last * STEP + 820;

    if (!vertical) {
      var first = steps[0].querySelector('.tread');
      var start = { x: first.offsetLeft - 26, y: first.offsetTop + first.offsetHeight };
      hopper.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
      hop(start, spot(0), 300);
      for (var i = 1; i <= last; i++) hop(spot(i - 1), spot(i), i * STEP + 300);
    }

    setTimeout(function () {
      steps[last].classList.add('peak');
      if (!vertical) {
        hopper.classList.add('home');
        burst(spot(last));
      }
      stairs.classList.add('done');
    }, end);
  }

  // ---------- Телефон: лестница листается пальцем, точка прыгает на ступень в центре ----------
  function swipeStairs() {
    var last = steps.length - 1;
    var ru = (document.documentElement.lang || 'ru').indexOf('en') !== 0;
    var dots = document.createElement('div');
    dots.className = 'stairs-dots';
    var hint = document.createElement('p');
    hint.className = 'stairs-hint';
    hint.textContent = ru ? 'Листайте ступени ←  →' : 'Swipe through the steps ←  →';
    steps.forEach(function (step, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', step.querySelector('.year').textContent + ' ' + step.querySelector('.co').textContent);
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
    });
    stairs.after(dots, hint);

    var cur = -1, started = false, peaked = false;

    // Верх полосы ступени без учёта уменьшения соседних ступеней
    function mspot(i) {
      var st = steps[i], t = st.querySelector('.tread');
      return { x: st.offsetLeft + st.offsetWidth / 2, y: st.offsetTop + st.offsetHeight - t.offsetHeight };
    }

    function go(i) {
      var s = steps[i];
      stairs.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - stairs.clientWidth / 2, behavior: 'smooth' });
    }

    function nearest() {
      var mid = stairs.scrollLeft + stairs.clientWidth / 2, best = 0, d = Infinity;
      steps.forEach(function (s, i) {
        var dd = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (dd < d) { d = dd; best = i; }
      });
      return best;
    }

    function select(i) {
      if (i === cur) return;
      var prev = cur;
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('cur', k === i); });
      Array.prototype.forEach.call(dots.children, function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      if (!started) return;
      hopper.classList.remove('home');
      if (prev < 0) {
        var t = mspot(i);
        hopper.animate([{ opacity: 0, transform: at({ x: t.x, y: t.y - 40 }) }, { opacity: 1, transform: at(t) }],
          { duration: 450, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'forwards' });
      } else {
        hop(mspot(prev), mspot(i), 0);
        hint.classList.add('gone');
      }
      if (i === last) {
        setTimeout(function () {
          if (cur !== last) return;
          hopper.classList.add('home');
          if (!peaked) {
            peaked = true;
            steps[last].classList.add('peak');
            burst(mspot(last));
          }
        }, 520);
      }
    }

    function start() {
      started = true;
      stairs.classList.add('swipe');
      steps.forEach(function (step, i) {
        var T = i * 110;
        step.querySelector('.tread').animate(
          [{ transform: 'scaleY(0)' }, { transform: 'none' }],
          { duration: 620, delay: T, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'forwards' });
        step.querySelector('.step-text').animate(
          [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 500, delay: T + 180, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
        counters[i].forEach(function (c) { countUp(c, T + 240, 900); });
      });
      setTimeout(function () {
        stairs.classList.add('done');
        var i = cur < 0 ? nearest() : cur;
        cur = -1;
        select(i);
      }, 6 * 110 + 520);
    }

    var ticking = false;
    stairs.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; select(nearest()); });
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (cur < 0 || !started) return;
      hopper.getAnimations().forEach(function (a) { a.cancel(); });
      hopper.style.opacity = 1;
      hopper.style.transform = at(mspot(cur));
    });

    select(0);
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { obs.disconnect(); start(); }
    }, { threshold: 0.35 }).observe(stairs);
  }

  if (window.matchMedia('(max-width: 960px)').matches) {
    swipeStairs();
    return;
  }

  // Когда меняется размер окна, точка остаётся на вершине
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!stairs.classList.contains('done')) return;
      hopper.getAnimations().forEach(function (a) { a.cancel(); });
      hopper.style.opacity = 1;
      hopper.style.transform = at(spot(steps.length - 1));
    }, 150);
  });

  new IntersectionObserver(function (entries, obs) {
    if (entries[0].isIntersecting) { obs.disconnect(); play(); }
  }, { threshold: 0.35 }).observe(stairs);
})();
