exports.isValid = function (email, password) {
  return email && password;
};

exports.isValidRegistration = function (name, email, password) {
  return name && email && password;
};
