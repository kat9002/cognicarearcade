//import Firebase libraries needed to connect to database
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, child, get} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

//configuration for Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCIIIWf-HcWXVOqqD82mcxy-3Xx3AtgDcc",
    authDomain: "facerecognitiontestdb.firebaseapp.com",
    databaseURL: "https://facerecognitiontestdb-default-rtdb.firebaseio.com",
    projectId: "facerecognitiontestdb",
    storageBucket: "facerecognitiontestdb.appspot.com",
    messagingSenderId: "733228864305",
    appId: "1:733228864305:web:adba281c0d53a7709bd610"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  
  //Retrieving Firebase Database to retrieve the labels for the uploaded users
  const getDB = getDatabase();

  //Accessing Firebase Storage to retrieve the images of users
  const storage = getStorage();


const video = document.getElementById("video");

    const labels = [];
    const dTokens = [];

    const dbRef = ref(getDB);
    get(child(dbRef, 'username')).then((snapshot)=>{
        var data = snapshot.val();
        for(let i in data){

            labels.push(data[i].replaceAll('"', '')); 

            get(child(dbRef, data[i].replaceAll('"', ''))).then((snapshot)=>{
            var data2 = snapshot.val();
            for(let i in data2){
    
                dTokens.push(data2[i].replaceAll('"', ''));           
            }
            console.log(dTokens)
        })          
        }
    })
    

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("./weights"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./weights"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./weights"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}



function getLabeledFaceDescriptions() {

    

  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
        var a = label;
        var token = dTokens[labels.indexOf(label)];

        var file = `https://firebasestorage.googleapis.com/v0/b/facerecognitiontestdb.appspot.com/o/${label.replaceAll(' ', '%20')}%2F1.jpg?alt=media&token=`+token
        
        console.log(token)
        console.log(file)
        const img = await faceapi.fetchImage(file);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
        
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
      
    })
  );
}

video.addEventListener("play", async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result,
      });
      drawBox.draw(canvas);
    });
  }, 100);
});
