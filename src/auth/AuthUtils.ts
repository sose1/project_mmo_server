const jwt = require("jsonwebtoken");

export const accessToken = async (username: string) => {
    return await jwt.sign({username}, process.env.TOKEN_SECRET, {expiresIn: '7d'})
}

export function authorize(authHeader: string): boolean {
    const token = authHeader.split(" ")[1];
    if (authHeader.split(" ")[0] != "Bearer")
        return false;
    if (token == null || token == "")
        return false;

    let isAuthorized = false;
    jwt.verify(token, process.env.TOKEN_SECRET as string, async (err: any) => {
        isAuthorized = !err;
    })
    return isAuthorized;
}

export function decodeToken(authHeader: string) {
    return jwt.decode(authHeader.split(" ")[1], process.env.TOKEN_SECRET)
}
