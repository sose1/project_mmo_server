import dotenv from "dotenv";
import dgram from "dgram";
import mongoose from "mongoose";
import UserController from "./controller/UserController";
import {decodeToken} from "./auth/AuthUtils";

dotenv.config()

class App {
    private app = dgram.createSocket('udp4')
    private port = process.env.PORT
    private mongodbUrl = process.env.MONGO_DB_URL
    private userController = new UserController()
    private connectedUser: Array<any> = []

    constructor() {
        this.onError();
        this.onMessage();
        this.onListening();
    }

    public bind() {
        this.app.bind(Number(this.port), () => {
            console.log(`Server bind on ${this.port}`)
        })
    }

    public connectToMongo() {
        mongoose.connect(`${this.mongodbUrl}`, () => {
            console.log(`connected to database url: ${this.mongodbUrl}`)
        })
    }

    private onError() {
        this.app.on('error', (err => {
            console.log(`server error: \n ${err.stack}`)
        }))
    }

    private onMessage() {
        this.app.on('message', (async (msg, rinfo) => {
            const message = JSON.parse(msg.toString())
            let response: any;
            switch (message.name) {
                case "connect":
                    const email = decodeToken(message.data.jwtApi).username;
                    const foundUser = await this.connectedUser.find(user => user.email === email)
                    if (foundUser === undefined) {
                        response = await this.userController.connect(message.data);
                        if (response != null) {
                            this.connectedUser.push(
                                {
                                    userId: response.data.user._id,
                                    email: response.data.user.email,
                                    address: rinfo.address,
                                    port: rinfo.port,
                                    family: rinfo.family
                                }
                            )

                            console.log(`User Connect: Email: ${email}, Address: ${rinfo.address}:${rinfo.port}`)
                            await this.sendMessage(JSON.stringify(response), rinfo.port, rinfo.address);
                            const otherResponse = await this.userController.findUserById(response.data.user._id);
                            await this.sendMessageExpect(this.connectedUser, otherResponse, response.data.userId);
                        }
                    } else {
                        await this.sendMessage(JSON.stringify("The user is currently connected"), rinfo.port, rinfo.address);
                    }
                    break;
                case "user-move":
                    response = await this.userController.userMovement(message.data)
                    if (response != null) {
                        if (response == 401) {
                            await this.sendMessage(response.toString(), rinfo.port, rinfo.address)
                        } else {
                            await this.sendMessage("Data received", rinfo.port, rinfo.address)
                            await this.sendMessageExpect(this.connectedUser, response, response.data.userId)
                        }
                    }
                    break;
                case "disconnect":
                    await this.sendMessage("Data received", rinfo.port, rinfo.address)
                    response = await this.userController.disconnect(message.data)
                    if (response != null) {
                        if (response == 401) {
                            await this.sendMessage(response.toString(), rinfo.port, rinfo.address)
                        } else {

                            const index = this.connectedUser.findIndex(user =>
                                message.data.userId == user.userId
                            );
                            if (index > -1)
                                console.log(`Disconnect Index: ${index}, userID: ${message.data.userId}, Addres: ${rinfo.address}:${rinfo.port}`)
                                this.connectedUser.splice(index, 1)

                            if (this.connectedUser.length > 0)
                                await this.sendMessageExpect(this.connectedUser, response, message.data.userId)
                        }
                    }
                    break;
                default:
                    await this.sendMessage("ERROR", rinfo.port, rinfo.address)
            }
        }))
    }

    private onListening() {
        this.app.on('listening', () => {
            const address = this.app.address();
            this.app.setRecvBufferSize(100000000); // 100mb
            this.app.setSendBufferSize(100000000);
            console.log(`server listening ${address.address}:${address.port}`);
        });
    }

    private sendMessage(message: string, port: number, address: string) {
        this.app.send(message,0, message.length, port, address)
    }

    private async sendMessageExpect(users: Array<any>, message: any, expectId: string) {
        const expectConnectedUsers = users.filter(user => expectId != user.userId)
        const strMessage = JSON.stringify(message)
        if (expectConnectedUsers.length > 0) {
            for (const user of expectConnectedUsers) {
                 this.sendMessage(strMessage, user.port, user.address)
            }
        }
    }
}

export default App
