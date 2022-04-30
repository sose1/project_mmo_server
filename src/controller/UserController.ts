import UserService from "../service/UserService";
import {authorize} from "../auth/AuthUtils";

class UserController {
    private userService = new UserService()
    connect = async (reqBody: any) => {
        return await this.userService.authorizeConnection(reqBody.jwtApi);
    }

    userMovement = async (reqBody: any) => {
        let response;
        authorize(reqBody.authorization)
            ? response = await this.userService.userMovement(reqBody)
            : response = 401
        return response
    }
}
export default UserController;
