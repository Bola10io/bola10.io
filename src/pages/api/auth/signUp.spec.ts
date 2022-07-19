import signUpInMemory from "./signUpInMemory";

interface SignUpRequest {
      email: string;
      password: string;
      nickname: string;
  }

describe("Authenticate User", () => {

    it("should be able to create a new user", async () => {
        const requestBody: SignUpRequest = {
                email: "lucaseverest@gmail.com.br",
                nickname: "Lucas Everest",
                password: "123456"
        }

        const result = await signUpInMemory(requestBody)

        expect(result).toHaveProperty("token")
    } )
})