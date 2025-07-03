const video = document.getElementById('video');
const overlay = document.getElementById('coiffeOverlay');
const logo = document.getElementById('logoOverlay');
const capturedPhoto = document.getElementById('capturedPhoto');
const countdownElement = document.getElementById('countdown');
const button = document.getElementById('snap');
const actionButtons = document.getElementById('actionButtons');
const shutterSound = document.getElementById('shutterSound');

document.getElementById('actionButtons').style.display = 'none';

// Initialiser la caméra
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => alert("Problème caméra : " + err));

// Gestion du carousel
const coiffes = ['coiffe1.png', 'coiffe2.png', 'coiffe3.png', 'coiffe4.png', 'coiffe5.png','coiffe6.png', 'coiffe7.png','coiffe8.png'];
let currentIndex = 0;

// Changer la coiffe en cliquant
function selectCoiffeHighlight(element, coiffeFile) {
  overlay.src = 'coiffes/' + coiffeFile;

  // retirer la selection des autres coiffes
  document.querySelectorAll('.carousel img').forEach(img => img.classList.remove('selected'));

  // ajouter sur l'image cliquée
  element.classList.add('selected');
}


// Countdown avec son
function startCountdown() {
  let countdown = 5;
  button.style.display = 'none';
  countdownElement.style.display = 'block';
  countdownElement.innerText = countdown;

  let interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownElement.innerText = countdown;
    } else {
      clearInterval(interval);
      countdownElement.style.display = 'none';
      shutterSound.play();
      takePhoto();
    }
  }, 1000);
}



function takePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');

  // ratio vidéo vs canvas
  const videoRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (videoRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = videoRatio * drawHeight;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / videoRatio;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  }

  // dessiner la vidéo
  ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

  // calculer les dimensions de la coiffe
  const photoboothBox = document.getElementById('photobooth').getBoundingClientRect();
  const overlayBox = overlay.getBoundingClientRect();
  const scaleX = canvas.width / photoboothBox.width;
  const scaleY = canvas.height / photoboothBox.height;

  const overlayX = (overlayBox.left - photoboothBox.left) * scaleX;
  const overlayY = (overlayBox.top - photoboothBox.top) * scaleY;
  const overlayWidth = overlayBox.width * scaleX;
  const overlayHeight = overlayBox.height * scaleY;

  // dessiner la coiffe avec transparence et halo sombre
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(overlay, overlayX, overlayY, overlayWidth, overlayHeight);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  const logoWidth = 60;
  const logoHeight = logo.height / logo.width * logoWidth;
  const x = canvas.width - logoWidth - 10;
  const y = canvas.height - logoHeight - 10;


// dessiner un cercle flou lumineux derrière le logo
ctx.save();
ctx.beginPath();
ctx.arc(x + logoWidth / 2, y + logoHeight / 2, 35, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
ctx.shadowColor = 'rgba(255, 255, 255, 1)';
ctx.shadowBlur = 30;
ctx.fill();
ctx.closePath();
ctx.restore();

// puis dessiner un petit cercle blanc opaque pour mieux contraster
ctx.save();
ctx.beginPath();
ctx.shadowBlur = 0; // très important
ctx.arc(x + logoWidth / 2, y + logoHeight / 2, 30, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
ctx.fill();
ctx.closePath();
ctx.restore();

// enfin le logo parfaitement net par dessus
ctx.save();
ctx.shadowBlur = 0; // sécurité pour être net
ctx.drawImage(logo, x, y, logoWidth, logoHeight);
ctx.restore();


  // afficher la photo capturée
  capturedPhoto.src = canvas.toDataURL("image/png");
  capturedPhoto.style.display = "block";

  // masquer le live
  video.style.display = 'none';
  overlay.style.display = 'none';
  logo.style.display = 'none';

  document.getElementById('loadingMessage').style.display = 'block';

  // lancer l'upload
  uploadToImgbb(capturedPhoto.src);
}

// Upload vers Imgbb
function uploadToImgbb(dataURL) {
  console.log("Uploading to Imgbb...");
  const formData = new FormData();
  formData.append('image', dataURL.split(',')[1]);

  fetch('https://api.imgbb.com/1/upload?key=1a8b2e207d88f1166ae1f57c0e48ab23', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    console.log("Imgbb result:", result);
    if (result.data && result.data.url) {
      showShareOptions(result.data.url);
    } else {
      alert('Erreur upload : ' + JSON.stringify(result));
    }
  })
  .catch(err => {
    alert("Erreur upload : " + err);
    console.error("Upload failed:", err);
  });
}

// Afficher QR code + bouton Réessayer
function showShareOptions(imageUrl) {
  actionButtons.style.display = 'flex';

  // Vider l'ancien QR code pour éviter l'empilement
  const qrcodeContainer = document.getElementById("qrcode");
  qrcodeContainer.innerHTML = '';

  // Afficher le container stylé
  document.getElementById('qrcodeContainer').style.display = 'flex';

  // Générer le nouveau QR code
  new QRCode(qrcodeContainer, {
    text: imageUrl,
    width: 128,
    height: 128
  });

  document.getElementById('loadingMessage').style.display = 'none';
}


// Réessayer
function retryPhoto() {
  capturedPhoto.style.display = 'none';
  video.style.display = 'block';
  overlay.style.display = 'block';
  logo.style.display = 'block';
  actionButtons.style.display = 'none';
  button.style.display = 'block';

  // Cacher et nettoyer le QR code
  document.getElementById('qrcodeContainer').style.display = 'none';
  document.getElementById('qrcode').innerHTML = '';
}

// Au démarrage
window.onload = function() {
  updateCoiffe();
  logo.src = 'images/logo_latraverse.png';
};


// const video = document.getElementById('video');
// const overlay = document.getElementById('coiffeOverlay');
// const logo = document.getElementById('logoOverlay');
// const hashtag = document.getElementById('hashtagOverlay');
// const capturedPhoto = document.getElementById('capturedPhoto');
// const countdownElement = document.getElementById('countdown');
// const button = document.getElementById('snap');
// const actionButtons = document.getElementById('actionButtons');
// const shutterSound = document.getElementById('shutterSound');



// document.getElementById('actionButtons').style.display = 'none';

// // Initialiser la caméra
// navigator.mediaDevices.getUserMedia({ video: true })
//   .then(stream => video.srcObject = stream)
//   .catch(err => alert("Problème caméra : " + err));

// // Changer la coiffe
// function selectCoiffe(coiffeFile) {
//   overlay.src = 'coiffes/' + coiffeFile;
// }

// const coiffes = ['coiffe1.png', 'coiffe2.png', 'coiffe3.png', 'coiffe4.png', 'coiffe5.png','coiffe6.png'];
// let currentIndex = 0;

// function updateCoiffe() {
//   document.getElementById('coiffeOverlay').src = 'coiffes/' + coiffes[currentIndex];
//   document.getElementById('currentCoiffe').src = 'coiffes/' + coiffes[currentIndex];
// }

// function nextCoiffe() {
//   currentIndex = (currentIndex + 1) % coiffes.length;
//   updateCoiffe();
// }

// function prevCoiffe() {
//   currentIndex = (currentIndex - 1 + coiffes.length) % coiffes.length;
//   updateCoiffe();
// }


// // Countdown avec son
// function startCountdown() {
//   let countdown = 5;
//   button.style.display = 'none';
//   countdownElement.style.display = 'block';
//   countdownElement.innerText = countdown;

//   let interval = setInterval(() => {
//     countdown--;
//     if (countdown > 0) {
//       countdownElement.innerText = countdown;
//     } else {
//       clearInterval(interval);
//       countdownElement.style.display = 'none';
//       shutterSound.play();
//       takePhoto();
//     }
//   }, 1000);
// }

// function takePhoto() {
//   const canvas = document.createElement('canvas');
//   canvas.width = 360;
//   canvas.height = 450;
//   const ctx = canvas.getContext('2d');

//   // ratio vidéo vs canvas
//   const videoRatio = video.videoWidth / video.videoHeight;
//   const canvasRatio = canvas.width / canvas.height;

//   let drawWidth, drawHeight, offsetX, offsetY;
//   if (videoRatio > canvasRatio) {
//     drawHeight = canvas.height;
//     drawWidth = videoRatio * drawHeight;
//     offsetX = (canvas.width - drawWidth) / 2;
//     offsetY = 0;
//   } else {
//     drawWidth = canvas.width;
//     drawHeight = drawWidth / videoRatio;
//     offsetX = 0;
//     offsetY = (canvas.height - drawHeight) / 2;
//   }

//   // dessiner la vidéo
//   ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

//   // dessiner la coiffe à la bonne taille
//   const photoboothBox = document.getElementById('photobooth').getBoundingClientRect();
//   const overlayBox = overlay.getBoundingClientRect();

//   const scaleX = canvas.width / photoboothBox.width;
//   const scaleY = canvas.height / photoboothBox.height;

//   const overlayX = (overlayBox.left - photoboothBox.left) * scaleX;
//   const overlayY = (overlayBox.top - photoboothBox.top) * scaleY;
//   const overlayWidth = overlayBox.width * scaleX;
//   const overlayHeight = overlayBox.height * scaleY;

//   ctx.drawImage(overlay, overlayX, overlayY, overlayWidth, overlayHeight);

//   // logo en bas à droite
//   if (logo.complete) {
//     ctx.drawImage(logo, canvas.width - 70, canvas.height - 40, 60, 30);
//   }

//   // hashtag texte en bas centre
//   ctx.font = "20px cursive";
//   ctx.fillStyle = "white";
//   ctx.textAlign = "center";
//   ctx.fillText("#LaTraverseDécoiffe", canvas.width / 2, canvas.height - 10);

//   // afficher la photo capturée
//   capturedPhoto.src = canvas.toDataURL("image/png");
//   capturedPhoto.style.display = "block";

//   // masquer le live
//   video.style.display = 'none';
//   overlay.style.display = 'none';
//   logo.style.display = 'none';

//   document.getElementById('loadingMessage').style.display = 'block';

//   // upload
//   uploadToImgbb(capturedPhoto.src);
// }


// // Upload vers Imgbb
// function uploadToImgbb(dataURL) {
//   const formData = new FormData();
//   formData.append('image', dataURL.split(',')[1]);

//   fetch('https://api.imgbb.com/1/upload?key=1a8b2e207d88f1166ae1f57c0e48ab23', {
//     method: 'POST',
//     body: formData
//   })
//   .then(response => response.json())
//   .then(result => {
//     if (result.data && result.data.url) {
//       showShareOptions(result.data.url);
//     } else {
//       alert('Erreur upload : ' + JSON.stringify(result));
//     }
//   })
//   .catch(err => alert("Erreur upload : " + err));
// }

// // Afficher QR code + bouton
// function showShareOptions(imageUrl) {
//   actionButtons.innerHTML = `
//     <button onclick="retryPhoto()">Réessayer</button>
//     <div id="qrcode"></div>
//   `;

//   new QRCode(document.getElementById("qrcode"), {
//     text: imageUrl,
//     width: 128,
//     height: 128
//   });

//   actionButtons.style.display = 'flex';
//   document.getElementById('loadingMessage').style.display = 'none';
// }

// // Relancer la prise
// function retryPhoto() {
//   capturedPhoto.style.display = 'none';
//   video.style.display = 'block';
//   overlay.style.display = 'block';
//   logo.style.display = 'block';
//   hashtag.style.display = 'block';
//   actionButtons.style.display = 'none';
//   button.style.display = 'block';
// }

// // Charger la première coiffe et logo au démarrage
// window.onload = function() {
//   selectCoiffe('coiffe1.png');
//   logo.src = 'images/logo_latraverse.png';
// };
