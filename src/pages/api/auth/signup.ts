import prismaClient from "../../../prisma";
import { genSaltSync, hashSync } from "bcryptjs";
import { sign } from "jsonwebtoken"

import { NextApiRequest, NextApiResponse } from "next";

interface SignUpRequest extends NextApiRequest {
  body: {
    email: string;
    password: string;
    nickname: string;
  }
}

// post API Route for Login on Bola10.io
const signUp = async (req: SignUpRequest, res: NextApiResponse) => {
  const { email, password, nickname } = req.body;

  // verificar se já existe um usuário com esse e-mail
  const userWithSameEmail = await prismaClient.user.findFirst({
    where: {
      email: email,
    },
  });

  if (userWithSameEmail) {
    return res.status(409).json({ message: 'Email already in use' })
  }

  // verificar se já existe um usuário com o mesmo nickname
  const userWithSameNickname = await prismaClient.user.findFirst({
    where: {
      nickname: nickname,
    },
  });

  if (userWithSameNickname) {
    return res.status(409).json({ message: 'Nickname already in use' })
  }

   // encriptar senha
   const salt = genSaltSync(10);
   const passwordHash = hashSync(password, salt);

  // Criar usuário
   const user = await prismaClient.user.create({
      data: {
        nickname,
        email,
        password: passwordHash,
      },
    });
  

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

  // falta refresh token. Entender o que é isso e como fazer.

  return res.status(201).json({token, user})
};

export default signUp;
