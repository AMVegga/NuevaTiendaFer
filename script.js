// ===== SUPABASE ===== //
const supabase = createClient(
  'https://gmvkmikuafewtenendsm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmttaWt1YWZld3RlbmVuZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzExNjgsImV4cCI6MjA3NzYwNzE2OH0.uskKXf-8OZDj_DYzy39u5R8QBrUghUklrXVDPU4-Jwo'
);

// ===== OBTENER PRODUCTOS ===== //
async function fetchProductsFromSupabase() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error cargando productos:', error);
    return [];
  }

  return data.map(p => ({
    id: p.id,
    title: p.nombre,
    price: p.precio,
    img: p.imagen_url || 'placeholder.jpg'
  }));
}

// ===== RENDERIZAR PRODUCTOS ===== //
async function renderProducts() {
  const products = await fetchProductsFromSupabase();
  const productGrid = document.getElementById('productGrid');
  productGrid.innerHTML = '';

  products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'product';
    el.innerHTML = `
      <img src="${p.img}" alt="${p.title}">
      <h4>${p.title}</h4>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="price">$${p.price.toFixed(2)}</div>
        <button class="add-btn" data-id="${p.id}" data-price="${p.price}" data-title="${p.title}" data-img="${p.img}">
          Agregar
        </button>
      </div>`;
    productGrid.appendChild(el);
  });

  // Función para mostrar el carrito en la página
function mostrarCarrito() {
    const listaCarrito = document.getElementById("lista-carrito");
    const totalElemento = document.getElementById("total");

    if (!listaCarrito || !totalElemento) {
        console.warn("No se encontró el contenedor del carrito."); // 📌 Prueba
        return;
    }

    let carrito = obtenerCarrito();
    listaCarrito.innerHTML = "";
    let total = 0;

    carrito.forEach((producto, index) => {
        let item = document.createElement("li");
        item.textContent = `${producto.nombre} - S/.${producto.precio.toFixed(2)}`;

        // Botón eliminar
        let botonEliminar = document.createElement("button");
        botonEliminar.textContent = "Eliminar";
        botonEliminar.onclick = () => {
            carrito.splice(index, 1);
            actualizarCarrito(carrito);
            mostrarCarrito();
            actualizarContadorCarrito();
        };

        item.appendChild(botonEliminar);
        listaCarrito.appendChild(item);
        total += producto.precio;
    });

    totalElemento.textContent = `${total.toFixed(2)}`;
}

  // Eventos de "Agregar al carrito"
  document.querySelectorAll('.add-btn').forEach(b => {
    b.addEventListener('click', e => {
      const btn = e.target;
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      const price = parseFloat(btn.dataset.price);
      const img = btn.dataset.img;

      const c = getCart();
      if (!c[id]) c[id] = { qty: 0, title, price, img };
      c[id].qty++;
      saveCart(c);
      renderCart();
    });
  });
}

// ===== CARRITO ===== //
const CART_KEY = 'bv_cart_v1';
const ORD_KEY = 'bv_orders_v1';

function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '{}'); }
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function clearCart() { localStorage.removeItem(CART_KEY); renderCart(); }

// ===== ELEMENTOS ===== //
const cartList = document.getElementById('cartList');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const paypalContainer = document.getElementById('paypal-button-container');
document.getElementById('year').textContent = new Date().getFullYear();

// ===== RENDER CARRITO ===== //
function renderCart() {
  const cart = getCart();
  cartList.innerHTML = '';
  let total = 0, count = 0;

  for (const id in cart) {
    const p = cart[id];
    const qty = p.qty;
    total += p.price * qty;
    count += qty;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img class="cart-thumb" src="${p.img}">
      <div style="flex:1">
        <div>${p.title}</div>
        <div class="price">$${p.price.toFixed(2)} x ${qty}</div>
      </div>
      <div class="qty">
        <button data-action="dec" data-id="${id}">-</button>
        <div>${qty}</div>
        <button data-action="inc" data-id="${id}">+</button>
      </div>
      <button data-action="rm" data-id="${id}" style="color:#ffb3b3;border:none;background:none;cursor:pointer">✕</button>`;
    cartList.appendChild(row);
  }

  cartCount.textContent = count;
  cartTotal.textContent = `$${total.toFixed(2)}`;

  cartList.querySelectorAll('button[data-action]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.id;
      const action = b.dataset.action;
      const c = getCart();
      if (action === 'dec') c[id].qty--;
      if (action === 'inc') c[id].qty++;
      if (action === 'rm' || c[id].qty <= 0) delete c[id];
      saveCart(c);
      renderCart();
    };
  });
}

// ===== INICIALIZAR ===== //
renderProducts();
renderCart();

