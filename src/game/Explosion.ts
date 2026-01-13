/**
 * Explosion Effect - Fabulous particle burst when enemies are destroyed
 */

import * as THREE from 'three';

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    rotationSpeed: THREE.Vector3;
}

export class Explosion {
    private scene: THREE.Scene;
    private particles: Particle[] = [];
    private lights: THREE.PointLight[] = [];
    private isActive: boolean = true;
    private elapsedTime: number = 0;
    private duration: number = 1.5;
    private position: THREE.Vector3;

    constructor(scene: THREE.Scene, position: THREE.Vector3, color: number = 0xff6600) {
        this.scene = scene;
        this.position = position.clone();

        // Create the explosion
        this.createExplosion(color);
    }

    private createExplosion(baseColor: number) {
        const particleCount = 20; // Reduced for performance
        const colors = [
            0xff6600, // Orange
            0xff3300, // Red-orange
            0xffff00, // Yellow
            0xff0066, // Pink
            0xffffff, // White core
        ];

        // Core flash
        const coreLight = new THREE.PointLight(0xffffff, 15, 80);
        coreLight.position.copy(this.position);
        this.scene.add(coreLight);
        this.lights.push(coreLight);

        // Secondary colored lights
        const light1 = new THREE.PointLight(baseColor, 10, 60);
        light1.position.copy(this.position);
        this.scene.add(light1);
        this.lights.push(light1);

        // Create particle debris
        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 0.3 + Math.random() * 0.8;

            // Random shape for variety
            let geometry: THREE.BufferGeometry;
            const shapeType = Math.random();
            if (shapeType < 0.4) {
                geometry = new THREE.IcosahedronGeometry(size, 0);
            } else if (shapeType < 0.7) {
                geometry = new THREE.BoxGeometry(size, size, size);
            } else {
                geometry = new THREE.TetrahedronGeometry(size);
            }

            const material = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(this.position);

            // Random velocity in all directions (spherical burst)
            const speed = 20 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );

            const rotationSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            const life = 0.5 + Math.random() * 1.0;

            this.particles.push({
                mesh,
                velocity,
                life,
                maxLife: life,
                rotationSpeed,
            });

            this.scene.add(mesh);
        }

        // Create expanding ring effect
        this.createShockwaveRing();

        // Create spark trails
        this.createSparkTrails();
    }

    private createShockwaveRing() {
        const ringGeometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.position);
        ring.lookAt(this.position.clone().add(new THREE.Vector3(0, 1, 0)));

        this.scene.add(ring);

        // Store ring as a special particle
        this.particles.push({
            mesh: ring,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 0.8,
            maxLife: 0.8,
            rotationSpeed: new THREE.Vector3(0, 0, 0),
        });
    }

    private createSparkTrails() {
        const sparkCount = 10; // Reduced for performance

        for (let i = 0; i < sparkCount; i++) {
            const geometry = new THREE.CylinderGeometry(0.05, 0.02, 2, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff66,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending,
            });

            const spark = new THREE.Mesh(geometry, material);
            spark.position.copy(this.position);

            // Fast outward velocity
            const speed = 40 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );

            // Orient spark in direction of travel
            spark.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                velocity.clone().normalize()
            );

            this.particles.push({
                mesh: spark,
                velocity,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                rotationSpeed: new THREE.Vector3(0, 0, 0),
            });

            this.scene.add(spark);
        }
    }

    update(delta: number): boolean {
        if (!this.isActive) return false;

        this.elapsedTime += delta;

        // Update lights (rapid fade)
        this.lights.forEach((light, index) => {
            const decay = index === 0 ? 15 : 8;
            light.intensity *= Math.pow(0.1, delta * decay);
        });

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= delta;

            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                (particle.mesh.material as THREE.Material).dispose();
                this.particles.splice(i, 1);
                continue;
            }

            // Move particle
            particle.mesh.position.addScaledVector(particle.velocity, delta);

            // Apply drag
            particle.velocity.multiplyScalar(0.96);

            // Rotate
            particle.mesh.rotation.x += particle.rotationSpeed.x * delta;
            particle.mesh.rotation.y += particle.rotationSpeed.y * delta;
            particle.mesh.rotation.z += particle.rotationSpeed.z * delta;

            // Fade out
            const lifePercent = particle.life / particle.maxLife;
            const material = particle.mesh.material as THREE.MeshBasicMaterial;
            material.opacity = lifePercent;

            // Scale down slightly
            const scale = 0.5 + lifePercent * 0.5;
            particle.mesh.scale.setScalar(scale);

            // Special handling for ring (expand it)
            if (particle.mesh.geometry.type === 'RingGeometry') {
                const expansion = 1 + (1 - lifePercent) * 30;
                particle.mesh.scale.set(expansion, expansion, 1);
            }
        }

        // Check if explosion is complete
        if (this.elapsedTime > this.duration && this.particles.length === 0) {
            this.isActive = false;
            this.dispose();
            return false;
        }

        return true;
    }

    dispose() {
        // Clean up any remaining particles
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            (particle.mesh.material as THREE.Material).dispose();
        });
        this.particles = [];

        // Clean up lights
        this.lights.forEach(light => {
            this.scene.remove(light);
        });
        this.lights = [];
    }

    isStillActive(): boolean {
        return this.isActive;
    }
}
