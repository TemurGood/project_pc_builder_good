import * as THREE from 'three';

// Node.js FileReader polyfill for GLTFExporter binary writer
if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
        if (this.onload) this.onload();
      });
    }
  };
}

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'public', 'models');

function exportToGlb(scene, filename) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => {
        const filePath = path.join(outDir, filename);
        if (gltf instanceof ArrayBuffer) {
          fs.writeFileSync(filePath, Buffer.from(gltf));
          console.log(`Saved ${filename}: ${fs.statSync(filePath).size} bytes`);
          resolve();
        } else {
          // If JSON
          const buf = Buffer.from(JSON.stringify(gltf));
          fs.writeFileSync(filePath, buf);
          console.log(`Saved ${filename} (json): ${fs.statSync(filePath).size} bytes`);
          resolve();
        }
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

// 1. Build Detailed Motherboard Model
function createMotherboard() {
  const group = new THREE.Group();

  // PCB Base (ATX standard ~ 305mm x 244mm scaled to units ~ 3.05 x 2.44)
  const pcbGeo = new THREE.BoxGeometry(2.44, 0.05, 3.05);
  const pcbMat = new THREE.MeshStandardMaterial({ 
    color: 0x11161d, 
    roughness: 0.6, 
    metalness: 0.2 
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // CPU Socket Bracket (AM5 / LGA1700 metal latch)
  const socketGeo = new THREE.BoxGeometry(0.65, 0.06, 0.65);
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
  const socket = new THREE.Mesh(socketGeo, socketMat);
  socket.position.set(0, 0.03, -0.4);
  group.add(socket);

  // VRM Heatsinks (Aluminum fin blocks with grooved chamfer)
  const vrm1Geo = new THREE.BoxGeometry(0.35, 0.3, 1.2);
  const vrmMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.9, roughness: 0.25 });
  const vrm1 = new THREE.Mesh(vrm1Geo, vrmMat);
  vrm1.position.set(-0.6, 0.15, -0.4);
  group.add(vrm1);

  const vrm2Geo = new THREE.BoxGeometry(0.9, 0.3, 0.35);
  const vrm2 = new THREE.Mesh(vrm2Geo, vrmMat);
  vrm2.position.set(0, 0.15, -1.05);
  group.add(vrm2);

  // I/O Shield Cover Armor
  const ioGeo = new THREE.BoxGeometry(0.35, 0.45, 1.4);
  const ioMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
  const io = new THREE.Mesh(ioGeo, ioMat);
  io.position.set(-1.0, 0.22, -0.5);
  group.add(io);

  // 4 RAM DIMM Slots
  const ramSlotMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
  for (let i = 0; i < 4; i++) {
    const slotGeo = new THREE.BoxGeometry(0.06, 0.12, 1.35);
    const slot = new THREE.Mesh(slotGeo, ramSlotMat);
    slot.position.set(0.55 + i * 0.12, 0.06, -0.4);
    group.add(slot);
  }

  // 2 PCIe x16 Reinforced Slots
  const pcieMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.95, roughness: 0.1 });
  for (let i = 0; i < 2; i++) {
    const pcieGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
    const pcie = new THREE.Mesh(pcieGeo, pcieMat);
    pcie.position.set(-0.1, 0.04, 0.4 + i * 0.7);
    group.add(pcie);
  }

  // M.2 NVMe Heatsinks
  const m2Mat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.8, roughness: 0.3 });
  const m2Geo = new THREE.BoxGeometry(0.85, 0.06, 0.24);
  const m2_1 = new THREE.Mesh(m2Geo, m2Mat);
  m2_1.position.set(0, 0.04, 0.15);
  group.add(m2_1);

  // Chipset Southbridge Heatsink
  const chipsetGeo = new THREE.BoxGeometry(0.65, 0.15, 0.65);
  const chipsetMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.85, roughness: 0.2 });
  const chipset = new THREE.Mesh(chipsetGeo, chipsetMat);
  chipset.position.set(0.65, 0.08, 0.85);
  group.add(chipset);

  return group;
}

// 2. Build CPU Cooler Model (Dual Tower + Fan / Pump)
function createCooler() {
  const group = new THREE.Group();

  // Base copper contact block
  const baseGeo = new THREE.BoxGeometry(0.7, 0.1, 0.7);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.2 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  group.add(base);

  // 6 Heatpipes
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xcc7722, metalness: 0.95, roughness: 0.15 });
  for (let i = -2; i <= 2; i++) {
    const pipeGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 16);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(i * 0.12, 0.6, 0);
    group.add(pipe);
  }

  // Dual aluminum fin stacks
  const finMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.3 });
  for (let f = 0; f < 30; f++) {
    const finGeo = new THREE.BoxGeometry(0.65, 0.015, 0.95);
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(-0.25, 0.25 + f * 0.035, 0);
    group.add(fin);

    const fin2 = new THREE.Mesh(finGeo, finMat);
    fin2.position.set(0.25, 0.25 + f * 0.035, 0);
    group.add(fin2);
  }

  // Central 120mm RGB Fan Frame
  const fanFrameGeo = new THREE.BoxGeometry(0.2, 1.1, 1.1);
  const fanFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const fanFrame = new THREE.Mesh(fanFrameGeo, fanFrameMat);
  fanFrame.position.set(0, 0.75, 0);
  group.add(fanFrame);

  // Rotating Fan Blades hub
  const fanHubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 24);
  const fanHubMat = new THREE.MeshStandardMaterial({ 
    color: 0x06b6d4, 
    emissive: 0x06b6d4, 
    emissiveIntensity: 0.6, 
    metalness: 0.5 
  });
  const fanHub = new THREE.Mesh(fanHubGeo, fanHubMat);
  fanHub.rotation.z = Math.PI / 2;
  fanHub.position.set(0, 0.75, 0);
  group.add(fanHub);

  return group;
}

// 3. Build RAM Module Model (DDR5 Heatspreader with RGB Lightbar)
function createRam() {
  const group = new THREE.Group();

  // PCB Edge Pins (Gold)
  const pinGeo = new THREE.BoxGeometry(0.04, 0.15, 1.35);
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
  const pins = new THREE.Mesh(pinGeo, pinMat);
  pins.position.set(0, 0.075, 0);
  group.add(pins);

  // Matte Black Aluminum Heatspreader
  const spreaderGeo = new THREE.BoxGeometry(0.08, 0.55, 1.4);
  const spreaderMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.35 });
  const spreader = new THREE.Mesh(spreaderGeo, spreaderMat);
  spreader.position.set(0, 0.4, 0);
  group.add(spreader);

  // Geometric cutout ridges
  const ridgeGeo = new THREE.BoxGeometry(0.09, 0.1, 1.2);
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.2 });
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridge.position.set(0, 0.45, 0);
  group.add(ridge);

  // Top Frosted RGB Lightbar
  const rgbGeo = new THREE.BoxGeometry(0.09, 0.08, 1.42);
  const rgbMat = new THREE.MeshStandardMaterial({ 
    color: 0xff007f, 
    emissive: 0xff007f, 
    emissiveIntensity: 0.8, 
    roughness: 0.1 
  });
  const rgb = new THREE.Mesh(rgbGeo, rgbMat);
  rgb.position.set(0, 0.7, 0);
  group.add(rgb);

  return group;
}

// 4. Build M.2 NVMe SSD Model
function createSsd() {
  const group = new THREE.Group();

  // PCB 2280
  const pcbGeo = new THREE.BoxGeometry(0.3, 0.04, 1.1);
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // Gold M.2 connector notch
  const connGeo = new THREE.BoxGeometry(0.28, 0.05, 0.1);
  const connMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95 });
  const conn = new THREE.Mesh(connGeo, connMat);
  conn.position.set(0, 0, -0.52);
  group.add(conn);

  // NAND Flash & Controller Chips
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  for (let i = 0; i < 2; i++) {
    const chipGeo = new THREE.BoxGeometry(0.22, 0.06, 0.28);
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0, 0.04, -0.15 + i * 0.35);
    group.add(chip);
  }

  // Aluminum Graphene Heatsink Label
  const heatGeo = new THREE.BoxGeometry(0.26, 0.03, 0.9);
  const heatMat = new THREE.MeshStandardMaterial({ 
    color: 0x0f172a, 
    metalness: 0.9, 
    roughness: 0.2 
  });
  const heatsink = new THREE.Mesh(heatGeo, heatMat);
  heatsink.position.set(0, 0.07, 0.05);
  group.add(heatsink);

  return group;
}

async function run() {
  console.log('Generating procedural GLB models...');
  await exportToGlb(createMotherboard(), 'motherboard.glb');
  await exportToGlb(createCooler(), 'cooler.glb');
  await exportToGlb(createRam(), 'ram.glb');
  await exportToGlb(createSsd(), 'ssd.glb');
  console.log('All 4 additional GLB models created successfully!');
}

run();
