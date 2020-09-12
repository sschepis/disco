// import a CSS module
import Gun = require("../../node_modules/gun/gun")
import "gun/sea"
import "gun/lib/webrtc"
import "gun/lib/radix"
import "gun/lib/radisk"
import "gun/lib/store"
import "gun/lib/rindexed"
import 'gun/lib/open'
import 'gun/lib/load'
import 'gun/lib/unset'

import randomstring from "randomstring"
import path from './path'

const peers = [
  "https://localhost:8765/gun",
  "https://me2peer-gun-relay.herokuapp.com/gun",
  //"http://gunjs.herokuapp.com/gun"
]

export default class GunService {
  state: any
  constructor(props: any) {
    this.state = Object.assign({
      gun: new Gun(peers),
      user: null,
      observedNodes: {}
    }, props )
    if (this.state.onInit) {
      this.state.onInit(this.state.gun)
    }
    this.state.user = this.state.gun.user()
    if (this.state.auth) {
      const a = this.state.auth
      if (a.create) {
        const username = a.username || randomstring.generate()
        const password = a.password || randomstring.generate()
        this.state.auth = Object.assign({
          username,
          password
        }, this.state.auth )
        this.state.user.create(username, password)
      } else {
        const username = a.username
        const password = a.password
        this.state.auth = Object.assign({}, this.state.auth)
        if (!username || !password) {
          throw new Error("Username and password must be provided!")
        }
        this.state.user.auth(username, password)
      }
      this.state.gun.on("auth", () => {
        if (this.state.onCreate && this.state.auth.create) {
          this.state.onCreate(this.state.user, this.state.auth)
        } else if (this.state.onAuth) {
          this.state.onAuth(this.state.user, this.state.auth)
        }
      })
      this.observe(Object.values(this.state.observablePaths))
    }
  }

  observe(paths: any) {
    paths.forEach((opath: any) => {
      const gunPath = this.gun.get(opath)
      gunPath.on((valu: any, key: any) => {
        if (this.state.onEmit) {
          this.state.onEmit(opath, gunPath, valu, key)
        }
      })
      if (this.state.onObserving) {
        this.state.onObserving(opath, gunPath)
      }
      this.state.observedNodes[opath] = gunPath
    })
  }

  get is() { return this.state.user.is }
  get userGun() { return this.state.user.is ? this.state.user : this.state.gun }
  get user() { return this.state.user.is ? this.state.user : null }
  get gun() { return this.state.gun }
}
