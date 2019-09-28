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

describe('Bifrost Server', () => {
    afterEach(() => {
        jest.clearAllMocks();
    })

    test('.setup() should instantiate restify and setup parsers', () => {
        let server = new Server({}, restify)

        server.setup()

        expect(useFn).toHaveBeenCalledTimes(2)
        expect(bodyParserFn).toHaveBeenCalled()
        expect(queryParserFn).toHaveBeenCalled()
    })

    test('.start() should invoke restify listen method', () => {
        let server = new Server({}, restify)

        server.setup().start()

        expect(listenFn).toHaveBeenCalled()
    })

    test('.logStart() should call console.log', () => {
        let server = new Server({}, restify)

        const consoleLog = console.log
        console.log = jest.fn()

        server.setup().start().logStart()

        expect(console.log).toHaveBeenCalled()

        console.log = consoleLog
    })

    test('.stop() should invoke restify close method', () => {
        let server = new Server({}, restify)

        server.setup().stop()

        expect(closeFn).toHaveBeenCalled()
    })

    test('.extractParams() should return the parameter placeholder', () => {
        let server = new Server()

        const path = './data/:filename:.json'

        const params = server.extractPathParams(path)

        expect(Array.isArray(params)).toBe(true)
        expect(params[0].placeholder).toEqual(':filename:')
    })

    test('.extractParams() should return the parameter name', () => {
        let server = new Server()

        const path = './data/:filename:.json'

        const params = server.extractPathParams(path)

        expect(params[0].name).toEqual('filename')
    })

    test('.extractParams() should return both parameters placeholders and names', () => {
        let server = new Server()

        const path = './data/:folder:/:filename:.json'

        const params = server.extractPathParams(path)

        expect(params.length).toEqual(2)
        expect(params[0].placeholder).toEqual(':folder:')
        expect(params[0].name).toEqual('folder')
        expect(params[1].placeholder).toEqual(':filename:')
        expect(params[1].name).toEqual('filename')
    })

    test('.replacePathPlaceholders() should replace a path placeholder with request param', () => {
        let server = new Server()

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
        let server = new Server()

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
        let server = new Server()

        const path = './data/:folder:/:filename:.json'
        const request = {
            params: {
                folder: 'bar'
            }
        }

        const parsedPath = server.replacePathPlaceholders(path, request)

        expect(parsedPath).toEqual('./data/bar/:filename:.json')
    })
})
