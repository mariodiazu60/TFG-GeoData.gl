//Selectores --- Seleccionamos los items de html que tengan esa clase
const carruselControl = document.querySelector(".carruselControl");
const bolas = document.querySelectorAll(".bola");
const slides = document.querySelectorAll(".slide");

//Listeners --- Añadimos listeners a los items que hemos seleccionado arriba
carruselControl.addEventListener("click", carruselControler);


function carruselControler(e) {
    //Si hacemos click sobre un item de la lista no hacemos nada
    if (e.target.tagName.toLowerCase() === 'li') {
        return;
    }

    //Desactivamos todas las bolas
    //Luego añadimos .active a la bola sobre la que se ha hecho click.
    bolas.forEach(bola => {
        bola.classList.remove("active");
        bola.src = "./assets/imgs/no-active.png";
    });
    e.target.classList.add("active");
    e.target.src = "./assets/imgs/active.png";


    //Desactivamos todas las slides
    slides.forEach(slide => {
        slide.classList.remove("slide-active");
    });

    //Activamos la slide correspodiente
    switch (e.target.classList[0]) {
        case "0":
            slides[0].classList.add("slide-active");
            break;
        case "1":
            slides[1].classList.add("slide-active");
            break;
        case "2":
            slides[2].classList.add("slide-active");
            break;
        case "3":
            slides[3].classList.add("slide-active");
            break;

        default:
            break;
    }


}
