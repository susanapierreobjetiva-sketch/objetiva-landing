// Objetiva Broker — landing
// Punto de entrada para futura interactividad (menú móvil, formularios, etc.)
// Menú móvil (hamburguesa)
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector("header nav, .header-page nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("open");
      nav.classList.toggle("nav-open");
    });
  }
});
