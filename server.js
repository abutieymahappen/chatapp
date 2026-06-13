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

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"))
})

const users = {}

io.on("connection", (socket) => {

socket.on("join", (username) => {

users[socket.id] = username

io.emit("system", `${username} joined the chat`)

io.emit("users", Object.values(users))

})

socket.on("typing", () => {

socket.broadcast.emit(
  "typing",
  users[socket.id]
)

})

socket.on("message", (message) => {

io.emit("message", {
  user: users[socket.id],
  text: message,
  time: new Date().toLocaleTimeString()
})

})

socket.on("disconnect", () => {

const username = users[socket.id]

delete users[socket.id]

io.emit("users", Object.values(users))

if(username){

  io.emit(
    "system",
    `${username} left the chat`
  )

}

})

})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
console.log("Server running on ${PORT}")
})
