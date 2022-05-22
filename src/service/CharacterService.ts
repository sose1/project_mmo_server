import axios from "axios";
import {accessToken} from "../auth/AuthUtils";
import Character from "../repository/CharacterRepository";

class CharacterService {
    authorizeConnection = async (jwt: string, characterId: string) => {
        let data;
        await axios.get(`http://localhost:8080/api/v1/characters/${characterId}/server/authorize`, {
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
            const otherPlayers = await Character.find({isActive: true}).select(['-password'])
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

    findCharacterById = async (characterId: string) => {
        return await Character.findById(characterId).select(['-password'])
    }

    playerMovement = async (data: any) => {
        const _id = data.playerId
        const position = data.position
        await Character.findByIdAndUpdate(
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

    disconnectPlayer = async (jwtApi: string, characterId: string) => {
        let data;
        await axios.get("http://localhost:8080/api/v1/accounts/logout", {
            headers: {
                Authorization: `${jwtApi}`
            }
        }).then(response => {
            data = response.data;
        }).catch(error => {
            data = error.response.status;
        });

        if (data != null && data != 401) {
            return {
                name: "player-disconnected",
                data: {
                    player: await Character.findById(characterId)
                }
            };
        }
    }
}

export default CharacterService
