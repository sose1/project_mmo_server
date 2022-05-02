import axios from "axios";
import {accessToken} from "../auth/AuthUtils";
import User from "../repository/UserRepository";

class UserService {
    authorizeConnection = async (jwt: string) => {
        let data;
        await axios.get("http://localhost:8080/api/v1/users/server/authorize", {
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
            return {
                name: "connected",
                data: {
                    jwtServer: jwtServer,
                    user: data
                }
            };
        }
        return data;
    }

    userMovement = async (data: any) => {
        const _id = data.userId
        const position = data.position
        await User.findByIdAndUpdate(
            {_id},
            {
                $set: {"position": position}
            }
        );

        return {
            name: "other-user-move",
            data: {
                userId: _id,
                position: position
            }
        };
    }
}

export default UserService
