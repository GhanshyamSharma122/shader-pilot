/**
 * Remote Player Ship
 * Represents other players/bots as proper spacecraft with interpolation
 */

import * as THREE from 'three';
import { PlayerState } from '../../shared/Protocol';

export class RemotePlayer {
    private scene: THREE.Scene;
    private group: THREE.Group;
    private shipGroup: THREE.Group;
    private engineGlow: THREE.PointLight;
    private nameLabel: THREE.Sprite;

    private targetPosition = new THREE.Vector3();
    private targetRotation = new THREE.Quaternion();

    public playerState: PlayerState;

    constructor(scene: THREE.Scene, state: PlayerState) {
        this.scene = scene;
        this.playerState = state;

        this.group = new THREE.Group();
        this.group.position.set(state.position.x, state.position.y, state.position.z);

        // Create proper ship mesh (same design as player but different colors)
        this.shipGroup = this.createShipMesh(state.team);
        this.group.add(this.shipGroup);

        // Engine glow
        const glowColor = state.team === 'red' ? 0xff4444 : state.team === 'blue' ? 0x4444ff : 0xff00ff;
        this.engineGlow = new THREE.PointLight(glowColor, 3, 20);
        this.engineGlow.position.set(0, 0, 2.5);
        this.group.add(this.engineGlow);

        // Name label
        this.nameLabel = this.createNameLabel(state.name, state.team);
        this.nameLabel.position.set(0, 5, 0);
        this.group.add(this.nameLabel);

        scene.add(this.group);
    }

    private createShipMesh(team: 'red' | 'blue' | null): THREE.Group {
        const shipGroup = new THREE.Group();

        // Determine colors based on team/bot status
        let bodyColor = 0x882288;  // Purple for bots
        let emissiveColor = 0xff00ff;
        if (team === 'red') {
            bodyColor = 0xaa2222;
            emissiveColor = 0xff4444;
        } else if (team === 'blue') {
            bodyColor = 0x2222aa;
            emissiveColor = 0x4444ff;
        }

        // Main body - fuselage
        const bodyGeom = new THREE.CylinderGeometry(0.35, 0.7, 3.5, 8);
        bodyGeom.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            metalness: 0.8,
            roughness: 0.2,
            emissive: emissiveColor,
            emissiveIntensity: 0.3,
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        shipGroup.add(body);

        // Nose cone
        const noseGeom = new THREE.ConeGeometry(0.35, 1.2, 8);
        noseGeom.rotateX(-Math.PI / 2);
        const noseMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            metalness: 0.9,
            roughness: 0.1,
            emissive: emissiveColor,
            emissiveIntensity: 0.4,
        });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        nose.position.z = -2.3;
        shipGroup.add(nose);

        // Wings
        const wingGeom = new THREE.BoxGeometry(4, 0.1, 1.5);
        const wingMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            metalness: 0.7,
            roughness: 0.3,
            emissive: emissiveColor,
            emissiveIntensity: 0.2,
        });
        const wings = new THREE.Mesh(wingGeom, wingMat);
        wings.position.z = 0.5;
        shipGroup.add(wings);

        // Engine pods
        const engineGeom = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
        engineGeom.rotateX(Math.PI / 2);
        const engineMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.2,
        });

        const engineLeft = new THREE.Mesh(engineGeom, engineMat);
        engineLeft.position.set(-1.2, 0, 1.5);
        shipGroup.add(engineLeft);

        const engineRight = new THREE.Mesh(engineGeom, engineMat);
        engineRight.position.set(1.2, 0, 1.5);
        shipGroup.add(engineRight);

        // Engine glow meshes
        const glowGeom = new THREE.SphereGeometry(0.25, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: emissiveColor,
            transparent: true,
            opacity: 0.8,
        });

        const glowLeft = new THREE.Mesh(glowGeom, glowMat);
        glowLeft.position.set(-1.2, 0, 2);
        shipGroup.add(glowLeft);

        const glowRight = new THREE.Mesh(glowGeom, glowMat);
        glowRight.position.set(1.2, 0, 2);
        shipGroup.add(glowRight);

        // Scale down slightly so it's distinguishable from player
        shipGroup.scale.setScalar(0.9);

        return shipGroup;
    }

    private createNameLabel(name: string, team: 'red' | 'blue' | null): THREE.Sprite {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 64;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
        ctx.fill();

        // Border
        if (team === 'red') ctx.strokeStyle = '#ff4466';
        else if (team === 'blue') ctx.strokeStyle = '#4466ff';
        else ctx.strokeStyle = '#ff00ff';  // Purple for bots
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (team === 'red') ctx.fillStyle = '#ff6688';
        else if (team === 'blue') ctx.fillStyle = '#6688ff';
        else ctx.fillStyle = '#ff66ff';  // Purple for bots

        ctx.fillText(name, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
        });

        const sprite = new THREE.Sprite(material);
        sprite.scale.set(10, 2.5, 1);
        return sprite;
    }

    updateFromServer(state: PlayerState) {
        this.playerState = state;
        this.targetPosition.set(state.position.x, state.position.y, state.position.z);
        this.targetRotation.set(state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w);

        // Update visibility
        this.group.visible = state.isAlive;
    }

    update(delta: number, time: number) {
        // Smooth interpolation
        this.group.position.lerp(this.targetPosition, 0.15);
        this.group.quaternion.slerp(this.targetRotation, 0.15);

        // Animate engine glow
        this.engineGlow.intensity = 3 + Math.sin(time * 10) * 0.8;
    }

    dispose() {
        this.scene.remove(this.group);
        this.shipGroup.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (child.material instanceof THREE.Material) {
                    child.material.dispose();
                }
            }
        });
        (this.nameLabel.material as THREE.SpriteMaterial).map?.dispose();
        (this.nameLabel.material as THREE.Material).dispose();
    }
}
