const WordService = require('../services/wordService');
const jwt = require('jsonwebtoken');

const wordService = new WordService();


exports.define = async (req, res) => {
  const word = req.query.word;
  if (!word) {
    return res.status(400).json({ message: "no word provided" });
  }
  try {
    const wordPartAndDefinitions = await wordService.getWordPartAndDefinitions(word); 
    // return full word object if found in mongo
    if (wordPartAndDefinitions) {
      return res.send({
        ...wordPartAndDefinitions,
        word,
      });
    }
		return res.status(400).json({ message: "word not found" });

  } catch (error) {
    console.log("error in api lookup: something went wrong", error);
    return res.status(500).json({ message: "internal error ... something went wrong" });
  }
}









// exports.token = async (req, res) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken) return res.status(401).json({ message: 'Missing token' });
//   try {
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     const { id, email } = decoded;
//     // check redis for refresh token
//     const storedRefreshToken = await tokenService.getRefreshToken(id);
//     if (!storedRefreshToken) {
//       return res.status(401).json({ message: 'Invalid token' });
//     }
//     if (refreshToken !== storedRefreshToken) {
//       console.log('attempt made to use invalidated token');
//       return res.status(403).json({ message: 'Invalid token' });
//     }
//     // return a new access token since refresh token is valid
//     const token = await tokenService.updateAccessToken(id, email);
//     return token
//       ? res.json({ success: true, token })
//       : res.status(500).json({ success: false, message: 'Error generating token' });
//   } catch (error) {
//     console.log('error refreshing token ', error);
//     return res.status(403).json({ message: 'Invalid token' });
//   }
// };
