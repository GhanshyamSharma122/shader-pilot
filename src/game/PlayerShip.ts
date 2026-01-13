/**
 * Player Spaceship - Improved Version
 * Proper 3D ship with smooth controls and visual effects
 */

import * as THREE from 'three';
import { PlayerInput, Vector3 } from '../../shared/Protocol';

export class PlayerShip {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private shipColor: number;

    private shipGroup: THREE.Group;
    private bodyMesh!: THREE.Mesh;
    private wingLeftMesh!: THREE.Mesh;
    private wingRightMesh!: THREE.Mesh;
    private cockpitMesh!: THREE.Mesh;
    private engineGlowLeft!: THREE.Mesh;
    private engineGlowRight!: THREE.Mesh;
    private engineLightLeft!: THREE.PointLight;
    private engineLightRight!: THREE.PointLight;

    private velocity = new THREE.Vector3();
    private rotationVelocity = new THREE.Vector3();

    // Smooth camera follow
    private cameraTargetPosition = new THREE.Vector3();
    private cameraCurrentPosition = new THREE.Vector3();

    // Third person camera settings
    private cameraDistance = 15;
    private cameraHeight = 5;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, shipColor: string = '#2244aa') {
        this.scene = scene;
        this.camera = camera;
        this.shipColor = parseInt(shipColor.replace('#', ''), 16);

        this.shipGroup = new THREE.Group();

        // Build the ship with the selected color
        this.buildShip();

        // Add engine effects
        this.addEngineEffects();

        scene.add(this.shipGroup);

        // Initialize camera position
        this.cameraCurrentPosition.copy(camera.position);
    }

    private buildShip() {
        // Main body - sleek fuselage
        const bodyGeom = new THREE.CylinderGeometry(0.4, 0.8, 4, 8);
        bodyGeom.rotateX(Math.PI / 2);

        // Derive colors from the selected ship color
        const baseColor = new THREE.Color(this.shipColor);
        const emissiveColor = baseColor.clone().multiplyScalar(0.3);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.shipColor,
            metalness: 0.8,
            roughness: 0.2,
            emissive: emissiveColor,
            emissiveIntensity: 0.3,
        });
        this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
        this.shipGroup.add(this.bodyMesh);

        // Nose cone
        const noseGeom = new THREE.ConeGeometry(0.4, 1.5, 8);
        noseGeom.rotateX(-Math.PI / 2);
        const noseMat = new THREE.MeshStandardMaterial({
            color: 0x3366cc,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x0044aa,
            emissiveIntensity: 0.2,
        });
        const noseMesh = new THREE.Mesh(noseGeom, noseMat);
        noseMesh.position.z = -2.5;
        this.shipGroup.add(noseMesh);

        // Cockpit glass
        const cockpitGeom = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        cockpitGeom.rotateX(-Math.PI / 2);
        const cockpitMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.1,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
        });
        this.cockpitMesh = new THREE.Mesh(cockpitGeom, cockpitMat);
        this.cockpitMesh.position.set(0, 0.3, -1);
        this.shipGroup.add(this.cockpitMesh);

        // Left wing
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(3, -0.5);
        wingShape.lineTo(2.5, 0);
        wingShape.lineTo(3, 0.3);
        wingShape.lineTo(0, 1);
        wingShape.lineTo(0, 0);

        const wingGeom = new THREE.ExtrudeGeometry(wingShape, {
            depth: 0.1,
            bevelEnabled: false,
        });
        wingGeom.rotateY(-Math.PI / 2);
        wingGeom.rotateZ(-Math.PI / 2);

        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x1a3366,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x001144,
            emissiveIntensity: 0.2,
        });

        this.wingLeftMesh = new THREE.Mesh(wingGeom.clone(), wingMat);
        this.wingLeftMesh.position.set(-0.5, 0, 0.5);
        this.wingLeftMesh.rotation.z = -0.1;
        this.shipGroup.add(this.wingLeftMesh);

        this.wingRightMesh = new THREE.Mesh(wingGeom.clone(), wingMat);
        this.wingRightMesh.position.set(0.5, 0, 0.5);
        this.wingRightMesh.rotation.z = 0.1;
        this.wingRightMesh.scale.x = -1;
        this.shipGroup.add(this.wingRightMesh);

        // Tail fin
        const tailGeom = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        const tailMat = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            metalness: 0.7,
            roughness: 0.3,
        });
        const tailMesh = new THREE.Mesh(tailGeom, tailMat);
        tailMesh.position.set(0, 0.6, 1.5);
        this.shipGroup.add(tailMesh);
    }

    private addEngineEffects() {
        // Engine glow meshes
        const engineGlowGeom = new THREE.CylinderGeometry(0.25, 0.4, 0.8, 16);
        engineGlowGeom.rotateX(Math.PI / 2);

        const engineGlowMat = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8,
        });

        this.engineGlowLeft = new THREE.Mesh(engineGlowGeom.clone(), engineGlowMat.clone());
        this.engineGlowLeft.position.set(-0.6, 0, 2.4);
        this.shipGroup.add(this.engineGlowLeft);

        this.engineGlowRight = new THREE.Mesh(engineGlowGeom.clone(), engineGlowMat.clone());
        this.engineGlowRight.position.set(0.6, 0, 2.4);
        this.shipGroup.add(this.engineGlowRight);

        // Engine point lights
        this.engineLightLeft = new THREE.PointLight(0x00aaff, 2, 10);
        this.engineLightLeft.position.set(-0.6, 0, 2.5);
        this.shipGroup.add(this.engineLightLeft);

        this.engineLightRight = new THREE.PointLight(0x00aaff, 2, 10);
        this.engineLightRight.position.set(0.6, 0, 2.5);
        this.shipGroup.add(this.engineLightRight);
    }

    setPosition(x: number, y: number, z: number) {
        this.shipGroup.position.set(x, y, z);
        this.velocity.set(0, 0, 0);

        // Reset camera
        this.cameraCurrentPosition.set(x, y + this.cameraHeight, z + this.cameraDistance);
        this.camera.position.copy(this.cameraCurrentPosition);
    }

    applyInput(input: PlayerInput, delta: number) {
        // Movement speed - reduced for more control
        const baseSpeed = 30;
        const boostMultiplier = input.boost ? 1.8 : 1;
        const speed = baseSpeed * boostMultiplier;

        // Rotation speed - significantly reduced for precision
        const rotSpeed = 1.3;

        // Get ship's orientation vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shipGroup.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion);

        // Apply thrust
        const thrust = new THREE.Vector3();
        thrust.addScaledVector(forward, input.forward * speed);
        thrust.addScaledVector(right, input.strafe * speed);
        thrust.addScaledVector(up, input.vertical * speed * 0.6);

        // Heavy drag for stable flight (stops quickly)
        this.velocity.lerp(thrust, delta * 5);

        // Stronger braking when no input
        if (Math.abs(input.forward) < 0.1 && Math.abs(input.strafe) < 0.1 && Math.abs(input.vertical) < 0.1) {
            this.velocity.multiplyScalar(0.92);
        }

        // Apply velocity
        this.shipGroup.position.addScaledVector(this.velocity, delta);

        // Apply rotation with low sensitivity for aiming
        const pitchAmount = -input.pitch * rotSpeed * delta * 0.6;
        const yawAmount = -input.yaw * rotSpeed * delta * 0.6;
        const rollAmount = input.roll * rotSpeed * delta * 1.5;

        // Apply rotations smoothly
        this.shipGroup.rotateOnAxis(new THREE.Vector3(1, 0, 0), pitchAmount);
        this.shipGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), yawAmount);
        this.shipGroup.rotateOnAxis(new THREE.Vector3(0, 0, 1), rollAmount);

        // Strong auto-level roll when not actively rolling
        if (Math.abs(input.roll) < 0.1) {
            const euler = new THREE.Euler().setFromQuaternion(this.shipGroup.quaternion, 'YXZ');
            euler.z *= 0.90; // Fast recovery
            this.shipGroup.quaternion.setFromEuler(euler);
        }

        // Strong auto-level pitch for stability
        if (Math.abs(input.pitch) < 0.05) {
            const euler = new THREE.Euler().setFromQuaternion(this.shipGroup.quaternion, 'YXZ');
            euler.x *= 0.95; // Moderate recovery
            this.shipGroup.quaternion.setFromEuler(euler);
        }
    }

    update(delta: number, time: number) {
        // Update engine effects based on speed
        const speed = this.velocity.length();
        const engineIntensity = 0.5 + speed * 0.02;
        const pulse = Math.sin(time * 15) * 0.2 + 0.8;

        this.engineLightLeft.intensity = engineIntensity * 2 * pulse;
        this.engineLightRight.intensity = engineIntensity * 2 * pulse;

        // Update engine glow size
        const glowScale = 0.8 + speed * 0.01;
        this.engineGlowLeft.scale.z = glowScale;
        this.engineGlowRight.scale.z = glowScale;

        // Engine color shifts with boost
        const engineColor = new THREE.Color(0x00aaff);
        if (speed > 60) {
            engineColor.lerp(new THREE.Color(0xffaa00), (speed - 60) / 40);
        }
        (this.engineGlowLeft.material as THREE.MeshBasicMaterial).color = engineColor;
        (this.engineGlowRight.material as THREE.MeshBasicMaterial).color = engineColor;
        this.engineLightLeft.color = engineColor;
        this.engineLightRight.color = engineColor;

        // Third person camera follow
        this.updateCamera(delta);
    }

    private updateCamera(delta: number) {
        // Calculate target camera position (behind and above ship)
        const shipPos = this.shipGroup.position;
        const shipForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipGroup.quaternion);
        const shipUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion);

        // Position camera behind ship
        this.cameraTargetPosition.copy(shipPos);
        this.cameraTargetPosition.addScaledVector(shipForward, this.cameraDistance);
        this.cameraTargetPosition.addScaledVector(shipUp, this.cameraHeight);

        // Smooth camera movement
        this.cameraCurrentPosition.lerp(this.cameraTargetPosition, delta * 5);
        this.camera.position.copy(this.cameraCurrentPosition);

        // Look at a point ahead of the ship
        const lookTarget = shipPos.clone().addScaledVector(shipForward.negate(), 10);
        this.camera.lookAt(lookTarget);
    }

    getForwardDirection(): Vector3 {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shipGroup.quaternion);
        return { x: forward.x, y: forward.y, z: forward.z };
    }

    getPosition(): THREE.Vector3 {
        return this.shipGroup.position.clone();
    }

    getRotation(): THREE.Quaternion {
        return this.shipGroup.quaternion.clone();
    }

    getRotationY(): number {
        // Extract Y rotation (yaw) from the ship's euler angles
        const euler = new THREE.Euler().setFromQuaternion(this.shipGroup.quaternion, 'YXZ');
        return euler.y;
    }

    setVisible(visible: boolean) {
        this.shipGroup.visible = visible;
    }

    // Quick 180-degree flip to see enemies behind
    flip180() {
        const flipRotation = new THREE.Quaternion();
        flipRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        this.shipGroup.quaternion.multiply(flipRotation);
    }

    showDamageEffect() {
        // Flash the ship red
        const originalEmissive = (this.bodyMesh.material as THREE.MeshStandardMaterial).emissive.clone();
        (this.bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
        (this.bodyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;

        setTimeout(() => {
            (this.bodyMesh.material as THREE.MeshStandardMaterial).emissive.copy(originalEmissive);
            (this.bodyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }, 150);
    }

    dispose() {
        this.scene.remove(this.shipGroup);
        // Dispose all geometries and materials
        this.shipGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (child.material instanceof THREE.Material) {
                    child.material.dispose();
                }
            }
        });
    }
}
