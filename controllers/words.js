const WordService = require('../services/wordService');
const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');

const wordService = new WordService();
const userService = new UserService();

exports.deleteCart = async (req, res) => {
    try {
      const user = await userService.getUser(req.userId);
      if (!user) {
        console.log('unable to find user in deleteCart route .. internal error');
        return res
          .status(400)
          .json({ message : 'User not found' });
      }
      await user.emptyCart();
      return res.status(200).json({ message : 'success' });
    } catch (e) {
      console.log({ errorMessage: e.message });
      res.status(500).json({ message : 'oops... something went wrong' });
    }
  }

exports.removeWordFromCart = async (req, res) => {
  let id = req.params.id;
  try {
    const user = await userService.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'unable to find user profile' });
    }
    // leaky abstraction ?
    user.removeFromCart(id);
    return res.status(200).json({ message: 'success' });
  } catch (e) {
    console.log({ errorMessage: e.message });
    res.status(500).json({ message: 'oops... something went wrong' });
  }
};

exports.addWordToCart = async (req, res) => {
  let { word } = req.body;
  const { userId } = req;
  if (!word) {
    return res.status(400).json({ message: 'no word provided' });
  }
  word = word.toLowerCase();
  try {
    const user = await userService.getUser(userId);
    if (!user) {
      console.log("can't find user in mongo for some reason");
      return res.status(400).json('unable to find user in addWord route');
    }
    console.log({ user });
    // find mongoose word object - must be here since it was previously searched
    const wordObj = await wordService.getWordFromDb(word);
    if (!wordObj) {
      return res.status(400).send("can't find word in db");
    }
    user.addToCart(wordObj._id);
    // id in wordobj needed for reference when deleting
    return res.json(wordObj); // word, part, definitions, _id
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: 'internal error ... something went wrong' });
  }
};

exports.define = async (req, res) => {
  const word = req.query.word;
  if (!word) {
    return res.status(400).json({ message: 'no word provided' });
  }
  try {
    const wordPartAndDefinitions = await wordService.getWordPartAndDefinitions(
      word,
    );
    // return full word object if found in mongo
    if (wordPartAndDefinitions) {
      return res.send({
        ...wordPartAndDefinitions,
        word,
      });
    }
    return res.status(400).json({ message: 'word not found' });
  } catch (error) {
    console.log('error in api lookup: something went wrong', error);
    return res
      .status(500)
      .json({ message: 'internal error ... something went wrong' });
  }
};

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
