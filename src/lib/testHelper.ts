import { User } from "@prisma/client"
import { uuid as uuidv4 } from "uuidv4"


export const testHelper = {
    mockApiContext: () => ({
      previewModeEncryptionKey: '',
      previewModeId: '',
      previewModeSigningKey: '',
    }),
    
    mockUser: () => ({
        id: uuidv4(),
        email: "bola10useremail@gmail.com",
        password: "123456",
        nickname: "bolinha",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        language: null,
        displayName: null,
        name: null,
        permissions: [],
        phone: null,
        pixKey: null,
        stripeId: null,
        subscriptionId: null
    } as User)
}