import randomstring from 'randomstring'
import GunService from './gunservice'
import 'gun/gun'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'
import 'gun/sea'
import 'gun/lib/webrtc'

import path from './path'

const log = console.log

// dispatch an event throgh the document
function dispatch (e:any, p:any = null) {
  document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
}

//
export default class DiscoPeer {
  state: {
    auth: any,
    paths: any,
    rootNode: any,
    userPath: any,
    observablePaths: any,
    onEmit: any,
    onObserving: any,
    onAuth: any,
    onCreate: any,
    lastAnnounce: any,
    lastChat: any
  }
  gun: any
  userGun: any
  //
  static defaults(that: any) {
    const rnd = randomstring.generate()
    var auth = window.localStorage.getItem('auth')
    auth = auth
      ? JSON.parse(auth)
      : {
          username: randomstring.generate(),
          password: randomstring.generate(),
          handle: 'user',
          create: true
        }
    return {
      rootNode: rnd,
      userPath: null,
      auth,
      lastAnnounce: 0,
      lastChat: 0,
      paths: {
        announce: null,
        chat: null,
        users: null,
        groups: null,
        user: {
          friends: null,
          public: null,
          settings: null,
          chats: null
        }
      },
      observablePaths: [
        `${that.props.rootNode || rnd}/announce`,
        `${that.props.rootNode || rnd}/chat`,
        `${that.props.rootNode || rnd}/users`,
        `${that.props.rootNode || rnd}/groups`,
      ],
      onInit:   (gun: any) => that.handleInit(gun),
      onEmit:   (opath: any, node: any, valu: any, key: any) => that.handleEmit(opath, node, valu, key),
      onObserving: (path: any, obj: any) => that.handleObserving(path, obj),
      onAuth:   (user: any, auth: any) => that.auth(user, auth, false),
      onCreate: (user: any, auth: any) => that.auth(user, auth, true)
    }
  }
  props
  gunService: GunService
  static instance

  static getInstance(props) {
    log('getInstance')
    if(!DiscoPeer.instance) {
      DiscoPeer.instance = new DiscoPeer(props)
    }
    return DiscoPeer.instance
  }

  //
  constructor(props: any) {
    log('constructor')
    this.props = props
    this.state = Object.assign(DiscoPeer.defaults(this), {})
    this.gunService = new GunService(this.state)
  }

  //
  setState(state) {
    this.state = Object.assign(this.state, state)
  }

  // event
  auth(user: any, auth: any, newUser: any) {
    log('auth')
    this.userGun = user
    if (newUser) {
      delete this.state.auth.create
      this.gun
        .path(`${this.state.rootNode}/users`)
        .set(this.state.auth)
        .once((v:any, k:any) => {
          this.state.auth.hid = k
          this.gun.path(`${this.state.rootNode}/users/${k}`).put(this.state.auth)
          window.localStorage.setItem('auth', JSON.stringify(this.state.auth))
          log('auth', `auth saved for ${this.state.auth.username}`)
        })
    } else {
      this.gun
        .path(`${this.state.rootNode}/users/${this.state.auth.hid}`)
        .once((v:any, k:any) => {
          if(k !== this.state.auth.hid) {
            throw new Error('hids do not match')
          }
        })
    }
    this.initUserObservables(this.state.auth.hid)
    this.ready()
  }

  initUserObservables(hid:any) {
    log('initUserObservables')
    const uPath = this.state.userPath = `${this.state.rootNode}/users/${hid}`
    const obs = [
      `${uPath}/friends`,
      `${uPath}/public`,
      `${uPath}/settings`,
      `${uPath}/chats`
    ]
    this.state.observablePaths = Object.assign(this.state.observablePaths, obs)
    this.gunService.observe(obs)
  }

  // event
  ready() {
    log('ready')
    this.announce()
  }

  // event
  announce() {
    log('announce')
    const ann = {
      username: this.state.auth.username,
      timestamp: Date.now()
    }
    this.gun.path(this.state.observablePaths[0]).set(ann)
  }

  //
  handleInit(gun: any) {
    log('handleInit')
    this.gun = gun
    this.gun.path = path.bind(this.gun)
  }

  //
  handleAnnounce(v: any) {
    log('handleAnnounce')
    dispatch('announce', {
      username: v.username,
      timestamp: v.timestamp
    })
    this.state.lastAnnounce = v.timestamp
  }

  handleObserving(path: any, obj: any) {
    if (path === this.state.observablePaths[0]) {
      this.state.paths.announce = obj
      log('handleObserving', `observing ${this.state.observablePaths[0]}`)
    }
    if (path === this.state.observablePaths[1]) {
      this.state.paths.chat = obj
      log('handleObserving', `observing ${this.state.observablePaths[1]}`)
    }
    if (path === this.state.observablePaths[2]) {
      this.state.paths.users = obj
      log('handleObserving', `observing ${this.state.observablePaths[2]}`)
    }
    if (path === this.state.observablePaths[3]) {
      this.state.paths.groups = obj
      log('handleObserving', `observing ${this.state.observablePaths[3]}`)
    }
    if (path === this.state.observablePaths[4]) {
      this.state.paths.friends = obj
      log('handleObserving', `observing ${this.state.observablePaths[4]}`)
    }
    if (path === this.state.observablePaths[5]) {
      this.state.paths.public = obj
      log('handleObserving', `observing ${this.state.observablePaths[5]}`)
    }
    if (path === this.state.observablePaths[6]) {
      this.state.paths.settings = obj
      log('handleObserving', `observing ${this.state.observablePaths[6]}`)
    }
    if (path === this.state.observablePaths[7]) {
      this.state.paths.chats = obj
      log('handleObserving', `observing ${this.state.observablePaths[6]}`)
    }
  }

  //
  handleAnnounceInit(v: any) {
    log('handleAnnounceInit')
    Object.values(v).map((ee: any) => {
      this.gun
        .path(ee['#'])
        .once((vv: any, kk: any) => {
        dispatch('announce', {
          username: v.username,
          timestamp: v.timestamp
        })
        this.state.lastChat = v.timestamp
      })
    })
  }

  //
  handleAnnounces(node: any, valu: any, key: any) {
    log('handleAnnounces')
    node.map().once((v: any, k: any) => {
      if(v.username) { this.handleAnnounce(v)
      } else { this.handleAnnounceInit(v) }
    })
  }

  //
  handleChat(v:any) {
    log('handleChat')
    if(v.username !== this.state.auth.username) {
      dispatch('chat_message', {
        username: v.username,
        timestamp: v.timestamp,
        message: v.chat
      })
      this.state.lastChat = v.timestamp
    }
  }

  //
  handleChatInit(v:any) {
    log('handleChatInit')
    Object.values(v).map((ee: any) =>
      this.gun.path(ee['#']).once((vv: any, kk: any) => {
        dispatch('chat_message', {
          username: v.username,
          timestamp: v.timestamp,
          message: v.chat
        })
        this.state.lastChat = v.timestamp
      })
    )
  }

  //
  handleChats(node: any, valu: any, key: any) {
    log('handleChats')
    node.map().once((v: any, k: any) => {
      if(v.username) { this.handleChat(v)
      } else { this.handleChatInit(v) }
    })
  }

  //
  handleEmit(opath: any, node: any, valu: any, key: any) {
    if (opath === this.state.observablePaths[0]) {
      this.handleAnnounces(node, valu, key)
    }
    if (opath === this.state.observablePaths[1]) {
      this.handleChats(node, valu, key)
    }
  }

  //
  userList() {}

  //
  chatWith ( friend: any, newMessage: any ) {
    const friendFunc = (k, fb, msg) => {
      fb // friends/friendhid/chats/xxxxx
      .get('chats')
      .get(k)
      .get('messages')
      .set({
        username: this.state.auth.username,
        hid: this.state.auth.hid,
        timestamp: Date.now(),
        status: 'unread',
        message: msg
      })
    }
    Promise p = new Promise((resolve, reject) => {
      const friendBase = this.state.paths.friends.get(friend)   // friends/friendhid
      log('chatWith', `${newMessage}`)
      if (!this.state.paths.chat) {
        return
      }
      friendBase.once((v:any, k:any) => {
        if (v) {
          const friendChats = friendBase.get('chats')
          friendChats.once((vv, kk) => { // friends/friendhid/chats
            if(!vv) {
              friendChats.put({
                participants: [ this.state.auth.hid, friend ],
                timestamp: Date.now()  // friends/friendhid/chats/xxxxx
              }).once((v:any, k:any) => {
                friendFunc(k, friendBase, newMessage)
              })
            } else {
              const friendChats = friendBase.get('chats')
              friendFunc(k, friendBase, newMessage)
            }
          }) // else this person is not our friend
        }
      })
    })
  }

  async searchGroups() {

  }

  async searchUser() {

  }

  async addFriend(friend) {
    const p = new Promise((resolve, reject) => {
      const friendBase = this.state.paths.friends
      friendBase.get(friend).once((v, k) => {
        if(!v) {
          friendBase.get(friend).put({
            timestamp: Date.now(),
            status: 'pending',
            participants: [this.state.paths.hid, friend]
          })
        }
        resolve()
      })
    }
    return p
  }

  async getFriends() {
    const p = new Promise((resolve, reject) => {
      const arrOut = []
      const l = v !== null ? Object.keys(v).length : 0
      const friendBase = this.state.paths.friends
      friendBase.map().once((v: any, k: any) => {
        if(v.status === 'friends') {
          arrOut.push(v)
        }
        if(arrOut.length===l) {
          resolve(arrOut)
        }
      }
    })
    return p
  }

  async getFriendRequests() {
    const p = new Promise((resolve, reject) => {
      const arrOut = []
      const l = v !== null ? Object.keys(v).length : 0
      const friendBase = this.state.paths.friends

      friendBase.map().once((v: any, k: any) => {
        if(v.status === 'pending') {
          arrOut.push(v)
        }
        if(arrOut.length===l) {
          resolve(arrOut)
        }
      })
    })
    return p
  }

  async approveFriendRequest(friendReq) {
    const p = new Promise((resolve, reject) => {
      const arrOut = []
      const friendBase = this.state.paths.friends.get(friendReq)
      friendBase.once((v, k) => {
        if(v && v.status === 'pending') {
          v.status = 'friends'
          friendBase.put(v).once(() => resolve(true))
        }
      })
    })
    return p
  }

  async removeFriend(friend) {

  }

  async createGroup(group) {

  }

  async deleteGroup(group) {

  }

  async joinGroup(group) {

  }

  async leaveGroup(group) {

  }

  async postToGroup(group) {

  }

  async postToWall(group) {

  }

  async postToPublic(group) {

  }
}
