const fs = require('fs')
const path = require('path')
const Restify = require('restify')
const Filesystem = require('./Filesystem')
const Logger = require('./Logger')

class Server extends Filesystem {
    constructor(options, logger, restify = Restify) {
        super() 

        const defaultOptions = {
            port: 8082,
            name: 'API Mock Service',
            baseDir: ''
        }

        this.options = Object.assign(defaultOptions, options)
        this.restify = restify
        this.logger = logger || new Logger()
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

    registerFakeApiEndpoints(endpoints) {
        endpoints.forEach(endpoint => {
            this.server[endpoint.method](endpoint.url, endpoint.action)
        })
    }

    registerMockApiEndpoints(endpoints) {
        endpoints.map(({ method, url, response, notFoundResponse, replaces }) =>
            this.server[method](url, this.mockApiAction.bind(this, response, notFoundResponse, replaces))
        )

        return this
    }

    loadMockApiEndpoints(endpointsPath) {
        endpointsPath = path.join(this.options.baseDir, endpointsPath)
        let endpoints = this.isDirectory(endpointsPath) ? this.loadDirectoryFiles(endpointsPath) : require(endpointsPath)

        this.registerMockApiEndpoints(endpoints)

        return this
    }

    mockApiAction(jsonPath, notFoundResponse, replaces, req, res, next) {
        jsonPath = path.join(this.options.baseDir, jsonPath)

        let result = {}
        let parsedJsonPath = this.replacePathParameters(jsonPath, req, replaces)

        try {
            if (!fs.existsSync(parsedJsonPath) && notFoundResponse) {
                this.logger.info('Response not found for', req.url, '-->', jsonPath, 'parsed as:', parsedJsonPath)

                parsedJsonPath = path.join(this.options.baseDir, notFoundResponse)
            }

            result = require(parsedJsonPath)
        } catch (err) {
            switch(err['code']) {
                case 'MODULE_NOT_FOUND':
                    this.logger.error('Response not found for', req.url, '-->', jsonPath, 'parsed as:', parsedJsonPath)
                    break;

                default:
                    this.logger.error('Generic error:', err)
            }
        }

        res.send(result)

        next()
    }

    extractPathParameters(path) {
        const regex = new RegExp(/(:([a-z0-9]*):)/, 'ig')

        let result = []
        let match

        while (match = regex.exec(path)) {
            const name = match[2] === 'wildcard' ? '*' : match[2]

            result.push({ placeholder: match[1], name })
        }

        return result
    }

    replacePathParameters(path, { params, query }, replaces = []) {
        const pathParams = this.extractPathParameters(path)
        const reqParams = { ...params, ...query }
       
        Object.keys(reqParams).forEach( paramKey => 
            replaces.forEach( replaceRule => {
                if (replaceRule.param === paramKey || replaceRule.param === "") {
                    const regex = new RegExp(replaceRule.regex)

                    reqParams[paramKey] = reqParams[paramKey].replace(regex, replaceRule.newValue)
                }
            })
        )

        return pathParams.reduce((acc, { placeholder, name }) => reqParams[name] ? acc.replace(placeholder, reqParams[name]) : acc, path)
    }
}

module.exports = Server
