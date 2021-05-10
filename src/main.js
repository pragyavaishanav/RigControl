import { EffectComposer } from './components/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './components/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './components/three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from './components/three/examples/jsm/postprocessing/OutlinePass.js';
import { GammaCorrectionShader } from './components/three/examples/jsm/shaders/GammaCorrectionShader.js';



import * as Utils from './components/system.js';
import { load } from './components/loadAssets.js';
import UI from './components/ui.js';
import { Interaction } from './components/interaction.js';
import { moveCameraSnap } from './components/moveCameraSnap.js';
import { Manage } from './components/manage.js';


const App = function () {

    let scene, camera, renderer, orbit, controls;
    let composer, renderPass, outlinePass;

    let outline = false;

    const container = document.getElementById('scene-container');

    const init = () => {

        scene = Utils.Scene();

        camera = Utils.Camera(container);

        renderer = Utils.Renderer();

        container.append(renderer.domElement)

        const _controllers = Utils.Controls(camera, renderer);
        orbit = _controllers[0];
        controls = _controllers[1];

        controls.addEventListener('change', render);
        controls.addEventListener('dragging-changed', function (event) {
            orbit.enabled = !event.value;
        });

        const ambientLight = Utils.Lights();
        scene.add(ambientLight, controls);

        const resizer = new Utils.Resizer(container, camera, renderer);
    }


    this.start = async function () {

        init();


        const loaderIcon = document.getElementById('loader');

        const { model, bones, dumbell, bench } = await load(loaderIcon);
        dumbell.NRightHand.visible = false;
        dumbell.NLeftHand.visible = false;
        bench.visible = false;
        scene.add(model, bench);

        const manager = new Manage(bones, model, dumbell, bench);

        const ui = new UI(model, bones, dumbell, bench, scene, controls, manager);
        ui.init();

        const interaction = new Interaction(ui, camera, controls, orbit, container);
        const cameraSnap = moveCameraSnap(model, orbit, interaction.mouse, camera);

        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        let selectedObjects = [model];

        controls.traverse((obj) => { // To be detected correctly by OutlinePass.
            obj.isTransformControls = true;
        });

        outlinePass = new OutlinePass({ x: 1024, y: 1024 }, scene, camera, selectedObjects);
        outlinePass.visibleEdgeColor.setHex('#000000');

        // outlinePass.maskBufferMaterial.skinning = true;
        // outlinePass.depthMaterial.skinning = true;
        outlinePass.prepareMaskMaterial.skinning = true;

        composer.addPass(new ShaderPass(GammaCorrectionShader));

        composer.addPass(outlinePass);


        $('#outlineCheck').click(() => {
            outline = $('#outlineCheck').prop('checked');
        });

        animate();
    }

    function render() {
        if (!outline) {

            renderer.render(scene, camera);
        }
        else {

            composer.render();
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        orbit.update();
    }

}



const app = new App();
console.clear();
app.start();
