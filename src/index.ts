import * as THREE from 'three'
import {
	GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader'
import {
	VRM
} from '@pixiv/three-vrm'
import {
	DeviceOrientationControls
} from "three/examples/jsm/controls/DeviceOrientationControls"
import Stats from 'stats.js';
import * as nipplejs from 'nipplejs'

const ua: string[] = [
	"iPod",
	"iPad",
	"iPhone"
];

function success() {
	(document.getElementById("txt") as HTMLElement).innerHTML = "ボタンを押してください!";
	(document.getElementById("check") as HTMLInputElement).disabled = false;
}

function failure() {
	(document.getElementById("txt") as HTMLElement).innerHTML = "このデバイスでは対応しておりません";
}


(document.getElementById("test") as HTMLElement).innerHTML = window.navigator.userAgent;
let iosflg: boolean = false;
if (((window.DeviceOrientationEvent) && ('ontouchstart' in window))) {
	//mobile
	for (let i: number = 0; i < ua.length; i++) {
		if (window.navigator.userAgent.indexOf(ua[i]) > 0) {
			iosflg = true;
			success();
			break;
		}
	}

	if (!iosflg && window.navigator.userAgent.indexOf("Android") > 0) {
		success();
	}

} else {
	//pc
	failure();
}

function check() {
	(document.getElementById("check") as HTMLInputElement).disabled = true;
	if (iosflg) {
		//ios
		try {
			DeviceOrientationEvent.requestPermission().then(res => {
				if (res === 'granted') {
					main();
				} else {
					failure();
				}
			});
		} catch (e) {
			failure();
			alert(e);
		}
	} else {
		//android
		main();
	}
}

(document.getElementById("check") as HTMLInputElement).onclick = check;

const xzManager = nipplejs.create({
	zone: document.getElementById("xzBox") as HTMLElement,
	color: 'white'
});

const yManager = nipplejs.create({
	zone: document.getElementById("yBox") as HTMLElement,
	color: 'red',
	lockY: true
});

function main() {
	(document.getElementById("canvas-wrapper-main") as HTMLElement).style.display = "inline";
	(document.getElementById("title") as HTMLElement).style.display = "none";
	(document.getElementById("xzBox") as HTMLElement).style.top = String(window.innerHeight - window.innerWidth / 2) + "px";
	(document.getElementById("yBox") as HTMLElement).style.top = String(window.innerHeight - window.innerWidth / 2) + "px";
	// document.body.requestFullscreen();//ios非対応

	window.resizeTo(window.innerWidth, window.innerHeight);
	const width: number = window.innerWidth;
	const height: number = window.innerHeight;

	const stats = new Stats();
	stats.showPanel(0);
	document.body.appendChild(stats.dom);

	//xz軸
	xzManager.on("move", (e, n) => {
		let deg_see: number = n.angle.degree;
		if (deg_see <= 270) {
			deg_see -= 90;
		} else {
			deg_see -= 360 + 90;
		}
		deg_see = Math.floor(deg_see * 1000) / 1000; //小数3桁まで

		let deg_move: number = (camera.rotation.y * 180 / Math.PI) + deg_see;
		if (deg_move < -90) {
			deg_move += 360 + 90;
		} else {
			deg_move += 90;
		}
		camera.position.x += Math.cos(deg_move * (Math.PI / 180)) * 0.01;
		camera.position.z -= Math.sin(deg_move * (Math.PI / 180)) * 0.01;
	});

	//y軸
	yManager.on("move", (e, n) => {
		if (n.direction != undefined) {
			const force: number = n.force;
			const p: number = (n.direction.y == "up") ? 1 : -1;
			camera.position.y += force * 0.01 * p;
		}
	});

	//three
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	const cameraY: number = 0.8;
	camera.position.set(0, cameraY, 2);

	const controls = new DeviceOrientationControls(camera);
	controls.connect();

	const rendererThree = new THREE.WebGLRenderer({
		canvas: (document.querySelector('canvas') as HTMLCanvasElement),
		antialias: true
	});
	rendererThree.setPixelRatio(window.devicePixelRatio);
	rendererThree.setSize(width, height);
	rendererThree.setClearColor(0x000000);

	const light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);

	let vrmupdate: any;

	const loader = new GLTFLoader();

	loader.load(
		'./models/test.vrm',

		(gltf) => {
			VRM.from(gltf).then((vrm) => {
				scene.add(vrm.scene);
				vrm.scene.rotation.y = Math.PI;
				vrmupdate = vrm;

				//ここが一番重い
				(document.getElementById('loadingWrapper') as HTMLElement).classList.add('loaded');
			})
		}
	)

	const update = () => {
		requestAnimationFrame(update);
		stats.begin();
		//初期カメラ調整
		if (controls.alphaOffset == 0 && camera.rotation.y != 0) {
			controls.alphaOffset = camera.rotation.y * -1;
		}
		controls.update();
		rendererThree.render(scene, camera);
		stats.end();
	};
	update();
}