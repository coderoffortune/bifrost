const Filesystem = require('../src/Filesystem')

describe('Filesystem class', () => {
    afterEach(() => {
        jest.clearAllMocks();
    })

    describe('.loadDirectoryFiles()', () => {
        test('should load directory childrens', () => {
            const filesystem = new Filesystem()
            
            const expectedData = [
                require('./data/endpoints/mock_endpoints.json')
            ]
            const loadedData = filesystem.loadDirectoryFiles(`${__dirname}/data/endpoints`)

            expect(loadedData).toEqual(expectedData)
        })

        test('should load directory childrens recursively', () => {
            const filesystem = new Filesystem()
            
            const loadedData = filesystem.loadDirectoryFiles(`${__dirname}/data/endpoints_with_subfolder`)

            expect(loadedData.length).toEqual(5)
        })
    })

    describe('.isDirectory()', () => {
        test('should return false if directory doesn\'t exists', () => {
            const filesystem = new Filesystem()

            const isDirectory = filesystem.isDirectory(`${__dirname}/data/endpointss`)

            expect(isDirectory).toBe(false)
        })
    })
})
