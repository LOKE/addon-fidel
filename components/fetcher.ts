// only alert about login redirect once;
let redirectAlerted = false;

interface FetchError extends Error {
  status?: number;
}

const LOGIN_PATH = "/auth";

export async function fetcher(input: RequestInfo, init?: RequestInit) {
  const resp = await fetch(input, init);

  if (!resp.ok) {
    if (resp.status === 401) {
      window.location.href = LOGIN_PATH;
    }
    if (resp.status === 403) {
      const errBody = await resp.json();
      if (errBody.message && !redirectAlerted) {
        redirectAlerted = true;
        alert(errBody.message);
      }
      window.location.href = LOGIN_PATH;
    }
    if (resp.status === 404) {
      return null;
    }

    let message = "Unknown Error";

    try {
      const errBody = await resp.json();
      if (errBody.message) {
        message = errBody.message;
      }
    } catch (jsonErr) {
      console.warn("error parsing error response", (jsonErr as Error).stack);
    }
    const err: FetchError = new Error(message);
    err.status = resp.status;

    throw err;
  }

  return resp.json();
}
