import axios from "axios";
import {accessToken, decodeToken} from "../auth/AuthUtils";
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
            const otherUsers = await User.find({isLogged: true}).select(['-password'])
            return {
                name: "connected",
                data: {
                    jwtServer: jwtServer,
                    user: data,
                    otherUsers: otherUsers
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

    disconnectUser = async (jwtApi: string) => {
        let data;
        await axios.get("http://localhost:8080/api/v1/users/logout", {
            headers: {
                Authorization: `${jwtApi}`
            }
        }).then(response => {
            data = response.data;
        }).catch(error => {
            data = error.response.status;
        });

        const email = decodeToken(jwtApi).username
        const user = await User.findOne({email: email}).select(['-password'])
        if (data != null && data != 401) {
            return {
                name: "user-disconnected",
                data: {
                    user: user
                }
            };
        }
    }
}

export default UserService
