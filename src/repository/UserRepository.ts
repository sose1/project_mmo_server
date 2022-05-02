import mongoose from "mongoose";

interface IUser {
    email: string;
    password: string;
}

interface UserModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc
}

interface UserDoc extends mongoose.Document {
    email: string;
    password: string;
}

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    position: {
        x: Number,
        y: Number,
        z: Number
    }
});

userSchema.statics.build = (attr: IUser) => {
    return new User(attr)
}

const User = mongoose.model<UserDoc, UserModelInterface>('User', userSchema);

const build = (attr: IUser) => {
    return new User(attr)
}
export default User
