const restify = require('restify')

class Server {
    constructor(port = 8080, name = "Bifrost API Mock Service") {
        this.name = name
        this.port = port
    } 

    setup() {
        this.server = restify.createServer({
            name: this.name
        })
        
        this.server.use(restify.plugins.queryParser())
        this.server.use(restify.plugins.bodyParser())

        return this
    }

    start() {
        this.server.listen(this.port, () => {
            console.log('%s listening at %s', this.server.name, this.server.url);
        })

        return this
    }

    stop() {
        this.server.close()
    }

    extractPathParams(path) {
        const regex = new RegExp(/(:([a-z0-9]*):)/, 'ig')

        let result = []
        let match

        while (match = regex.exec(path)) {
            result.push({ placeholder: match[1], name: match[2] })
        }

        return result
    }

    replacePathPlaceholders(path, {params}) {
        const pathParams = this.extractPathParams(path)

        return pathParams.reduce( (acc, {placeholder, name}) => params[name] ? acc.replace(placeholder, params[name]) : acc, path )
    }
}

module.exports = Server
