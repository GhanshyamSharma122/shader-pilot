/**
 * Projectile - Improved Version
 * Better looking lasers with proper trails
 */

import * as THREE from 'three';
import { ProjectileState, ProjectileType } from '../../shared/Protocol';

export class Projectile {
    private scene: THREE.Scene;
    private group: THREE.Group;
    private coreMesh: THREE.Mesh;
    private glowMesh: THREE.Mesh;
    private light: THREE.PointLight;

    private velocity: THREE.Vector3;
    private type: ProjectileType;

    constructor(scene: THREE.Scene, state: ProjectileState) {
        this.scene = scene;
        this.type = state.type;
        this.velocity = new THREE.Vector3(state.velocity.x, state.velocity.y, state.velocity.z);

        this.group = new THREE.Group();
        this.group.position.set(state.position.x, state.position.y, state.position.z);

        // Create projectile based on type
        const visuals = this.createProjectileVisuals(state.type);
        this.coreMesh = visuals.core;
        this.glowMesh = visuals.glow;
        this.light = visuals.light;

        this.group.add(this.coreMesh);
        this.group.add(this.glowMesh);
        this.group.add(this.light);

        // Orient in direction of travel
        if (this.velocity.length() > 0) {
            const dir = this.velocity.clone().normalize();
            this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        }

        scene.add(this.group);
    }

    private createProjectileVisuals(type: ProjectileType): {
        core: THREE.Mesh;
        glow: THREE.Mesh;
        light: THREE.PointLight;
    } {
        let color: number;
        let coreLength: number;
        let glowSize: number;
        let lightIntensity: number;

        switch (type) {
            case 'missile':
                color = 0xff6600;
                coreLength = 1.5;
                glowSize = 0.8;
                lightIntensity = 3;
                break;

            case 'plasma':
                color = 0xff00ff;
                coreLength = 0.8;
                glowSize = 1.2;
                lightIntensity = 4;
                break;

            default: // laser
                color = 0x00ffff;
                coreLength = 2;
                glowSize = 0.5;
                lightIntensity = 2;
        }

        // Core beam
        const coreGeom = new THREE.CylinderGeometry(0.05, 0.05, coreLength, 8);
        coreGeom.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
        });
        const core = new THREE.Mesh(coreGeom, coreMat);

        // Outer glow
        const glowGeom = new THREE.CylinderGeometry(0.15, 0.1, coreLength * 1.2, 8);
        glowGeom.rotateX(Math.PI / 2);
        const glowMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);

        // Point light
        const light = new THREE.PointLight(color, lightIntensity, 15);
        light.position.z = coreLength / 2;

        return { core, glow, light };
    }

    update(delta: number) {
        // Pulse effect
        const time = Date.now() * 0.01;
        const pulse = 0.8 + Math.sin(time) * 0.2;
        this.light.intensity = 2 * pulse;
        (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + pulse * 0.2;
    }

    dispose() {
        this.scene.remove(this.group);
        this.coreMesh.geometry.dispose();
        (this.coreMesh.material as THREE.Material).dispose();
        this.glowMesh.geometry.dispose();
        (this.glowMesh.material as THREE.Material).dispose();
    }
}
