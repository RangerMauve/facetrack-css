/* global faceapi */
import './face-api.js'

//const FPS = 0.25
const FPS = 20
const NOSE_POINT = 33
const CHIN_POINT = 8

run()

function $ (query) {
  return document.querySelector(query)
}

async function run () {
  const video = $('#video')
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { height: 360 } })

  console.log('got stream', stream)
  video.srcObject = stream

  await faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models')
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models')

  console.log('Loaded Models')
  const input = video

  const outline = $('#outline')
  const nose = $('#nose')
  const chin = $('#chin')
  const content = $('#content')

  await delay(1000)

  while (true) {
    //console.log('Detecting video')
    const detectionsWithLandmarks = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)

    // console.log({ detectionsWithLandmarks })

    if (!detectionsWithLandmarks) {
      outline.style = ''
      continue
    }

    const { alignedRect, landmarks } = detectionsWithLandmarks

    const { top, left, width, height } = alignedRect.box
    const { imageWidth, imageHeight } = alignedRect

    outline.style = `
top: ${top}px;
left: ${left}px;
width: ${width}px;
height: ${height}px;
`
    // Positions can be found here: https://www.pyimagesearch.com/wp-content/uploads/2017/04/facial_landmarks_68markup.jpg
    const noseTip = landmarks.positions[NOSE_POINT]
    nose.style = `top: ${noseTip.y}px; left: ${noseTip.x}px`

    const chinTip = landmarks.positions[CHIN_POINT]
    chin.style = `top: ${chinTip.y}px; left: ${chinTip.x}px`

    const rotation = angleBetween(noseTip, chinTip)
    const offsetX = - (left + width / 2 - imageWidth/2) / imageWidth * 100
    const offsetY = (top + height / 2 - imageHeight/2) / imageHeight * 100

    const contentStyle = `transform:
      translate(${offsetX}%, ${offsetY}%)
      rotateZ(${180 - rotation + 90}deg);
    `

    content.style = contentStyle

    await delay(1000 / FPS)
  }
}

// Based on this stack overflow question
// https://stackoverflow.com/questions/15888180/calculating-the-angle-between-points
function angleBetween (point1, point2) {
  const dy = point1.y - point2.y
  const dx = point1.x - point2.x
  let theta = Math.atan2(dy, dx) // range (-PI, PI]
  theta *= 180 / Math.PI // rads to degs, range (-180, 180]
  // if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta
}

function delay (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
