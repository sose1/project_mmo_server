import mongoose from "mongoose";

//todo : 1. Zmienić nazwenictwo z player na Character;
// 2. Character ma pola, nickname, owner, position, isActive (kiedy polaczy sie z Serverem, jesli odlaczy to isActive false)

interface ICharacter {
    nickname: string;
    owner: string;
}

interface CharacterModelInterface extends mongoose.Model<CharacterDoc> {
    build(attr: ICharacter): CharacterDoc
}

interface CharacterDoc extends mongoose.Document {
    nickname: String
    owner: mongoose.Schema.Types.ObjectId;
    isActive: boolean;
}

const characterSchema = new mongoose.Schema({
    nickname: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    position: {
        x: Number,
        y: Number,
        z: Number,
        rotation: Number
    },
    isActive: Boolean
});

characterSchema.statics.build = (attr: ICharacter) => {
    return new Character(attr)
}

const Character = mongoose.model<CharacterDoc, CharacterModelInterface>('Character', characterSchema);

const build = (attr: ICharacter) => {
    return new Character(attr)
}
export default Character
