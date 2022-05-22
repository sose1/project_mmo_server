import dotenv from "dotenv";
import dgram from "dgram";
import mongoose from "mongoose";
import CharacterController from "./controller/CharacterController";
import {decodeToken} from "./auth/AuthUtils";

dotenv.config()

class App {
    private app = dgram.createSocket('udp4')
    private port = process.env.PORT
    private mongodbUrl = process.env.MONGO_DB_URL
    private playerController = new CharacterController()
    private connectedPlayers: Array<any> = []

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
                    const foundPlayer = await this.connectedPlayers.find(player => player.email === email)
                    if (foundPlayer === undefined) {
                        response = await this.playerController.connect(message.data);
                        if (response != null) {
                            this.connectedPlayers.push(
                                {
                                    playerId: response.data.player._id,
                                    email: response.data.player.email,
                                    address: rinfo.address,
                                    port: rinfo.port,
                                    family: rinfo.family
                                }
                            )

                            console.log(`Player Connect: Email: ${email}, Address: ${rinfo.address}:${rinfo.port}`)
                            await this.sendMessage(JSON.stringify(response), rinfo.port, rinfo.address);
                            const otherResponse = await this.playerController.findPlayerById(response.data.player._id);
                            await this.sendMessageExpect(this.connectedPlayers, otherResponse, response.data.player._id);
                        }
                    } else {
                        await this.sendMessage(JSON.stringify("The player is currently connected"), rinfo.port, rinfo.address);
                    }
                    break;
                case "player-move":
                    response = await this.playerController.playerMovement(message.data)
                    if (response != null) {
                        if (response == 401) {
                            await this.sendMessage(response.toString(), rinfo.port, rinfo.address)
                        } else {
                            await this.sendMessage("Data received", rinfo.port, rinfo.address)
                            await this.sendMessageExpect(this.connectedPlayers, response, response.data.playerId)
                        }
                    }
                    break;
                case "disconnect":
                    await this.sendMessage("Data received", rinfo.port, rinfo.address)
                    response = await this.playerController.disconnect(message.data)
                    if (response != null) {
                        if (response == 401) {
                            await this.sendMessage(response.toString(), rinfo.port, rinfo.address)
                        } else {

                            const index = this.connectedPlayers.findIndex(player =>
                                message.data.playerId == player.playerId
                            );
                            if (index > -1)
                                console.log(`Disconnect Index: ${index}, playerID: ${message.data.playerId}, Addres: ${rinfo.address}:${rinfo.port}`)
                                this.connectedPlayers.splice(index, 1)

                            if (this.connectedPlayers.length > 0)
                                await this.sendMessageExpect(this.connectedPlayers, response, message.data.playerId)
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

    private async sendMessageExpect(players: Array<any>, message: any, expectId: string) {
        const expectConnectedPlayers = players.filter(players => expectId != players.playerId)
        const strMessage = JSON.stringify(message)
        if (expectConnectedPlayers.length > 0) {
            for (const player of expectConnectedPlayers) {
                 this.sendMessage(strMessage, player.port, player.address)
            }
        }
    }
}

export default App
