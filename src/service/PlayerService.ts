import axios from "axios";
import {accessToken, decodeToken} from "../auth/AuthUtils";
import Player from "../repository/PlayerRepository";

class PlayerService {
    authorizeConnection = async (jwt: string) => {
        let data;
        await axios.get("http://localhost:8080/api/v1/players/server/authorize", {
            headers: {
                Authorization: `${jwt}`
            }
        }).then(response => {
            data = response.data;
        }).catch(error => {
            data = error.response.status;
        });

        if (data != null && data != 401) {
            const {email} = data
            const jwtServer = await accessToken(email)
            const otherPlayers = await Player.find({isLogged: true}).select(['-password'])
            return {
                name: "connected",
                data: {
                    jwtServer: jwtServer,
                    player: data,
                    otherPlayers: otherPlayers
                }
            };
        }
        return data;
    }

    findPlayerById = async (playerId: string) => {
        return await Player.findById(playerId).select(['-password'])
    }

    playerMovement = async (data: any) => {
        const _id = data.playerId
        const position = data.position
        await Player.findByIdAndUpdate(
            {_id},
            {
                $set: {"position": position}
            }
        );

        return {
            name: "other-player-move",
            data: {
                playerId: _id,
                position: position
            }
        };
    }

    disconnectPlayer = async (jwtApi: string) => {
        let data;
        await axios.get("http://localhost:8080/api/v1/players/logout", {
            headers: {
                Authorization: `${jwtApi}`
            }
        }).then(response => {
            data = response.data;
        }).catch(error => {
            data = error.response.status;
        });

        const email = decodeToken(jwtApi).username
        const player = await Player.findOne({email: email}).select(['-password'])
        if (data != null && data != 401) {
            return {
                name: "player-disconnected",
                data: {
                    player: player
                }
            };
        }
    }
}

export default PlayerService
