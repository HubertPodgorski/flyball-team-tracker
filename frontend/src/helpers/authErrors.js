const authErrorKeys = {
  ALL_FIELDS_MUST_BE_FILLED: "authErrors.allFieldsRequired",
  INCORRECT_EMAIL: "authErrors.incorrectEmail",
  INCORRECT_PASSWORD: "authErrors.incorrectPassword",
  EMAIL_ALREADY_IN_USE: "authErrors.emailInUse",
  INVALID_CLUB_CODE: "authErrors.invalidClubCode",
};

export const getAuthErrorMessage = (error, t) => {
  const code = error?.response?.data?.error;

  if (code && authErrorKeys[code]) {
    return t(authErrorKeys[code]);
  }

  if (!error?.response) {
    return t("authErrors.networkError");
  }

  return t("authErrors.genericError");
};
