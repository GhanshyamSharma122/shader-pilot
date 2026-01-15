/**
 * Space Environment - Multiple Arena Themes
 * Creates different battleground settings
 */

import * as THREE from 'three';

export type ArenaType = 'solar' | 'earth' | 'mars' | 'jupiter';

// Arena color palettes
const ARENA_PALETTES = {
    solar: {
        skyColor: 0x000011,
        fogColor: 0x000022,
        ambientColor: 0x222244,
        sunColor: 0xffffee,
        starColors: [0xffffff, 0xffddaa, 0xff7744, 0x8888ff],
    },
    earth: {
        skyColor: 0x000033,
        fogColor: 0x001144,
        ambientColor: 0x334455,
        sunColor: 0xffffff,
        starColors: [0xffffff, 0xccddff, 0xaabbff, 0xffffff],
    },
    mars: {
        skyColor: 0x220500,
        fogColor: 0x331100,
        ambientColor: 0x442211,
        sunColor: 0xffaa77,
        starColors: [0xffccaa, 0xffaa88, 0xff8866, 0xffffcc],
    },
    jupiter: {
        skyColor: 0x110800,
        fogColor: 0x221100,
        ambientColor: 0x443322,
        sunColor: 0xffddaa,
        starColors: [0xffeecc, 0xffcc88, 0xddaa66, 0xffffff],
    },
};

export class Environment {
    private scene: THREE.Scene;
    private starfield: THREE.Points | null = null;
    private planets: THREE.Group;
    private asteroids: THREE.InstancedMesh | null = null;
    private ambientLight: THREE.AmbientLight;
    private sunLight: THREE.DirectionalLight;
    private arena: ArenaType;

    constructor(scene: THREE.Scene, arena: ArenaType = 'solar') {
        this.scene = scene;
        this.arena = arena;
        this.planets = new THREE.Group();

        const palette = ARENA_PALETTES[arena];

        // Scene settings based on arena
        this.scene.background = new THREE.Color(palette.skyColor);
        this.scene.fog = new THREE.FogExp2(palette.fogColor, 0.00015);

        // Lighting
        this.ambientLight = new THREE.AmbientLight(palette.ambientColor, 0.4);
        scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(palette.sunColor, 1.2);
        this.sunLight.position.set(100, 50, -50);
        scene.add(this.sunLight);

        // Create environment based on arena type
        this.createStarfield();
        this.createArenaElements();

        scene.add(this.planets);
    }

    private createStarfield() {
        const palette = ARENA_PALETTES[this.arena];
        const starCount = 8000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 800 + Math.random() * 1200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Use arena-specific star colors
            const colorChoice = palette.starColors[Math.floor(Math.random() * palette.starColors.length)];
            const color = new THREE.Color(colorChoice);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() < 0.05 ? 2 + Math.random() * 2 : 0.5 + Math.random() * 1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
        });

        this.starfield = new THREE.Points(geometry, material);
        this.scene.add(this.starfield);
    }

    private createArenaElements() {
        switch (this.arena) {
            case 'earth':
                this.createEarthArena();
                break;
            case 'mars':
                this.createMarsArena();
                break;
            case 'jupiter':
                this.createJupiterArena();
                break;
            default:
                this.createSolarArena();
        }

        // Always add asteroids and war debris for gameplay
        this.createAsteroids();
        this.createWarDebris();
    }

    // War debris - destroyed ships and wreckage
    private createWarDebris() {
        const debrisGroup = new THREE.Group();

        // 5 destroyed ship hulls scattered around
        for (let i = 0; i < 5; i++) {
            const hullGroup = new THREE.Group();

            // Damaged fuselage
            const hullGeom = new THREE.CylinderGeometry(2, 3, 12, 6);
            hullGeom.rotateX(Math.PI / 2);
            const hull = new THREE.Mesh(hullGeom, new THREE.MeshStandardMaterial({
                color: 0x333344, metalness: 0.8, roughness: 0.6
            }));
            hullGroup.add(hull);

            // Broken wing
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(8, 0.3, 3),
                new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7 })
            );
            wing.position.set(2, 0, 0);
            wing.rotation.z = 0.3;
            hullGroup.add(wing);

            // Position around arena
            const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 150 + Math.random() * 250;
            hullGroup.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 100,
                Math.sin(angle) * radius
            );
            hullGroup.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            debrisGroup.add(hullGroup);
        }

        // Floating debris particles
        const debrisCount = 80;
        const positions = new Float32Array(debrisCount * 3);
        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 100 + Math.random() * 400;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        const debrisGeom = new THREE.BufferGeometry();
        debrisGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const debris = new THREE.Points(debrisGeom, new THREE.PointsMaterial({
            color: 0x666666, size: 3, transparent: true, opacity: 0.7
        }));
        debrisGroup.add(debris);

        this.planets.add(debrisGroup);
    }

    private createSolarArena() {
        // Sun
        const sunGeom = new THREE.SphereGeometry(80, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
        });
        const sun = new THREE.Mesh(sunGeom, sunMat);
        sun.position.set(600, 200, -1200);
        this.planets.add(sun);

        // Sun glow
        const sunGlowGeom = new THREE.SphereGeometry(100, 32, 32);
        const sunGlowMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.3,
        });
        const sunGlow = new THREE.Mesh(sunGlowGeom, sunGlowMat);
        sunGlow.position.copy(sun.position);
        this.planets.add(sunGlow);

        // Saturn-like planet with rings
        const saturnGeom = new THREE.SphereGeometry(120, 32, 32);
        const saturnMat = new THREE.MeshStandardMaterial({
            color: 0xddaa66,
            metalness: 0.1,
            roughness: 0.8,
        });
        const saturn = new THREE.Mesh(saturnGeom, saturnMat);
        saturn.position.set(-500, 100, -600);
        this.planets.add(saturn);

        // Saturn rings
        const ringGeom = new THREE.RingGeometry(150, 220, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xccaa88,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(saturn.position);
        ring.rotation.x = Math.PI / 2.2;
        this.planets.add(ring);

        // Small purple moon
        const moonGeom = new THREE.SphereGeometry(25, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0x6644aa,
            emissive: 0x221133,
            emissiveIntensity: 0.3,
        });
        const moon = new THREE.Mesh(moonGeom, moonMat);
        moon.position.set(200, -100, 400);
        this.planets.add(moon);
    }

    private createEarthArena() {
        // Earth
        const earthGeom = new THREE.SphereGeometry(200, 64, 64);
        const earthMat = new THREE.MeshStandardMaterial({
            color: 0x2266aa,
            metalness: 0.1,
            roughness: 0.8,
        });
        const earth = new THREE.Mesh(earthGeom, earthMat);
        earth.position.set(-300, -400, -500);
        this.planets.add(earth);

        // Earth clouds (slightly larger sphere)
        const cloudGeom = new THREE.SphereGeometry(205, 64, 64);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
        });
        const clouds = new THREE.Mesh(cloudGeom, cloudMat);
        clouds.position.copy(earth.position);
        this.planets.add(clouds);

        // Moon
        const moonGeom = new THREE.SphereGeometry(50, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.9,
        });
        const moon = new THREE.Mesh(moonGeom, moonMat);
        moon.position.set(300, 100, -800);
        this.planets.add(moon);

        // Space station (simple shape)
        const stationGroup = new THREE.Group();
        const coreGeom = new THREE.CylinderGeometry(8, 8, 60, 8);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
        const core = new THREE.Mesh(coreGeom, coreMat);
        stationGroup.add(core);

        const solarGeom = new THREE.BoxGeometry(80, 2, 15);
        const solarMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, metalness: 0.5 });
        const solar1 = new THREE.Mesh(solarGeom, solarMat);
        solar1.position.y = 15;
        stationGroup.add(solar1);
        const solar2 = new THREE.Mesh(solarGeom, solarMat);
        solar2.position.y = -15;
        stationGroup.add(solar2);

        stationGroup.position.set(150, 80, 300);
        stationGroup.rotation.z = Math.PI / 6;
        this.planets.add(stationGroup);
    }

    private createMarsArena() {
        // Mars (large backdrop)
        const marsGeom = new THREE.SphereGeometry(300, 64, 64);
        const marsMat = new THREE.MeshStandardMaterial({
            color: 0xcc4422,
            metalness: 0.1,
            roughness: 0.9,
        });
        const mars = new THREE.Mesh(marsGeom, marsMat);
        mars.position.set(0, -500, -600);
        this.planets.add(mars);

        // Phobos
        const phobosGeom = new THREE.IcosahedronGeometry(20, 1);
        const phobosMat = new THREE.MeshStandardMaterial({
            color: 0x886655,
            roughness: 1,
        });
        const phobos = new THREE.Mesh(phobosGeom, phobosMat);
        phobos.position.set(-200, 100, -200);
        this.planets.add(phobos);

        // Deimos
        const deimosGeom = new THREE.IcosahedronGeometry(12, 1);
        const deimosMat = new THREE.MeshStandardMaterial({
            color: 0x776655,
            roughness: 1,
        });
        const deimos = new THREE.Mesh(deimosGeom, deimosMat);
        deimos.position.set(350, -50, -150);
        this.planets.add(deimos);

        // Red dust particles
        const dustCount = 500;
        const dustPositions = new Float32Array(dustCount * 3);
        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 800;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 300;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 800;
        }
        const dustGeom = new THREE.BufferGeometry();
        dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0xcc6644,
            size: 2,
            transparent: true,
            opacity: 0.4,
        });
        const dust = new THREE.Points(dustGeom, dustMat);
        this.planets.add(dust);
    }

    private createJupiterArena() {
        // Jupiter (massive backdrop)
        const jupiterGeom = new THREE.SphereGeometry(500, 64, 64);
        const jupiterMat = new THREE.MeshStandardMaterial({
            color: 0xddaa77,
            metalness: 0.1,
            roughness: 0.7,
        });
        const jupiter = new THREE.Mesh(jupiterGeom, jupiterMat);
        jupiter.position.set(0, -600, -800);
        this.planets.add(jupiter);

        // Great Red Spot (overlayed sphere segment)
        const spotGeom = new THREE.SphereGeometry(80, 32, 32);
        const spotMat = new THREE.MeshBasicMaterial({
            color: 0xcc4422,
            transparent: true,
            opacity: 0.5,
        });
        const spot = new THREE.Mesh(spotGeom, spotMat);
        spot.position.set(-100, -400, -450);
        this.planets.add(spot);

        // Io (volcanic moon)
        const ioGeom = new THREE.SphereGeometry(30, 32, 32);
        const ioMat = new THREE.MeshStandardMaterial({
            color: 0xcccc44,
            emissive: 0x442200,
            emissiveIntensity: 0.3,
        });
        const io = new THREE.Mesh(ioGeom, ioMat);
        io.position.set(-300, 50, -100);
        this.planets.add(io);

        // Europa (ice moon)
        const europaGeom = new THREE.SphereGeometry(25, 32, 32);
        const europaMat = new THREE.MeshStandardMaterial({
            color: 0xccddee,
            metalness: 0.2,
            roughness: 0.3,
        });
        const europa = new THREE.Mesh(europaGeom, europaMat);
        europa.position.set(250, 100, 200);
        this.planets.add(europa);

        // Storm clouds (floating particles)
        const cloudCount = 300;
        const cloudPositions = new Float32Array(cloudCount * 3);
        for (let i = 0; i < cloudCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 200 + Math.random() * 400;
            cloudPositions[i * 3] = Math.cos(angle) * radius;
            cloudPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            cloudPositions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        const cloudGeom = new THREE.BufferGeometry();
        cloudGeom.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
        const cloudMat = new THREE.PointsMaterial({
            color: 0xddbb88,
            size: 6,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
        });
        const stormClouds = new THREE.Points(cloudGeom, cloudMat);
        this.planets.add(stormClouds);
    }

    private createAsteroids() {
        const asteroidCount = 150;
        const baseGeom = new THREE.IcosahedronGeometry(1, 1);

        // Deform the base geometry
        const positions = baseGeom.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            const noise = 0.6 + Math.random() * 0.8;
            positions.setXYZ(i, x * noise, y * noise, z * noise);
        }
        baseGeom.computeVertexNormals();

        const asteroidMat = new THREE.MeshStandardMaterial({
            color: this.arena === 'mars' ? 0x884433 : 0x555555,
            roughness: 1,
            metalness: 0.2,
        });

        this.asteroids = new THREE.InstancedMesh(baseGeom, asteroidMat, asteroidCount);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 250 + Math.random() * 300;
            const height = (Math.random() - 0.5) * 150;

            dummy.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            const scale = 2 + Math.random() * 6;
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            this.asteroids.setMatrixAt(i, dummy.matrix);
        }

        this.scene.add(this.asteroids);
    }

    update(delta: number, time: number, playerPosition: THREE.Vector3) {
        // Slowly rotate starfield
        if (this.starfield) {
            this.starfield.rotation.y += delta * 0.002;
        }

        // Rotate asteroids slowly
        if (this.asteroids) {
            this.asteroids.rotation.y += delta * 0.01;
        }

        // Move planets slightly for parallax effect
        this.planets.children.forEach((child, index) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
                child.rotation.y += delta * 0.001 * (index % 3 === 0 ? 1 : -0.5);
            }
        });
    }

    dispose() {
        if (this.starfield) {
            this.starfield.geometry.dispose();
            (this.starfield.material as THREE.Material).dispose();
            this.scene.remove(this.starfield);
        }

        if (this.asteroids) {
            this.asteroids.geometry.dispose();
            (this.asteroids.material as THREE.Material).dispose();
            this.scene.remove(this.asteroids);
        }

        this.planets.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (child.material instanceof THREE.Material) {
                    child.material.dispose();
                }
            }
        });
        this.scene.remove(this.planets);
        this.scene.remove(this.ambientLight);
        this.scene.remove(this.sunLight);
    }
}
