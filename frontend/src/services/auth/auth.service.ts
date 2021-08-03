import Auth0Lock from "auth0-lock";
import gql from "graphql-tag";

import store from "../../store";
import apollo from "../../apollo";
import { loginSuccessful, logoutActionCreator } from "./auth.state";

const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID as string;
const FRONTEND_URL = process.env.PUBLIC_URL;

if (
  typeof AUTH0_DOMAIN !== "string" ||
  AUTH0_DOMAIN.length === 0 ||
  typeof AUTH0_CLIENT_ID !== "string" ||
  AUTH0_CLIENT_ID.length === 0
) {
  console.error(
    `REACT_APP_AUTH0_DOMAIN and REACT_APP_AUTH0_CLIENT_ID must be set #EgglMa`,
    { AUTH0_DOMAIN, AUTH0_CLIENT_ID }
  );
  globalThis.alert(
    `ERROR\n\nREACT_APP_AUTH0_DOMAIN and REACT_APP_AUTH0_CLIENT_ID are missing. #rWAzIR`
  );
}

if (
  globalThis.navigator.userAgent.indexOf("Chrome") === -1 &&
  globalThis.navigator.userAgent.indexOf("Safari") !== -1
) {
  globalThis.alert(
    `ERROR\n\nSorry, but login doesn't work in Safari. We don't know why. ` +
      `If we figure it out and fix it, we'll remove this notice. ` +
      `In the meantime, sorry, please use Chrome (not Incognito) or Firefox.\n#94uzBG`
  );
}

const TOKEN_STORAGE_KEY = "_authToken";
const USER_ID_STORAGE_KEY = "_userId";
const ROLES_STORAGE_KEY = "_roles";

const storage = window.sessionStorage;

const lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
  auth: {
    responseType: "token id_token",
    redirect: false,
    redirectUrl: FRONTEND_URL,
    params: {
      scope: "openid profile email",
    },
  },
});

lock.on("authorization_error", (error) => {
  debugger;
});
lock.on("unrecoverable_error", (error) => {
  debugger;
});

lock.on("authenticated", (authResult: AuthResult) => {
  if (typeof authResult.idTokenPayload === "undefined") {
    alert(
      `ERROR\n\nThere was an unexpected error during login. Please try again. If this fails again, please let us know and send us the error code: #efi8Kg`
    );
    throw new Error("Missing idTokenPayload #ajk9nu");
  }

  const userId = authResult.idTokenPayload.sub;
  const roles = (authResult.idTokenPayload as any)[
    "https://hasura.io/jwt/claims"
  ]["x-hasura-allowed-roles"];

  storage.setItem(TOKEN_STORAGE_KEY, authResult.idToken);
  storage.setItem(USER_ID_STORAGE_KEY, userId);

  storage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));

  store.dispatch(loginSuccessful(userId, roles));
});

export const showLock = () => {
  lock.show();
};

export const logout = () => {
  storage.clear();
  store.dispatch(logoutActionCreator());
  lock.logout({ returnTo: FRONTEND_URL });
};

export const getToken = () => {
  return storage.getItem(TOKEN_STORAGE_KEY);
};

export const getUserId = () => {
  return storage.getItem(USER_ID_STORAGE_KEY);
};

export const getRoles = (): string[] => {
  return JSON.parse(storage.getItem(ROLES_STORAGE_KEY) || `["user"]`);
};

export const userHasRole = (role: string) => {
  const roles = getRoles();
  return roles.indexOf(role) !== -1;
};

// We need to re-read these from `storage` on startup to ensure that our redux
// store is kept up to date.
export const startup = () => {
  const userId = getUserId();
  const roles = getRoles();
  if (!!userId && !!roles && roles.length > 0) {
    // Try to make a GraphQL request to ensure that we have a valid JWT
    apollo
      .query({
        query: gql`
          query StartupProfile($user_id: String!) {
            user_profiles(where: { user_id: { _eq: $user_id } }) {
              id
            }
          }
        `,
        variables: {
          user_id: userId,
        },
      })
      .then((result) => {
        store.dispatch(loginSuccessful(userId, roles));
      })
      .catch((error) => {
        alert(`GraphQL Error #9yhFiw: ${error.message}`);
      });
  }
};

// We have a circular import here. The `apollo.ts` file imports this file, and
// this file imports `apollo` from `apollo.ts`. Therefore we need to trigger the
// `startup()` call in the next flush, hence the `setTimeout()` here.
setTimeout(startup, 0);
