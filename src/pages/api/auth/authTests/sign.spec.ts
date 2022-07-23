import request from "supertest";
import http, { IncomingMessage, ServerResponse } from "http";
import { apiResolver }  from "next/dist/server/api-utils/node";
import sign from "../sign"
import bcryptjs, {compare} from "bcryptjs";
import jsonwebtoken from "jsonwebtoken"
import { testHelper } from "../../../../lib/testHelper"
import { User } from "@prisma/client";
import prismaClient from "../../../../prisma";
import signup from "../signup";

const signUser = {
    email: "userSignTests@gmail.com",
    password: "userSignPassword",
};

const secondUserSeed = {
    email: "userSignTests@gmail.com",
    password: "userSignPassword",
    nickname: "nickSignUser"
};


interface signUpResponse {
    token: string;
    user: User;
}

describe("Tests of sign API Route", () => {
    let serverSign: http.Server
    let serverSignUp: http.Server
    beforeAll(async () => {
        // iniciar o "servidor" http, com a apiResolver do next pra rota de Sign
        const requestHandlerSign = (req: IncomingMessage, res: ServerResponse) => {
          apiResolver(
            req,
            res,
            undefined,
            sign,
            testHelper.mockApiContext(),
            true
            );
        };
        serverSign = http.createServer(requestHandlerSign)

        // iniciar o "servidor" http, com a apiResolver do next pra rota de SignUp
        const requestHandlerSignUp = (req: IncomingMessage, res: ServerResponse) => {
          apiResolver(
            req,
            res,
            undefined,
            signup,
            testHelper.mockApiContext(),
            true
            );
        };
        serverSignUp = http.createServer(requestHandlerSignUp)
    })

    afterAll(async () => {
        // fechar o servidor
        serverSign.close();
        serverSignUp.close();
    });

    describe("First seed user", () => {
        beforeEach(async () => {
            // criar um user seed pra rota de Sign
            await request
                .agent(serverSignUp)
                .post("/")
                .send(secondUserSeed)
        })

        // apagar usuários criados no banco depois de cada teste caso tenham sido
        afterEach(async () => {
            const user = await prismaClient.user.findFirst({
                where: {
                    email: signUser.email
                }
            })

            if(user) {
                await prismaClient.user.delete({
                    where: {
                        email: signUser.email
                    }
                })
            }
        })
    
        it("should be able to authenticate a new user and return this user informations", async () => {
            // realizar a request usando o supertest no servidor iniciado
            await request
                .agent(serverSign)
                .post("/")
                .send(signUser)
                .then((res) => {
                    const responseBody: signUpResponse = res.body
    
                    expect(res.status).toBe(200)
                    expect(responseBody).toHaveProperty("user")
                })
        })
    
        it("should be able to create a new user token and return this token", async () => {
            //mockar a função sign do jsonwebtoken
            jest.spyOn(jsonwebtoken, "sign").mockImplementationOnce(() => {
                return "jwttoken"
            })

            // fazer login na rota sig
            await request.agent(serverSign)
            .post("/")
            .send(signUser)
            .then((res) => {
                const responseBody: signUpResponse = res.body
    
                expect(res.status).toEqual(200);
                expect(responseBody.token).toEqual("jwttoken");
            })
            expect(jsonwebtoken.sign).toHaveBeenCalled()
        })
    
        
    })
    
    describe("Second seed user", () => {

        const secondUserSignUp = {
            email: "userSignSecondTests@gmail.com",
            password: "userSignSecondPassword",
            nickname: "nickSignSecondUser"
        }
        
        beforeEach(async () => {
            // criar um user seed pros testes
            await request
                .agent(serverSignUp)
                .post("/")
                .send(secondUserSignUp)
        })

        // apagar usuários criados no banco depois de cada teste caso tenham sido
        afterEach(async () => {
            const user = await prismaClient.user.findFirst({
                where: {
                    email: secondUserSignUp.email
                }
            })

            if(user) {
                await prismaClient.user.delete({
                    where: {
                        email: secondUserSignUp.email
                    }
                })
            }
        })

        it("Should not be able to authenticate user with wrong password", async () => {
            jest.spyOn(bcryptjs, "compare")

            // mock de user com senha errada
            const userWrongPassword = {
                email: "userSignSecondTests@gmail.com",
                password: "userSignSecondPfhfhassword"
            }
            // fazer login na rota sign
            await request.agent(serverSign)
            .post("/")
            .send(userWrongPassword)
            .then((res) => {
                const responseBody: signUpResponse = res.body
    
                expect(res.status).toEqual(403);
                expect(responseBody).toEqual({ message:"Wrong credentials"})
            })
            expect(compare).toBeCalled()
        })

        it("should not be able to create a new user without email", async () => {
            // criar mock de dados do usuário sem email
            const mockUser = {
                email: "",
                password: "123456",
            }
            // realizar a request usando o supertest no servidor 2 vezes com o mesmo nick e emails diferentes
            const signAttempt = await request
                .agent(serverSign)
                .post("/")
                .send(mockUser)
    
                expect(signAttempt.status).toBe(422)
                expect(signAttempt.body).toEqual({ message:"Email not found on request body"})
        })

        it("should not be able to create a new user without email", async () => {
            // criar mock de dados do usuário sem email
            const mockUser = {
                email: "userSignSecondTests@gmail.com",
                password: "",
            }
            // realizar a request usando o supertest no servidor 2 vezes com o mesmo nick e emails diferentes
            const signAttempt = await request
                .agent(serverSign)
                .post("/")
                .send(mockUser)
    
                expect(signAttempt.status).toBe(422)
                expect(signAttempt.body).toEqual({ message:"Password not found on request body"})
        })
    })
})




