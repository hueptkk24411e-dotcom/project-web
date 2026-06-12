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
// Booking form confirmation
var bookingForm = document.getElementById('bookingFormElement');
var confirmationModal = document.getElementById('confirmationModal');
var successModal = document.getElementById('successModal');
var btnCancel = document.getElementById('btnCancel');
var btnConfirmSubmit = document.getElementById('btnConfirmSubmit');
var btnCloseSuccess = document.getElementById('btnCloseSuccess');

if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // Show confirmation modal
        if (confirmationModal) {
            confirmationModal.classList.add('show');
        }
    });
}

if (btnCancel) {
    btnCancel.addEventListener('click', function () {
        if (confirmationModal) {
            confirmationModal.classList.remove('show');
        }
    });
}

if (btnConfirmSubmit) {
    btnConfirmSubmit.addEventListener('click', function () {
        if (confirmationModal) {
            confirmationModal.classList.remove('show');
        }
        if (successModal) {
            successModal.classList.add('show');
        }
    });
}

if (btnCloseSuccess)
 {
    btnCloseSuccess.addEventListener('click', function () {

        if (successModal) {
            successModal.classList.remove('show');
        }

        if (bookingForm) {
            bookingForm.reset();
        }

        // Cập nhật lại bảng tóm tắt
        updatePrice();
    });
}

// FAQ accordion

document.querySelectorAll('.style-card').forEach(function (card) {
    function selectStyle() {
        var styleName = card.getAttribute('data-style');
        var styleSelect = document.getElementById('style');

        if (!styleSelect) return;

        for (var i = 0; i < styleSelect.options.length; i++) {
            if (styleSelect.options[i].text === styleName) {
                styleSelect.selectedIndex = i;
                break;
            }
        }
        updatePrice();
    }

    card.addEventListener('click', selectStyle);
    card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectStyle();
        }
    });
});

var serviceSelect = document.getElementById('service');
var styleSelect = document.getElementById('style');
var weightSelect = document.getElementById('weight');
var petNameInput = document.getElementById('petName');
var breedSelect = document.getElementById('breed');
var bookingDateInput = document.getElementById('bookingDate');
var timeSelect = document.getElementById('time');
var petTypeSelect = document.getElementById('petType');

const dogBreeds = [
    'Poodle',
    'Golden Retriever',
    'Labrador',
    'Corgi',
    'Husky',
    'Pomeranian',
    'Shiba Inu'
];

const catBreeds = [
    'British Shorthair',
    'Persian',
    'Maine Coon',
    'Ragdoll',
    'Scottish Fold',
    'Siamese'
];

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
}

function getSelectedAddOns() {
    var addOns = [];
    var total = 0;
    document.querySelectorAll('[data-addon]:checked').forEach(function(checkbox) {
        addOns.push(checkbox.closest('.addon-item').querySelector('.addon-name').textContent);
        total += Number(checkbox.dataset.price);
    });
    return { items: addOns, total: total };
}
function updateBreeds() {

    breedSelect.innerHTML =
        '<option value="">Chọn giống</option>';

    let breeds = [];

    if (petTypeSelect.value === 'dog') {
        breeds = dogBreeds;
    }
    else if (petTypeSelect.value === 'cat') {
        breeds = catBreeds;
    }

    breeds.forEach(function (breed) {

        const option = document.createElement('option');

        option.value = breed;

        option.textContent = breed;

        breedSelect.appendChild(option);
    });
}

function updatePrice() {
    var baseService = Number(serviceSelect.value || 0);
    var styleExtra = Number(styleSelect.value || 0);
    var weightExtra = Number(weightSelect.value || 0);
    var addOnsData = getSelectedAddOns();
    var total = baseService + styleExtra + weightExtra + addOnsData.total;

    // Update summary panel
document.getElementById('summaryService').textContent     = serviceSelect.options[serviceSelect.selectedIndex]?.text || '-';
    document.getElementById('summaryStyle').textContent = styleSelect.options[styleSelect.selectedIndex]?.text || '-';
    document.getElementById('summaryPet').textContent = petNameInput.value && breedSelect.value ? (petNameInput.value + ' (' + breedSelect.value + ')') : '-';
    
    if (bookingDateInput.value && timeSelect.value) {
        var date = new Date(bookingDateInput.value);
        var dateStr = date.toLocaleDateString('vi-VN');
        document.getElementById('summaryDateTime').textContent = dateStr + ', ' + timeSelect.value;
    } else {
        document.getElementById('summaryDateTime').textContent = '-';
    }
    
    if (addOnsData.items.length > 0) {
        document.getElementById('summaryAddons').style.display = 'flex';
        document.getElementById('summaryAddonsText').textContent = addOnsData.items.join(', ');
    } else {
        document.getElementById('summaryAddons').style.display = 'none';
    }
    
    document.getElementById('summaryTotal').textContent = total > 0 ? formatVND(total) : '0 VND';
}

[serviceSelect, styleSelect, weightSelect, petNameInput, breedSelect, bookingDateInput, timeSelect].forEach(function (element) {
    if (element) {
        element.addEventListener('change', updatePrice);
        if (element.type === 'text') element.addEventListener('input', updatePrice);
    }
});

document.querySelectorAll('[data-addon]').forEach(function(checkbox) {
    checkbox.addEventListener('change', updatePrice);
});
if (petTypeSelect) {
    petTypeSelect.addEventListener('change', updateBreeds);
}

updatePrice();
function scrollGallery(value){
    document.getElementById("gallery")
    .scrollBy({
        left:value,
        behavior:"smooth"
    });
}

function showPage(page){

    document.getElementById("home-page").style.display = "none";
    document.getElementById("hotel-page").style.display = "none";

    if(page === "home"){
        document.getElementById("home-page").style.display = "block";
    }

    if(page === "hotel"){
        document.getElementById("hotel-page").style.display = "block";
    }
}
function showPage(page){

    document.getElementById("home-page").style.display = "none";
    document.getElementById("hotel-page").style.display = "none";
    document.getElementById("grooming-page").style.display = "none";
    document.getElementById("policy-page").style.display = "none";
    document.getElementById("blog-page").style.display = "none";
    document.getElementById("shop-page").style.display = "none";
    document.getElementById("contact-page").style.display = "none";
    document.getElementById(page + "-page").style.display = "block";
}
// FAQ
