import UserService from "../service/UserService";

class UserController {
    private userService = new UserService()
    connect = async (reqBody: any) => {
        return await this.userService.authorizeConnection(reqBody.jwtApi)
    }
}
export default UserController
