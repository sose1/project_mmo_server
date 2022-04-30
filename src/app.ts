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
            console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
            const message = JSON.parse(msg.toString())
            switch (message.name) {
                case "connect":
                    const response = await this.userController.connect(message.data)
                    if (response != null)
                        await this.sendMessage(JSON.stringify(response), rinfo.port, rinfo.address)
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
}

export default App

