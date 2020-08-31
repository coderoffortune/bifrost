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
        it('.setup() should instantiate restify and setup parsers', () => {
            const server = new Server({}, null, restify)
    
            server.setup()
    
            expect(useFn).toHaveBeenCalledTimes(2)
            expect(bodyParserFn).toHaveBeenCalled()
            expect(queryParserFn).toHaveBeenCalled()
        })
    
        it('.start() should invoke restify listen method', () => {
            const server = new Server({}, null, restify)
    
            server.setup().start()
    
            expect(listenFn).toHaveBeenCalled()
        })
    
        it('.logStart() should call console.log', () => {
            const server = new Server({}, null, restify)
    
            server.setup().start().logStart()
    
            expect(console.log).toHaveBeenCalledTimes(1)
        })
    
        it('.stop() should invoke restify close method', () => {
            const server = new Server({}, null, restify)
    
            server.setup().stop()
    
            expect(closeFn).toHaveBeenCalled()
        })    
    })

    describe('.extractPathParameters()', () => {
        it('should return the parameter placeholder', () => {
            const server = new Server()
    
            const path = './data/:filename:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(Array.isArray(params)).toBe(true)
            expect(params[0].placeholder).toEqual(':filename:')
        })
    
        it('should return the parameter name', () => {
            const server = new Server()
    
            const path = './data/:filename:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(params[0].name).toEqual('filename')
        })
    
        it('should return both parameters placeholders and names', () => {
            const server = new Server()
    
            const path = './data/:folder:/:filename:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(params).toEqual([
                {placeholder: ':folder:', name: 'folder'},
                {placeholder: ':filename:', name: 'filename'}
            ])
        })

        it('should return * as parameters name when placeholder is wildcard', () => {
            const server = new Server()
    
            const path = './data/:wildcard:.json'
    
            const params = server.extractPathParameters(path)
    
            expect(params).toEqual([{placeholder: ':wildcard:', name: '*'}])
        })    
    })

    describe('.replacePathParameters()', () => {
        it('should replace a path placeholder with request param', () => {
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
    
        it('should replace a query string placeholder with query param', () => {
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

        it('should replace all path placeholders with request params', () => {
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
    
        it('should leave path placeholders that are not in the request params', () => {
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
        it('should return the data inside the desired json file', () => {
            const server = new Server()
            const mockData = require('./data/mock_response.json')
            const req = {}
            
            server.mockApiAction('../tests/data/mock_response.json', undefined, [], req, res, next)

            expect(res.send).toHaveBeenCalledWith(mockData)
            expect(next).toHaveBeenCalledTimes(1)
        })

        it('should return empty data when the json file doesn\'t exists and log the error', () => {
            const server = new Server()
            const req = {}
            
            server.mockApiAction('../tests/data/mock_responsee.json', undefined, [], req, res, next)

            expect(res.send).toHaveBeenCalledWith({})
            expect(console.error).toHaveBeenCalledTimes(1)
        })

        it('should return the data inside the desired json file using parametric path', () => {
            const server = new Server()
            const mockData = require('./data/mock_response.json')
            const req = {
                params: {
                    responseType: 'mock'
                }
            }
            
            server.mockApiAction('../tests/data/:responseType:_response.json', undefined, [], req, res, next)

            expect(res.send).toHaveBeenCalledWith(mockData)
        })
    })

    describe('.registerMockApiEndpoints()', () => {
        it('should register one endpoint', () => {
            const server = new Server({}, null, restify)

            const endpoint = [{
                method: 'get',
                url: '//www.example.com/fakeurl',
                response: '../some/data/response.json'
            }]

            server.setup().start().registerMockApiEndpoints(endpoint)

            expect(getFn).toHaveBeenCalledTimes(1)
        })

        it('should register two endpoints', () => {
            const server = new Server({}, null, restify)

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
        it('should load endpoints definition from file', () => {
            const server = new Server({}, null, restify)

            server.setup().start().loadMockApiEndpoints(`${__dirname}/data/endpoints/mock_endpoints.json`)

            expect(getFn).toHaveBeenCalledTimes(2)
        })

        it('should load endpoints definition from all the files in a directory', () => {
            const server = new Server({}, null, restify)

            server.setup().start().loadMockApiEndpoints(`${__dirname}/data/endpoints_with_subfolder`)

            expect(getFn).toHaveBeenCalledTimes(5)
        })
    })

    describe('.registerFakeApiEndpoints()', () => {
        it('should call appropriate server method to register the endpoint', () => {
            const stubAction = jest.fn()
            const endpoints = [
                {
                    method: 'get',
                    url: '/Cart.API/1.6/:siteCode/carts.json',
                    action: stubAction
                }
            ]
            const server = new Server({}, null, restify)
    
            server.setup()
            
            server.server.get = jest.fn()
    
            server.registerFakeApiEndpoints(endpoints)
    
            expect(server.server.get).toHaveBeenCalledWith(endpoints[0].url, endpoints[0].action)    
        })
    })
})
