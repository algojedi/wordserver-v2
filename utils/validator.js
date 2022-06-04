exports.isValidLogin = function (email, password) {
  return email && password;
};

exports.isValidRegistration = function (name, email, password) {
  return name && email && email.length > 3 && password && password.length > 3;
};
