//#region IMPORTS
const csv = require("csvtojson");
import { MapboxLayer } from "@deck.gl/mapbox";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { ScatterplotLayer } from "@deck.gl/layers";
import { IconLayer } from "@deck.gl/layers";
import { GridLayer } from "@deck.gl/aggregation-layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
//#endregion

//#region VARIABLES DEL MAPA
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
    placeholder: "Buscar ciudad o región...",
    mapboxgl: mapboxgl,
  }),
  "top-left"
);
//#endregion

//#region VARIABLES GLOBALES
var data; //Aquí guardamos el contenido del archivo en forma de json
var filteredData; //Aquí guardamos el contenido del archivo en forma de json
var capasActivas = []; //Array con las capas activas en cada momento
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
var capasAsistente = true; //Flag para indicar al controlador de las capas que estamos activando y desactivando desde el asistente
//#endregion

//#region SELECTORES ASISTENTE DE CONFIGURACIÓN
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
//#endregion

//#region SELECTORES MENÚ
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
const contenedorFiltros = document.querySelector(".contenedorFiltros");
const addFilterButton = document.getElementById("addFilterButton");
const contenedorCapas = document.querySelector(".contenedorCapas");
const capaSelect = document.querySelectorAll(".capaSelect")
const addCapaButton = document.getElementById("addCapaButton");
const deleteCapaButtons = document.querySelectorAll(".deleteCapaButton");
//#endregion

//#region LISTENERS
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
addFilterButton.addEventListener("click", stateFilterControler); //Controlamos los htmls de los filtros
addCapaButton.addEventListener("click", stateCapasControler); //Añadimos los htmls de las capas
deleteCapaButtons.forEach((btn) => btn.addEventListener("click", stateCapasControler));
capaSelect.forEach((select) =>
  select.addEventListener("click", stateCapasControler)
);
//#endregion



//#region CONTROLADORES ASISTENTE DE CONFIGURACIÓN

//Se llama cuando se selcciona un doc desde el input
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
      filteredData = data;
      docSubido = true;
      leerNombreCampos();
      crearCapas();
      infoInput.innerHTML = "Archivo leído correctamente.";
      infoInput.style.color = "#70b77e";
    } else if (extension === "csv") {
      (async () => {
        data = await csv({ checkType: true }).fromString(lector.result);
        filteredData = data;
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

//Se llama desde INPUTCONTROLLER() --> Leemos los campos del documento, los guardamos y añadimos elementos a la interfaz
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

  //Una vez leidos todos los campos montamos el panel de filtros
  addHTMLFiltros();
}

//Se llama desde los los botones del asistente "Siguiente/Anterior Paso" --> Controla en qué paso del asistente estamos
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
        capasAsistente = true;
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
        capasAsistente = false;
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

//Se llama desde los los botones del asistente de selección de capas y temas -->  Llama a CAPASCONTROLER() o a TEMACONTROLER() para (des)activar temas y capas
function btnsControler(e) {
  //Comprobamos qué botón está llamando a la función
  if (e.target.classList[0] === "representacion-btn" || e.target.classList[0] === "representacion-btn-active") {
    //Al hacer click vemos le estado del botón
    if (e.target.classList[2] === "representacion-btn-active") {
      //Dectivamos el botón correspondiente y la capa correspondiente
      e.target.classList.remove("representacion-btn-active");
      capasControler(e.target.classList[1], "eliminar");
    } else {
      //Activamos el botón correspondiente y la capa correspondiente
      e.target.classList.add("representacion-btn-active");
      capasControler(e.target.classList[1]);
    }

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
//#endregion




//#region CONTROLADORES MENÚ

//Se llama desde el nav del menú --> Desactiva los paneles y activa el panel que corresponda
function panelControler(e) {
  //Si clicas en ul,span o nav se para ejecución
  //Se hace así porque el pointer-events: none; evita el click sobre los hijos del item y no lo queremos
  if (e.target.tagName.toLowerCase() === "ul" || e.target.tagName.toLowerCase() === "span" || e.target.tagName.toLowerCase() === "nav" ||
    e.target.tagName.toLowerCase() === "div"
  ) { return; }

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
  //Desactivamos los marcadores de todas las opciones y activamos sobre la que se ha hecho clic
  for (let i = 0; i < e.target.parentNode.children.length; i++) {
    e.target.parentNode.children[i].children[0].style.borderBottom = "2px solid var(--fondo)"
  }
  e.target.children[0].style.borderBottom = "2px solid var(--azul)"
}
//Se llama desde el nav del menú --> Controla la expansión del menú
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

//Se llama desde BTNSCONTROLER() o desde STATECAPASCONTROLER() --> Controla la activación y desactivación de las capas
function capasControler(index, accion) {
  //Según el index activamos o desactivamos la capa que toque
  switch (index) {
    case "Puntos": //Capa de puntos
      if (accion === "eliminar") {
        mostrarCapaPuntos = false;
        removeElementCapasActivas("Puntos");
      } else {
        mostrarCapaPuntos = true;
        capasActivas.push("Puntos");
      }
      break;
    case "Chinchetas": //Capa de chichetas
      if (accion === "eliminar") {
        mostrarCapaChinchetas = false;
        removeElementCapasActivas("Chinchetas");
      } else {
        mostrarCapaChinchetas = true;
        capasActivas.push("Chinchetas");
      }
      break;
    case "Calor3D": //Capa de calor 3D
      if (accion === "eliminar") {
        mostrarCapaCalor3D = false;
        removeElementCapasActivas("Calor3D");;
      } else {
        mostrarCapaCalor3D = true;
        capasActivas.push("Calor3D");
      }
      break;
    case "Calor": //Capa de calor
      if (accion === "eliminar") {
        mostrarCapaCalor = false;
        removeElementCapasActivas("Calor");
      } else {
        mostrarCapaCalor = true;
        capasActivas.push("Calor");
      }
      break;
    case "Hexagono": //Capa de hexágonos
      if (accion === "eliminar") {
        mostrarCapaHex = false;
        removeElementCapasActivas("Hexagonos");
      } else {
        mostrarCapaHex = true;
        capasActivas.push("Hexagonos");
      }
      break;
    case "Caminos": //Capa de caminos
      if (accion === "eliminar") {
        mostrarCapaCaminos = false;
        removeElementCapasActivas("Caminos");
      } else {
        mostrarCapaCaminos = true;
        capasActivas.push("Caminos");
      }
      break;
    default:
      break;
  }

  //Si es la primera vez lo indicamos a stateCapasControler para generar los controles en la interfaz en el panel de capas
  if (capasAsistente) {
    stateCapasControler();
  }
  //Llamamos a update layer para que redibujar el mapa.
  updateLayers();
}
//Función auxiliar para eliminar un elemento concreto de un array
function removeElementCapasActivas(elem) {
  const index = capasActivas.indexOf(elem);
  if (index > -1) {
    capasActivas.splice(index, 1);
  }
}

//Se llama desde el botón de borrar capa, la hacer click sobre los selects y options y desde el asistente de config --> Ordena a capasControler qué capas añadir y eliminar
function stateCapasControler(e) {

  //Si llamamos desde el asistente
  if (capasAsistente) {
    console.log("Recibiendo llamada del asistente")

    //Desactivamos todas las cajas de capas
    for (let i = 0; i < 6; i++) {
      contenedorCapas.children[i].classList.remove("cajaCapaActive");
    }
    //Activamos las cajas necesarias
    for (let i = 0; i < capasActivas.length; i++) {
      if (contenedorCapas.children[i].classList[1] === undefined) {
        contenedorCapas.children[i].classList.add("cajaCapaActive");
        contenedorCapas.children[i].children[0].value = capasActivas[i];
      }
    }
  }

  //Si el elemento que llama a la func. es el botón de add capa añadimos el html
  if (e.target.id === "addCapaButton") {
    for (let i = 0; i < 6; i++) {
      if (contenedorCapas.children[i].classList[1] === undefined) {
        contenedorCapas.children[i].classList.add("cajaCapaActive");
        contenedorCapas.children[i].children[0].value = "";
        break;
      }
    }
  }

  //Si llamamos desde el btn borrar capa: ocultamos el html, llamamos a capasControler para apagar la capa y actualizamos el mapa
  if (e.target.classList[0] === "deleteCapaButton") {
    e.target.parentNode.classList.remove("cajaCapaActive");
    capasControler(e.target.parentNode.children[0].value, "eliminar");
  }


  //Si hacemos click sobre el select borramos la capa que haya.
  if (e.target.tagName.toLowerCase() === "select" && e.target.value != "") {
    capasControler(e.target.value, "eliminar");
    console.log("valor para borrar " + e.target.value);
  }
  //Si click sobre el options ponemos la nueva
  else if (e.target.tagName.toLowerCase() === "option" && e.target.value != "") {
    console.log("valor para añadir " + e.target.value);
    capasControler(e.target.value);
  }
}

//Se llama al leer el nombre de los campos del archivo para generar el html necesario
function addHTMLFiltros() {
  var div, options, input;

  //Iteramos sobre los nombres de los campos para rellenar las options
  for (let i = 0; i < nombreCampos.length; i++) {
    options +=
      "<option value=" + nombreCampos[i] + ">" + nombreCampos[i] + "</option>";
  }

  //Miramos el tipeof del primer elemento del json para poner el input correcto
  for (let key in data[0]) {
    switch (typeof data[0][key]) {
      case "string":
        input = '<input type="text" class="inputFilter text">';
        break;
      case "number":
        input =
          '<input type="number" placeholder="Mínimo" id="0" class="inputFilter number" step=0.001> <input type="number" placeholder="Máximo"  id="1" class="inputFilter number" step=0.001>';
        break;
    }
    break;
  }

  //Vaciamos. Si hemos elegido varios archivos de datos tendríamos varios filtros si no los vaciamos
  contenedorFiltros.innerHTML = ""
  //Creamos todos los html de los filtros con los datos recuperados arriba
  for (let x = 0; x < nombreCampos.length; x++) {
    //Creamos el div con los options e input correctos
    //Si es el primero ponemos la clase cajaFiltroActive, a los demás no para que no aparezcan de primeras
    if (x == 0) {
      div = ' <div class="cajaFiltro cajaFiltroActive">'
    } else {
      div = ' <div class="cajaFiltro">'
    }
    contenedorFiltros.innerHTML +=
      div + '<select name="campos" class="filtroSelect">' + options + "</select>" +
      input + "<button class='deleteFilter'> Borrar </button>" + "</div>";
  }

  //Añadimos los listener a los select, a los botones
  const filtroSelect = document.querySelectorAll(".filtroSelect");
  filtroSelect.forEach((select) =>
    select.addEventListener("change", typeOfInputControler)
  );

  const applyFilterBtn = document.querySelectorAll(".applyFilter");
  applyFilterBtn.forEach((btn) => btn.addEventListener("click", filterData));

  const deleteFilterBtn = document.querySelectorAll(".deleteFilter");
  deleteFilterBtn.forEach((btn) => btn.addEventListener("click", stateFilterControler));
}

//Se llama al darle a añadir o borrar un filtro
function stateFilterControler(e) {
  //Si el elemento que llama a la func. es el botón de añadir añadimos el html para un nuevo filtro
  if (e.target.id === "addFilterButton") {
    for (var i = 0; i < contenedorFiltros.children.length; i++) {
      if (contenedorFiltros.children[i].classList[1] === undefined) {
        contenedorFiltros.children[i].classList.add("cajaFiltroActive");
        break;
      }
    }
  }
  //Si llamamos desde el botón borrar filtro ocultamos el filtro y llamamos al filtrado para que actualice los datos
  else if (e.target.classList[0] === "deleteFilter") {
    e.target.parentNode.classList.remove("cajaFiltroActive")
    filterData();
  }
}

//Se llama al cambiar de option en los selects del filtro
function typeOfInputControler(e) {
  var input1 = e.target.parentNode.children[1];
  var input2 = e.target.parentNode.children[2];
  //Ver el tipeof del value del select
  switch (typeof data[0][e.target.value]) {
    case "string":
      console.log("El campo " + e.target.value + " es un string");

      if (input1.classList[1] === "number") {
        //Modificamos el primer input
        input1.value = "";
        input1.type = "text";
        input1.placeholder = "Filtrar por...";
        input1.classList.remove("number");
        input1.classList.add("text");
        //Ocultamos el segundo
        input2.value = "";
        input2.style.display = "none";
      }
      break;
    case "number":
      console.log("El campo " + e.target.value + " es un número");
      if (input1.classList[1] === "text") {
        //Modificamos el primer input
        input1.value = "";
        input1.type = "number";
        input1.placeholder = "Mínimo";
        input1.classList.remove("text");
        input1.classList.add("number");
        //Mostramos el segundo
        input2.value = "";
        input2.style.display = "flex";

      }
      break;

    default: console.log("El campo " + e.target.value + " es del tipo " + typeof data[0][e.target.value]);
      break;
  }
}

//Se llama al hacer click en aplicar filtros
function filterData() {
  //Antes de filtrar recuperamos todos los filtros
  const cajasFiltros = document.querySelectorAll(".cajaFiltro")

  var contadorFiltrosActivos = 0;
  filteredData = data;
  //Iteramos sobre los filtro para filtrar los datos según los filtros activos
  cajasFiltros.forEach(cajaFiltro => {
    if (cajaFiltro.classList.contains("cajaFiltroActive")) {
      contadorFiltrosActivos++;
      if (typeof data[0][cajaFiltro.children[0].value] === "number") {

        if (cajaFiltro.children[1].value != "" && cajaFiltro.children[2].value != "") {
          filteredData = filteredData.filter(
            d => d[cajaFiltro.children[0].value] >= cajaFiltro.children[1].value
              && d[cajaFiltro.children[0].value] <= cajaFiltro.children[2].value
          );
        } else if (cajaFiltro.children[1].value == "" && cajaFiltro.children[2].value != "") {
          filteredData = filteredData.filter(d => d[cajaFiltro.children[0].value] <= cajaFiltro.children[2].value);
        } else if (cajaFiltro.children[2].value == "" && cajaFiltro.children[1].value != "") {
          filteredData = filteredData.filter(d => d[cajaFiltro.children[0].value] >= cajaFiltro.children[1].value);
        }
        else {
          console.log("ERROR, AÑADE ALMENOS UN VALOR PARA FILTRAR");
        }

      } else {
        if (cajaFiltro.children[1].value !== "") {
          filteredData = filteredData.filter(d => d[cajaFiltro.children[0].value] === cajaFiltro.children[1].value);
          console.log('filtered data', filteredData);

        } else {
          console.log("ERROR, AÑADE UN VALOR PARA FILTRAR");
        }
      }
    }
  });

  //Si no hay filtros activos igualamos filteredData a los datos originales
  if (contadorFiltrosActivos == 0) {
    console.log("NO HAY FILTROS ACTIVOS");
    filteredData = data;
  }

  //Actualizamos el mapa y la infobox para que no se quede con datos viejos
  updateLayers();
  infoBoxControler("limpiarInfoBox");
}

//Controla que panel del menú está activo
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

//Controlamos que campos se muestran en la infobox
function paramsInfoBoxControler(e) {
  if (e.target.id === "infoParams") {
    return;
  }
  //Si es "" o verde es que está activo, lo desactivamos, eliminamos del array de campos a mostrar
  //y actualizamos la infoBox
  //Si me da tiempo hay que cambiar esto porque mirar le color del fondo es una idea malísima. Si cambiara el nombre de esa ver de css no funcionaría.
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

//Función que actualiza los datos dentro del html del infobox
function infoBoxControler(object) {
  const info = document.getElementById("info");
  if (object != null && object != "limpiarInfoBox") {
    info.innerHTML = "";
    info.innerHTML = info.innerHTML + "<p id='numElems'>Representado " + filteredData.length + " elementos </p>" +
      "<p>Coordenadas : [" + object[nombreCampoLat] + " , " + object[nombreCampoLon] + "]</p>";
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
  else {
    info.innerHTML = "";
    info.innerHTML = info.innerHTML + "<p id='numElems'>Representado " + filteredData.length + " elementos </p>"
  }
}

//Controla que tema está activo
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
//#endregion




//#region CONTROLADORES DEL MAPA
function crearCapas() {
  //Capa de puntos
  capaPuntos = new MapboxLayer({
    id: "points",
    type: ScatterplotLayer,
    data: filteredData,
    radiusMinPixels: 3,
    radiusMaxPixels: 7,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getFillColor: (d) => [255, 0, 102],
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        infoBoxControler(object);
      }
    }
  });

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  };
  capaChinchetas = new MapboxLayer({
    id: "icon-layer",
    type: IconLayer,
    data: filteredData,
    iconAtlas:
      "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
    iconMapping: ICON_MAPPING,
    getIcon: (d) => "marker",
    getSize: (d) => 30,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getColor: (d) => [255, 0, 102],
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
    data: filteredData,
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
    data: filteredData,
    radiusPixels: 50,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
  });

  capaHex = new MapboxLayer({
    id: "hex",
    data: filteredData,
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
    //Actualizamos el prop data con filteredData, borramos la capa y la redibujamos
    capaPuntos.props.data = filteredData;
    map.removeLayer("points");
    map.addLayer(capaPuntos);
  } else {
    if (map.getLayer("points")) {
      map.removeLayer("points");
    }
  }

  if (mostrarCapaChinchetas) {
    capaChinchetas.props.data = filteredData;
    map.removeLayer("icon-layer");
    map.addLayer(capaChinchetas);
  } else {
    if (map.getLayer("icon-layer")) {
      map.removeLayer("icon-layer");
    }
  }

  if (mostrarCapaCalor3D) {
    capaCalor3D.props.data = filteredData;
    map.removeLayer("heat3D");
    map.addLayer(capaCalor3D);
  } else {
    if (map.getLayer("heat3D")) {
      map.removeLayer("heat3D");
    }
  }

  if (mostrarCapaCalor) {
    capaCalor.props.data = filteredData;
    map.removeLayer("heat");
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
//#endregion
