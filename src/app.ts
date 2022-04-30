import dotenv from "dotenv";
import dgram from "dgram";
import mongoose from "mongoose";
import UserController from "./controller/UserController";

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
            // console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
            const message = JSON.parse(msg.toString())
            let response: any;
            switch (message.name) {
                case "connect":
                    const foundUser = await this.connectedUser.find(user => user.port === rinfo.port)
                    if (foundUser === undefined) {
                        response = await this.userController.connect(message.data);
                        if (response != null) {
                            await this.sendMessage(JSON.stringify(response), rinfo.port, rinfo.address);
                            this.connectedUser.push(
                                {
                                    userId: response.data.user._id,
                                    address: rinfo.address,
                                    port: rinfo.port,
                                    family: rinfo.family
                                }
                            )
                        }
                    } else {
                        await this.sendMessage(JSON.stringify("The user is currently connected"), rinfo.port, rinfo.address);
                    }
                    break;
                case "user-move":
                    response = await this.userController.userMovement(message.data)
                    if (response != null) {
                        if (response == 401) {
                            await this.sendMessage(response, rinfo.port, rinfo.address)
                        } else {
                            await this.sendMessageExpect(this.connectedUser, response)
                        }
                    }
                    break;
            }
        }))
    }

    private onListening() {
        this.app.on('listening', () => {
            const address = this.app.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });
    }

    private async sendMessage(message: string, port: number, address: string) {
        this.app.send(message, port, address)
    }

    private async sendMessageExpect(users: Array<any>, message: any) {
        const expectConnectedUsers = users.filter(user => message.data.userId != user.userId)
        for (const user of expectConnectedUsers) {
            await this.sendMessage(message, user.port, user.address)
        }
    }
}

export default App
