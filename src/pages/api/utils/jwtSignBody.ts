import { User } from "@prisma/client"

const jwtSignBody = (user: User) => {
    return [
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
    ]
}

export default jwtSignBody;