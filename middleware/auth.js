const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // auth header should have the following format: 'Bearer token'
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'unauthorized' });

/*
  const someId = '6275c73824e2991946c58d06';
  let reply = await redisClient.get(someId);
  const tokens = JSON.parse(reply)
  const message = reply ? 'good stuff' : 'no token found';
	*/


  // TODO: check if token is valid in redis as well
  let decoded
  try {
		// verfiying token using secret confirms that we sent must have created it 
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('decoded: ', decoded);
  } catch (err) {
		// error can be due to expired token or invalid token
    console.log('error verifying token: ', err);
    return res.status(403).json({ message: 'invalid token' });
  }
  const { id, email } = decoded;
  // decoded:  { id: ..,  email: 'Jelvis@jelvis.com', iat: 1652018132, exp: 1652450132 }
  req.user = { id, email };
  next();
};
