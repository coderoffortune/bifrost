const Server = require('../src/Server')

const closeFn = jest.fn()
const bodyParserFn = jest.fn()
const listenFn = jest.fn()
const queryParserFn = jest.fn()
const useFn = jest.fn()

const restify = {
    createServer: () => ({
        close: closeFn,
        listen: listenFn,
        name: '',
        url: '',
        use: useFn,
    }),
    plugins: {
        bodyParser: bodyParserFn,
        queryParser: queryParserFn,
    },
}

const res = {send: jest.fn()}
const next = jest.fn()

console = {
    log: jest.fn(),
    error: jest.fn()
}

describe('Bifrost Server', () => {
    afterEach(() => {
        jest.clearAllMocks();
    })

    test('.setup() should instantiate restify and setup parsers', () => {
        const server = new Server({}, restify)

        server.setup()

        expect(useFn).toHaveBeenCalledTimes(2)
        expect(bodyParserFn).toHaveBeenCalled()
        expect(queryParserFn).toHaveBeenCalled()
    })

    test('.start() should invoke restify listen method', () => {
        const server = new Server({}, restify)

        server.setup().start()

        expect(listenFn).toHaveBeenCalled()
    })

    test('.logStart() should call console.log', () => {
        const server = new Server({}, restify)

        server.setup().start().logStart()

        expect(console.log).toHaveBeenCalledTimes(1)
    })

    test('.stop() should invoke restify close method', () => {
        const server = new Server({}, restify)

        server.setup().stop()

        expect(closeFn).toHaveBeenCalled()
    })

    test('.extractParams() should return the parameter placeholder', () => {
        const server = new Server()

        const path = './data/:filename:.json'

        const params = server.extractPathParams(path)

        expect(Array.isArray(params)).toBe(true)
        expect(params[0].placeholder).toEqual(':filename:')
    })

    test('.extractParams() should return the parameter name', () => {
        const server = new Server()

        const path = './data/:filename:.json'

        const params = server.extractPathParams(path)

        expect(params[0].name).toEqual('filename')
    })

    test('.extractParams() should return both parameters placeholders and names', () => {
        const server = new Server()

        const path = './data/:folder:/:filename:.json'

        const params = server.extractPathParams(path)

        expect(params.length).toEqual(2)
        expect(params[0].placeholder).toEqual(':folder:')
        expect(params[0].name).toEqual('folder')
        expect(params[1].placeholder).toEqual(':filename:')
        expect(params[1].name).toEqual('filename')
    })

    test('.replacePathPlaceholders() should replace a path placeholder with request param', () => {
        const server = new Server()

        const path = './data/:filename:.json'
        const request = {
            params: {
                filename: 'example'
            }
        }

        const parsedPath = server.replacePathPlaceholders(path, request)

        expect(parsedPath).toEqual('./data/example.json')
    })

    test('.replacePathPlaceholders() should replace all path placeholders with request params', () => {
        const server = new Server()

        const path = './data/:folder:/:filename:.json'
        const request = {
            params: {
                folder: 'bar',
                filename: 'foo'
            }
        }

        const parsedPath = server.replacePathPlaceholders(path, request)

        expect(parsedPath).toEqual('./data/bar/foo.json')
    })

    test('.replacePathPlaceholders() should leave path placeholders that are not in the request params', () => {
        const server = new Server()

        const path = './data/:folder:/:filename:.json'
        const request = {
            params: {
                folder: 'bar'
            }
        }

        const parsedPath = server.replacePathPlaceholders(path, request)

        expect(parsedPath).toEqual('./data/bar/:filename:.json')
    })

    test('.mockApiAction() should return the data inside the desired json file', () => {
        const server = new Server()
        const mockData = require('./data/mock_response.json')
        const req = {}
        
        server.mockApiAction(req, res, next, '../tests/data/mock_response.json')

        expect(res.send).toHaveBeenCalledWith(mockData)
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('.mockApiAction() should return empty data when the json file doesn\'t exists', () => {
        const server = new Server()
        const req = {}
        
        server.mockApiAction(req, res, next, '../tests/data/mock_responsee.json')

        expect(res.send).toHaveBeenCalledWith({})
    })

    test('.mockApiAction() should log the error when the json file doesn\'t exists', () => {
        const server = new Server()
        const req = {}
        
        server.mockApiAction(req, res, next, '../tests/data/mock_responsee.json')

        expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('.mockApiAction() should return the data inside the desired json file using parametric path', () => {
        const server = new Server()
        const mockData = require('./data/mock_response.json')
        const req = {
            params: {
                responseType: 'mock'
            }
        }
        
        server.mockApiAction(req, res, next, '../tests/data/:responseType:_response.json')

        expect(res.send).toHaveBeenCalledWith(mockData)
    })
})
