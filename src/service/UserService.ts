import axios from "axios";
import {accessToken} from "../auth/AuthUtils";

class UserService {
    authorizeConnection = async (jwt: string) => {
        let data;
        await axios.get("http://localhost:8080/api/v1/users/server/authorize", {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        }).then(response => {
            data = response.data;
        }).catch(error => {
            data = error.response.status
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
            }
        }
        return data
    }
}

export default UserService
