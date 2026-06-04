/* ============================================
   Petopia – Script
   ============================================ */

// --- Grooming price estimator ---
const priceTable = {
  dog: { 1: 120000, 2: 180000, 3: 260000, 4: 350000 },
  cat: { 1: 100000, 2: 150000, 3: 220000, 4: 300000 },
};
const furMult    = { '1': 1, '1.5': 1.4, '2': 1.8 };
const svcPrices  = { '150000': 150000, '200000': 200000, '350000': 350000 };

function updatePrice() {
  const pet     = document.querySelector('input[name="pet"]:checked')?.value || 'dog';
  const weight  = document.getElementById('weight')?.value || '1';
  const fur     = document.getElementById('fur')?.value || '1';
  const service = document.getElementById('service')?.value || '150000';
  const display = document.getElementById('price-display');
  if (!display) return;

  const base  = (priceTable[pet]?.[weight] || 150000);
  const mult  = furMult[fur] || 1;
  const extra = svcPrices[service] || 150000;
  const total = Math.round((base * mult + extra) / 1000) * 1000;

  display.textContent = total.toLocaleString('vi-VN') + 'đ';
  display.style.transform = 'scale(1.1)';
  setTimeout(() => { display.style.transform = 'scale(1)'; }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  // Estimator listeners
  ['weight', 'fur', 'service'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updatePrice);
  });
  document.querySelectorAll('input[name="pet"]').forEach(r =>
    r.addEventListener('change', updatePrice)
  );
  updatePrice();

  // Add to cart toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  document.querySelectorAll('.product__cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.closest('.product-card')?.querySelector('.product__name')?.textContent || 'Sản phẩm';
      showToast('✅ Đã thêm "' + name.slice(0, 30) + '..." vào giỏ');
    });
  });

  // Newsletter
  const nbtn = document.getElementById('newsletter-btn');
  if (nbtn) {
    nbtn.addEventListener('click', () => {
      const email = nbtn.previousElementSibling?.value?.trim();
      if (email && email.includes('@')) {
        showToast('📬 Đăng ký thành công: ' + email);
        nbtn.previousElementSibling.value = '';
      } else {
        showToast('⚠️ Vui lòng nhập email hợp lệ!');
      }
    });
  }
});