import { optionalAuthenticate } from "../plugins/optional-auth.js"
import {
    changeUserNameSchema,
    uploadAvatarSchema
} from "../schemas/user.schema.js"
import { changeNameOfUser, findUserByAddress, findUserByName, updateUserAvatar } from "../services/users.service.js"

import type { AppInstance } from "../types.js"
import configureFileUpload from "../utils/s3.js"


export default async (app: AppInstance) => {
    await configureFileUpload(app);

    app.get("/profile/:_name", {
        schema: {
            tags: ["User"],
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {

            try {
                let { address, name } = request as any
                let { _name } = request.params as any
                let user: any


                if (name == _name) {
                    user = await findUserByAddress(address)
                } else {
                    user = await findUserByAddress(_name)
                }


                return reply.status(200).send({
                    message: "OK",
                    data: user
                })
            } catch (error) {
                console.log(error)
                return reply.status(500).send({
                    message: "Internal Server Error"
                })
            }
        }
    })


    app.put("/change-name", {
        schema: {
            tags: ["User"],
            body: changeUserNameSchema
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            const { new_name } = request.body
            try {
                let { userId } = request as any
                //check exist
                let check = await findUserByName(new_name)
                if (check) {
                    return reply.status(400).send({
                        message: "Existed",
                    })
                } else {
                    //update name
                    await changeNameOfUser(userId, new_name)
                }

                return reply.status(200).send({
                    message: "OK",
                    data: {
                        name: new_name
                    }
                })
            } catch (error) {
                console.log(error)
                return reply.status(500).send({
                    message: "Internal Server Error"
                })
            }
        }
    })


    app.post("/avatar", {
        schema: {
            tags: ["User"],
            body: uploadAvatarSchema
        },
        onRequest: app.authenticate,
        handler: async (request, reply) => {
            try {
                const { userId } = request;
                const { mimeType, fileSize } = request.body

                // Upload file lên S3
                const result = await app.uploadFileToS3(mimeType, 'users/avatars', userId.toString(), fileSize);

                // Cập nhật avatar trong database
                await updateUserAvatar(userId, result.key);

                return reply.status(200).send({
                    message: "Avatar uploaded successfully",
                    data: result,
                });
            } catch (err) {
                console.error(err);
                return reply.status(500).send({ message: "Failed to upload avatar" });
            }
        }
    });

}
