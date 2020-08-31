class Logger {
    info(title, ...message) {
        console.log('\x1b[32m', title, '\x1b[37m', ...message)
    }

    error(title, ...message) {
        console.error('\x1b[31m', title, '\x1b[37m', ...message)
    }
}

module.exports = Logger
