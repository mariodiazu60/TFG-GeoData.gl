//IMPORTS, VARS E INCIALIZACIÓN DEL MAPA
const csv = require('csvtojson');
import { MapboxLayer } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
mapboxgl.accessToken = 'pk.eyJ1IjoibWRuNiIsImEiOiJja2ZsZHRoMXAyMHk5MnlvMzJ3azliNzVoIn0.TVyz96dtNAH7PtNb8Yw_2g';
const account = "mapbox://styles/mdn6/";
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mdn6/ckfzc89xt07rg19o3ljldgzv0',
    center: { lat: 40.0, lng: 2.0 },
    zoom: 3,
});

//Variables globales para las capas
var data;
var mostrarCapas = false;

//Selectores ---------------------------------------------------------------------------------------------
//Para el asistente
const asistente = document.getElementById("asistente");
const btnsSiguiente = document.querySelectorAll(".btn-asistente");
const steps = document.querySelectorAll(".step");
const btnsRepreContainer = document.getElementById("representacion-btns");
const btnsTemaContainer = document.getElementById("tema-btns");
const repreBtns = document.querySelectorAll(".representacion-btn");
const temaBtns = document.querySelectorAll(".tema-btn");
const input = document.getElementById("inputArchivo");

//Para panel de control
const menu = document.getElementById("menu");
const navPanelControl = document.querySelector(".nav");
const paneles = document.querySelectorAll(".panel");
const panelMapa = document.querySelector(".panel-mapa");
const bolas = document.querySelectorAll(".bola");

//Listeners ----------------------------------------------------------------------------------------------
btnsSiguiente.forEach(btn => btn.addEventListener("click", stepControler));     //Controlamos las etapas del asistente (Asistente)
input.addEventListener("change", inputController);                              //Controlamos si suben un archivo (Asistente)
btnsRepreContainer.addEventListener("click", btnsControler);                    //Controlamos los btns del tipo de representación (Asistente)
btnsTemaContainer.addEventListener("click", btnsControler);                     //Controlamos los btns del tema del mapa (Asistente)
navPanelControl.addEventListener("click", panelControler);                      //Controlamos las tabs del panel de control (web app)
panelMapa.addEventListener("click", temasControler);                            //Controlamos los btns del temad del mapa (web app)


//Controladores ------------------------------------------------------------------------------------------

//Para el asistente de config.
function inputController(e) {
    //Leemos el archivo del input con FileReader
    var file = e.target.files[0];
    if (!file) {
        return;
    }

    var lector = new FileReader();
    lector.onload = function () {
        //Comprobamos la extension
        let extension = file.name.split('.').pop();
        if (extension === "json") {
            data = JSON.parse(lector.result)
            console.log(data);
            crearCapas();
        } else if (extension === "csv") {
            (async () => {
                data = await csv({ checkType: true }).fromString(lector.result);
                crearCapas();
            })();
        }
    };
    lector.readAsText(file);
}
function stepControler(e) {

    //Desactivamos todos los steps
    steps.forEach(step => {
        step.classList.remove("step-active")
    });

    //Activamos el step que correponda
    switch (e.target.classList[0]) {
        case "-2":
            steps[1].classList.add("step-active")
            //volvemos al segundo paso
            break;
        case "-1":
            steps[0].classList.add("step-active")
            //volvemos al primer paso
            break;
        case "0":
            steps[1].classList.add("step-active")
            //pasamos al segundo paso
            break;
        case "1":
            steps[2].classList.add("step-active")
            //pasamos al tercer paso
            break;
        case "2":
            //accedemos a la web app
            asistente.style = "display: none;"
            menu.style = "display: flex;"
            break;
    }
}
function btnsControler(e) {
    //Comprobamos desde que interfaz se está llamando
    if (e.target.classList[0] === "representacion-btn") {
        //Desactivamos todos los botones
        repreBtns.forEach(btn => {
            btn.classList.remove("representacion-btn-active");
        });
        //Activamos el botón correspondiente
        e.target.classList.add("representacion-btn-active");
    }
    else if (e.target.classList[0] === "tema-btn") {
        //Desactivamos todos los botones
        temaBtns.forEach(btn => {
            btn.classList.remove("tema-btn-active");
        });
        //Activamos el botón correspondiente
        e.target.classList.add("tema-btn-active");
        //Mandamos a temasControler el index para que lo maneje
        temasControler(e.target.classList[1]);
    }

}

//Para el menú de config.
function panelControler(e) {
    //Si clicas en ul se para ejecución
    //Se hace así porque el pointer-events: none;
    //Evita el click sobre los hijos de la lista y no lo queremos
    if (e.target.tagName.toLowerCase() === 'ul') {
        return;
    }
    //Desactivamos todos los paneles
    paneles.forEach(panel => {
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
        default: break;
    }
}
function temasControler(e) {
    //Si e es un número: estamos llamando desde el asistente
    //Si no: estamos llamando desde el panel de
    let index = 0;
    if (e >= 0 && e < 6) {
        index = e;
    } else {
        index = e.target.classList[0];
    }

    //Ponemos las bolas del panel en rojo
    bolas.forEach(bola => {
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
        default: break;
    }
    //Mostramos las capas
    mostrarCapas = true;
}






//Controladores del mapa ----------------------------------------------------------------------------
//Constructores de capas
var myPointsLayer = "";
var myHexLayer = "";
function crearCapas() {
    myPointsLayer = new MapboxLayer({
        id: 'points',
        type: ScatterplotLayer,
        data: data,
        radiusMinPixels: 3,
        radiusMaxPixels: 7,
        getPosition: d => [d.longitude, d.latitude],
        getFillColor: d => d.n_killed > 0 ? [200, 0, 40, 150] : [255, 140, 0, 100]
    });

    myHexLayer = new MapboxLayer({
        id: 'hex',
        data: data,
        type: HexagonLayer,
        getPosition: d => [d.longitude, d.latitude],
        getElevationWeight: d => (d.n_killed * 2) + d.n_injured,
        elevationScale: 100,
        extruded: true,
        radius: 1609,
        opacity: 0.6,
        coverage: 0.88,
        getFillColor: d => d.n_killed > 0 ? [200, 0, 40, 150] : [255, 255, 0, 100]
    });
}


//Eventos del mapa ----------------------------------------------------------------------------------------
map.on('load', () => {
    if (mostrarCapas) {
        map.addLayer(myPointsLayer);
        map.addLayer(myHexLayer);
    }
});

map.on('styledata', () => {
    if (mostrarCapas) {
        if (!map.getLayer('points')) {
            map.addLayer(myPointsLayer);
        }
        if (!map.getLayer('hex')) {
            map.addLayer(myHexLayer);
        }
    }
});
