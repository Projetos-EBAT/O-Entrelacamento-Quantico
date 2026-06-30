// =======================================================
// ANIMAÇÃO FUTURISTA: TERRA + CONTINENTES -> MAPA SVG RJ
// =======================================================

let faseAtual = 0; // 0: Terra, 1: Zoom Cinematográfico, 2: Mapa Pulsando
let progressoZoom = 0;
// Inicia a rotação de lado para que o Brasil venha surgindo na tela
let anguloTerra = -1.5; 

// DADOS GEOGRÁFICOS DO RIO DE JANEIRO
let raioTerra = 160;
let latRJ = -22.9; // Latitude real do RJ
let lonRJ = -43.2; // Longitude real do RJ

// Converte a Latitude e Longitude para as coordenadas X, Y, Z da esfera 3D
let theta = latRJ * (Math.PI / 180);
let phi = lonRJ * (Math.PI / 180) + Math.PI; 
let rioX = raioTerra * Math.cos(theta) * Math.sin(phi);
let rioY = -raioTerra * Math.sin(theta);
let rioZ = raioTerra * Math.cos(theta) * Math.cos(phi);

let mapaText = []; 
let mouseNoMapa = false;
let escalaPulso = 1;
let imgTerra;

function preload() {
  // Carrega a textura da Terra
  imgTerra = loadImage(
    'terra.jpg',
    () => console.log("Textura da Terra carregada com sucesso!"),
    (err) => {
      console.error("Erro ao carregar terra.jpg", err);
    }
  );

  // Carrega o SVG convertido em texto
  loadStrings(
    'mapa_Rio.html',
    (lines) => {
      mapaText = lines;
      console.log("Mapa carregado.");
    },
    (err) => {
      console.error("Erro ao carregar mapa_Rio.html", err);
      mapaText = [];
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  if (mapaText && mapaText.length > 0) {
    let htmlStr = mapaText.join('\n');
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlStr;
    let svgElement = tempDiv.querySelector('svg');
    
    if (svgElement) {
      svgElement.id = 'mapa-rj-svg'; 
      
      let mapaContainer = document.createElement('div');
      mapaContainer.style.position = 'absolute';
      mapaContainer.style.top = '0';
      mapaContainer.style.left = '0';
      mapaContainer.style.width = '100vw';
      mapaContainer.style.height = '100vh';
      mapaContainer.style.overflow = 'hidden'; 
      mapaContainer.style.pointerEvents = 'none'; 
      
      svgElement.style.position = 'absolute';
      svgElement.style.transformOrigin = 'center center';
      
      // AJUSTE DE TAMANHO: Começa pequeno no globo e fica GIGANTE no zoom
      svgElement.style.width = '400px'; 
      svgElement.style.height = 'auto';
      svgElement.style.opacity = '0';
      svgElement.style.transition = 'opacity 0.8s ease'; 
      svgElement.style.willChange = 'transform, left, top';
      
      mapaContainer.appendChild(svgElement);
      document.body.appendChild(mapaContainer);

      let cssMapaStyle = document.createElement('style');
      cssMapaStyle.innerHTML = `
        #mapa-rj-svg path {
          fill: rgba(20, 5, 40, 0.4) !important; 
          stroke: rgba(160, 80, 255, 0.8) !important;
          stroke-width: 1px !important;
          transition: all 0.3s ease;
          cursor: pointer;
          pointer-events: auto;
        }
        #mapa-rj-svg path:hover {
          fill: rgba(200, 100, 255, 0.7) !important;
          stroke: #ffffff !important;
          stroke-width: 2px !important;
          filter: drop-shadow(0px 0px 15px rgba(255, 200, 255, 1));
        }
      `;
      document.head.appendChild(cssMapaStyle);

      let paths = svgElement.querySelectorAll('path');
      paths.forEach(p => {
        p.addEventListener('mouseenter', () => mouseNoMapa = true);
        p.addEventListener('mouseleave', () => mouseNoMapa = false);
      });
    }
  }
}

function draw() {
  background(10, 5, 25);

  if (faseAtual === 0) {
    anguloTerra += 0.005; // Planeta girando
  } 
  else if (faseAtual === 1) {
    progressoZoom += 0.012;
    if (progressoZoom >= 1) {
      faseAtual = 2;
      progressoZoom = 1;
    }
    anguloTerra += 0.0003; // Gira quase parando durante o zoom
  } 
  else if (faseAtual === 2) {
    anguloTerra += 0.0001;
  }

  desenharTerra();
  atualizarPosicaoMapa();
}

// --------------------------------------------------------
// DESENHO E ANIMAÇÃO DO PLANETA COM CONTINENTES
// --------------------------------------------------------
function desenharTerra() {
  push();
  
  let pZoom = faseAtual >= 1 ? progressoZoom : 0;
  let escalaAtual = lerp(1, 15, Math.pow(pZoom, 3));
  if (faseAtual >= 1) scale(escalaAtual);

  rotateY(anguloTerra);
  rotateX(PI / 6);

  // O Zoom puxa a câmera perfeitamente para a coordenada do Rio de Janeiro
  if (faseAtual >= 1) {
    translate(lerp(0, -rioX, Math.pow(pZoom, 2)), lerp(0, -rioY, Math.pow(pZoom, 2)), lerp(0, -rioZ, Math.pow(pZoom, 2)));
  }

  let alpha = faseAtual >= 1 ? lerp(255, 0, Math.pow(pZoom, 2)) : 255;

  // DESENHA A ESFERA COM O MAPA DA TERRA
  push();
  // Se a imagem existir, aplica a textura. Se não, pinta de escuro.
  if (imgTerra && imgTerra.width > 0) {
    noStroke();
    tint(100, 130, 255, alpha); // Filtro holográfico azul/roxo
    texture(imgTerra);
  } else {
    fill(20, 10, 40, alpha);
  }
  sphere(raioTerra - 1, 48, 48);
  pop();

  // DESENHA O WIREFRAME POR CIMA PARA MANTER O ESTILO
  noFill();
  let pesoLinha = faseAtual >= 1 ? 0.8 / escalaAtual : 0.8;
  
  stroke(180, 100, 255, alpha * 0.5);
  strokeWeight(pesoLinha);
  sphere(raioTerra, 24, 24);

  stroke(100, 200, 255, alpha * 0.2);
  strokeWeight(pesoLinha * 0.5);
  sphere(raioTerra + 5, 16, 16);
  pop();
}

// --------------------------------------------------------
// RASTREAMENTO DO SVG E GATILHO AUTOMÁTICO DE ZOOM
// --------------------------------------------------------
function atualizarPosicaoMapa() {
  let svgEl = document.getElementById('mapa-rj-svg');
  if (!svgEl) return;

  let pZoom = faseAtual >= 1 ? progressoZoom : 0;
  
  let vx = rioX;
  let vy = rioY;
  let vz = rioZ;

  if (faseAtual >= 1) {
    vx += lerp(0, -rioX, Math.pow(pZoom, 2));
    vy += lerp(0, -rioY, Math.pow(pZoom, 2));
    vz += lerp(0, -rioZ, Math.pow(pZoom, 2));
  }

  let cosX = Math.cos(PI / 6);
  let sinX = Math.sin(PI / 6);
  let y1 = vy * cosX - vz * sinX;
  let z1 = vy * sinX + vz * cosX;
  vy = y1;
  vz = z1;

  let cosY = Math.cos(anguloTerra);
  let sinY = Math.sin(anguloTerra);
  let x2 = vx * cosY + vz * sinY;
  let z2 = -vx * sinY + vz * cosY;
  vx = x2;
  vz = z2;

  let escalaAtual = lerp(1, 15, Math.pow(pZoom, 3));
  if (faseAtual >= 1) {
    vx *= escalaAtual;
    vy *= escalaAtual;
    vz *= escalaAtual;
  }

  let camZ = (height / 2.0) / Math.tan(PI / 6.0);
  let fator = camZ / (camZ - vz); 
  
  let sx = vx * fator + (width / 2);
  let sy = vy * fator + (height / 2);

  // GATILHO: Aciona o zoom quando o Rio cruza o meio da tela (vx = 0)
  if (faseAtual === 0 && vz > 0 && vx > -2 && vx < 2) {
    faseAtual = 1; 
  }

  // Define a escala do SVG (0.05 no globo = pequeno; 1.8 no zoom = Ocupa a tela)
  let escalaGlobo = 0.05; 
  let escalaFoco = 1.8;   

  if (faseAtual === 0) {
    if (vz > 0) {
      svgEl.style.opacity = '0.6'; 
    } else {
      svgEl.style.opacity = '0'; 
    }
    svgEl.style.left = sx + 'px';
    svgEl.style.top = sy + 'px';
    svgEl.style.transform = `translate(-50%, -50%) scale(${escalaGlobo})`;
  } 
  else if (faseAtual === 1) {
    svgEl.style.opacity = lerp(0.6, 1, progressoZoom);
    svgEl.style.left = sx + 'px';
    svgEl.style.top = sy + 'px';
    let currentScale = lerp(escalaGlobo, escalaFoco, Math.pow(progressoZoom, 3));
    svgEl.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
  } 
  else if (faseAtual === 2) {
    svgEl.style.opacity = '1';
    svgEl.style.left = sx + 'px';
    svgEl.style.top = sy + 'px';

    if (!mouseNoMapa) {
      escalaPulso = escalaFoco + Math.sin(frameCount * 0.05) * 0.04;
    } else {
      escalaPulso = lerp(escalaPulso, escalaFoco, 0.1);
    }
    svgEl.style.transform = `translate(-50%, -50%) scale(${escalaPulso})`;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}