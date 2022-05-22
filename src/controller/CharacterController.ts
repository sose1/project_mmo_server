import CharacterService from "../service/CharacterService";
import {authorize} from "../auth/AuthUtils";

class CharacterController {
    private characterService = new CharacterService()
    connect = async (reqBody: any) => {
        return await this.characterService.authorizeConnection(reqBody.jwtApi, reqBody.characterId);
    }

    findPlayerById = async (playerId: string) => {
        const player =  await this.characterService.findCharacterById(playerId);
        return {
            name: "player-connected",
            data: {
                player: player
            }
        }
    }
    playerMovement = async (reqBody: any) => {
        let response;
        authorize(reqBody.authorization)
            ? response = await this.characterService.playerMovement(reqBody)
            : response = 401
        return response
    }

    disconnect = async (reqBody: any) => {
        let response;
        authorize(reqBody.authorization)
            ? response = await this.characterService.disconnectPlayer(reqBody.jwtApi, reqBody.playerId)
            : response = 401
        return response
    }
}

export default CharacterController;
