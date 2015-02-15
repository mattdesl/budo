var spawn = require('npm-execspawn')

//Runs watchify with given args, returns process
module.exports = function(watchifyArgs) {
    var cmd = ['watchify']
        .concat(watchifyArgs||'')
        .join(' ')
    
    var proc = spawn(cmd)
    proc.stderr.on('data', function(err) {
        process.stderr.write(err.toString())
    })

    var hasClosed = false
    process.on('close', handleClose)
    process.on('exit', handleClose)
    
    return proc

    function handleClose() {
        if (hasClosed) return
        hasClosed = true
        proc.kill()   
    }
}