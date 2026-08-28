const authErrorMessages = {
  ALL_FIELDS_MUST_BE_FILLED: "Please fill in all fields.",
  INCORRECT_EMAIL: "No account found with that email.",
  INCORRECT_PASSWORD: "Incorrect password.",
  EMAIL_ALREADY_IN_USE: "An account with that email already exists.",
};

export const getAuthErrorMessage = (error) => {
  const code = error?.response?.data?.error;

  if (code && authErrorMessages[code]) {
    return authErrorMessages[code];
  }

  if (!error?.response) {
    return "Can't reach the server. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
};
