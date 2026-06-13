import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(express.static("public"))

let online = 0

io.on("connection", (socket) => {

  online++
  io.emit("online", online)

  socket.on("join", (username) => {
    socket.username = username

    io.emit("message", {
      user: "SYSTEM",
      text: `${username} joined the chat`
    })
  })

  socket.on("message", (text) => {
    io.emit("message", {
      user: socket.username,
      text
    })
  })

  socket.on("disconnect", () => {

    online--
    io.emit("online", online)

    if (socket.username) {
      io.emit("message", {
        user: "SYSTEM",
        text: `${socket.username} left the chat`
      })
    }
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
