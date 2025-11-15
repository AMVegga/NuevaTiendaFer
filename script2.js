document.addEventListener("DOMContentLoaded", () => {
    actualizarContadorCarrito();
    mostrarCarrito();
    actualizarBotonesCompra();
});

// Obtener carrito de LocalStorage
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

// Guardar carrito en LocalStorage
function actualizarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// Función para agregar un producto al carrito
function agregarAlCarrito(nombre, precio) {
    console.log("Intentando agregar:", nombre, precio); // 📌 Prueba

    if (!nombre || !precio) {
        alert("Error: Producto sin datos.");
        return;
    }

    let carrito = obtenerCarrito(); // Obtener carrito actualizado
    carrito.push({ nombre, precio: parseFloat(precio) });

    actualizarCarrito(carrito); // Guardar en LocalStorage
    actualizarContadorCarrito();
    mostrarCarrito(); // Mostrar actualización en tiempo real
    actualizarBotonesCompra(); // el botón vuelve a “Comprar” y se habilita
}

// Función para actualizar el contador del carrito
function actualizarContadorCarrito() {
    const contador = document.getElementById("contador-carrito");
    if (contador) {
        let carrito = obtenerCarrito();
        contador.textContent = carrito.length;
    }
}

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
            actualizarBotonesCompra();
        };

        item.appendChild(botonEliminar);
        listaCarrito.appendChild(item);
        total += producto.precio;
    });

    totalElemento.textContent = `${total.toFixed(2)}`;
}

// Evento para vaciar el carrito
document.addEventListener("DOMContentLoaded", () => {
    const btnVaciar = document.getElementById("vaciar-carrito");
    if (btnVaciar) {
        btnVaciar.addEventListener("click", () => {
            actualizarCarrito([]); // Vaciar LocalStorage
            mostrarCarrito();
            actualizarContadorCarrito();
            actualizarBotonesCompra();
        });
    }
});

// Actualiza el estado visual de los botones de compra
function actualizarBotonesCompra() {
  const carrito = obtenerCarrito();
  const botones = document.querySelectorAll(".agregar-carrito");

  botones.forEach(boton => {
    const nombre = boton.dataset.nombre;
    const enCarrito = carrito.some(p => p.nombre === nombre);

    if (enCarrito) {
      boton.textContent = "Producto añadido";
      boton.disabled = true;
      boton.style.backgroundColor = "#28a745"; // verde
      boton.style.color = "#fff";
    } else {
      boton.textContent = "Comprar";
      boton.disabled = false;
      boton.style.backgroundColor = "";
      boton.style.color = "";
    }
  });
}

// Evento para agregar productos desde la tienda
document.addEventListener("DOMContentLoaded", () => {
    
});

// Función que maneja la adición al carrito
function agregarEventoAlBoton(event) {
    const boton = event.target;
    const nombre = boton.dataset.nombre;
    const precio = boton.dataset.precio;

    if (!nombre || !precio) {
        alert("Error: El producto no tiene datos.");
        return;
    }

    agregarAlCarrito(nombre, precio);
    cambiarBotonAñadido(boton);
}

// Función para cambiar el texto del botón cuando se agrega un producto
function cambiarBotonAñadido(boton) {
    boton.textContent = "Producto añadido";
    boton.disabled = true;
    boton.style.backgroundColor = "#28a745"; // Verde
    boton.style.color = "#fff"; // Blanco
}

// Función para calcular el total del carrito
function calcularTotalCarrito() {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let total = carrito.reduce((suma, producto) => {
      let precio = parseFloat(producto.precio) || 0.00;
      let cantidad = parseInt(producto.cantidad) || 1;
      return suma + (precio * cantidad);
    }, 0.00);
    return total.toFixed(2);
}
   
// Funcion buscador de productos en el encabezado //

function buscarProductos() {
    let input = document.getElementById("buscador").value.toLowerCase();
    let productos = document.querySelectorAll(".producto");

    productos.forEach(producto => {
        let nombre = producto.getAttribute("data-nombre").toLowerCase();
        producto.style.display = nombre.includes(input) ? "block" : "none";
    });
}

// Funcion buscador de productos en la seccion productos //

function buscarProductos2() {
    let input = document.getElementById("buscador2").value.toLowerCase();
    let productos = document.querySelectorAll(".producto");

    productos.forEach(producto => {
        let nombre = producto.getAttribute("data-nombre").toLowerCase();
        producto.style.display = nombre.includes(input) ? "block" : "none";
    });
}

/* funcion para enviar el pedido por whatsapp */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-whatsapp");
  if (btn) btn.addEventListener("click", enviarPedidoWhatsApp);
});

function enviarPedidoWhatsApp() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");

  if (!carrito || carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const nombre = limpiarTexto(document.getElementById("custName").value);
  const ciudad = limpiarTexto(document.getElementById("custCity").value);
  const direccion = limpiarTexto(document.getElementById("custAddress").value);
  const telefono = limpiarTexto(document.getElementById("custPhone").value);
  const notas = limpiarTexto(document.getElementById("custNotes").value);

  if (!nombre || !ciudad || !direccion || !telefono) {
    alert("Completa todos los campos obligatorios.");
    return;
  }

  let mensaje = `🧾 *Nuevo Pedido*\n`;
  mensaje += `👤 Nombre: ${nombre}\n`;
  mensaje += `📍 Ciudad: ${ciudad}\n`;
  mensaje += `🏠 Dirección: ${direccion}\n`;
  mensaje += `📱 Teléfono: ${telefono}\n`;
  if (notas.trim() !== "") mensaje += `📝 Nota: ${notas}\n`;
  mensaje += `\n🛒 *Productos:*\n`;

  let total = 0;

  carrito.forEach(item => {
    const precio = parseFloat(item.precio) || 0;
    mensaje += `• ${item.nombre} - S/.${precio.toFixed(2)}\n`;
    total += precio;
  });

  mensaje += `\n💰 Total: S/.${total.toFixed(2)}`;

  const numero = "+51952208427";

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  console.log(mensaje);
  window.open(url, "_blank");
}

function limpiarTexto(txt) {
  return txt.replace(/\n/g, " ").replace(/\r/g, "").trim();
}
   
//* CARGAR PRODUCTOS *//

  async function cargarProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  const contenedor = document.getElementById("productos");
  data.forEach(p => {
    contenedor.innerHTML += `
      <div>
        <img src="${p.imagen_url}" width="180"; height="250">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <strong>$${p.precio}</strong>
      </div>
    `;
  });
}

cargarProductos();

//** REGISTRO DE USUARIO (INACTIVO)**//

//* async function registrar() { 
//*  const email = document.getElementById('email').value;
//*  const pass = document.getElementById('password').value;

//*  const { data, error } = await supabase.auth.signUp({
//*    email: email,
//*    password: pass
//*  });

//*  if (error) {
//*  alert('Error: ' + error.message);
//* } else {
//*  alert('Revisa tu correo para confirmar');
//*  }
//* }

  //* CARGAR CATALOGO *// 

  async function cargarCatalogo() {
    const { data, error } = await supabase
      .from("productos")
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error al cargar productos:', error);
      return;
    }

    const contenedor = document.getElementById("catalogo-productos");
    contenedor.innerHTML = "";

    data.forEach(p => {
  const div = document.createElement("div");
  div.className = "producto";
  div.setAttribute("data-nombre", p.nombre);

  div.innerHTML = `
    <h3>${p.nombre}</h3>
    <img src="${p.imagen_url}" width="180"; height="250"><br>
    <p>${p.descripcion}</p>
    <strong>S/.${p.precio}</strong><br>
    <button 
      class="agregar-carrito" 
      data-nombre="${p.nombre}" 
      data-precio="${p.precio}">
      Comprar
    </button>
  `;

  contenedor.appendChild(div);
});

const botones = contenedor.querySelectorAll(".agregar-carrito");
  botones.forEach(boton => {
    boton.addEventListener("click", agregarEventoAlBoton);
  });
}

  cargarCatalogo();

//* AMPLIADO DEL CATALOGO DE PRODUCTOS (INACTIVO) *//

//** document.addEventListener('click', function(e) {
//** const producto = e.target.closest('.producto');
//** if (producto) {
      // Si ya está ampliado, lo cerramos
//** const yaAmpliado = document.querySelector('.producto.ampliado');
//**  if (yaAmpliado && yaAmpliado !== producto) {
//**    yaAmpliado.classList.remove('ampliado');
//**  }
//**  producto.classList.toggle('ampliado');
//**  document.body.style.overflow = producto.classList.contains('ampliado') ? 'hidden' : 'auto';
//**    }
//**  });

///////////////////////////////////

//** INICIAR SESION (INACTIVO) **//

//** document.getElementById("iniciar-sesion").addEventListener("click", async () => {
//**  const email = document.getElementById("email").value;
//**  const password = document.getElementById("password").value;

//**  const { data, error } = await supabase.auth.signInWithPassword({
//**    email,
//**  password,
//**  });

//**  if (error) {
//**  alert("❌ Error al iniciar sesión: " + error.message);
//**  } else {
//**  alert("✅ Sesión iniciada correctamente.");
    // Redirigir al panel de administrador (si quieres)
//** window.location.href = "admin.html";
//**  }
//** });