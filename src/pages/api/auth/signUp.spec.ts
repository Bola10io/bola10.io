import request from "supertest";
import http, { IncomingMessage, ServerResponse } from "http";
import { apiResolver }  from "next/dist/server/api-utils/node";
import signUp from "./signUp";
import { testHelper } from "../../../lib/testHelper"; //aqui estão os mocks de dados

describe("Sign Up API Routes tests", () => {

    // iniciar o "servidor" http, com a apiResolver do next
    let server: http.Server
    beforeAll(async () => {
        const requestHandler = (req: IncomingMessage, res: ServerResponse) => {
          apiResolver(
            req,
            res,
            undefined,
            signUp,
            testHelper.mockApiContext(),
            true
          );
        };

        server = http.createServer(requestHandler)
    })

    // fechar o servidor
    afterAll(() => {
        server.close();
    });
    
    // talvez apagar o usuário do prisma após cada teste

    it("should be able to create a new user", async () => {
        // pegar o mock dos dados do usuário
        const mockUser = {
            email: "bola10user@gmail.com",
            password: "123456",
            nickname: "bolinha",
        }

        // realizar a request usando o supertest no servidor iniciado
        const result = await request
            .agent(server)
            .post("/api/auth/signUp")
            .send(mockUser)

        expect(result.status).toBe(201)
        expect(result.body).toHaveProperty("token")
    })

    it("should not be able to create a user with email already in use", async () => {
        // criar mocks de dados do usuário
        const firstMockUser = {
            email: "testSameEmail@gmail.com",
            password: "123456",
            nickname: "1-nickSameEmailTest",
        }

        const secondMockUser = {
            email: "testSameEmail@gmail.com",
            password: "123456",
            nickname: "2-nickSameEmailTest",
        }

        // realizar a request usando o supertest no servidor 2 vezes com o mesmo email e nicks diferentes
        const firstSignUpAttempt = await request.agent(server).post("/api/auth/signUp").send(firstMockUser)
        const secondSignUpAttempt = await request.agent(server).post("/api/auth/signUp").send(secondMockUser)

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
        const firstSignUpAttempt = await request.agent(server).post("/api/auth/signUp").send(firstMockUser)
        const secondSignUpAttempt = await request.agent(server).post("/api/auth/signUp").send(secondMockUser)

        expect(secondSignUpAttempt.status).toBe(409)
        expect(secondSignUpAttempt.body).toEqual({ message:"Nickname already in use"})
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
            .post("/api/auth/signUp")
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
            .post("/api/auth/signUp")
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
            .post("/api/auth/signUp")
            .send(mockUser)

            expect(signUpAttempt.status).toBe(422)
            expect(signUpAttempt.body).toEqual({ message:"Nickname not found on request body"})
    })
})