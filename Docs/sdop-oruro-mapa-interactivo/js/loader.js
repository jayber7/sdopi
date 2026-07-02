(function cargarRecursosCartograficos() {
  const motor = ["lea", "flet"].join("");
  const version = "1.9.4";
  const base = `https://unpkg.com/${motor}@${version}/dist/${motor}`;

  function cargarCSS(url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  function cargarScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  cargarCSS(`${base}.css`);

  cargarScript(`${base}.js`)
    .then(() => cargarScript("js/osm-services.js"))
    .then(() => cargarScript("js/data.js"))
    .then(() => cargarScript("js/app.js"))
    .catch(() => {
      const target = document.querySelector("#realMap");
      if (target) {
        target.innerHTML = `<div class="map-error"><div><strong>No se pudo cargar el mapa</strong><span>Revisa tu conexión a internet.</span></div></div>`;
      }
    });
}());
