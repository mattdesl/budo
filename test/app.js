require('canvas-testbed')(render)

var img = new Image()
img.src = 'baboon.png'

var time = 0

function render(ctx, width, height, dt) {
    time += dt/1000
    ctx.clearRect(0, 0, width, height)
    ctx.fillRect(Math.sin(time)*50 + 100, 15, 250, 250) 
    ctx.fillText("foo taada!", 40, 40)
    if (img.width > 0 || img.height > 0)
        ctx.drawImage(img, 250, 50)
}