const Restify = require('restify')

class Server {
    constructor(options, restify = Restify) {
        const defaultOptions = {
            port: 8080, 
            name: 'Bifrost API Mock Service'
        }

        this.options = Object.assign(defaultOptions, options)
        this.restify = restify
    } 

    setup() {
        this.server = this.restify.createServer({
            name: this.options.name
        })
        
        this.server.use(this.restify.plugins.queryParser())
        this.server.use(this.restify.plugins.bodyParser())

        return this
    }

    start() {
        this.server.listen(this.options.port, this.logStart)

        return this
    }

    stop() {
        this.server && this.server.close && this.server.close()
    }

    logStart() {
        console.log('%s listening at %s', this.server.name, this.server.url);
    }

    registerMockApiEndpoints(endpoints) {
        endpoints = Array.isArray(endpoints) ? endpoints : require(endpoints)

        endpoints.map( ({method, url, response}) => 
            this.server[method](url, (req, res, next) => this.mockApiAction(req, res, next, response))    
        )

        return this
    }

    mockApiAction(req, res, next, jsonPath) {
        let result = {}

        const parsedJsonPath = this.replacePathParameters(jsonPath, req)

        try {
            result = require(parsedJsonPath)
        } catch(err) {
            console.error(err)
        }

        res.send(result)

        next()
    }

    extractPathParameters(path) {
        const regex = new RegExp(/(:([a-z0-9]*):)/, 'ig')

        let result = []
        let match

        while (match = regex.exec(path)) {
            result.push({ placeholder: match[1], name: match[2] })
        }

        return result
    }

    replacePathParameters(path, {params}) {
        const pathParams = this.extractPathParameters(path)

        return pathParams.reduce( (acc, {placeholder, name}) => params[name] ? acc.replace(placeholder, params[name]) : acc, path )
    }
}

module.exports = Server
