document.addEventListener("DOMContentLoaded", function () {
    const menuNav = document.querySelector("#menu-btn");
    const menuMatter = document.querySelector("#matter-container");
    const panelMenu = document.querySelector(".menu-panel-container");

    function toggleMenu() {
        menuNav.classList.toggle("js-active");
        if (menuNav.classList.contains("js-active")) {
            menuMatter.classList.add("js-active");
            panelMenu.classList.add("js-active");
            removeOldCanvas(); // Supprime l'ancienne balise <canvas> avant de créer une nouvelle instance
            initializeMatter();
        } else {
            menuMatter.classList.remove("js-active");
            panelMenu.classList.remove("js-active");
            destroyMatter();
        }
    }

    menuNav.addEventListener("click", toggleMenu);
});

let engine, render, runner, mouseConstraint;

function removeOldCanvas() {
    const oldCanvas = document.querySelector('#matter-container canvas');
    if (oldCanvas) {
        oldCanvas.remove();
    }
}

function initializeMatter() {
    const THICCNESS = 120;
    const SVG_PATH_SELECTORS = ["#matter-path", "#matter-path2", "#matter-path3", "#matter-path4", "#matter-path5"];
    const matterContainer = document.querySelector("#matter-container");
    const menuButton = document.querySelector(".menu-panel-container.js-active");

    const desiredWidth = 350; // en pixels
    const desiredHeight = window.innerHeight; // 100vh

    // Créer un objet fictif pour simuler les dimensions souhaitées
    const buttonRect = {
        width: desiredWidth,
        height: desiredHeight,
        top: 0,
        right: desiredWidth,
        bottom: desiredHeight,
        left: 0
    };

    const buttonWidth = buttonRect.width; // Utilisation de la largeur définie
    const buttonHeight = buttonRect.height; // Utilisation de la hauteur définie

    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Svg = Matter.Svg,
        Vertices = Matter.Vertices,
        Events = Matter.Events,
        Mouse = Matter.Mouse,
        MouseConstraint = Matter.MouseConstraint;

    engine = Engine.create();
    render = Render.create({
        element: matterContainer,
        engine: engine,
        options: {
            width: buttonWidth,
            height: buttonHeight,
            background: "transparent",
            wireframes: false,
            showAngleIndicator: false
        }
    });

    const panelMenu = document.querySelector(".menu-panel-container");
    if (panelMenu.classList.contains("js-active")) {
        createSvgBodies();
    }

    let ground = Bodies.rectangle(
        buttonWidth / 2,
        buttonHeight + THICCNESS / 2,
        buttonWidth,
        THICCNESS,
        { isStatic: true, render: { visible: false } }
    );

    let leftWall = Bodies.rectangle(
        0 - THICCNESS / 2,
        buttonHeight / 2,
        THICCNESS,
        24500, // Hauteur ajustée à 3000px
        { isStatic: true, render: { visible: false } }
    );

    let rightWall = Bodies.rectangle(
        buttonWidth + THICCNESS / 2,
        buttonHeight / 2,
        THICCNESS,
        24500, // Hauteur ajustée à 3000px
        { isStatic: true, render: { visible: false } }
    );

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    let mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    Composite.add(engine.world, mouseConstraint);

    mouseConstraint.mouse.element.removeEventListener(
        "mousewheel",
        mouseConstraint.mouse.mousewheel
    );
    mouseConstraint.mouse.element.removeEventListener(
        "DOMMouseScroll",
        mouseConstraint.mouse.mousewheel
    );

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    function createSvgBodies() {
        const colors = ["red", "blue", "green", "purple", "orange"];
        const positions = [
            { x: buttonWidth / 2, y: -900 },
            { x: buttonWidth / 2, y: -400 },
            { x: buttonWidth / 2 + 100, y: -800 },
            { x: buttonWidth / 2, y: -600 },
            { x: buttonWidth / 2 + 100, y: -400 }
        ];

        SVG_PATH_SELECTORS.forEach((selector, index) => {
            const path = document.querySelector(selector);

            if (path) {
                path.setAttribute('fill', colors[index]);
                let vertices = Svg.pathToVertices(path);
                vertices = Vertices.scale(vertices, 1, 1);
                let chamferedVertices = Vertices.chamfer(vertices, 1, 1, 1, 1);
                let svgBody = Bodies.fromVertices(
                    positions[index].x,
                    positions[index].y,
                    [chamferedVertices],
                    {
                        friction: 0.1,
                        frictionAir: 0.001,
                        restitution: 0.75,
                        render: {
                            fillStyle: "red",
                            strokeStyle: "#464655",
                            opacity: 0.5,
                            visible: false
                        }
                    }
                );

                svgBody.svgElement = path;
                Composite.add(engine.world, svgBody);
            }
        });
    }

    function updateSvgTransforms() {
        SVG_PATH_SELECTORS.forEach(selector => {
            const body = Composite.allBodies(engine.world)
                .find(body => body.svgElement && `#${body.svgElement.id}` === selector);

            if (body) {
                const { position, angle, bounds } = body;

                const svgBBox = body.svgElement.getBBox();
                const svgWidth = svgBBox.width;
                const svgHeight = svgBBox.height;

                const offsetX = position.x - (svgWidth / 2);
                const offsetY = position.y - (svgHeight / 2) + 100;

                body.svgElement.setAttribute(
                    'transform',
                    `translate(${offsetX}, ${offsetY}) rotate(${angle * (180 / Math.PI)}, ${svgWidth / 2}, ${svgHeight / 2})`
                );
            }
        });
    }

    Events.on(engine, 'beforeUpdate', updateSvgTransforms);
}

function destroyMatter() {
    if (Render) {
        Render.stop(Render);
        if (Render.canvas) {
            Render.canvas.remove();
        }
        if (Render.context) {
            Render.context = null;
        }
        Render.textures = {};
    }

    if (Runner) {
        Runner.stop(runner);
    }

    if (Engine) {
        Composite.clear(engine.world, false);
        Engine.clear(engine);
    }

    Engine = null;
    Render = null;
    Runner = null;
    mouseConstraint = null;
}
