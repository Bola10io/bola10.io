import prismaClient from "../../../prisma";
import { genSaltSync, hashSync } from "bcryptjs";
import { sign } from "jsonwebtoken"

import { NextApiRequest, NextApiResponse } from "next";

// post API Route for Login on Bola10.io
const signUp = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, password, nickname } = req.body;
  
  //encriptar senha
  const salt = genSaltSync(10);
  const passwordHash = hashSync(password, salt);

  //verificar se usuário já existe
  let user = await prismaClient.user.findFirst({
    where: {
      email: email,
    },
  });

  // Se o usuário não existir adicionar no banco
  if (!user) {
    user = await prismaClient.user.create({
      data: {
        email,
        password: passwordHash,
        nickname,
      },
    });
  } else {
    return res.status(409).json("message: user already exists")
  }

  const token = sign(
    {
      user:{
        name: user.name,
        id: user.id,
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
