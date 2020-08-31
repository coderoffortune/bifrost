const Logger = require('../src/Logger')

describe('Logger', () => {
    test('info() should call console.log with it\'s params plus two colors', () => {
        const logger = new Logger()
        const consoleLog = console.log

        console.log = (...args) => {}

        let spyConsoleLog = jest.spyOn(console, 'log')

        logger.info('title', 'partial', 'message', 'composed')

        expect(spyConsoleLog).toHaveBeenCalledWith('\x1b[32m', 'title', '\x1b[37m', 'partial', 'message', 'composed')

        console.log = consoleLog
    })

    test('info() should call console.log with it\'s params plus two colors', () => {
        const logger = new Logger()
        const consoleError = console.error
        
        console.error = (...args) => {}
        
        let spyConsoleError = jest.spyOn(console, 'error')

        logger.error('title', 'partial', 'error', 'composed')

        expect(spyConsoleError).toHaveBeenCalledWith('\x1b[31m', 'title', '\x1b[37m', 'partial', 'error', 'composed')

        console.error = consoleError
    })
})