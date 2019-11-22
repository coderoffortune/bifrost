const Server = require('../src/Server')

const bodyParserFn = jest.fn()
const queryParserFn = jest.fn()

const closeFn = jest.fn()
const listenFn = jest.fn()
const useFn = jest.fn()

const getFn = jest.fn()
const postFn = jest.fn()

const restify = {
    createServer: () => ({
        name: '',
        url: '',

        close: closeFn,
        listen: listenFn,
        use: useFn,

        get: getFn,
        post: postFn,
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

    describe('lifecycle method', () => {
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
    })

    describe('.extractPathParameters()', () => {
        test('should return the parameter placeholder', () => {
            const server = new Server()
    
            const path = './data/:filename:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(Array.isArray(params)).toBe(true)
            expect(params[0].placeholder).toEqual(':filename:')
        })
    
        test('should return the parameter name', () => {
            const server = new Server()
    
            const path = './data/:filename:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(params[0].name).toEqual('filename')
        })
    
        test('should return both parameters placeholders and names', () => {
            const server = new Server()
    
            const path = './data/:folder:/:filename:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(params.length).toEqual(2)
            expect(params[0].placeholder).toEqual(':folder:')
            expect(params[0].name).toEqual('folder')
            expect(params[1].placeholder).toEqual(':filename:')
            expect(params[1].name).toEqual('filename')
        })    
    })

    describe('.replacePathParameters()', () => {
        test('should replace a path placeholder with request param', () => {
            const server = new Server()
    
            const path = './data/:filename:.json'
            const request = {
                params: {
                    filename: 'example'
                }
            }
    
            const parsedPath = server.replacePathParameters(path, request)
    
            expect(parsedPath).toEqual('./data/example.json')
        })
    
        test('should replace a query string placeholder with query param', () => {
            const server = new Server()
    
            const path = './data/:filename:.json'
            const request = {
                params: {},
                query: {
                    filename: 'example'
                }
            }
    
            const parsedPath = server.replacePathParameters(path, request)
    
            expect(parsedPath).toEqual('./data/example.json')
        })

        test('should replace all path placeholders with request params', () => {
            const server = new Server()
    
            const path = './data/:folder:/:filename:.json'
            const request = {
                params: {
                    folder: 'bar',
                    filename: 'foo'
                }
            }
    
            const parsedPath = server.replacePathParameters(path, request)
    
            expect(parsedPath).toEqual('./data/bar/foo.json')
        })
    
        test('should leave path placeholders that are not in the request params', () => {
            const server = new Server()
    
            const path = './data/:folder:/:filename:.json'
            const request = {
                params: {
                    folder: 'bar'
                }
            }
    
            const parsedPath = server.replacePathParameters(path, request)
    
            expect(parsedPath).toEqual('./data/bar/:filename:.json')
        })
    })

    describe('.mockApiAction()', () => {
        test('should return the data inside the desired json file', () => {
            const server = new Server()
            const mockData = require('./data/mock_response.json')
            const req = {}
            
            server.mockApiAction('../tests/data/mock_response.json', req, res, next)

            expect(res.send).toHaveBeenCalledWith(mockData)
            expect(next).toHaveBeenCalledTimes(1)
        })

        test('should return empty data when the json file doesn\'t exists and log the error', () => {
            const server = new Server()
            const req = {}
            
            server.mockApiAction('../tests/data/mock_responsee.json', req, res, next)

            expect(res.send).toHaveBeenCalledWith({})
            expect(console.error).toHaveBeenCalledTimes(1)
        })

        test('should return the data inside the desired json file using parametric path', () => {
            const server = new Server()
            const mockData = require('./data/mock_response.json')
            const req = {
                params: {
                    responseType: 'mock'
                }
            }
            
            server.mockApiAction('../tests/data/:responseType:_response.json', req, res, next)

            expect(res.send).toHaveBeenCalledWith(mockData)
        })
    })

    describe('.registerMockApiEndpoints()', () => {
        test('should register one endpoint', () => {
            const server = new Server({}, restify)

            const endpoint = [{
                method: 'get',
                url: '//www.example.com/fakeurl',
                response: '../some/data/response.json'
            }]

            server.setup().start().registerMockApiEndpoints(endpoint)

            expect(getFn).toHaveBeenCalledTimes(1)
        })

        test('should register two endpoints', () => {
            const server = new Server({}, restify)

            const endpoint = [{
                method: 'get',
                url: '//www.example.com/fakeurl',
                response: '../some/data/response.json'
            },{
                method: 'get',
                url: '//www.example.com/fakeurl',
                response: '../some/data/response.json'
            }]

            server.setup().start().registerMockApiEndpoints(endpoint)

            expect(getFn).toHaveBeenCalledTimes(2)
        })
    })

    describe('.loadMockApiEndpoints()', () => {
        test('should load endpoints definition from file', () => {
            const server = new Server({}, restify)

            server.setup().start().loadMockApiEndpoints(`${__dirname}/data/endpoints/mock_endpoints.json`)

            expect(getFn).toHaveBeenCalledTimes(2)
        })

        test('should load endpoints definition from all the files in a directory', () => {
            const server = new Server({}, restify)

            server.setup().start().loadMockApiEndpoints(`${__dirname}/data/endpoints_with_subfolder`)

            expect(getFn).toHaveBeenCalledTimes(5)
        })
    })
})
