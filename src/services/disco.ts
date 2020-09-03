import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';

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
    lastChat: any,
    events: {
      onReady: any,
      onObserving: any,
      onAnnounce: any
    }
  }
  gun: any
  userGun: any
  //
  static defaults(that: any) {
    const rnd = 'OBEY'//randomstring.generate()
    var auth = window.localStorage.getItem('auth')
    auth = auth
      ? JSON.parse(auth)
      : {
          username: randomstring.generate(),
          password: randomstring.generate(),
          handle: DiscoPeer.uniqueName(),
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
      onCreate: (user: any, auth: any) => that.auth(user, auth, true),
      events: {}
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

  static uniqueName() {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals]
    })
    .split('_')
    .map(e => e.charAt(0).toUpperCase() + e.slice(1))
    .join('')
  }

  //
  constructor(props: any) {
    log('constructor')
    this.props = props
    this.state = Object.assign(DiscoPeer.defaults(this), props)
    this.gunService = new GunService(this.state)
    this.handleObserving = this.handleObserving.bind(this)
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
      const usersNode = this.gun.path(`${this.state.rootNode}/users`)
      usersNode.set(this.state.auth)
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
    this.state.observablePaths = this.state.observablePaths.concat(obs)
    this.gunService.observe(obs)
  }

  // event
  ready() {
    log('ready')
    if(this.state.events.onReady) {
      this.state.events.onReady()
    }
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
    if(this.state.events.onAnnounce) {
      this.state.events.onAnnounce(ann)
    }
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
      hid: v.hid,
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
      this.state.paths.user.friends = obj
      log('handleObserving', `observing ${this.state.observablePaths[4]}`)
    }
    if (path === this.state.observablePaths[5]) {
      this.state.paths.user.public = obj
      log('handleObserving', `observing ${this.state.observablePaths[5]}`)
    }
    if (path === this.state.observablePaths[6]) {
      this.state.paths.user.settings = obj
      log('handleObserving', `observing ${this.state.observablePaths[6]}`)
    }
    if (path === this.state.observablePaths[7]) {
      this.state.paths.user.chats = obj
      log('handleObserving', `observing ${this.state.observablePaths[7]}`)
    }
    if(this.state.events.onObserving) {
      this.state.events.onObserving(path)
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
    // log('handleChats')
    // node.map().once((v: any, k: any) => {
    //   if(v.username) { this.handleChat(v)
    //   } else { this.handleChatInit(v) }
    // })
  }

  //
  handleFriends(node: any, valu: any, key: any) {
    log('handleFriends')
    node.map().once((v: any, k: any) => {
      if(v.username) { this.handleFriend(node, valu, key)
      } else { this.handleFriendInit(node, valu, key) }
    })
  }

  //
  handleFriendInit(node: any, valu: any, key: any) {
    log('handleFriendInit')
  }

  //
  handleFriend(node: any, valu: any, key: any) {
    log('handleFriend', valu)
  }

  //
  handleEmit(opath: any, node: any, valu: any, key: any) {
    // announce
    if (opath === this.state.observablePaths[0]) {
      this.handleAnnounces(node, valu, key)
    }
    // global chat (TODO: remove this. )
    if (opath === this.state.observablePaths[1]) {
      this.handleChats(node, valu, key)
    }
    // user friends. observed to receive friend requests
    if (opath === this.state.observablePaths[4]) {
      this.handleFriends(node, valu, key)
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
    })x
  }

  async searchGroups() {

  }

  async searchUser() {

  }

  addFriend(friend, callback) {
    log('addFriend', `${friend}`)
    const friendBase = this.state.paths.user.friends
    friendBase.get(friend).once((v) => {
      if(v) { return callback() }
      friendBase.set({
        timestamp: Date.now(),
        status: 'pending'
      }).once((vv, kk) => {
        const participantsBase = friendBase.get(kk).get('participants')
        [this.state.paths.hid, friend].forEach((e) => participantsBase.set(e))
      })
      if(callback) { callback() }
    })
  }

  getUsers(callback) {
    const userBase = this.state.paths.users
    userBase.once((v: any, k: any) => {
      if(callback) { callback(null, v) }
    })
  }

  getFriends(callback) {
    const friendsBase = this.state.paths.user.friends
    friendsBase.once((v: any, k: any) => {
      if(callback) { callback(null, v) }
    })
  }

  getFriendRequests(callback) {
    const friendsBase = this.state.paths.user.friends
    friendsBase.once((v: any, k: any) => {
      if(callback) { callback(null, v) }
    })
  }

  approveFriendRequest(friend, callback) {
    const friendBase = this.state.paths.user.friends.get(friend)
    friendBase.once((v, k) => {
      if(v && v.status === 'pending') {
        v.status = 'friends'
        friendBase.put(v).on(() => {
          if(callback) { callback() }
        })
      }
    })
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
