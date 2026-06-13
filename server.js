import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new Server(server)

// static files
app.use(express.static(path.join(__dirname, "public")))

// route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// users storage
const users = {}

// SOCKET CONNECTION
io.on("connection", (socket) => {

  console.log("User connected:", socket.id)

  // JOIN USER
  socket.on("join", (username) => {

    users[socket.id] = {
      id: socket.id,
      username
    }

    // update all users
    io.emit("users", Object.values(users))

    // system message
    socket.broadcast.emit(
      "system",
      `${username} joined the chat`
    )

  })

  // GLOBAL MESSAGE
  socket.on("message", (text) => {

    const user = users[socket.id]
    if (!user) return

    io.emit("message", {
      user: user.username,
      text,
      time: new Date().toLocaleTimeString()
    })

  })

  // PRIVATE MESSAGE (DM)
  socket.on("privateMessage", (data) => {

    const sender = users[socket.id]
    if (!sender) return

    const msg = {
      from: sender.username,
      text: data.text,
      time: new Date().toLocaleTimeString()
    }

    // send to receiver
    io.to(data.to).emit("privateMessage", msg)

    // send back to sender
    socket.emit("privateMessage", {
      from: "You",
      text: data.text,
      time: msg.time
    })

  })

  // TYPING (optional UI feature)
  socket.on("typing", () => {

    const user = users[socket.id]
    if (!user) return

    socket.broadcast.emit("typing", user.username)

  })

  // DISCONNECT
  socket.on("disconnect", () => {

    const user = users[socket.id]

    if (user) {

      socket.broadcast.emit(
        "system",
        `${user.username} left the chat`
      )

      delete users[socket.id]

      io.emit("users", Object.values(users))
    }

    console.log("User disconnected:", socket.id)

  })

})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`🚀 BROSKIX Chat running on port ${PORT}`)
})
