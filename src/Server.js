const Restify = require('restify')
const Filesystem = require('./Filesystem')

class Server extends Filesystem {
    constructor(options, restify = Restify) {
        super() 

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
        this.server.listen(this.options.port, this.logStart.bind(this))

        return this
    }

    stop() {
        this.server && this.server.close && this.server.close()
    }

    logStart() {
        console.log('%s listening at %s', this.server.name, this.server.url);
    }

    registerMockApiEndpoints(endpoints) {
        endpoints.map(({ method, url, response }) =>
            this.server[method](url, this.mockApiAction.bind(this, response))
        )

        return this
    }

    loadMockApiEndpoints(path) {
        let endpoints = this.isDirectory(path) ? this.loadDirectoryFiles(path) : require(path)

        this.registerMockApiEndpoints(endpoints)

        return this
    }

    mockApiAction(jsonPath, req, res, next) {
        let result = {}

        const parsedJsonPath = this.replacePathParameters(jsonPath, req)

        try {
            result = require(parsedJsonPath)
        } catch (err) {
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

    replacePathParameters(path, { params, query }) {
        const pathParams = this.extractPathParameters(path)
        const reqParams = { ...params, ...query }

        return pathParams.reduce((acc, { placeholder, name }) => reqParams[name] ? acc.replace(placeholder, reqParams[name]) : acc, path)
    }
}

module.exports = Server
