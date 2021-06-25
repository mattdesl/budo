/* globals Image */
import createLoop from 'canvas-loop'
import createContext from '2d-context'


const context = createContext() as CanvasRenderingContext2D
const canvas = context.canvas as HTMLCanvasElement

type IApp = ReturnType<typeof createLoop> & Partial<NodeJS.EventEmitter> & {
  shape?: [ width: number, height: number ],
  scale?: any
}

const app: IApp = createLoop(canvas, {
  scale: window.devicePixelRatio
})
document.body.appendChild(canvas)

const img = new Image()
img.onload = () => app.start()
img.src = 'baboon.png'

let time = 0

app.on('tick', (dt) => {
  const [ width, height ] = app.shape
  context.clearRect(0, 0, width, height)

  time += dt / 1000

  context.save()
  context.scale(app.scale, app.scale)
  context.fillRect(Math.sin(time) * 50 + 300, 50, 20, 40)
  context.fillText('from browserify with typescript!', 40, 40)
  context.drawImage(img, 50, 50)
  context.restore()
})
