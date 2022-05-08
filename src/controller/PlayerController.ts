import PlayerService from "../service/PlayerService";
import {authorize} from "../auth/AuthUtils";

class PlayerController {
    private playerService = new PlayerService()
    connect = async (reqBody: any) => {
        return await this.playerService.authorizeConnection(reqBody.jwtApi);
    }

    findPlayerById = async (playerId: string) => {
        const player =  await this.playerService.findPlayerById(playerId);
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
            ? response = await this.playerService.playerMovement(reqBody)
            : response = 401
        return response
    }

    disconnect = async (reqBody: any) => {
        let response;
        authorize(reqBody.authorization)
            ? response = await this.playerService.disconnectPlayer(reqBody.jwtApi)
            : response = 401
        return response
    }
}

export default PlayerController;
