export const optionalAuthenticate = async (request, reply) => {
  try {
    let token = request.headers['authorization'];
    console.log(`optionalAuthenticate` , token)

    if (!token) {
      request.userId = null;
    } else {
      await request.server.authenticate(request, reply);
    }
  } catch (err) {
    request.userId = null;
  }
};
