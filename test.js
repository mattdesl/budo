require('canvas-testbed')(render)

function render(ctx, width, height) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillRect(0, 0, 150, 100)
    // ctx.fillRect(50, 50, 50, 50)
}