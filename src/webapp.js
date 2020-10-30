//Imports, requires, variables/constantes globales
const csv = require("csvtojson");
import { MapboxLayer } from "@deck.gl/mapbox";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { ScatterplotLayer } from "@deck.gl/layers";
import { IconLayer } from "@deck.gl/layers";
import { GridLayer } from "@deck.gl/aggregation-layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";

//Variables globales para el mapa
var mapboxgl = require("mapbox-gl/dist/mapbox-gl.js");
mapboxgl.accessToken =
  "pk.eyJ1IjoibWRuNiIsImEiOiJja2ZsZHRoMXAyMHk5MnlvMzJ3azliNzVoIn0.TVyz96dtNAH7PtNb8Yw_2g";
const account = "mapbox://styles/mdn6/";
var map = new mapboxgl.Map({
  container: "map",
  style: "",
  center: { lat: 0.0, lng: 0.0 },
  zoom: 4,
});
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    language: "es-ES",
    placeholder: "Buscar ciudad, región...",
    mapboxgl: mapboxgl,
  }),
  "top-left"
);
var data; //Aquí guardamos el contenido del archivo en forma de json
var capaPuntos = ""; //Var para guardar la capa de puntos
var capaChinchetas = ""; //Var para guardar la capa de chinchetas
var capaCalor3D = ""; //Var para guardar la capa de calor 3D
var capaCalor = ""; //Var para guardar la capa de calor
var capaHex = ""; //Var para guardar la capa de hex
var nombreCampoLat = ""; //Aquí guardamos el nombre del campo de la lat
var nombreCampoLon = ""; //Aquí guardamos el nombre del campo de la lon
var nombreCampos = []; //Nos guardamos el nombre de todos los campos del archivo
var nombreCamposMostrar = []; //Nos guardamos el nombre de los campos del archivo que hay que mostrar en la infobox
var mostrarCapaPuntos = false; //Flag para saber si hay que dibujar la capa de puntos
var mostrarCapaChinchetas = false; //Flag para saber si hay que dibujar la capa de chinchetas
var mostrarCapaCalor3D = false; //Flag para saber si hay que dibujar la capa de calor 3D
var mostrarCapaCalor = false; //Flag para saber si hay que dibujar la capa de calor
var mostrarCapaHex = false; //Flag para saber si hay que dibujar la capa de hexagonos
var mostrarCapaCaminos = false; //Flag para saber si hay que dibujar la capa de hexagonos
//Variables globales para la interfaz
var docSubido = false;
var temaElegido = false;
var lastObjectHovered = null; //último objeto para poder cambiar la info que muestra la infoBox

//Selectores ---------------------------------------------------------------------------------------------
//Para el asistente
const asistente = document.getElementById("asistente");
const btnsSiguiente = document.querySelectorAll(".btn-asistente");
const steps = document.querySelectorAll(".step");
const btnsRepreContainer = document.getElementById("representacion-btns");
const btnsTemaContainer = document.getElementById("tema-btns");
const temaBtns = document.querySelectorAll(".tema-btn");
const input = document.getElementById("inputArchivo");
const infoInput = document.getElementById("infoInput");
const infoTema = document.getElementById("infoTema");
const sectionMap = document.getElementById("map");

//Para panel de control
const menu = document.getElementById("menu");
const navPanelControl = document.querySelector(".nav");
const paneles = document.querySelectorAll(".panel");
const panelMapa = document.querySelector(".panel-mapa");
const bolas = document.querySelectorAll(".bola");
const infoBox = document.getElementById("infoBox");
const expandir = document.getElementById("expandir");
const minimizar = document.getElementById("minimizar");
const camposInteraccion = document.querySelectorAll(".campo-interaccion");
const busqueda = document.querySelector(".mapboxgl-ctrl-geocoder");
busqueda.style.display = "none";
const controles = document.querySelector(".mapboxgl-ctrl-group");
controles.style.display = "none";
const infoParams = document.getElementById("infoParams");
const addFilterButton = document.getElementById("addFilterButton");

//Listeners ----------------------------------------------------------------------------------------------
btnsSiguiente.forEach((btn) => btn.addEventListener("click", stepControler)); //Controlamos las etapas del asistente (Asistente)
input.addEventListener("change", inputController); //Controlamos si suben un archivo (Asistente)
btnsRepreContainer.addEventListener("click", btnsControler); //Controlamos los btns del tipo de representación (Asistente)
btnsTemaContainer.addEventListener("click", btnsControler); //Controlamos los btns del tema del mapa (Asistente)
navPanelControl.addEventListener("click", panelControler); //Controlamos las tabs del panel de control (web app)
panelMapa.addEventListener("click", temasControler); //Controlamos los btns del temad del mapa (web app)
camposInteraccion.forEach((campo) =>
  campo.addEventListener("click", interaccionControler)
); //Controlamos los ajustes de interacción (web app)
expandir.addEventListener("click", expandirMenuControler); //Controlamos la expansión del menú (web app)
minimizar.addEventListener("click", expandirMenuControler); //Controlamos la expansión del menú (web app)
infoParams.addEventListener("click", paramsInfoBoxControler); //Controlamos que campos se muestra en infoBox (web app)
addFilterButton.addEventListener("click", addHTMLFiltro);

//Controladores ------------------------------------------------------------------------------------------
//Para el asistente de config.
function inputController(e) {
  //Leemos el archivo del input con FileReader
  var file = e.target.files[0];
  if (!file) {
    return;
  }

  //Avisamos de que estamos trabajando
  infoInput.style.color = "#70b77e";
  infoInput.innerHTML = "Leyendo el archivo...";

  var lector = new FileReader();
  lector.onload = function () {
    //Comprobar extension, parsear/convertir archivo, obtener lat/lon, crear las capas y mostrar mensaje
    let extension = file.name.split(".").pop();
    if (extension === "json" && JSON.parse(lector.result)) {
      data = JSON.parse(lector.result);
      docSubido = true;
      leerNombreCampos();
      crearCapas();
      infoInput.innerHTML = "Archivo leído correctamente.";
      infoInput.style.color = "#70b77e";
    } else if (extension === "csv") {
      (async () => {
        data = await csv({ checkType: true }).fromString(lector.result);
        docSubido = true;
        leerNombreCampos();
        crearCapas();
        infoInput.innerHTML = "Archivo leído correctamente.";
        infoInput.style.color = "#70b77e";
      })();
    } else {
      infoInput.style.color = "#fe5f55";
      infoInput.innerHTML =
        "¡Vaya! No conseguimos leer tu archivo. Inténtalo con otro archivo.";
    }
  };
  lector.readAsText(file);
}

function leerNombreCampos() {
  //Vaciamos el innerHTML del selector de datos por si estuviera lleno, así no se duplica la info que esté dentro
  infoParams.innerHTML = "";

  //Iteramos sobre los nombres de los campos buscando lat y lon
  let index = 0;
  for (var key in data[0]) {
    nombreCampos[index] = key;
    nombreCamposMostrar[index] = key;
    if (
      key === "lat" ||
      key === "Lat" ||
      key === "LAT" ||
      key === "lati" ||
      key === "Lati" ||
      key === "LATI" ||
      key === "latitude" ||
      key === "Latitude" ||
      key === "LATITUDE" ||
      key === "latitud" ||
      key === "Latitud" ||
      key === "LATITUD"
    ) {
      nombreCampoLat = key;
      console.log("campo lat : " + nombreCampoLat);
    } else if (
      key === "lon" ||
      key === "Lon" ||
      key === "LON" ||
      key === "lng" ||
      key === "Lng" ||
      key === "LNG" ||
      key === "long" ||
      key === "Long" ||
      key === "LONG" ||
      key === "longitude" ||
      key === "Longitude" ||
      key === "LONGITUDE" ||
      key === "longitud" ||
      key === "Longitud" ||
      key === "LONGITUD"
    ) {
      nombreCampoLon = key;
      console.log("campo lon : " + nombreCampoLon);
    } else {
      //Si el campo no es ni lat ni lon añadimos el campo en todos los sitios del menu de config
      //En la caja de seleccion de datos
      infoParams.innerHTML +=
        " <div class='params'><p>" + nombreCampos[index] + "</p></div>";
    }
    index++;
  }
}

function stepControler(e) {
  //Desactivamos todos los steps si ya tenemos un doc con datos
  steps.forEach((step) => {
    if (docSubido) {
      step.classList.remove("step-active");
    }
  });

  //Activamos el step que correponda
  switch (e.target.classList[0]) {
    case "-2":
      //volvemos al segundo paso
      steps[1].classList.add("step-active");
      break;
    case "-1":
      //volvemos al primer paso
      steps[0].classList.add("step-active");
      break;
    case "0":
      //pasamos al segundo paso siempre que se haya subido un doc
      if (docSubido) {
        steps[1].classList.add("step-active");
      } else {
        infoInput.innerHTML =
          "¡Ups! Selecciona un archivo de datos antes de continuar.";
        infoInput.style.color = "#fe5f55";
      }
      break;
    case "1":
      //pasamos al tercer paso
      steps[2].classList.add("step-active");
      break;
    case "2":
      //Si hemos elegido tema pasamos a la web app
      if (temaElegido) {
        sectionMap.style = "align-items: flex-end; justify-content:center;";
        asistente.style = "display: none;";
        menu.style = "display: flex;";
        infoBox.style = "display: block;";
        busqueda.style.display = "block";
        controles.style.display = "block";
        //Centramos el mapa en los datos
        map.flyTo({
          center: [data[0][nombreCampoLon], data[0][nombreCampoLat]],
          speed: 0.35,
          zoom: 10,
        });
      } else {
        //Si no hemos elegido tema nos quedamos en el mismo step
        //Activamos el último step porque lo desactivamos con el foreach arriba
        //Esto se podría hacer de otra forma (mejorar si da tiempo)
        steps[2].classList.add("step-active");
        infoTema.innerHTML = "Selecciona un tema para el mapa";
        infoTema.style.color = "#fe5f55";
      }

      break;
  }
}

function btnsControler(e) {
  //Comprobamos desde que interfaz se está llamando
  if (
    e.target.classList[0] === "representacion-btn" ||
    e.target.classList[0] === "representacion-btn-active"
  ) {
    //Si hacemos click sobre un btn activo lo desactivamos
    //Si no estaba activo lo activamos
    if (e.target.classList[2] === "representacion-btn-active") {
      e.target.classList.remove("representacion-btn-active");
    } else {
      //Activamos el botón correspondiente
      e.target.classList.add("representacion-btn-active");
    }
    //Mandamos a capasControler el index para active o desactive
    capasControler(e.target.classList[1]);
  } else if (e.target.classList[0] === "tema-btn") {
    //Desactivamos todos los botones
    temaBtns.forEach((btn) => {
      btn.classList.remove("tema-btn-active");
    });
    //Activamos el botón correspondiente
    e.target.classList.add("tema-btn-active");
    //Activamos el flag de temaElegido
    temaElegido = true;
    //Mandamos a temasControler el index para que lo maneje
    temasControler(e.target.classList[1]);
  }
}

//Para el menú de config.
function panelControler(e) {
  //Si clicas en ul,span o nav se para ejecución
  //Se hace así porque el pointer-events: none; evita el click sobre los hijos del item y no lo queremos
  if (
    e.target.tagName.toLowerCase() === "ul" ||
    e.target.tagName.toLowerCase() === "span" ||
    e.target.tagName.toLowerCase() === "nav" ||
    e.target.tagName.toLowerCase() === "div"
  ) {
    return;
  }
  //Desactivamos todos los paneles
  paneles.forEach((panel) => {
    panel.classList.remove("panel-active");
  });

  //Gracias a la clase[0] sabemos sobre que li hemos hecho clic.
  //Activamos el panel que corresponda
  switch (e.target.classList[0]) {
    case "0":
      paneles[0].classList.add("panel-active");
      break;
    case "1":
      paneles[1].classList.add("panel-active");
      break;
    case "2":
      paneles[2].classList.add("panel-active");
      break;
    case "3":
      paneles[3].classList.add("panel-active");
      break;
    default:
      break;
  }
}

function expandirMenuControler(e) {
  //La primera vez height del menu será cadena vacia, las siguientes 60/30vh
  if (e.target.id === "expandir") {
    if (menu.style.height === "" || menu.style.height === "30vh") {
      menu.style.height = "60vh";
      expandir.style.transform = "rotate(90deg)";
      infoBox.style.maxHeight = "30vh";
    } else {
      menu.style.height = "30vh";
      infoBox.style.maxHeight = "60vh";
      expandir.style.transform = "rotate(-90deg)";
    }
  } else {
    if (menu.style.height === "60vh") {
      expandir.style.transform = "rotate(-90deg)";
    }
    menu.style.height = "12vh";
    infoBox.style.maxHeight = "80vh";
  }
}

function capasControler(e) {
  //Si e es un número: estamos llamando desde el asistente
  //Si no: estamos llamando desde el panel de config.
  let index = 0;
  if (e >= 0 && e < 6) {
    index = e;
  } else {
    index = e.target.classList[0];
  }

  //Según el index activamos o desactivamos la capa que toque
  switch (index) {
    case "0": //Capa de puntos
      if (mostrarCapaPuntos) {
        mostrarCapaPuntos = false;
        console.log("DESactivada capa de puntos");
      } else {
        mostrarCapaPuntos = true;
        console.log("Activada capa de puntos");
      }
      break;
    case "1": //Capa de chichetas
      if (mostrarCapaChinchetas) {
        mostrarCapaChinchetas = false;
        console.log("DESactivada capa de chichets");
      } else {
        mostrarCapaChinchetas = true;
        console.log("Activada capa de chichetas");
      }
      break;
    case "2": //Capa de calor 3D
      if (mostrarCapaCalor3D) {
        mostrarCapaCalor3D = false;
        console.log("DESactivada capa de calor3D");
      } else {
        mostrarCapaCalor3D = true;
        console.log("Activada capa de calor3D");
      }
      break;
    case "3": //Capa de calor
      if (mostrarCapaCalor) {
        mostrarCapaCalor = false;
        console.log("DESactivada capa de cluster");
      } else {
        mostrarCapaCalor = true;
        console.log("Activada capa de clusters");
      }
      break;
    case "4": //Capa de hexágonos
      if (mostrarCapaHex) {
        mostrarCapaHex = false;
        console.log("DESactivada capa de hex");
      } else {
        mostrarCapaHex = true;
        console.log("Activada capa de hex");
      }
      break;
    case "5": //Capa de caminos
      if (mostrarCapaCaminos) {
        mostrarCapaCaminos = false;
        console.log("DESactivada capa de caminos");
      } else {
        mostrarCapaCaminos = true;
        console.log("Activada capa de caminos");
      }
      break;
    default:
      break;
  }
  //Llamamos a update layer para que redibujar el mapa.
  updateLayers();
}

function addHTMLFiltro(e) {
  var options;
  var input;

  //Iteramos para rellenar las options con los campos
  for (let i = 0; i < nombreCampos.length; i++) {
    options +=
      "<option value=" + nombreCampos[i] + ">" + nombreCampos[i] + "</option>";
  }

  //Miramos el tipo del primer elemtno del json para poner el input correcto
  for (var key in data[0]) {
    console.log(data[0][key]);
    console.log(typeof data[0][key]);
    break;
  }
  switch (typeof data[0][key]) {
    case "string":
      input = '<input type="text" class="text">';
      break;
    case "number":
      input =
        '<input type="number" placeholder="Mínimo" class="filtroInput number 0"> <input type="number" placeholder="Máximo" class=" filtroInput number 1">';
      break;
  }

  //Creamos el div con los options e input correctos
  const contenedorFiltros = document.querySelector(".contenedorFiltros");
  contenedorFiltros.innerHTML +=
    ' <div class="cajaFiltro">' +
    '<select name="campos" class="filtroSelect">' +
    options +
    "</select>" +
    input +
    "</div>";

  //Cada vez que cambiamos el innerHTML recurperamos el hmtl y añadimos los listener
  const filtroSelect = document.querySelectorAll(".filtroSelect");
  filtroSelect.forEach((select) =>
    select.addEventListener("change", typeOfInputControler)
  );

  /*
  const filtroInput = document.querySelectorAll(".filtroInput");
  filtroInput.forEach((input) =>
    input.addEventListener("change", typeOfInputControler)
  ); */
}
function typeOfInputControler(e) {
  var input;

  //Ver el tipeof del value del select
  switch (typeof data[0][e.target.value]) {
    case "string":
      console.log("Este campo es un string");
      //Eliminamos los inputs que haya
      e.target.parentNode.children[1].remove();
      e.target.parentNode.children[1].remove();
      break;
    case "number":
      console.log("Este campo es un número");
      //Eliminamos los input
      e.target.parentNode.children[1].remove();
      e.target.parentNode.children[1].remove();
      break;
  }
}

function interaccionControler(e) {
  switch (e.target.classList[1]) {
    case "mostrarInfo":
      if (infoBox.style.display === "block") {
        infoBox.style.display = "none";
      } else {
        infoBox.style.display = "block";
      }
      break;

    case "mostrarControles":
      if (controles.style.display === "block") {
        controles.style.display = "none";
      } else {
        controles.style.display = "block";
      }
      break;

    case "mostrarBusqueda":
      if (busqueda.style.display === "block") {
        busqueda.style.display = "none";
      } else {
        busqueda.style.display = "block";
      }
      break;
  }
}
function paramsInfoBoxControler(e) {
  if (e.target.id === "infoParams") {
    return;
  }
  //Si es "" o verde es que está activo, lo desactivamos, eliminamos del array ded campos a mostrar
  //y actualizamos la infoBox
  if (
    e.target.style.backgroundColor === "" ||
    e.target.style.backgroundColor === "var(--verde)"
  ) {
    e.target.style.backgroundColor = "var(--gris)";
    nombreCamposMostrar.splice(
      nombreCamposMostrar.indexOf(e.target.children[0].innerText),
      1
    );
    infoBoxControler(lastObjectHovered);
  }
  //Si no, lo activamos, añadimos al array de campos a mostrar y actualizamos la infobox
  else {
    e.target.style.backgroundColor = "var(--verde)";
    nombreCamposMostrar.push(e.target.children[0].innerText);
    infoBoxControler(lastObjectHovered);
  }
  console.log(nombreCamposMostrar);
}
function infoBoxControler(object) {
  const info = document.getElementById("info");
  if (object != null) {
    info.innerHTML = "";
    info.innerHTML =
      info.innerHTML +
      "<p>Representado " +
      data.length +
      " elementos </p>" +
      "<p>Coordenadas : [" +
      object[nombreCampoLat] +
      " , " +
      object[nombreCampoLon] +
      "]</p>";

    //Iteramos sobre nombreCamposMostrar para mostrar la info que elija el user
    for (let i = 0; i < nombreCamposMostrar.length; i++) {
      if (
        nombreCamposMostrar[i] !== nombreCampoLat &&
        nombreCamposMostrar[i] !== nombreCampoLon
      ) {
        info.innerHTML =
          info.innerHTML +
          "<p >" +
          nombreCamposMostrar[i] +
          " : " +
          object[nombreCamposMostrar[i]] +
          "</p>";
      }
    }
  }
}

function temasControler(e) {
  //Si pulsamos fuera de los botones no hacemos nada
  if (e.target != undefined && e.target.classList[0] === "panel") {
    return;
  }
  //Si e es un número: estamos llamando desde el asistente
  //Si no: estamos llamando desde el panel de config.
  let index = 0;
  if (e >= 0 && e < 6) {
    index = e;
    //Informamos de que se ha elegido un tema correctamente
    infoTema.innerHTML = "¡Tema seleccionado! Puedes continuar.";
    infoTema.style.color = "#70b77e";
  } else {
    index = e.target.classList[0];
  }

  //Ponemos las bolas del panel en rojo
  bolas.forEach((bola) => {
    bola.src = "./assets/imgs/no.svg";
  });
  //Actualizamos la bola del tema asignado
  bolas[index].src = "./assets/imgs/yes.svg";

  //Cambiamos el tema del mapa
  switch (index) {
    case "0":
      map.setStyle(account + "ckfzbshld135b19qx61b9midj");
      break;
    case "1":
      map.setStyle(account + "ckfzc1hj713al19niu6ixn421");
      break;
    case "2":
      map.setStyle(account + "ckfzc2og7138519ml3rpgkmyy");
      break;
    case "3":
      map.setStyle(account + "ckfzbxsid07i319o3q6w1ru39");
      break;
    case "4":
      map.setStyle(account + "ckfzc6vsx13fb19nydfwx65fw");
      break;
    case "5":
      map.setStyle(account + "ckfzc89xt07rg19o3ljldgzv0");
      break;
    default:
      break;
  }
}

//Controladores del mapa ----------------------------------------------------------------------------
//Constructores de capas
function crearCapas() {
  //Capa de puntos
  capaPuntos = new MapboxLayer({
    id: "points",
    type: ScatterplotLayer,
    data: data,
    radiusMinPixels: 3,
    radiusMaxPixels: 7,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getFillColor: (d) =>
      d.n_killed > 0 ? [200, 0, 40, 150] : [255, 140, 0, 100],
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        infoBoxControler(object);
      }
    },
  });

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  };
  capaChinchetas = new MapboxLayer({
    id: "icon-layer",
    type: IconLayer,
    data: data,
    iconAtlas:
      "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
    iconMapping: ICON_MAPPING,
    getIcon: (d) => "marker",
    getSize: (d) => 30,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getColor: (d) => [Math.sqrt(d.exits), 140, 0],
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        infoBoxControler(object);
      }
    },
  });

  capaCalor3D = new MapboxLayer({
    id: "heat3D",
    type: GridLayer,
    data: data,
    pickable: true,
    extruded: true,
    cellSize: 200,
    elevationScale: 10,
    colorDomain: [1, 100],
    opacity: 0.6,
    coverage: 0.75,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    onHover: ({ object, x, y }) => {
      const info = document.getElementById("info");
      if (object) {
        info.innerHTML = "";
        info.innerHTML =
          info.innerHTML +
          "<p>Representado " +
          data.length +
          " elementos </p>" +
          "<p>Coordenadas aprox. : [" +
          object.points[0][nombreCampoLat] +
          " , " +
          object.points[0][nombreCampoLon] +
          "]</p>" +
          "<p>Elementos en este área : " +
          object.count +
          " </p>";
      } else {
        // info.innerHTML = "";
      }
    },
  });

  capaCalor = new MapboxLayer({
    id: "heat",
    type: HeatmapLayer,
    data: data,
    radiusPixels: 50,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
  });

  capaHex = new MapboxLayer({
    id: "hex",
    data: data,
    type: HexagonLayer,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getElevationWeight: (d) => d.n_killed * 2 + d.n_injured,
    elevationScale: 100,
    extruded: true,
    radius: 1609,
    opacity: 0.6,
    coverage: 0.88,
    getFillColor: (d) =>
      d.n_killed > 0 ? [200, 0, 40, 150] : [255, 255, 0, 100],
  });
}

//Eventos del mapa ----------------------------------------------------------------------------------------
map.on("styledata", () => {
  if (mostrarCapaPuntos) {
    map.addLayer(capaPuntos);
  }
  if (mostrarCapaChinchetas) {
    map.addLayer(capaChinchetas);
  }
  if (mostrarCapaCalor3D) {
    map.addLayer(capaCalor3D);
  }
  if (mostrarCapaCalor) {
    map.addLayer(capaCalor);
  }
  if (!map.getLayer("hex")) {
    //  map.addLayer(capaHex);
  }
});

function updateLayers() {
  if (mostrarCapaPuntos) {
    map.addLayer(capaPuntos);
  } else {
    if (map.getLayer("points")) {
      map.removeLayer("points");
    }
  }

  if (mostrarCapaChinchetas) {
    map.addLayer(capaChinchetas);
  } else {
    if (map.getLayer("icon-layer")) {
      map.removeLayer("icon-layer");
    }
  }

  if (mostrarCapaCalor3D) {
    map.addLayer(capaCalor3D);
  } else {
    if (map.getLayer("heat3D")) {
      map.removeLayer("heat3D");
    }
  }

  if (mostrarCapaCalor) {
    map.addLayer(capaCalor);
  } else {
    if (map.getLayer("heat")) {
      map.removeLayer("heat");
    }
  }

  if (!map.getLayer("hex")) {
    //  map.addLayer(capaHex);
  }
  map.triggerRepaint();
}
