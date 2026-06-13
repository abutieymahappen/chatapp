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

app.use(express.static(path.join(__dirname, "public")))

// USERS
const users = {}

// CHAT STORAGE (THIS MAKES IT "TELEGRAM LIKE")
const chats = {
  global: []
}

// helper
function getDMKey(a, b) {
  return [a, b].sort().join("_")
}

io.on("connection", (socket) => {

  // JOIN
  socket.on("join", (user) => {
    users[socket.id] = user
    io.emit("users", Object.values(users))
  })

  // GLOBAL MESSAGE
  socket.on("message", (text) => {

    const user = users[socket.id]
    if (!user) return

    const msg = {
      user: user.username,
      text,
      time: Date.now()
    }

    chats.global.push(msg)

    io.emit("message", msg)
  })

  // PRIVATE DM (REAL STORAGE)
  socket.on("privateMessage", (data) => {

    const sender = users[socket.id]
    if (!sender) return

    const key = getDMKey(sender.id, data.to)

    if (!chats[key]) chats[key] = []

    const msg = {
      from: sender.username,
      text: data.text,
      time: Date.now()
    }

    chats[key].push(msg)

    // send to receiver
    io.to(data.to).emit("privateMessage", msg)

    // send back to sender
    socket.emit("privateMessage", {
      ...msg,
      from: "You"
    })

  })

  // SEND CHAT HISTORY (TELEGRAM STYLE)
  socket.on("loadChat", (chatId, cb) => {
    cb(chats[chatId] || [])
  })

  // DISCONNECT
  socket.on("disconnect", () => {
    delete users[socket.id]
    io.emit("users", Object.values(users))
  })

})

server.listen(3000, () => {
  console.log("🔥 BROSKIX TELEGRAM 100% RUNNING")
})
