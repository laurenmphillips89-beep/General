/*
  Nourish by Nature: cart drawer rewards.
  - Adds the free gift when the cart reaches the gift goal, and removes it if the cart drops below.
  - Powers the "+ Add" buttons and arrows in the "Little ones also love" slider.
  - Animates the progress bar between cart updates.
  Settings come from snippets/nbn-cart-rewards.liquid (window.NBN_REWARDS).
*/
(() => {
  if (window.__nbnRewardsLoaded) return;
  window.__nbnRewardsLoaded = true;

  const config = () => window.NBN_REWARDS || {};
  const json = { 'Content-Type': 'application/json', Accept: 'application/json' };
  let busy = false;
  let lastPct = null;
  let lastQualifying = null;

  const post = (url, body) =>
    fetch(url, { method: 'POST', headers: json, body: JSON.stringify(body) }).then(r => {
      if (!r.ok) throw new Error(`${url} ${r.status}`);
      return r.json();
    });

  // Same refresh the theme uses (component-cart.js), without forcing the drawer open.
  const refreshDrawer = async () => {
    if (document.body.classList.contains('template-cart')) {
      window.location.reload();
      return;
    }
    const text = await fetch('?section_id=helper-cart').then(r => r.text());
    const html = new DOMParser().parseFromString(text, 'text/html');
    const form = document.getElementById('AjaxCartForm');
    const subtotal = document.getElementById('AjaxCartSubtotal');
    const newForm = html.getElementById('AjaxCartForm');
    const newSubtotal = html.getElementById('AjaxCartSubtotal');
    if (!form || !newForm) return;
    form.innerHTML = newForm.innerHTML;
    if (typeof form.ajaxifyCartItems === 'function') form.ajaxifyCartItems();
    if (subtotal && newSubtotal) subtotal.innerHTML = newSubtotal.innerHTML;
    const count = form.querySelector('[data-cart-count]');
    const total = form.querySelector('[data-cart-total]');
    document.querySelectorAll('[data-header-cart-count]').forEach(el => { if (count) el.textContent = count.textContent; });
    document.querySelectorAll('[data-header-cart-total]').forEach(el => { if (total) el.textContent = total.textContent; });
  };

  // Keep exactly one gift in the cart when it qualifies, none when it doesn't.
  const syncGift = async () => {
    const { giftAt, giftVariant } = config();
    if (busy || !giftVariant || !giftAt) return;
    busy = true;
    try {
      const cart = await fetch('/cart.js', { headers: json }).then(r => r.json());
      const giftLines = cart.items.filter(i => i.variant_id === giftVariant);
      const giftQty = giftLines.reduce((s, i) => s + i.quantity, 0);
      const giftTotal = giftLines.reduce((s, i) => s + i.final_line_price, 0);
      const qualifying = cart.total_price - giftTotal;
      const otherItems = cart.item_count - giftQty;

      let changed = false;
      if (qualifying >= giftAt && otherItems > 0 && giftQty === 0) {
        await post('/cart/add.js', { items: [{ id: giftVariant, quantity: 1 }] });
        changed = true;
      } else if ((qualifying < giftAt || otherItems === 0) && giftQty > 0) {
        await post('/cart/update.js', { updates: { [giftVariant]: 0 } });
        changed = true;
      } else if (giftQty > 1) {
        await post('/cart/update.js', { updates: { [giftVariant]: 1 } });
        changed = true;
      }
      if (changed) await refreshDrawer();
    } catch (e) {
      console.warn('[nbn-rewards]', e);
    } finally {
      busy = false;
    }
  };

  // Slide the bar from where it was to where it is now, and give the message a little pop on a new milestone.
  const animateBar = () => {
    const el = document.querySelector('[data-nbn-rewards]');
    if (!el) return;
    const fill = el.querySelector('.nbn-rewards__fill');
    const pct = Number(el.dataset.pct);
    const qualifying = Number(el.dataset.qualifying);
    if (fill && lastPct !== null && lastPct !== pct) {
      fill.style.transition = 'none';
      fill.style.width = `${lastPct}%`;
      void fill.offsetWidth;
      fill.style.transition = '';
      fill.style.width = `${pct}%`;
    }
    if (lastQualifying !== null) {
      const shipAt = Number(el.dataset.shipAt);
      const giftAt = Number(el.dataset.giftAt);
      const crossed = t => lastQualifying < t && qualifying >= t;
      if (crossed(shipAt) || crossed(giftAt)) el.querySelector('.nbn-rewards__msg')?.classList.add('is-celebrating');
    }
    lastPct = pct;
    lastQualifying = qualifying;
  };

  const onCartRendered = () => {
    animateBar();
    syncGift();
  };

  // Slider: "+ Add" buttons and arrows (delegated, so they keep working after the drawer re-renders).
  document.addEventListener('click', async e => {
    const scroll = e.target.closest('[data-nbn-scroll]');
    if (scroll) {
      const track = scroll.closest('[data-nbn-upsells]')?.querySelector('.nbn-upsells__track');
      track?.scrollBy({ left: Number(scroll.dataset.nbnScroll) * track.clientWidth * 0.8, behavior: 'smooth' });
      return;
    }
    const add = e.target.closest('[data-nbn-add]');
    if (!add) return;
    e.preventDefault();
    add.disabled = true;
    add.textContent = 'Adding…';
    try {
      await post('/cart/add.js', { items: [{ id: Number(add.dataset.nbnAdd), quantity: 1 }] });
      await refreshDrawer();
      document.getElementById('site-cart-sidebar')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.warn('[nbn-rewards]', err);
      add.disabled = false;
      add.textContent = 'Try again';
    }
  });

  const start = () => {
    const form = document.getElementById('AjaxCartForm');
    if (form) {
      let t;
      new MutationObserver(() => {
        clearTimeout(t);
        t = setTimeout(onCartRendered, 120);
      }).observe(form, { childList: true });
    }
    onCartRendered();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
