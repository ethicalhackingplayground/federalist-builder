const jwt = require("jsonwebtoken")
const request = require("request")

class CloudFoundryAuthClient {
  constructor() {
    this._username = process.env.DEPLOY_USER_USERNAME
    this._password = process.env.DEPLOY_USER_PASSWORD
    this._token = ""
  }

  accessToken() {
    return new Promise((resolve, revoke) => {
      if (this._tokenExpired()) {
        resolve(this._fetchNewToken())
      } else {
        resolve(this._token)
      }
    })
  }

  _fetchNewToken() {
    return this._sendNewTokenRequest().then((token) => {
      this._token = token
      return token
    })
  }

  _sendNewTokenRequest() {
    return new Promise((resolve, reject) => {
      request.post({
        url: this._tokenEndpoint(),
        auth: {
          username: "cf",
          password: "",
        },
        form: {
          grant_type: "password",
          username: this._username,
          password: this._password,
          response_type: "token",
        },
      }, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          resolve(JSON.parse(body).access_token)
        }
      })
    })
  }

  _tokenEndpoint() {
    return process.env.CLOUD_FOUNDRY_OAUTH_TOKEN_URL
  }

  _tokenExpired() {
    if (this._token) {
      let decodedToken = jwt.decode(this._token)
      return decodedToken.exp - (Date.now() / 1000) < 5
    } else {
      return true
    }
  }
}

module.exports = CloudFoundryAuthClient