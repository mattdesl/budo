require('canvas-testbed')(render)

var img = new Image()
img.src = 'baboon.png'

function render(ctx, width, height) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillRect(10, 15, 250, 250) 
    ctx.fillText("foo taada!", 40, 40)
    if (img.width > 0 || img.height > 0)
        ctx.drawImage(img, 50, 50)
}