import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
	getFirestore,
	collection,
	getDocs,
	query,
	where,
	orderBy,
	doc,
	getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ==========================================
// 1. SEPET (CART) VE MODAL FONKSİYONLARI
// ==========================================
let cart = JSON.parse(localStorage.getItem('myCart')) || [];

window.freeShippingThreshold = 0;

// Fonksiyonları HTML'deki onclick eventlerinin görebilmesi için window'a ekliyoruz
window.toggleCartModal = function () {
	const modal = document.getElementById('checkout-modal');
	modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
	window.renderCart();
};

window.saveCart = function () {
	localStorage.setItem('myCart', JSON.stringify(cart));
	window.renderCart();
};

window.addToCart = function (id, title, price, image, deliveryPrice) {
	const existingItem = cart.find((item) => item.id === id);
	if (existingItem) {
		existingItem.qty += 1;
		existingItem.image = image;
		existingItem.price = price;
		existingItem.title = title;
		existingItem.deliveryPrice = deliveryPrice; // Kargo ücretini güncelle
	} else {
		cart.push({
			id,
			title,
			price,
			image,
			qty: 1,
			deliveryPrice: deliveryPrice,
		});
	}
	window.saveCart();
	alert(`${title} sepete eklendi!`);
};

window.changeQty = function (id, delta) {
	const item = cart.find((item) => item.id === id);
	if (item) {
		item.qty += delta;
		if (item.qty <= 0) {
			cart = cart.filter((i) => i.id !== id);
		}
		window.saveCart();
	}
};

window.renderCart = function () {
	const container = document.getElementById('cart-items-container');
	const badge = document.getElementById('cart-badge');
	const summaryContainer = document.querySelector('.cart-total');

	if (!container) return;
	container.innerHTML = '';

	let totalQty = 0;
	let itemsTotal = 0;
	let maxShippingFee = 0; // YENİ: Sadece en yüksek kargo bedelini tutacak değişken

	if (cart.length === 0) {
		container.innerHTML =
			'<p style="text-align:center; color:#777; font-size: 20px; font-weight: 500; margin: 40px 0;">Sepetiniz şu an boş.</p>';
		badge.textContent = 0;
		if (summaryContainer) {
			summaryContainer.innerHTML =
				'Genel Toplam: <span id="cart-total-price">0.00</span> TL';
		}
		return;
	}

	cart.forEach((item) => {
		totalQty += item.qty;
		itemsTotal += item.price * item.qty;

		// YENİ KARGO MANTIĞI: Döngüdeki ürünün kargosu, şu ana kadarki en yüksek kargodan büyükse onu al.
		// Böylece sepet başına sadece tek bir kargo (en yükseği) yansır.
		const currentItemShipping = parseFloat(item.deliveryPrice) || 0;
		if (currentItemShipping > maxShippingFee) {
			maxShippingFee = currentItemShipping;
		}

		const itemHTML = `
        <div class="cart-item" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #eee;">
            <img src="${item.image}" alt="${item.title}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
            <div class="cart-item-info" style="flex:1; margin-left:15px;">
                <p class="cart-item-title" style="font-weight:bold; font-size:16px; margin:0;">${item.title}</p>
                <p class="cart-item-price" style="color:#555; font-size:14px; margin:0;">${item.price} TL</p>
            </div>
            <div class="cart-qty-controls">
                <button onclick="changeQty('${item.id}', -1)" style="background:#eee; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">-</button>
                <span style="margin:0 10px; font-weight:bold;">${item.qty}</span>
                <button onclick="changeQty('${item.id}', 1)" style="background:#eee; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">+</button>
            </div>
        </div>
        `;
		container.insertAdjacentHTML('beforeend', itemHTML);
	});

	let totalShipping = maxShippingFee; // Sepet başına tek kargoyu finale aktarıyoruz

	// Ücretsiz Kargo Mantığı
	let shippingText = '';
	if (
		window.freeShippingThreshold > 0 &&
		itemsTotal >= window.freeShippingThreshold
	) {
		totalShipping = 0;
		shippingText = `<span style="color: #27ae60; font-weight: bold;">Ücretsiz Kargo!</span>`;
	} else {
		shippingText = `${totalShipping.toFixed(2)} TL`;
	}

	const grandTotal = itemsTotal + totalShipping;

	if (summaryContainer) {
		summaryContainer.innerHTML = `
            <div style="font-size: 14px; font-weight: normal; margin-bottom: 5px; color:#555; text-align: right;">Ara Toplam: ${itemsTotal.toFixed(2)} TL</div>
            <div style="font-size: 14px; font-weight: normal; margin-bottom: 10px; color:#555; text-align: right;">Kargo Ücreti: ${shippingText}</div>
            <div style="font-size: 18px; text-align: right;">Genel Toplam: <span id="cart-total-price" style="color:#e67e22; font-weight: bold;">${grandTotal.toFixed(2)}</span> TL</div>
        `;
	}

	badge.textContent = totalQty;
};

window.validateAndProceed = function () {
	if (cart.length === 0) {
		alert('Sepetiniz boş! Lütfen önce ürün ekleyin.');
		return;
	}

	const name = document.getElementById('cust-name').value.trim();
	const phone = document.getElementById('cust-phone').value.trim();
	const address = document.getElementById('cust-address').value.trim();

	if (!name || !phone || !address) {
		alert('Lütfen Ad-Soyad, Telefon ve Adres alanlarının tamamını doldurun.');
		return;
	}

	const orderTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
	const orderPayload = {
		customer: { name, phone, address },
		items: cart,
		totalPrice: orderTotal,
	};

	console.log("Backend'e Gönderilecek Sipariş Verisi:", orderPayload);

	document.getElementById('checkout-form').style.display = 'none';
	const iframeContainer = document.getElementById('payment-iframe-container');
	iframeContainer.style.display = 'block';
	iframeContainer.innerHTML = `
            <h3 style="text-align:center; color: #f7711e;">Güvenli Ödeme Başlatılıyor...</h3>
            <p style="text-align:center; font-size:14px; color:#666;">Banka altyapısına bağlanılıyor, lütfen bekleyin.</p>
        `;
};

// Sayfa yüklendiğinde sepeti çiz
document.addEventListener('DOMContentLoaded', window.renderCart);

// ==========================================
// 2. FIREBASE VE ÜRÜN RENDER FONKSİYONLARI
// ==========================================
const firebaseConfig = {
	apiKey: 'AIzaSyASQTw9Vzw50z3mg5K5RFzRIE2RceAcWVM',
	authDomain: 'dogaldengerehberi-fb258.firebaseapp.com',
	projectId: 'dogaldengerehberi-fb258',
	storageBucket: 'dogaldengerehberi-fb258.firebasestorage.app',
	messagingSenderId: '477979514072',
	appId: '1:477979514072:web:4c4e698969769ec86ff3ad',
	measurementId: 'G-9PLDY1P2NV',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function renderAllContent() {
	const productsContainer = document.getElementById('products-grid');
	const pricingContainer = document.getElementById('pricing-grid');

	if (productsContainer)
		productsContainer.innerHTML =
			'<p style="text-align:center; width:100%;">Yükleniyor...</p>';
	if (pricingContainer)
		pricingContainer.innerHTML =
			'<p style="text-align:center; width:100%;">Yükleniyor...</p>';

	try {
		const settingSnap = await getDoc(doc(db, 'settings', 'shipping'));
		if (settingSnap.exists()) {
			window.freeShippingThreshold = settingSnap.data().threshold || 0;
		}
		const q = query(
			collection(db, 'products'),
			where('isVisible', '==', true),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);

		if (productsContainer) productsContainer.innerHTML = '';
		if (pricingContainer) pricingContainer.innerHTML = '';

		if (querySnapshot.empty) {
			if (productsContainer)
				productsContainer.innerHTML = '<p>Ürün bulunamadı.</p>';
			return;
		}

		querySnapshot.forEach((doc) => {
			const product = doc.data();

			// --- A. INFO CARD ---
			if (productsContainer) {
				let attributesHTML = '';
				if (product.attributes && product.attributes.length > 0) {
					attributesHTML = product.attributes
						.map(
							(attr) => `
                            <li class="product-attribute">
                                <ion-icon class="product-icon" name="${attr.icon}"></ion-icon>
                                <span>${attr.text}</span>
                            </li>
                        `
						)
						.join('');
				}
				const tagClass = product.tagColor ? `tag--${product.tagColor}` : '';

				const productHTML = `
                    <div class="product">
                        <img class="product-img" src="${product.image}" alt="${product.title}" />
                        <div class="product-content">
                            <div class="product-tags">
                                <span class="tag ${tagClass}">${product.tagText}</span>
                            </div>
                            <p class="product-title">${product.title}</p>
                            <ul class="product-attributes">${attributesHTML}</ul>
                        </div>
                    </div>`;

				productsContainer.insertAdjacentHTML('beforeend', productHTML);
			}

			// --- B. PRICING CARD ---
			if (pricingContainer) {
				const isSoldOut = product.isSoldOut === true;
				const planClass = isSoldOut
					? 'pricing-plan--complete'
					: 'pricing-plan--starter';
				const btnText = isSoldOut ? 'Yakında' : 'Sipariş Ver';

				const rawPrice = parseFloat(product.price) || 0;
				const discountAmount = parseFloat(product.discount) || 0;
				const finalPrice = rawPrice - discountAmount;

				let priceHTML = '';
				if (isSoldOut) {
					priceHTML = `---<span>TL</span>`;
				} else {
					if (discountAmount > 0) {
						priceHTML = `
                            <span style="font-weight: normal; text-decoration: line-through; font-size: 0.8em; color:#888;">${rawPrice}TL</span>
                            <span style="font-weight: normal; margin-top: -10px; font-size: 0.6em; color:#888;">yerine</span>
                            ${finalPrice}<span>TL</span>`;
					} else {
						priceHTML = `${rawPrice}<span>TL</span>`;
					}
				}

				let featuresHTML = '';
				if (product.pricingFeatures && product.pricingFeatures.length > 0) {
					featuresHTML = product.pricingFeatures
						.map((feature) => {
							if (feature && feature.trim() !== '') {
								return `
                                <li class="list-item">
                                    <ion-icon class="list-icon" name="checkmark-outline"></ion-icon>
                                    <span>${feature}</span>
                                </li>`;
							}
							return '';
						})
						.join('');
				}

				// ESKİ SORUNLU btnAction KODUNU SİL, YERİNE AŞAĞIDAKİNİ KOY:

				let buttonHTML = '';
				if (isSoldOut) {
					buttonHTML = `<a href="javascript:void(0)" class="btn btn--full" style="background-color: #ccc; cursor: not-allowed;">Yakında</a>`;
				} else {
					// SİHİRLİ ÇÖZÜM: Resmi data-img içine saklıyoruz. onClick ile çekerken tarayıcı string'i bozamıyor.
					buttonHTML = `<a href="javascript:void(0)" class="btn btn--full" data-img="${product.image}" onclick="window.addToCart('${doc.id}', '${product.title.replace(/'/g, "\\'")}', ${finalPrice}, this.getAttribute('data-img'), ${parseFloat(product.deliveryPrice) || 0})">Sipariş Ver</a>`;
				}

				const pricingHTML = `
                    <div class="pricing-plan ${planClass}">
                        <header class="plan-header">
                            <p class="plan-name">${product.title}</p>
                            <p class="plan-price">${priceHTML}</p>
                            <p class="plan-text">
                                Kargo ücreti ${product.deliveryPrice ? product.deliveryPrice : '0'}TL
                            </p>
                        </header>
                        <ul class="list">
                            ${featuresHTML}
                        </ul>
                        <div class="plan-sign-up">
                            ${buttonHTML}
                        </div>
                    </div>
            `;

				pricingContainer.insertAdjacentHTML('beforeend', pricingHTML);
			}
		});
	} catch (error) {
		console.error('Hata:', error);
	}
}

renderAllContent();
