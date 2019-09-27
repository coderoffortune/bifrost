const Server = require('../src/Server')

const restify = {
    createServer: () => ({
        use: () => {},
        name: '',
        url: ''
    })
}

describe('Bifrost Server', () => {

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

    test('.replacePathPlaceholders() should replace a path placeholder with a param from request', () => {
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

    test('.replacePathPlaceholders() should replace all path placeholders with params from request', () => {
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
})
