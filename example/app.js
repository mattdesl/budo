var dpr = window.devicePixelRatio||1
var ctx = require('2d-context')()
var fit = require('canvas-fit')(ctx.canvas, window, dpr)

//setup canvas DOM state
window.addEventListener('resize', fit, false)
require('domready')(function() {
    fit()
    document.body.appendChild(ctx.canvas)
})

var img = new Image()
img.src = 'baboon.png'
var time = 0

require('raf-loop')(function(dt) {
    var width = ctx.canvas.width,
        height = ctx.canvas.height
    ctx.clearRect(0, 0, width, height)

    time += dt/1000

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.fillRect(Math.sin(time)*50 + 300, 200, 50, 25) 
    ctx.fillText("from browserify!", 40, 40)
    if (img.width > 0 || img.height > 0)
        ctx.drawImage(img, 50, 50)
    ctx.restore()
}).start()