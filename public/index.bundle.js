/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("//Selectores --- Seleccionamos los items de html que tengan esa clase\r\nconst carruselControl = document.querySelector(\".carruselControl\");\r\nconst bolas = document.querySelectorAll(\".bola\");\r\nconst slides = document.querySelectorAll(\".slide\");\r\n\r\n//Listeners --- Añadimos listeners a los items que hemos seleccionado arriba\r\ncarruselControl.addEventListener(\"click\", carruselControler);\r\n\r\n\r\nfunction carruselControler(e) {\r\n    //Si hacemos click sobre un item de la lista no hacemos nada\r\n    if (e.target.tagName.toLowerCase() === 'li') {\r\n        return;\r\n    }\r\n\r\n    //Desactivamos todas las bolas\r\n    //Luego añadimos .active a la bola sobre la que se ha hecho click.\r\n    bolas.forEach(bola => {\r\n        bola.classList.remove(\"active\");\r\n        bola.src = \"./assets/imgs/no-active.png\";\r\n    });\r\n    e.target.classList.add(\"active\");\r\n    e.target.src = \"./assets/imgs/active.png\";\r\n\r\n\r\n    //Desactivamos todas las slides\r\n    slides.forEach(slide => {\r\n        slide.classList.remove(\"slide-active\");\r\n    });\r\n\r\n    //Activamos la slide correspodiente\r\n    switch (e.target.classList[0]) {\r\n        case \"0\":\r\n            slides[0].classList.add(\"slide-active\");\r\n            break;\r\n        case \"1\":\r\n            slides[1].classList.add(\"slide-active\");\r\n            break;\r\n        case \"2\":\r\n            slides[2].classList.add(\"slide-active\");\r\n            break;\r\n        case \"3\":\r\n            slides[3].classList.add(\"slide-active\");\r\n            break;\r\n\r\n        default:\r\n            break;\r\n    }\r\n\r\n\r\n}\r\n\n\n//# sourceURL=webpack:///./src/index.js?");

/***/ })

/******/ });