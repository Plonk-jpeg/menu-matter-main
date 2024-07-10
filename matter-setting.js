document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.querySelector(".page");

    function toggleMenu() {
        menuButton.classList.toggle("js-active");

        if (menuButton.classList.contains("js-active")) {
            // Open menu: initialize Matter.js
            initializeMatter();
        } else {
            // Close menu: destroy Matter.js
            destroyMatter();
        }
    }

    menuButton.addEventListener("click", toggleMenu);
});

let engine, render, runner, mouseConstraint;

function initializeMatter() {
    const THICCNESS = 120;
    const SVG_PATH_SELECTORS = ["#matter-path", "#matter-path2", "#matter-path3", "#matter-path4", "#matter-path5"];
    const matterContainer = document.querySelector("#matter-container");

    // module aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Body = Matter.Body,
        Svg = Matter.Svg,
        Vector = Matter.Vector,
        Vertices = Matter.Vertices,
        Events = Matter.Events;

    // create an engine
    engine = Engine.create();

    // create a renderer
    render = Render.create({
        element: matterContainer,
        engine: engine,
        options: {
            width: 900,
            height: 947,
            background: "transparent",
            wireframes: false,
            showAngleIndicator: false
        }
    });

    createSvgBodies();

    let ground = Bodies.rectangle(
        matterContainer.clientWidth / 2,
        matterContainer.clientHeight + THICCNESS / 2,
        1500,
        THICCNESS,
        {
            isStatic: true,
            render: { visible: false }
        }
    );

    let leftWall = Bodies.rectangle(
        0 - THICCNESS / 2,
        matterContainer.clientHeight / 2,
        THICCNESS,
        matterContainer.clientHeight * 5,
        {
            isStatic: true,
            render: { visible: false }
        }
    );

    let rightWall = Bodies.rectangle(
        349 + THICCNESS / 2,
        matterContainer.clientHeight / 2,
        THICCNESS,
        matterContainer.clientHeight * 5,
        {
            isStatic: true,
            render: { visible: false }
        }
    );

    // add all of the bodies to the world
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    let mouse = Matter.Mouse.create(render.canvas);
    mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    Composite.add(engine.world, mouseConstraint);

    // allow scroll through the canvas
    mouseConstraint.mouse.element.removeEventListener(
        "mousewheel",
        mouseConstraint.mouse.mousewheel
    );
    mouseConstraint.mouse.element.removeEventListener(
        "DOMMouseScroll",
        mouseConstraint.mouse.mousewheel
    );

    // run the renderer
    Render.run(render);

    // create runner
    runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);
    console.log(Composite.allBodies(engine.world));

    function createSvgBodies() {
        const colors = ["red", "blue", "green", "purple", "orange"];
        const positions = [
            { x: 200, y: -900 },
            { x: 200, y: -400 },
            { x: 300, y: -800 },
            { x: 200, y: -600 },
            { x: 300, y: -400 }
        ];

        SVG_PATH_SELECTORS.forEach((selector, index) => {
            const path = document.querySelector(selector);

            if (path) {
                // Colorer l'élément SVG
                path.setAttribute('fill', colors[index]);

                let vertices = Svg.pathToVertices(path);
                vertices = Vertices.scale(vertices, 1, 1);
                let chamferedVertices = Vertices.chamfer(vertices, 1, 1, 1, 1);

                let svgBody = Bodies.fromVertices(
                    positions[index].x,  // Initial X position
                    positions[index].y,  // Initial Y position
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

                // Calculer le centre du corps physique
                const bodyCenterX = (bounds.min.x + bounds.max.x) / 2;
                const bodyCenterY = (bounds.min.y + bounds.max.y) / 2;

                // Obtenir les dimensions du SVG
                const svgBBox = body.svgElement.getBBox();
                const svgWidth = svgBBox.width;
                const svgHeight = svgBBox.height;

                // Calculer les offsets pour centrer le SVG
                const offsetX = position.x - (svgWidth / 2);
                const offsetY = position.y - (svgHeight / 2) + 100;

                // Appliquer les transformations SVG pour aligner avec le centre du corps physique
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
    Render.stop(render);
    Runner.stop(runner);
    Composite.clear(engine.world, false);
    Engine.clear(engine);

    if (render.canvas) {
        render.canvas.remove();
    }

    if (render.context) {
        render.context = null;
    }

    render.textures = {};
}
