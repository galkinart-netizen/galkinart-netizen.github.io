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

  // ---------- Телефон: линия времени, которая заполняется вслед за прокруткой ----------
  function scrollTimeline() {
    var last = steps.length - 1;
    var rail = document.createElement('span');
    rail.className = 'rail';
    rail.setAttribute('aria-hidden', 'true');
    stairs.insertBefore(rail, stairs.firstChild);
    var lit = -1, finished = false, shown = false;

    function dotY(i) { return steps[i].getBoundingClientRect().top - stairs.getBoundingClientRect().top + 5; }

    function reveal(i, lag) {
      var step = steps[i];
      step.classList.add('lit');
      step.querySelector('.tread').animate(
        [{ transform: 'scaleX(0)' }, { transform: 'none' }],
        { duration: 700, delay: lag, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'forwards' });
      step.querySelector('.step-text').animate(
        [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, delay: lag + 120, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
      counters[i].forEach(function (c) { countUp(c, lag + 200, 900); });
      if (i === last) {
        setTimeout(function () {
          step.classList.add('peak');
          hopper.classList.add('home');
          burst({ x: 11, y: dotY(last) + 11 });
          stairs.classList.add('done');
        }, lag + 650);
      }
    }

    var ticking = false;
    function update() {
      ticking = false;
      var top = dotY(0), h = dotY(last) - top;
      var r = stairs.getBoundingClientRect();
      var line = window.innerHeight * 0.85;
      var p = Math.max(0, Math.min(1, (line - r.top - top) / h));
      rail.style.top = top + 'px';
      rail.style.height = h + 'px';
      rail.style.transform = 'scaleY(' + p + ')';
      if (!shown && r.top < window.innerHeight) {
        shown = true;
        hopper.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
      }
      hopper.style.transform = 'translate(11px,' + (top + p * h) + 'px)';
      var reach = -1;
      for (var i = 0; i <= last; i++) if (dotY(i) - top <= p * h + 2) reach = i;
      var batch = 0;
      while (lit < reach) { lit++; reveal(lit, batch++ * 140); }
      steps.forEach(function (s, i) { s.classList.toggle('cur', i === lit); });
      if (lit === last) finished = true;
    }
    function onMove() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);
    update();
  }

  if (window.matchMedia('(max-width: 960px)').matches) {
    scrollTimeline();
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
