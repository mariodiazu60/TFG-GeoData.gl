//#region IMPORTS
const csv = require("csvtojson");
var t; //Tostada
var taux; //Tostada auxiliar
import { MapboxLayer } from "@deck.gl/mapbox";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { ScatterplotLayer } from "@deck.gl/layers";
import { IconLayer } from "@deck.gl/layers";
import { GridLayer } from "@deck.gl/aggregation-layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ArcLayer } from "@deck.gl/layers";
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

//Objetos para guardar los props de cada capa
var capaPuntos = {
  capa: "",
  mostrar: false,
  campoColor: "", //Nombre del campo por el que agrupar
  valoresCamposColores: [], //Distintos valores del campo a agrupar
  arrayColores: [], //Array de colores para cada valor distinto a agrupar
  tam: 3, //Tamaño de los puntos
},
  capaChinchetas = {
    capa: "",
    mostrar: false,
    campoColor: "", //Campo por el que colorear
    valoresCamposColores: [], //Distintos valores del campo a colorear
    arrayColores: [],
    tam: 20,
  },
  capaCalor3D = {
    capa: "",
    mostrar: false,
    anchoCelda: 100,
    escalaElevacion: 10,
  },
  capaCalor = {
    capa: "",
    mostrar: false,
  },
  capaHex = {
    capa: "",
    mostrar: false,
    campoAltura: "",
    campoRadio: 500,
    campoEscalaElevacion: 25,
  },
  capaCaminos = {
    capa: "",
    mostrar: false,
    campoLatOrig: "",
    campoLonOrig: "",
    campoLatDestino: "",
    campoLonDestino: "",
    campoColor: "", //Campo por el que colorear
    valoresCamposColores: [], //Distintos valores del campo a colorear
    arrayColores: [],
  };

//#endregion

//#region VARIABLES GLOBALES
var data; //Aquí guardamos el contenido del archivo en forma de json
var filteredData; //Aquí guardamos el contenido del archivo en forma de json
var capasActivas = []; //Array con las capas activas en cada momento
var nombreCampoLat = ""; //Aquí guardamos el nombre del campo de la lat
var nombreCampoLon = ""; //Aquí guardamos el nombre del campo de la lon
var nombreCampos = []; //Nos guardamos el nombre de todos los campos del archivo
var nombreCamposMostrar = []; //Nos guardamos el nombre de los campos del archivo que hay que mostrar en la infobox
//Variables globales para la interfaz
var docSubido = false;
var temaElegido = false;
var lastObjectHovered = null; //último objeto para poder cambiar la info que muestra la infoBox
var capasAsistente = true; //Flag para indicar al controlador de las capas que estamos activando y desactivando desde el asistente
var options; //Nos guardamos el html de los options con los campos del doc para usarlo cada vez que se necesite
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
const capaSelect = document.querySelectorAll(".capaSelect");
const addCapaButton = document.getElementById("addCapaButton");
const deleteCapaButtons = document.querySelectorAll(".deleteCapaButton");
const selectCampoColor = document.querySelectorAll(".selectCampoColor");
const inputAnchoCalor3D = document.querySelectorAll(".radioCalor3D");
const inputAlturaCalor3D = document.querySelectorAll(".elevacionCalor3D");
const inputTamPuntos = document.querySelectorAll(".tamPuntos");
const selectAltura = document.querySelectorAll(".selectAltura");
const radioHex = document.querySelectorAll(".radioHex");
const elevacionHex = document.querySelectorAll(".elevacionHex");
const latOrigen = document.querySelectorAll(".inputLatOrigen");
const lonOrigen = document.querySelectorAll(".inputLonOrigen");
const latDestino = document.querySelectorAll(".inputLatDestino");
const lonDestino = document.querySelectorAll(".inputLonDestino");
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

addCapaButton.addEventListener("click", capasHTMLAction); //Añadimos los htmls de las capas
deleteCapaButtons.forEach((btn) =>
  btn.addEventListener("click", capasHTMLAction)
);
capaSelect.forEach((select) => select.addEventListener("change", switchCapas));
selectCampoColor.forEach((select) =>
  select.addEventListener("change", updateCampoColor)
);
inputTamPuntos.forEach((input) =>
  input.addEventListener("change", updateCampoTam)
);

inputAnchoCalor3D.forEach((input) =>
  input.addEventListener("change", updateCamposCalor3D)
);

inputAlturaCalor3D.forEach((input) =>
  input.addEventListener("change", updateCamposCalor3D)
);

selectAltura.forEach((select) =>
  select.addEventListener("change", updateCamposHex)
);

radioHex.forEach((input) => input.addEventListener("change", updateCamposHex));

elevacionHex.forEach((input) =>
  input.addEventListener("change", updateCamposHex)
);

latOrigen.forEach((select) =>
  select.addEventListener("change", updateCamposCaminos)
);

lonOrigen.forEach((select) =>
  select.addEventListener("change", updateCamposCaminos)
);

latDestino.forEach((select) =>
  select.addEventListener("change", updateCamposCaminos)
);

lonDestino.forEach((select) =>
  select.addEventListener("change", updateCamposCaminos)
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
  if (t != undefined) {
    t.hideToast();
  }
  t = Toastify({
    text: "<p> Leyendo el archivo de datos...</p>",
    duration: 5000,
    className: "toast",
    backgroundColor: "var(--azul)",
    gravity: "top",
    position: "center",
    offset: {
      y: ".4rem"
    },
    onClick: function () { t.hideToast() }
  }).showToast();

  var lector = new FileReader();
  lector.onload = function () {
    //Comprobar extension, parsear/convertir archivo, obtener lat/lon, crear las capas y mostrar mensaje    
    let extension = file.name.split(".").pop();
    if (extension === "json" && JSON.parse(lector.result)) {
      data = JSON.parse(lector.result);
      filteredData = data;
      docSubido = true;

      t.hideToast();
      t = Toastify({
        text: "<p>  ¡Archivo leído correctamente! <br> Puedes continuar con el siguiente paso.</p>",
        duration: 5000,
        className: "toast",
        backgroundColor: "var(--verde)",
        gravity: "top",
        position: "center",
        offset: {
          y: ".4rem"
        },
        onClick: function () { t.hideToast() }
      }).showToast();

      leerNombreCampos();
      crearCapas();
      updateLayers();
    } else if (extension === "csv") {
      (async () => {
        data = await csv({ checkType: true, delimiter: [",", ";"] }).fromString(lector.result);
        filteredData = data;
        docSubido = true;

        t.hideToast();
        t = Toastify({
          text: "<p>  ¡Archivo leído correctamente! <br> Puedes continuar con el siguiente paso.</p>",
          duration: 5000,
          className: "toast",
          backgroundColor: "var(--verde)",
          gravity: "top",
          position: "center",
          offset: {
            y: ".4rem"
          },
          onClick: function () { t.hideToast() }
        }).showToast();

        leerNombreCampos();
        crearCapas();
        updateLayers();
      })();

    } else {
      t.hideToast();
      t = Toastify({
        text: "<p>  Puede que el archivo esté dañado o sea un tipo de archivo no aceptado.</p>",
        duration: 5000,
        className: "toast",
        backgroundColor: "var(--rojo)",
        gravity: "top",
        position: "center",
        offset: {
          y: ".4rem" // vertical axis - can be a number or a string indicating unity. eg: '2em'
        },
        onClick: function () { t.hideToast() }
      }).showToast();
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
      key.toLowerCase() === "lat" || key.toLowerCase() === "lati" || key.toLowerCase() === "latitude" || key.toLowerCase() === "latitud"
      || key.toLowerCase() === "y" || key.toLowerCase() === "latitud_y"
    ) {
      nombreCampoLat = key;
      console.log("campo lat : " + nombreCampoLat);
    } else if (
      key.toLowerCase() === "lon" || key.toLowerCase() === "lng" || key.toLowerCase() === "long" ||
      key.toLowerCase() === "longitude" || key.toLowerCase() === "longitud" || key.toLowerCase() === "x"
      || key.toLowerCase() === "longitud_x"
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
        t.hideToast();
        steps[1].classList.add("step-active");
        capasAsistente = true;
      } else {
        if (t != undefined) {
          t.hideToast();
        }
        t = Toastify({
          text: "<p>  Selecciona un archivo de datos antes de continuar.</p>",
          duration: 5000,
          className: "toast",
          backgroundColor: "var(--rojo)",
          gravity: "top",
          position: "center",
          offset: {
            y: ".4rem"
          },
          onClick: function () { t.hideToast() }
        }).showToast();
      }
      break;
    case "1":
      //pasamos al tercer paso
      steps[2].classList.add("step-active");
      break;
    case "2":
      //Si hemos elegido tema pasamos a la web app
      if (temaElegido) {
        if (t != undefined) {
          t.hideToast();
        }
        //Llamamos a capasHTMLAction para generar la interfaz
        capasHTMLAction();
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
        if (t != undefined) {
          t.hideToast();
        }
        t = Toastify({
          text: "<p>  Selecciona un tema para el mapa antes de continuar.</p>",
          duration: 5000,
          className: "toast",
          backgroundColor: "var(--rojo)",
          gravity: "top",
          position: "center",
          offset: {
            y: ".4rem"
          },
          onClick: function () { t.hideToast() }
        }).showToast();
      }

      break;
  }
}

//Se llama desde los los botones del asistente de selección de capas y temas -->  Llama a CAPASCONTROLER() o a TEMACONTROLER() para (des)activar temas y capas
function btnsControler(e) {
  //Comprobamos qué botón está llamando a la función
  if (
    e.target.classList[0] === "representacion-btn" ||
    e.target.classList[0] === "representacion-btn-active"
  ) {
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
  //Desactivamos los marcadores de todas las opciones y activamos sobre la que se ha hecho clic
  for (let i = 0; i < e.target.parentNode.children.length; i++) {
    e.target.parentNode.children[i].children[0].style.borderBottom =
      "2px solid var(--fondo)";
  }
  e.target.children[0].style.borderBottom = "2px solid var(--azul)";
}
//Se llama desde el nav del menú --> Controla la expansión del menú
function expandirMenuControler(e) {
  //La primera vez height del menu será cadena vacia, las siguientes 50/30vh
  if (e.target.id === "expandir") {
    if (menu.style.height === "" || menu.style.height === "30vh") {
      menu.style.height = "50vh";
      expandir.style.transform = "rotate(90deg)";
      infoBox.style.maxHeight = "40vh";
    } else {
      menu.style.height = "30vh";
      infoBox.style.maxHeight = "60vh";
      expandir.style.transform = "rotate(-90deg)";
    }
  } else {
    if (menu.style.height === "50vh") {
      expandir.style.transform = "rotate(-90deg)";
    }
    menu.style.height = "12vh";
    infoBox.style.maxHeight = "80vh";
  }
}

//Se llama desde BTNSCONTROLER() o desde capasHTMLAction() --> Controla la activación y desactivación de las capas
function capasControler(index, accion, showToast) {
  console.log(index, accion);
  //Según el index activamos o desactivamos la capa que toque
  //El array de capasActivas se utiliza para saber qué HTML añadir en los filtros y las capas.
  switch (index) {
    case "Puntos": //Capa de puntos
      if (accion === "eliminar") {
        capaPuntos.mostrar = false;
        removeElementCapasActivas("Puntos");
      } else {
        capaPuntos.mostrar = true;
        capasActivas.push("Puntos");
      }
      break;
    case "Chinchetas": //Capa de chichetas
      if (accion === "eliminar") {
        capaChinchetas.mostrar = false;
        removeElementCapasActivas("Chinchetas");
      } else {
        capaChinchetas.mostrar = true;
        capasActivas.push("Chinchetas");
      }
      break;
    case "Calor3D": //Capa de calor 3D
      if (accion === "eliminar") {
        capaCalor3D.mostrar = false;
        removeElementCapasActivas("Calor3D");
      } else {
        capaCalor3D.mostrar = true;
        capasActivas.push("Calor3D");
      }
      break;
    case "Calor": //Capa de calor
      if (accion === "eliminar") {
        capaCalor.mostrar = false;
        removeElementCapasActivas("Calor");
      } else {
        capaCalor.mostrar = true;
        capasActivas.push("Calor");
      }
      break;
    case "Hexagonos": //Capa de hexágonos
      if (accion === "eliminar") {
        capaHex.mostrar = false;
        removeElementCapasActivas("Hexagonos");
      } else {
        capaHex.mostrar = true;
        capasActivas.push("Hexagonos");
      }
      break;
    case "Arcos": //Capa de arcos
      if (accion === "eliminar") {
        console.log("desactivando arcos");
        capaCaminos.mostrar = false;
        removeElementCapasActivas("Arcos");
      } else {
        console.log("activando arcos");
        capaCaminos.mostrar = true;
        capasActivas.push("Arcos");
      }
      break;
    default:
      break;
  }

  if (showToast === undefined) {
    //Tostadas informativas
    if (t != undefined) {
      t.hideToast();
    }
    if (accion === "eliminar") {
      t = Toastify({
        text: "<p> Capa de " + index + " eliminada del mapa.</p>",
        duration: 5000,
        className: "toast",
        backgroundColor: "var(--rojo)",
        gravity: "top",
        position: "center",
        offset: {
          y: ".4rem"
        },
        onClick: function () { t.hideToast() }
      }).showToast();
    } else {
      var textExtra = "";
      if (index === "Hexagonos" || index === "Arcos") {
        textExtra = "<br> Para usar esta capa debes completar los campos con *."
      }
      t = Toastify({
        text: "<p> Capa de " + index + " añadida al mapa. " + textExtra + "</p>",
        duration: 5000,
        className: "toast",
        backgroundColor: "var(--verde)",
        gravity: "top",
        position: "center",
        offset: {
          y: ".4rem"
        },
        onClick: function () { t.hideToast() }
      }).showToast();

    }
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

//Se llama desde el botón de borrar/añadir capa, desde el asistente de config --> Cambia la interfaz según lsa capas activas
function capasHTMLAction(e) {
  //Si llamamos desde el asistente
  if (capasAsistente) {
    //Iteramos sobre todas las cajas, añadimos el html necesario y las desactivamos
    //Hay que hacerlo por si se deseleccionan capas en el asistente que no se queden las cajas activas
    for (let i = 0; i < 6; i++) {
      //Añadimos los options al select de seleccion campo para colores antes de desactivar las cajas
      contenedorCapas.children[i].children[3].innerHTML =
        "<option value=''></option>" + options;

      //Añadimos los options al select de altura para la caja de hex.
      let optionsAltura = ""; //Auxiliar para los options del select de la altura
      for (let i = 0; i < nombreCampos.length; i++) {
        if (
          typeof data[0][nombreCampos[i]] === "number" &&
          nombreCampos[i] != nombreCampoLat &&
          nombreCampos[i] != nombreCampoLon
        ) {
          optionsAltura +=
            "<option value=" +
            nombreCampos[i] +
            ">" +
            nombreCampos[i] +
            "</option>";
        }
      }
      //Input altura hexágonos
      contenedorCapas.children[i].children[7].innerHTML =
        "<option value=''></option>" + options;
      //Input coordenas arcos
      contenedorCapas.children[i].children[13].innerHTML =
        "<option value=''></option>" + options;
      contenedorCapas.children[i].children[14].innerHTML =
        "<option value=''></option>" + options;
      contenedorCapas.children[i].children[16].innerHTML =
        "<option value=''></option>" + options;
      contenedorCapas.children[i].children[17].innerHTML =
        "<option value=''></option>" + options;

      //Desactivamos
      contenedorCapas.children[i].classList.remove("cajaCapaActive");
    }
    //Activamos las cajas necesarias
    for (let i = 0; i < capasActivas.length; i++) {
      if (contenedorCapas.children[i].classList[1] === undefined) {
        contenedorCapas.children[i].classList.add("cajaCapaActive");
        //Ponemos el nombre(s) de la capa(s) en el select
        contenedorCapas.children[i].children[1].value = capasActivas[i];
      }
    }
  } else if (e != undefined) {
    //Si el elemento que llama a la func. es el botón de add capa añadimos el html
    if (e.target.id === "addCapaButton") {
      for (let i = 0; i < 6; i++) {
        if (contenedorCapas.children[i].classList[1] === undefined) {
          contenedorCapas.children[i].classList.add("cajaCapaActive");
          contenedorCapas.children[i].children[1].value = "";
          break;
        }
      }
    }

    //Si llamamos desde el btn borrar capa: ocultamos el html, llamamos a capasControler para apagar la capa y actualizamos el mapa
    else if (e.target.classList[0] === "deleteCapaButton") {
      e.target.parentNode.classList.remove("cajaCapaActive");
      capasControler(e.target.parentNode.children[1].value, "eliminar");
    }
  }
  //Llamamos a html builder para que active o desactive inputs y selects para cada capa activa
  HTMLCapasBuilder();
}

//Esta forma es mucho más ineficiente que la primera versión pero es la única que se me ocurre porque chrome no acepta eventos en los <option> :(
function switchCapas(e) {
  //Borramos las capa que estuvieran previamente activas
  capasControler("Puntos", "eliminar", false);
  capasControler("Chinchetas", "eliminar", false);
  capasControler("Calor", "eliminar", false);
  capasControler("Calor3D", "eliminar", false);
  capasControler("Hexagonos", "eliminar", false);
  capasControler("Arcos", "eliminar", false);

  //Activamos las capas que deban estar activas
  for (let i = 0; i < 6; i++) {
    if (contenedorCapas.children[i].classList[1] === "cajaCapaActive") {
      if (e.target.value === "Puntos") {
        //Pasamos un obj a updateCampoColor porque espera un evento para buscar el target
        updateCampoColor({
          target: e.target.parentNode.parentNode.children[3],
        });
      } else if (e.target.value === "Chinchetas") {
        //Pasamos un obj a updateCampoColor porque espera un evento para buscar el target
        updateCampoColor({
          target: e.target.parentNode.parentNode.children[3],
        });
      }
      capasControler(contenedorCapas.children[i].children[1].value);
    }
  }
  HTMLCapasBuilder();
}
//Se desde llama capasHTMLAction. Se encarga de mostrar el HTML correcto para cada tipo de capa
function HTMLCapasBuilder() {
  for (let i = 0; i < 6; i++) {
    //Iteramos en los hijos de cada caja de capa y desactivamos todos los hijos
    for (let x = 2; x < contenedorCapas.children[i].children.length - 1; x++) {
      contenedorCapas.children[i].children[x].style = "display:none";
    }

    //Activamos los campos dependiendo del tipo de capa
    switch (contenedorCapas.children[i].children[1].value) {
      case "Puntos":
        //p campo color
        contenedorCapas.children[i].children[2].style = "display:block";
        //select campo color
        contenedorCapas.children[i].children[3].style = "display:block";
        contenedorCapas.children[i].children[3].value = capaPuntos.campoColor;
        //p tamaño puntos
        contenedorCapas.children[i].children[4].style = "display:block";
        //input tamaño puntos
        contenedorCapas.children[i].children[5].style = "display:block";
        contenedorCapas.children[i].children[5].value = capaPuntos.tam;
        break;

      case "Chinchetas":
        //p campo color
        contenedorCapas.children[i].children[2].style = "display:block";
        //select campo color
        contenedorCapas.children[i].children[3].style = "display:block";
        contenedorCapas.children[i].children[3].value =
          capaChinchetas.campoColor;
        break;

      case "Calor3D":
        //input ancho celda calor3D
        contenedorCapas.children[i].children[18].style = "display:block";
        contenedorCapas.children[i].children[19].style = "display:block";
        contenedorCapas.children[i].children[19].value = capaCalor3D.anchoCelda;
        //input elevación celda calor3D
        contenedorCapas.children[i].children[20].style = "display:block";
        contenedorCapas.children[i].children[21].style = "display:block";
        contenedorCapas.children[i].children[21].value =
          capaCalor3D.escalaElevacion;
        break;

      case "Hexagonos":
        //p altura hexágonos
        contenedorCapas.children[i].children[6].style = "display:block";
        //input altura hexágonos
        contenedorCapas.children[i].children[7].style = "display:block";
        contenedorCapas.children[i].children[7].value = capaHex.campoAltura;
        //p radio hexágonos
        contenedorCapas.children[i].children[8].style = "display:block";
        //input radio hexágonos
        contenedorCapas.children[i].children[9].style = "display:block";
        contenedorCapas.children[i].children[9].value = capaHex.campoRadio;
        //p escala hexágonos
        contenedorCapas.children[i].children[10].style = "display:block";
        //input escala hexágonos
        contenedorCapas.children[i].children[11].style = "display:block";
        contenedorCapas.children[i].children[11].value =
          capaHex.campoEscalaElevacion;
        break;

      case "Arcos":
        //p campo color
        contenedorCapas.children[i].children[2].style = "display:block";
        //select campo color
        contenedorCapas.children[i].children[3].style = "display:block";
        contenedorCapas.children[i].children[3].value = capaCaminos.campoColor;
        //p coordenadas para arcos
        contenedorCapas.children[i].children[12].style = "display:block";
        contenedorCapas.children[i].children[15].style = "display:block";
        //inputs coordenadas para arcos
        contenedorCapas.children[i].children[13].style = "display:block";
        contenedorCapas.children[i].children[13].style = "display:block";
        contenedorCapas.children[i].children[14].style = "display:block";
        contenedorCapas.children[i].children[16].style = "display:block";
        contenedorCapas.children[i].children[17].style = "display:block";
        break;
    }

    //Descativamos el valor de los options del select de los tipo de representación que que ya están activas
    for (let x = 0; x < 6; x++) {
      if (
        capasActivas.indexOf(
          contenedorCapas.children[i].children[1].children[x].value
        ) === -1
      ) {
        contenedorCapas.children[i].children[1].children[x].style =
          "display:inline";
      } else {
        contenedorCapas.children[i].children[1].children[x].style =
          "display:none";
      }
    }
  }
}

//Se llama al leer el nombre de los campos del archivo para generar el html necesario
function addHTMLFiltros() {
  var div, input;

  //Iteramos sobre los nombres de los campos para rellenar las options
  for (let i = 0; i < nombreCampos.length; i++) {
    options +=
      "<option value=" + nombreCampos[i] + ">" + nombreCampos[i] + "</option>";
  }

  //Miramos el tipeof del primer elemento del json para poner el input correcto
  for (let key in data[0]) {
    switch (typeof data[0][key]) {
      case "string":
        input =
          '<input type="text" placeholder="Filtrar por..." class="inputFilter text"> <input type="number" placeholder="Máx."  id="1" class="inputFilter number" step=0.001 style="display:none">';
        break;
      case "number":
        input =
          '<input type="number" placeholder="Mín." id="0" class="inputFilter number" step=0.001> <input type="number" placeholder="Máx."  id="1" class="inputFilter number" step=0.001>';
        break;
    }
    break;
  }

  //Vaciamos. Si hemos elegido varios archivos de datos tendríamos varios filtros si no los vaciamos
  contenedorFiltros.innerHTML = "";
  //Creamos todos los html de los filtros con los datos recuperados arriba
  for (let x = 0; x < nombreCampos.length; x++) {
    //Creamos el div con los options e input correctos
    div = ' <div class="cajaFiltro">';

    contenedorFiltros.innerHTML +=
      div +
      '<select name="campos" class="filtroSelect">' +
      options +
      "</select>" +
      input +
      "<button class='deleteFilter'> Borrar filtro </button>" +
      "</div>";
  }

  //Añadimos los listener a los select, a los botones
  const filtroSelect = document.querySelectorAll(".filtroSelect");
  filtroSelect.forEach((select) =>
    select.addEventListener("change", typeOfInputControler)
  );

  const applyFilterBtn = document.querySelectorAll(".applyFilter");
  applyFilterBtn.forEach((btn) => btn.addEventListener("click", filterData));

  const deleteFilterBtn = document.querySelectorAll(".deleteFilter");
  deleteFilterBtn.forEach((btn) =>
    btn.addEventListener("click", stateFilterControler)
  );
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
    e.target.parentNode.classList.remove("cajaFiltroActive");
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
        input1.placeholder = "Mín.";
        input1.classList.remove("text");
        input1.classList.add("number");
        //Mostramos el segundo
        input2.value = "";
        input2.style.display = "flex";
      }
      break;

    default:
      console.log(
        "El campo " +
        e.target.value +
        " es del tipo " +
        typeof data[0][e.target.value]
      );
      break;
  }
}

//Se llama al hacer click en aplicar filtros
function filterData() {
  //Antes de filtrar recuperamos todos los filtros
  const cajasFiltros = document.querySelectorAll(".cajaFiltro");
  var contadorFiltrosActivos = 0;
  filteredData = data;
  //Iteramos sobre los filtro para filtrar los datos según los filtros activos
  cajasFiltros.forEach((cajaFiltro) => {
    if (cajaFiltro.classList.contains("cajaFiltroActive")) {
      contadorFiltrosActivos++;
      if (typeof data[0][cajaFiltro.children[0].value] === "number") {
        if (
          cajaFiltro.children[1].value != "" &&
          cajaFiltro.children[2].value != ""
        ) {
          filteredData = filteredData.filter(
            (d) =>
              d[cajaFiltro.children[0].value] >= cajaFiltro.children[1].value &&
              d[cajaFiltro.children[0].value] <= cajaFiltro.children[2].value
          );
        } else if (
          cajaFiltro.children[1].value == "" &&
          cajaFiltro.children[2].value != ""
        ) {
          filteredData = filteredData.filter(
            (d) =>
              d[cajaFiltro.children[0].value] <= cajaFiltro.children[2].value
          );
        } else if (
          cajaFiltro.children[2].value == "" &&
          cajaFiltro.children[1].value != ""
        ) {
          filteredData = filteredData.filter(
            (d) =>
              d[cajaFiltro.children[0].value] >= cajaFiltro.children[1].value
          );
        } else {
          if (taux !== undefined) {
            taux.hideToast()
          }
          taux = Toastify({
            text: "<p>Hay filtros vacios. Se han ignorado al realizar el filtrado.</p>",
            duration: 5000,
            className: "toast",
            backgroundColor: "var(--amarillo)",
            gravity: "top",
            position: "center",
            offset: {
              y: ".4rem"
            },
            onClick: function () { taux.hideToast() }
          }).showToast();
        }
      } else {
        if (cajaFiltro.children[1].value !== "") {
          filteredData = filteredData.filter(
            (d) =>
              d[cajaFiltro.children[0].value] === cajaFiltro.children[1].value
          );
          console.log("filtered data", filteredData);
        } else {
          if (taux !== undefined) {
            taux.hideToast()
          }
          taux = Toastify({
            text: "<p>Hay filtros vacios. Se han ignorado al realizar el filtrado.</p>",
            duration: 5000,
            className: "toast",
            backgroundColor: "var(--amarillo)",
            gravity: "top",
            position: "center",
            offset: {
              y: ".4rem"
            },
            onClick: function () { taux.hideToast() }
          }).showToast();
        }
      }
    }
  });

  //Si no hay filtros activos igualamos filteredData a los datos originales
  if (contadorFiltrosActivos == 0) {
    if (t != undefined) {
      t.hideToast();
    }
    if (taux != undefined) {
      taux.hideToast();
    }
    t = Toastify({
      text: "<p>No hay filtros activos para filtrar los datos.</p>",
      duration: 5000,
      className: "toast",
      backgroundColor: "var(--rojo)",
      gravity: "top",
      position: "center",
      offset: {
        y: ".4rem"
      },
      onClick: function () { t.hideToast() }
    }).showToast();
    filteredData = data;
  } else {
    //Actualizamos el mapa y la infobox para que no se quede con datos viejos
    updateLayers();
    infoBoxControler("limpiarInfoBox");
  }
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
  //Si me da tiempo hay que cambiar esto porque mirar le color del fondo es una idea malísima. Si cambiara el nombre de esa var de css no funcionaría.
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
function infoBoxControler(object, mostrarCoords) {
  const info = document.getElementById("info");
  if (object != null && object != "limpiarInfoBox") {
    let coords = "";
    if (mostrarCoords) {
      coords =
        "<p>Coordenadas : [" +
        object[nombreCampoLat] +
        " , " +
        object[nombreCampoLon] +
        "]</p>";
    }

    info.innerHTML = "";
    info.innerHTML =
      info.innerHTML +
      "<p id='numElems'>Representado " +
      filteredData.length +
      " elementos </p>" +
      coords;
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
  } else {
    info.innerHTML = "";
    info.innerHTML =
      info.innerHTML +
      "<p id='numElems'>Representado " +
      filteredData.length +
      " elementos </p>";
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
    if (t != undefined) {
      t.hideToast();
    }
    t = Toastify({
      text: "<p>  ¡Tema seleccionado! <br> Ya puedes finalizar la configuración.</p>",
      duration: 5000,
      className: "toast",
      backgroundColor: "var(--verde)",
      gravity: "top",
      position: "center",
      offset: {
        y: ".4rem"
      },
    }).showToast();
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

//#region FUNCS PARA UPDATEAR VALORES DE CAPAS

//Se llama cuando cambia el valor del select
function updateCampoColor(e) {
  switch (e.target.parentNode.children[1].value) {
    case "Puntos": //Capa de puntos
      capaPuntos.campoColor = e.target.value;
      getValoresCampoColor(capaPuntos);
      break;
    case "Chinchetas": //Capa de chichetas
      capaChinchetas.campoColor = e.target.value;
      getValoresCampoColor(capaChinchetas);
      break;

    case "Arcos": //Capa de chichetas
      capaCaminos.campoColor = e.target.value;
      getValoresCampoColor(capaCaminos);
      break;
    default:
      break;
  }
}

function updateCampoTam(e) {
  capaPuntos.tam = e.target.value;
  capaPuntos.capa.props.radiusMinPixels = e.target.value;
  updateLayers();
}

function updateCamposCalor3D(e) {
  switch (e.target.classList[0]) {
    case "radioCalor3D":
      capaCalor3D.anchoCelda = parseInt(e.target.value);
      capaCalor3D.capa.props.cellSize = capaCalor3D.anchoCelda;
      break;

    case "elevacionCalor3D":
      capaCalor3D.escalaElevacion = parseInt(e.target.value);
      capaCalor3D.capa.props.elevationScale = capaCalor3D.escalaElevacion;
      break;
  }
  updateLayers();
}

function updateCamposHex(e) {
  switch (e.target.classList[0]) {
    case "selectAltura":
      capaHex.campoAltura = e.target.value;
      break;

    case "radioHex":
      capaHex.campoRadio = parseInt(e.target.value);
      capaHex.capa.props.radius = capaHex.campoRadio;
      break;

    case "elevacionHex":
      capaHex.campoEscalaElevacion = parseInt(e.target.value);
      capaHex.capa.props.elevationScale = capaHex.campoEscalaElevacion;
      break;
  }
  updateLayers();
}

function updateCamposCaminos(e) {
  switch (e.target.classList[0]) {
    case "inputLatOrigen":
      capaCaminos.campoLatOrig = e.target.value;
      break;

    case "inputLonOrigen":
      capaCaminos.campoLonOrig = e.target.value;
      break;

    case "inputLatDestino":
      capaCaminos.campoLatDestino = e.target.value;
      break;

    case "inputLonDestino":
      capaCaminos.campoLonDestino = e.target.value;
      break;
  }

  if (
    (capaCaminos.campoLatOrig,
      capaCaminos.campoLonOrig,
      capaCaminos.campoLatDestino,
      capaCaminos.campoLonDestino !== "")
  ) {
    //Centramos el mapa en los datos
    map.flyTo({
      center: [
        data[0][capaCaminos.campoLonOrig],
        data[0][capaCaminos.campoLatOrig],
      ],
      speed: 0.35,
      zoom: 10,
    });
    updateLayers();
  }
}
//#endregion

function toAscii(value) {
  let sum = 0;
  //Si el valor no es un string, lo devolvemos directamente sin pasarlo a ASCII porque no es necesario.
  if (typeof value != "string") {
    value = value.toString();
  }
  for (let i = 0; i < value.length; i++) {
    sum += value.charCodeAt(i);
  }
  return sum;
}

function getValoresCampoColor(capaProps) {
  //Vaciamos el array para que no se llene infinitamente
  capaProps.arrayColores = [];
  capaProps.valoresCamposColores = [];

  if (capaProps.campoColor != "") {
    for (let i = 0; i < filteredData.length; i++) {
      let sum = toAscii(filteredData[i][capaProps.campoColor]);
      //Si no existe el valor en el array lo metemos con push
      if (capaProps.valoresCamposColores.indexOf(sum) == -1) {
        capaProps.valoresCamposColores.push(sum);
        capaProps.arrayColores.push([
          Math.floor(Math.random() * 255),
          Math.floor(Math.random() * 255),
          Math.floor(Math.random() * 255),
          200,
        ]);
      }
    }
  }

  //Cuando tenemos el valor del campo calor y los colores preparados redibujamos el mapa
  //El constructor de la capa llamará a getColors para dibujar con los colores correctos
  updateLayers();
}

function getColors(d, capaProps) {
  if (capaProps.campoColor == "") {
    return [255, 0, 102];
  }

  for (let i = 0; i < capaProps.valoresCamposColores.length; i++) {
    if (
      toAscii(d[capaProps.campoColor]) === capaProps.valoresCamposColores[i]
    ) {
      return capaProps.arrayColores[i];
    }
  }
}

function crearCapas() {
  //Capa de puntos
  capaPuntos.capa = new MapboxLayer({
    id: "points",
    type: ScatterplotLayer,
    data: filteredData,
    radiusMinPixels: capaPuntos.tam,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getFillColor: (d) => getColors(d, capaPuntos),
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        infoBoxControler(object, true);
      }
    },
  });

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  };
  capaChinchetas.capa = new MapboxLayer({
    id: "icon-layer",
    type: IconLayer,
    data: filteredData,
    iconAtlas:
      "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
    iconMapping: ICON_MAPPING,
    getIcon: (d) => "marker",
    getSize: (d) => 25,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getColor: (d) => getColors(d, capaChinchetas),
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        infoBoxControler(object, true);
      }
    },
  });

  capaCalor3D.capa = new MapboxLayer({
    id: "heat3D",
    type: GridLayer,
    data: filteredData,
    pickable: true,
    extruded: true,
    cellSize: capaCalor3D.anchoCelda,
    elevationScale: capaCalor3D.escalaElevacion,
    colorDomain: [1, 100],
    opacity: 0.6,
    coverage: 0.9,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    onHover: ({ object, x, y }) => {
      const info = document.getElementById("info");
      if (object) {
        info.innerHTML = "";
        info.innerHTML =
          info.innerHTML +
          "<p>Representando " +
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

  capaCalor.capa = new MapboxLayer({
    id: "heat",
    type: HeatmapLayer,
    data: filteredData,
    radiusPixels: 50,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
  });

  capaHex.capa = new MapboxLayer({
    id: "hex",
    data: filteredData,
    type: HexagonLayer,
    getElevationWeight: (d) => d[capaHex.campoAltura],
    elevationScale: capaHex.campoEscalaElevacion,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    extruded: true,
    radius: capaHex.campoRadio,
    opacity: 0.5,
    coverage: 1,
    getFillColor: (d) =>
      d[capaHex.campoAltura] > 30 ? [200, 0, 40, 150] : [255, 255, 0, 100],
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        const info = document.getElementById("info");
        if (object != null && object != "limpiarInfoBox") {
          info.innerHTML = "";
          info.innerHTML =
            info.innerHTML +
            "<p id='numElems'>Representando " +
            filteredData.length +
            " elementos </p>" +
            "<p>Coordenadas aprox. : [" +
            object.position[0].toFixed(3) +
            " , " +
            object.position[1].toFixed(3) +
            "]</p>" +
            "<p>Representado " +
            object.points.length +
            " elementos en este área.</p>";

          let sum = 0;
          //Iteramos sobre los points para sacar la suma de los valores de la altura
          for (let i = 0; i < object.points.length; i++) {
            sum += object.points[i][capaHex.campoAltura];
          }
          //Añadimos la suma de los valores de la altura a la info box
          info.innerHTML =
            info.innerHTML +
            "<p>" +
            capaHex.campoAltura +
            " totales : " +
            sum.toString() +
            "</p>";
        } else {
          info.innerHTML = "";
          info.innerHTML =
            info.innerHTML +
            "<p id='numElems'>Representado " +
            filteredData.length +
            " elementos </p>";
        }
      }
    },
  });

  capaCaminos.capa = new MapboxLayer({
    id: "arcos",
    data: filteredData,
    type: ArcLayer,
    getHeight: 0.45,
    getWidth: (d) => 5,
    getSourcePosition: (d) => [
      d[capaCaminos.campoLonOrig],
      d[capaCaminos.campoLatOrig],
    ],
    getTargetPosition: (d) => [
      d[capaCaminos.campoLonDestino],
      d[capaCaminos.campoLatDestino],
    ],

    getTargetColor: (d) => getColors(d, capaCaminos),
    getSourceColor: (d) => getColors(d, capaCaminos),
    pickable: true,
    onHover: ({ object }) => {
      //Nos guardamos el object sobre el que hacemos over y llamamos a infoBoxControler para actualizar la info
      if (object != undefined) {
        lastObjectHovered = object;
        infoBoxControler(object, false);
      }
    },
  });
}

map.on("styledata", () => {
  if (capaPuntos.mostrar) {
    map.addLayer(capaPuntos.capa);
  }
  if (capaChinchetas.mostrar) {
    map.addLayer(capaChinchetas.capa);
  }
  if (capaCalor3D.mostrar) {
    map.addLayer(capaCalor3D.capa);
  }
  if (capaCalor.mostrar) {
    map.addLayer(capaCalor.capa);
  }
  if (capaHex.mostrar) {
    map.addLayer(capaHex.capa);
  }
  if (capaCaminos.mostrar) {
    map.addLayer(capaCaminos.capa);
  }
});

function updateLayers() {
  if (capaPuntos.mostrar) {
    //Actualizamos el prop data con filteredData, borramos la capa y la redibujamos
    capaPuntos.capa.props.data = filteredData;
    map.removeLayer("points");
    map.addLayer(capaPuntos.capa);
  } else {
    if (map.getLayer("points")) {
      map.removeLayer("points");
    }
  }

  if (capaChinchetas.mostrar) {
    capaChinchetas.capa.props.data = filteredData;
    map.removeLayer("icon-layer");
    map.addLayer(capaChinchetas.capa);
  } else {
    if (map.getLayer("icon-layer")) {
      map.removeLayer("icon-layer");
    }
  }

  if (capaCalor3D.mostrar) {
    capaCalor3D.capa.props.data = filteredData;
    map.removeLayer("heat3D");
    map.addLayer(capaCalor3D.capa);
  } else {
    if (map.getLayer("heat3D")) {
      map.removeLayer("heat3D");
    }
  }

  if (capaCalor.mostrar) {
    capaCalor.capa.props.data = filteredData;
    map.removeLayer("heat");
    map.addLayer(capaCalor.capa);
  } else {
    if (map.getLayer("heat")) {
      map.removeLayer("heat");
    }
  }

  if (capaHex.mostrar) {
    capaHex.capa.props.data = filteredData;
    if (map.getLayer("hex")) {
      map.removeLayer("hex");
    }
    map.addLayer(capaHex.capa);
  } else {
    if (map.getLayer("hex")) {
      map.removeLayer("hex");
    }
  }

  if (capaCaminos.mostrar) {
    capaCaminos.capa.props.data = filteredData;
    if (map.getLayer("arcos")) {
      map.removeLayer("arcos");
    }
    map.addLayer(capaCaminos.capa);
  } else {
    if (map.getLayer("arcos")) {
      map.removeLayer("arcos");
    }
  }
  map.triggerRepaint();
}
//#endregion
