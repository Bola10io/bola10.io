import request from "supertest";
import http, { IncomingMessage, ServerResponse } from "http";
import { apiResolver }  from "next/dist/server/api-utils/node";
import signup from "../signup";
import { testHelper } from "../../../../lib/testHelper"; //aqui estão os mocks de dados
import jsonwebtoken, { sign } from "jsonwebtoken";
import prismaClient from "../../../../prisma";
import { User } from "@prisma/client";

const signUpUser = {
    email: "signUptestgmail.com",
    password: "123456",
    nickname: "signUpNick"
};

interface signUpResponse {
    token: string;
    user: User;
    message: string;
}

describe("Sign Up API Routes tests", () => {

    // iniciar o "servidor" http, com a apiResolver do next
    let server: http.Server
    beforeAll(async () => {
        const requestHandler = (req: IncomingMessage, res: ServerResponse) => {
          apiResolver(
            req,
            res,
            undefined,
            signup,
            testHelper.mockApiContext(),
            true
            );
        };
        
        server = http.createServer(requestHandler)
    })

    // apagar usuários criados no banco depois de cada teste caso tenham sido criados
    afterEach(async () => {
        const user = await prismaClient.user.findFirst({
            where: {
                email: signUpUser.email
            }
        })

        if(user) {
            await prismaClient.user.delete({
                where: {
                    email: signUpUser.email
                }
            })
        }
    })
    
    // fechar o servidor
    afterAll(() => {
        server.close();
    });

    it("should be able to create a new user and return this user", async () => {
        // realizar a request usando o supertest no servidor iniciado
        await request
            .agent(server)
            .post("/api/auth/signup")
            .send(signUpUser)
            .then((res) => {
                const responseBody: signUpResponse = res.body

                expect(res.status).toBe(201)
                expect(responseBody).toHaveProperty("user")
                expect(responseBody.message).toEqual("User created successfully")
            })

    })

    it("should not be able to create a user with email already in use", async () => {

        // realizar a request usando o supertest no servidor 2 vezes com o mesmo email e nicks diferentes
        const firstSignUpAttempt = await request.agent(server).post("/api/auth/signup").send(signUpUser)
        const secondSignUpAttempt = await request.agent(server).post("/api/auth/signup").send(signUpUser)

        expect(secondSignUpAttempt.status).toBe(409)
        expect(secondSignUpAttempt.body).toEqual({ message:"Email already in use"})
    })

    it("should not be able to create a user with nickname already in use", async () => {
        // criar mocks de dados do usuário
        const firstMockUser = {
            email: "1-testSameNickname@gmail.com",
            password: "123456",
            nickname: "nickSameNickTest",
        }
        const secondMockUser = {
            email: "2-testSameNickname@gmail.com",
            password: "123456",
            nickname: "nickSameNickTest",
        }

        // realizar a request usando o supertest no servidor 2 vezes com o mesmo nick e emails diferentes
        const firstSignUpAttempt = await request.agent(server).post("/api/auth/signup").send(firstMockUser)
        const secondSignUpAttempt = await request.agent(server).post("/api/auth/signup").send(secondMockUser)

        
        expect(secondSignUpAttempt.status).toBe(409)
        expect(secondSignUpAttempt.body).toEqual({ message:"Nickname already in use"})

        // apagar o usuário criado pro teste
        await prismaClient.user.delete({
            where: {
                email: firstMockUser.email
            }
        })
    })

    it("should not be able to create a new user without email", async () => {
        // criar mock de dados do usuário sem email
        const mockUser = {
            email: "",
            password: "123456",
            nickname: "nickWithoutEmailTest",
        }

        // realizar a request usando o supertest no servidor 2 vezes com o mesmo nick e emails diferentes
        const signUpAttempt = await request
            .agent(server)
            .post("/api/auth/signup")
            .send(mockUser)

            expect(signUpAttempt.status).toBe(422)
            expect(signUpAttempt.body).toEqual({ message:"Email not found on request body"})
    })

    it("should not be able to create a new user without password", async () => {
        // criar mock de dados do usuário sem password
        const mockUser = {
            email: "withoutPasswordEmailTest",
            password: "",
            nickname: "nickWithoutEmailTest",
        }

        // realizar a request usando o supertest no servidor 2 vezes com o mesmo nick e emails diferentes
        const signUpAttempt = await request
            .agent(server)
            .post("/api/auth/signup")
            .send(mockUser)

            expect(signUpAttempt.status).toBe(422)
            expect(signUpAttempt.body).toEqual({ message:"Password not found on request body"})
    })

    it("should not be able to create a new user without nickname", async () => {
        // criar mock de dados do usuário sem nickname
        const mockUser = {
            email: "withoutPasswordEmailTest",
            password: "123456",
            nickname: "",
        }

        // realizar a request usando o supertest no servidor 2 vezes com o mesmo nick e emails diferentes
        const signUpAttempt = await request
            .agent(server)
            .post("/api/auth/signup")
            .send(mockUser)

            expect(signUpAttempt.status).toBe(422)
            expect(signUpAttempt.body).toEqual({ message:"Nickname not found on request body"})
    })


    it("shold create a new token and return this token", async () => {
        //mockar a função sign do jsonwebtoken
        jest.spyOn(jsonwebtoken, "sign").mockImplementation(() => {
            return "jwt_token"
        })
        // criar user na rota signup
        await request.agent(server)
        .post("/")
        .send(signUpUser)
        .then((res) => {
            
            const responseBody: signUpResponse = res.body

            expect(res.status).toEqual(201);
            expect(responseBody.token).toEqual("jwt_token");
        })
        expect(jsonwebtoken.sign).toHaveBeenCalled()
    })
    
    
    it("shold call prisma.create", async () => {
        jest.spyOn(prismaClient.user, "create")
        // criar user na rota signup
        await request.agent(server)
        .post("/")
        .send(signUpUser)
        
        expect(prismaClient.user.create).toHaveBeenCalledTimes(1)
    })
})
