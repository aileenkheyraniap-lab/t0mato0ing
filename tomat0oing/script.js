// ====== DATA PRODUK (ubah sesuai produkmu) ======
const WA_NUMBER = "6281234567890"; // ganti dengan nomor WhatsApp tokomu (format 62...)

const products = [
  {
    id: "msr-original",
    name: "Mango Sticky Rice Reguler",
    image: "mango sticky rice reguler.jpg",
    desc: "Ketan pulen, mangga manis, saus santan gurih, taburan wijen.",
    price: 12000,
    stock: 20,
    specs: ["Wadah: boks plastik 500 ml", "Isi: ketan, 1/2 mangga, saus santan", "Tahan: 1 hari (simpan di kulkas)"]
  },
  {
    id: "msr-jumbo",
    name: "Mango Sticky Rice Jumbo",
    image: "Mango sticky rice jumbo.jpg",
    desc: "Porsi lebih besar dengan mangga lebih banyak untuk berbagi.",
    price: 15000,
    stock: 12,
    specs: ["Wadah: boks plastik 750 ml", "Isi: ketan, 1 mangga, saus santan", "Tahan: 1 hari (simpan di kulkas)"]
  },
  {
    id: "msr-paket",
    name: "Mango Sticky Rice Bundling",
    image: "mango sticky rice bundling.jpg",
    desc: "Cocok untuk arisan, hampers, atau acara kecil.",
    price: 22000,
    stock: 6,
    specs: ["Isi: mango sticky rice bundling", "Kemasan: kantong rapi + stiker", "Tahan: 1 hari (simpan di kulkas)"]
  }
];

const reviews = [
  { name: "Rina, Depok", stars: 5, text: "Ketannya lembut, santannya gurih, mangganya manis. Kemasan rapi dan tidak tumpah." },
  { name: "Dimas, Jakarta", stars: 5, text: "Pengiriman cepat, masih dingin saat sampai. Porsinya pas." },
  { name: "Sari, Bogor", stars: 4, text: "Enak banget, semoga ada varian topping baru ya." }
];

// ====== UTIL ======
const rupiah = n => "Rp" + n.toLocaleString("id-ID");
const $ = sel => document.querySelector(sel);

let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("cart") || "[]");
} catch (e) { cart = []; }

function saveCart() {
  try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {}
}

// ====== RENDER PRODUK ======
function renderProducts() {
  const grid = $("#productGrid");
  grid.innerHTML = products.map(p => `
    <article class="card">
      <div class="product-img"><img src="${p.image}" alt="${p.name}"></div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <ul class="specs">${p.specs.map(s => `<li>• ${s}</li>`).join("")}</ul>
        <div class="price">${rupiah(p.price)}</div>
        <div class="stock ${p.stock === 0 ? "out" : ""}">${p.stock > 0 ? "Stok hari ini: " + p.stock : "Stok habis"}</div>
        <button class="btn small full" data-add="${p.id}" ${p.stock === 0 ? "disabled" : ""}>Tambah ke Keranjang</button>
      </div>
    </article>
  `).join("");
}

function renderReviews() {
  $("#reviewGrid").innerHTML = reviews.map(r => `
    <div class="card info review">
      <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p>${r.text}</p>
      <div class="who">${r.name}</div>
    </div>
  `).join("");
}

// ====== KERANJANG ======
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const item = cart.find(c => c.id === id);
  if (item) {
    if (item.qty < product.stock) item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  const product = products.find(p => p.id === id);
  if (!item || !product) return;
  item.qty = Math.min(product.stock, item.qty + delta);
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, c) => {
    const p = products.find(x => x.id === c.id);
    return sum + (p ? p.price * c.qty : 0);
  }, 0);
}

function renderCart() {
  const box = $("#cartItems");
  if (cart.length === 0) {
    box.innerHTML = '<p class="empty">Keranjang masih kosong.</p>';
  } else {
    box.innerHTML = cart.map(c => {
      const p = products.find(x => x.id === c.id);
      return `
        <div class="cart-row">
          <div>
            <div class="name">${p.name}</div>
            <div class="meta">${rupiah(p.price)} x ${c.qty} = ${rupiah(p.price * c.qty)}</div>
            <button class="remove" data-remove="${c.id}">Hapus</button>
          </div>
          <div class="qty">
            <button data-minus="${c.id}" aria-label="Kurangi">−</button>
            <span>${c.qty}</span>
            <button data-plus="${c.id}" aria-label="Tambah">+</button>
          </div>
        </div>`;
    }).join("");
  }
  $("#cartTotal").textContent = rupiah(cartTotal());
  $("#cartCount").textContent = cart.reduce((s, c) => s + c.qty, 0);
}

// ====== CHECKOUT KE WHATSAPP ======
function handleCheckout(e) {
  e.preventDefault();
  const msg = $("#formMsg");
  msg.className = "form-msg";

  const name = $("#custName").value.trim();
  const phone = $("#custPhone").value.trim();
  const address = $("#custAddress").value.trim();
  const pay = $("#custPay").value;

  if (cart.length === 0) { msg.textContent = "Keranjang masih kosong."; return; }
  if (!name || !address) { msg.textContent = "Nama dan alamat wajib diisi."; return; }
  if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(phone.replace(/[\s-]/g, ""))) {
    msg.textContent = "Nomor WhatsApp tidak valid.";
    return;
  }

  const lines = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    return `- ${p.name} x${c.qty} = ${rupiah(p.price * c.qty)}`;
  });

  const text = [
    "Halo t0mato0ing, saya ingin memesan:",
    ...lines,
    `Total: ${rupiah(cartTotal())}`,
    "",
    `Nama: ${name}`,
    `WhatsApp: ${phone}`,
    `Alamat: ${address}`,
    `Pembayaran: ${pay}`
  ].join("\n");

  msg.className = "form-msg ok";
  msg.textContent = "Mengarahkan ke WhatsApp...";
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

// ====== AKORDEON KEBIJAKAN ======
function initAccordion() {
  document.querySelectorAll(".acc-head").forEach(btn => {
    btn.addEventListener("click", () => {
      const body = btn.nextElementSibling;
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      body.classList.toggle("open", !open);
    });
  });
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderReviews();
  renderCart();
  initAccordion();
  $("#year").textContent = new Date().getFullYear();

  $("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
  $("#mainNav").addEventListener("click", e => {
    if (e.target.tagName === "A") $("#mainNav").classList.remove("open");
  });

  document.body.addEventListener("click", e => {
    const t = e.target;
    if (t.dataset.add) addToCart(t.dataset.add);
    if (t.dataset.plus) changeQty(t.dataset.plus, 1);
    if (t.dataset.minus) changeQty(t.dataset.minus, -1);
    if (t.dataset.remove) removeItem(t.dataset.remove);
  });

  $("#checkoutForm").addEventListener("submit", handleCheckout);
});