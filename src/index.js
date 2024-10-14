import app from './app.js'
import { dbConnect } from './db/connect.js'
import { localPort } from './const.js'

let PORT = process.env.PORT || localPort

// Start the server
const startServer = async () => {
    try {
        await dbConnect()

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })

        app.on('error', (err) => {
            console.error(`Server encountered an error: ${err.message}`)
        })
    } catch (error) {
        console.error(`Error starting the server: ${error.message}`)
        process.exit(1)
    }
}
startServer()

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...')
    server.close(() => {
        console.log('Closed out remaining connections.')
        process.exit(0)
    })

    // Force close connections after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown...')
        process.exit(1)
    }, 10000)
})
