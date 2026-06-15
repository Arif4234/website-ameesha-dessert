let MENU = [
  {
    id: "chocolate-fudge",
    name: "Kek Coklat Fudge",
    category: "Kek",
    price: 38,
    image: "chocolate-fudge.png",
    tag: "Terlaris",
    desc: "Kek lembap dengan ganache coklat pekat."
  },
  {
    id: "fresh-pavlova",
    name: "Pavlova Buah Segar",
    category: "Kek",
    price: 42,
    image: "assets/fresh-pavlova.png",
    tag: "Buah segar",
    desc: "Meringue rangup, krim lembut, dan buah bermusim."
  },
  {
    id: "tiramisu-cup",
    name: "Tiramisu Cup",
    category: "Sejuk",
    price: 12,
    image: "assets/tiramisu-cup.png",
    tag: "Cup",
    desc: "Lapisan kopi, mascarpone, dan koko halus."
  },
  {
    id: "caramel-pudding",
    name: "Puding Karamel",
    category: "Puding",
    price: 18,
    image: "assets/caramel-pudding.png",
    tag: "Lembut",
    desc: "Puding telur berkaramel untuk 4 hingga 6 orang."
  },
  {
    id: "macaron-box",
    name: "Macaron Kotak 6",
    category: "Kuih",
    price: 30,
    image: "assets/macaron-box.png",
    tag: "Kotak hadiah",
    desc: "Gabungan vanila, beri, pistachio, dan coklat."
  },
  {
    id: "mango-cheesecake",
    name: "Kek Keju Mangga",
    category: "Kek",
    price: 45,
    image: "assets/mango-cheesecake.png",
    tag: "Sejuk",
    desc: "Cheesecake sejuk dengan puri mangga dan biskut."
  },
  {
    id: "walnut-brownies",
    name: "Brownies Walnut",
    category: "Kuih",
    price: 28,
    image: "assets/walnut-brownies.png",
    tag: "Fudgy",
    desc: "Brownies padat, coklat pekat, dan walnut rangup."
  },
  {
    id: "mochi-icecream",
    name: "Aiskrim Mochi",
    category: "Sejuk",
    price: 16,
    image: "assets/mochi-icecream.png",
    tag: "Mini",
    desc: "Mochi kenyal berinti aiskrim teh hijau dan strawberi."
  }
];

const CATEGORIES = ["Semua", "Kek", "Sejuk", "Puding", "Kuih"];
const KEYS = {
  users: "manishub.users",
  session: "manishub.session",
  cartPrefix: "manishub.cart.",
  ordersPrefix: "manishub.orders."
};

const ADMIN_EMAIL = "admin@ameesha.com";
const ADMIN_PASSWORD = "123456";


const state = {
  user: null,
  cart: [],
  category: "Semua",
  search: ""
};

const $ = (selector) => document.querySelector(selector);
const money = (value) => `RM${value.toFixed(2)}`;

const elements = {
  sessionPill: $("#sessionPill"),
  authView: $("#authView"),
  profileView: $("#profileView"),
  profileAvatar: $("#profileAvatar"),
  profileName: $("#profileName"),
  profileEmail: $("#profileEmail"),
  profilePhone: $("#profilePhone"),
  logoutButton: $("#logoutButton"),
  loginForm: $("#loginForm"),
  registerForm: $("#registerForm"),
  searchInput: $("#searchInput"),
  categoryTabs: $("#categoryTabs"),
  menuGrid: $("#menuGrid"),
  cartCount: $("#cartCount"),
  cartList: $("#cartList"),
  subtotalText: $("#subtotalText"),
  deliveryText: $("#deliveryText"),
  totalText: $("#totalText"),
  checkoutForm: $("#checkoutForm"),
  fulfillment: $("#fulfillment"),
  addressLabel: $("#addressLabel"),
  deliveryAddress: $("#deliveryAddress"),
  orderDate: $("#orderDate"),
  orderTime: $("#orderTime"),
  orderNote: $("#orderNote"),
  orderHistory: $("#orderHistory"),
  toast: $("#toast")
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function hashPassword(password) {
  if (window.crypto?.subtle && window.TextEncoder) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return btoa(unescape(encodeURIComponent(password))).split("").reverse().join("");
}

function getUsers() {
  return readJson(KEYS.users, []);
}

function saveUsers(users) {
  writeJson(KEYS.users, users);
}

function cartKey(email = "guest") {
  return `${KEYS.cartPrefix}${email}`;
}

function ordersKey(email) {
  return `${KEYS.ordersPrefix}${email}`;
}

function readCart(email = "guest") {
  return readJson(cartKey(email), []);
}

function saveCart() {
  writeJson(cartKey(state.user?.email ?? "guest"), state.cart);
}

function readOrders() {
  if (!state.user) return [];
  return readJson(ordersKey(state.user.email), []);
}

function saveOrders(orders) {
  if (!state.user) return;
  writeJson(ordersKey(state.user.email), orders);
}

function setSession(user) {
  state.user = user;
  if (user) {
    localStorage.setItem(KEYS.session, user.email);
    const guestCart = readCart("guest");
    const userCart = readCart(user.email);
    state.cart = mergeCarts(userCart, guestCart);
    writeJson(cartKey(user.email), state.cart);
    localStorage.removeItem(cartKey("guest"));
  } else {
    localStorage.removeItem(KEYS.session);
    state.cart = readCart("guest");
  }
  render();
}

function mergeCarts(baseCart, incomingCart) {
  const merged = [...baseCart];
  incomingCart.forEach((incoming) => {
    const existing = merged.find((item) => item.id === incoming.id);
    if (existing) {
      existing.qty += incoming.qty;
    } else {
      merged.push({ ...incoming });
    }
  });
  return merged;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}

function render() {
  renderAccount();
  renderCategories();
  renderMenu();
  renderCart();
  renderHistory();
}

function renderAccount() {
  if (!state.user) {
    elements.sessionPill.textContent = "Belum log masuk";
    elements.authView.classList.remove("is-hidden");
    elements.profileView.classList.add("is-hidden");
    return;
  }

  elements.sessionPill.textContent = `Log masuk sebagai ${state.user.name}`;
  elements.authView.classList.add("is-hidden");
  elements.profileView.classList.remove("is-hidden");
  elements.profileAvatar.textContent = state.user.name.trim().charAt(0).toUpperCase();
  elements.profileName.textContent = state.user.name;
  elements.profileEmail.textContent = state.user.email;
  elements.profilePhone.textContent = state.user.phone;
}

function renderCategories() {
  elements.categoryTabs.innerHTML = CATEGORIES.map((category) => {
    const active = category === state.category ? " is-active" : "";
    return `<button class="category-tab${active}" type="button" data-category="${category}">${category}</button>`;
  }).join("");
}

function filteredMenu() {
  const query = state.search.trim().toLowerCase();
  return MENU.filter((item) => {
    const inCategory = state.category === "Semua" || item.category === state.category;
    const inSearch = !query || `${item.name} ${item.category} ${item.desc}`.toLowerCase().includes(query);
    return inCategory &&
       inSearch &&
       !item.soldOut;
  });
}

function renderMenu() {
  const items = filteredMenu();
  if (items.length === 0) {
    elements.menuGrid.innerHTML = `<div class="empty-state">Tiada menu yang sepadan.</div>`;
    return;
  }

  elements.menuGrid.innerHTML = items.map((item) => `
    <article class="dessert-card">
      <div class="dessert-media">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="dessert-body">
        <div class="dessert-top">
          <h3 class="dessert-name">${item.name}</h3>
          <span class="dessert-price">${money(item.price)}</span>
        </div>
        <p class="dessert-meta">${item.desc}</p>
        <div class="dessert-actions">
          <span class="badge">${item.tag}</span>
          <button class="add-button" type="button" data-add="${item.id}">Tambah</button>
        </div>
      </div>
    </article>
  `).join("");
}

function getSubtotal() {
  return state.cart.reduce((sum, cartItem) => {
    const menuItem = MENU.find((item) => item.id === cartItem.id);
    return sum + (menuItem ? menuItem.price * cartItem.qty : 0);
  }, 0);
}

function getDeliveryFee() {
  return elements.fulfillment.value === "delivery" && state.cart.length > 0 ? 5 : 0;
}

function renderCart() {
  const itemTotal = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = getSubtotal();
  const delivery = getDeliveryFee();

  elements.cartCount.textContent = `${itemTotal} item`;
  elements.subtotalText.textContent = money(subtotal);
  elements.deliveryText.textContent = money(delivery);
  elements.totalText.textContent = money(subtotal + delivery);

  if (state.cart.length === 0) {
    elements.cartList.innerHTML = `<div class="empty-state">Bakul masih kosong.</div>`;
    return;
  }

  elements.cartList.innerHTML = state.cart.map((cartItem) => {
    const item = MENU.find((menuItem) => menuItem.id === cartItem.id);
    if (!item) return "";
    return `
      <div class="cart-item">
        <img class="cart-thumb" src="${item.image}" alt="${item.name}" />
        <div class="cart-copy">
          <strong>${item.name}</strong>
          <div class="cart-line">
            <span>${money(item.price * cartItem.qty)}</span>
            <div class="qty-controls" aria-label="Kuantiti ${item.name}">
              <button class="qty-btn" type="button" data-decrease="${item.id}" aria-label="Kurangkan">−</button>
              <span>${cartItem.qty}</span>
              <button class="qty-btn" type="button" data-increase="${item.id}" aria-label="Tambah">+</button>
              <button class="qty-btn remove" type="button" data-remove="${item.id}" aria-label="Buang">×</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  if (!state.user) {
    elements.orderHistory.innerHTML = `<div class="empty-state">Log masuk untuk lihat pesanan.</div>`;
    return;
  }

  const orders = readOrders();
  if (orders.length === 0) {
    elements.orderHistory.innerHTML = `<div class="empty-state">Belum ada pesanan.</div>`;
    return;
  }

  elements.orderHistory.innerHTML = orders.slice().reverse().map((order) => `
    <article class="order-card">
      <header>
        <strong>${order.id}</strong>
        <span class="status-chip">${order.status}</span>
      </header>
      <p>${order.date} · ${order.time} · ${order.method === "delivery" ? "Penghantaran" : "Ambil sendiri"}</p>
      <p>${order.items.map((item) => `${item.qty}x ${item.name}`).join(", ")}</p>
      <p><strong>${money(order.total)}</strong></p>
    </article>
  `).join("");
}

function addToCart(id) {
  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast("Item ditambah ke bakul.");
}

function changeQuantity(id, direction) {
  const item = state.cart.find((cartItem) => cartItem.id === id);
  if (!item) return;
  item.qty += direction;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((cartItem) => cartItem.id !== id);
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function setAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authTab === tab);
  });
  elements.loginForm.classList.toggle("is-hidden", tab !== "login");
  elements.registerForm.classList.toggle("is-hidden", tab !== "register");
}

function setTodayMinimum() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  elements.orderDate.min = localDate;
  elements.orderDate.value = localDate;
}

async function handleLogin(event) {
  event.preventDefault();
  const email = normalizeEmail($("#loginEmail").value);
  const password = $("#loginPassword").value;
  const passwordHash = await hashPassword(password);
  const user = getUsers().find((candidate) => candidate.email === email && candidate.passwordHash === passwordHash);

  if (!user) {
    showToast("E-mel atau kata laluan tidak sepadan.");
    return;
  }

  elements.loginForm.reset();
  setSession(user);
  showToast("Log masuk berjaya.");
}

async function handleRegister(event) {
  event.preventDefault();
  const users = getUsers();
  const name = $("#registerName").value.trim();
  const phone = $("#registerPhone").value.trim();
  const email = normalizeEmail($("#registerEmail").value);
  const password = $("#registerPassword").value;

  if (users.some((user) => user.email === email)) {
    showToast("E-mel ini sudah didaftarkan.");
    return;
  }

  const user = {
    id: `USR-${Date.now().toString(36).toUpperCase()}`,
    name,
    phone,
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveUsers(users);
  elements.registerForm.reset();
  setAuthTab("login");
  setSession(user);
  showToast("Akaun berjaya dibina.");
}

function handleCheckout(event) {
  event.preventDefault();
  if (!state.user) {
    showToast("Sila log masuk atau bina akaun dahulu.");
    setAuthTab("login");
    return;
  }

  if (state.cart.length === 0) {
    showToast("Pilih pencuci mulut dahulu.");
    return;
  }

  const method = elements.fulfillment.value;
  const address = elements.deliveryAddress.value.trim();
  if (method === "delivery" && !address) {
    showToast("Masukkan alamat penghantaran.");
    elements.deliveryAddress.focus();
    return;
  }

  const items = state.cart.map((cartItem) => {
    const item = MENU.find((menuItem) => menuItem.id === cartItem.id);
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      qty: cartItem.qty
    };
  });
  const total = getSubtotal() + getDeliveryFee();

const paymentFile =
document.getElementById("paymentProof")
.files[0];

if(!paymentFile){

    showToast(
    "Sila upload bukti pembayaran"
    );

    return;
}

const reader = new FileReader();

reader.onload = function(e){

    const order = {

        id: `MH-${Date.now().toString(36).toUpperCase()}`,

        items,

        total,

        method,

        address,

        note: elements.orderNote.value.trim(),

        date: elements.orderDate.value,

        time: elements.orderTime.value,

        paymentProof: e.target.result,

        status: "Menunggu Pengesahan",

        createdAt: new Date().toISOString()
    };

    const orders = readOrders();

    orders.push(order);

    saveOrders(orders);

    state.cart = [];

    saveCart();

    elements.checkoutForm.reset();

    setTodayMinimum();

    elements.addressLabel.classList.add("is-hidden");

    renderCart();

    renderHistory();

    showToast(`Tempahan ${order.id} berjaya dihantar.`);
};

reader.readAsDataURL(paymentFile);
 }

function bindEvents() {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => setAuthTab(button.dataset.authTab));
  });

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.registerForm.addEventListener("submit", handleRegister);
  elements.logoutButton.addEventListener("click", () => {
    setSession(null);
    showToast("Anda sudah log keluar.");
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderMenu();
  });

  elements.categoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderCategories();
    renderMenu();
  });

  elements.menuGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addToCart(button.dataset.add);
  });

  elements.cartList.addEventListener("click", (event) => {
    const increase = event.target.closest("[data-increase]");
    const decrease = event.target.closest("[data-decrease]");
    const remove = event.target.closest("[data-remove]");
    if (increase) changeQuantity(increase.dataset.increase, 1);
    if (decrease) changeQuantity(decrease.dataset.decrease, -1);
    if (remove) removeFromCart(remove.dataset.remove);
  });

  elements.fulfillment.addEventListener("change", () => {
    const isDelivery = elements.fulfillment.value === "delivery";
    elements.addressLabel.classList.toggle("is-hidden", !isDelivery);
    renderCart();
  });

  elements.checkoutForm.addEventListener("submit", handleCheckout);
}

function boot() {
  const sessionEmail = localStorage.getItem(KEYS.session);
  state.user = getUsers().find((user) => user.email === sessionEmail) ?? null;
  state.cart = readCart(state.user?.email ?? "guest");
  setTodayMinimum();
  bindEvents();
  render();
}

const adminMenus =
JSON.parse(
localStorage.getItem("adminMenus") || "[]"
);

adminMenus.forEach(menu => {

    MENU.push({
        id: menu.id,
        name: menu.name,
        category: menu.category,
        price: menu.price,
        image: menu.image,
        tag: menu.soldOut ? "SOLD OUT" : "Baru",
        desc: menu.desc,
        soldOut: menu.soldOut
    });

});
boot();
function adminLogin() {

    const email = prompt("Admin Email");
    const password = prompt("Admin Password");

    if (
        email === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD
    ) {

        document.getElementById("adminDashboard")
        .classList.remove("is-hidden");

        loadAdminData();

        alert("Login Admin Berjaya");

    } else {

        alert("Login Gagal");
    }
}

function loadAdminData() {

    renderAdminMenus();
    renderAllOrders();

}

function renderAdminMenus() {

    const list =
    document.getElementById("adminMenuList");

    list.innerHTML = MENU.map((item,index)=>`

    <div style="border:1px solid #ddd;padding:10px;margin:10px">

        <b>${item.name}</b><br>

        Harga:
        <input type="number"
        value="${item.price}"
        onchange="updatePrice(${index},this.value)">

        <button onclick="toggleSoldOut(${index})">
            ${item.soldOut ? "Available" : "Sold Out"}
        </button>

    </div>

    `).join("");

}

function updatePrice(index,newPrice){

    MENU[index].price =
    Number(newPrice);

    renderMenu();
}

function toggleSoldOut(index){

    MENU[index].soldOut =
    !MENU[index].soldOut;

    renderAdminMenus();
    renderMenu();
}

function renderAllOrders(){

    const container =
    document.getElementById("allOrders");

    let html="";

    const users =
    JSON.parse(localStorage.getItem(KEYS.users)||"[]");

    users.forEach(user=>{

        const orders =
        JSON.parse(
        localStorage.getItem(
        KEYS.ordersPrefix + user.email
        ) || "[]"
        );

        orders.forEach(order=>{

            html += `

            <div style="border:1px solid #ccc;padding:10px;margin:10px">

                <b>${user.name}</b><br>
                ${user.email}<br>

                Order:
                ${order.items.map(i=>
                    `${i.qty}x ${i.name}`
                ).join(", ")}

                <br><br>

                Status:
                <select onchange="
                    this.dataset.order='${order.id}'
                ">
                    <option>Diterima</option>
                    <option>Preparing</option>
                    <option>Ready</option>
                    <option>Completed</option>
                </select>

            </div>

            `;
        });

    });

    container.innerHTML = html;
}

const adminBtn =
document.getElementById("adminLoginBtn");

if(adminBtn){
adminBtn.addEventListener(
        "click",
        adminLogin
);
}
    
