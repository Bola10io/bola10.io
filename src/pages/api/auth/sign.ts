import { compare } from "bcryptjs";
import { NextApiResponse, NextApiRequest } from "next"
import prismaClient from "../../../prisma";
import { sign as signJWT } from "jsonwebtoken"

interface SignRequest extends NextApiRequest {
    body: {
        login: string;
        password: string;
    }
}


const sign = async (req: SignRequest, res: NextApiResponse) => {
    if (req.method === "POST") {
        const { login, password } = req.body;

         // verificar se o email e o password foram enviados
        if (!login) {
            return res.status(422).json({ message: "Login not found on request body"})
          } else if (!password) {
            return res.status(422).json({ message: "Password not found on request body"})
        }
        
        // buscar user no banco
        const user = await prismaClient.user.findFirst({
            where: {
                OR: [
                    {
                        email: login,
                    },
                    { 
                        nickname: login 
                    },
                  ],
            }
        })

        // retornar um erro caso não encontre o user
        if (!user) {
            return res.status(403).json({ message: "Wrong credentials"})
        }

        // verificar se a senha está correta
        const passwordMatch = await compare(password, user.password)

        // retornar erro se a senha estiver incorreta
        if (!passwordMatch) {
            return res.status(403).json({ message: "Wrong credentials"})
        }
        
        // gerar um novo token
        const token = signJWT(
            {
            user:{
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

        // criar novo token no banco
        await prismaClient.token.create({
            data: {
                token: token,
                userId: user.id,
            }
        })

        
        // retornar user e token
        return res.status(200).json({token, user})

    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).send('Method not allowed');
    }
}

export default sign


