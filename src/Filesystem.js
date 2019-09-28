const fs = require('fs')
const path = require('path')

class Filesystem {
    constructor() {
        this.fs = fs
        this.path = path
    }

    loadDirectoryFiles(dir, filelist) {
        filelist = filelist || []

        this.fs.readdirSync(dir).forEach(file => {
            const filePath = this.path.join(dir, file)

            if (this.fs.statSync(filePath).isDirectory()) {
                filelist = this.loadDirectoryFiles(filePath, filelist)
            } else {
                filelist.push(require(filePath))
            }
        })

        return filelist
    }

    isDirectory(path) {
        return this.fs.statSync(path).isDirectory()
    }
}

module.exports = Filesystem
