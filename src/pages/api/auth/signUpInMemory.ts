import { genSaltSync, hashSync } from "bcryptjs";
import { sign } from "jsonwebtoken"
import { v4 as uuidV4 } from "uuid";
require("dotenv").config();


interface SignUpRequest {
    email: string;
    password: string;
    nickname: string;
}

interface ICreateUser {
    email: string;
    nickname: string;
    passwordHash: string;
}

class User {
    password: string;
    email: string;
    nickname: string;

    constructor({email, nickname, passwordHash}: ICreateUser) {
        this.password = passwordHash,
        this.email = email,
        this.nickname = nickname
        this.id = uuidV4();
        this.createdAt = new Date()
    }
    id: string;
    name?: string;
    displayName?: string;
    phone?: string;
    pixKey?: string;
    language?: string;
    stripeId?: string;
    subscriptionId?: string;
    lastLogin?: string;
    permissions?: string[];
    createdAt?: Date;
}

// post API Route for Login on Bola10.io
const signUpInMemory = async ({ email, password, nickname }: SignUpRequest) => {
    let users: User[] = []

  // verificar se já existe um usuário com esse e-mail
  const userWithSameEmail = users.some((user) => user.email === email)

  if (userWithSameEmail) {
    return "message: Email already in use"
  }

  // verificar se já existe um usuário com o mesmo nickname
  const userWithSameNickname = users.some((user) => user.nickname === nickname)

  if (userWithSameNickname) {
    return "message: Nickname already in use"
  }

   // encriptar senha
   const salt = genSaltSync(10);
   const passwordHash = hashSync(password, salt);

  // Criar usuário
  const user = new User({
    email, nickname, passwordHash
  })

  // adicionar ao 'banco'
  users.push(user)
  

  const token = sign(
    {
      user:{
        id: user.id,
        nickname: user.nickname,
        email: user.email
      },
    },
    process.env.JWT_SECRET as string,
    {
      subject: user.id,
      expiresIn: "1d",
    }
  )

  return {token, user}
};

export default signUpInMemory;
