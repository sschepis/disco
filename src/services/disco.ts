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

function user(i) {
  return {
    hid: i.hid,
    username: i.username,
    handle: i.handle,
    timestamp: Date.now()
  }
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
    const rnd = 'flnuixahktnuf33333nKBFBs'//randomstring.generate()
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
          feed: null,
          settings: null,
          chats: null,
          incoming: null
        }
      },
      observablePaths: {
        announcePath: `${that.props.rootNode || rnd}/announce`,
        chatsPath: `${that.props.rootNode || rnd}/chats`,
        usersPath: `${that.props.rootNode || rnd}/users`,
        groupsPath: `${that.props.rootNode || rnd}/groups`
      },
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

  // get the peer engine instance
  static getInstance(props) {
    log('getInstance')
    if(!DiscoPeer.instance) {
      DiscoPeer.instance = new DiscoPeer(props)
    }
    return DiscoPeer.instance
  }

  // generate a unique name
  static uniqueName() {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals]
    })
    .split('_')
    .map(e => e.charAt(0).toUpperCase() + e.slice(1))
    .join('')
  }

  // service constructor = set up dependencies
  constructor(props: any) {
    log('constructor')
    this.props = props
    this.state = Object.assign(DiscoPeer.defaults(this), props)
    this.gunService = new GunService(this.state)
    this.handleObserving = this.handleObserving.bind(this)
  }

  // set the state of the service
  setState(state) {
    this.state = Object.assign(this.state, state)
  }

  // event
  auth(user: any, auth: any, newUser: any) {
    const self = this
    log('auth')
    this.userGun = user
    const authMethod = newUser ? 'register' : 'login'
    this[authMethod]((err, hid) => {
      if(err) throw err
      self.initUserObservables(hid)
      self.ready()
    })
  }

  register(callback) {
    log('register', `registering ${this.state.auth.username}`)
    delete this.state.auth.create
    const usersNode = this.gun.get(`${this.state.rootNode}/users`)
    usersNode.set({
      username: this.state.auth.username,
      handle: this.state.auth.handle,
      timestamp: Date.now()
    })
    .once((v:any, k:any) => {
      this.state.auth.hid = k
      this.gun
      .get(`${this.state.rootNode}/users/${k}`)
      .put({
        hid: this.state.auth.hid,
        username: this.state.auth.username,
        handle: this.state.auth.handle,
        timestamp: Date.now()
      })
      window.localStorage.setItem('auth', JSON.stringify(this.state.auth))
      log('register', `auth saved for ${this.state.auth.username}`)
      callback(null,k)
    })
  }

  login(callback) {
    this.gun
    .get(`${this.state.rootNode}/users/${this.state.auth.hid}`)
    .once((v:any, k:any) => {
      callback(null,k)
    })
  }

  initUserObservables(hid:any) {
    log('initUserObservables')
    const obs = {
      userFriendsPath: `${hid}/friends`,
      userFeedPath: `${hid}/feed`,
      userSettingsPath: `${hid}/settings`,
      userChatsPath: `${hid}/chats`,
      userIncomingMessagesPath: `${hid}/incoming`
    }
    this.state.observablePaths = Object.assign(this.state.observablePaths, obs)
    this.gunService.observe(Object.values(obs))
  }

  // event
  ready() {
    log('ready')
    if(this.state.events.onReady) {
      this.state.events.onReady()
    }
    dispatch('ready')
    this.announce()
  }

  // event
  announce() {
    log('announce')
    const ann = {
      hid: this.state.auth.hid,
      username: this.state.auth.username,
      handle: this.state.auth.handle,
      timestamp: Date.now()
    }
    this.gun.get(this.state.observablePaths.announcePath).set(ann)
    if(this.state.events.onAnnounce) {
      this.state.events.onAnnounce(ann)
    }
    dispatch('announce', ann)
  }

  //
  handleInit(gun: any) {
    log('handleInit')
    this.gun = gun
  }

  handleObserving(path: any, obj: any) {
    if (path === this.state.observablePaths.announcePath) {
      this.state.paths.announce = obj
      log('handleObserving', `observing ${this.state.observablePaths.announcePath}`)
    }
    if (path === this.state.observablePaths.chatsPath) {
      this.state.paths.chats = obj
      log('handleObserving', `observing ${this.state.observablePaths.chatsPath}`)
    }
    if (path === this.state.observablePaths.usersPath) {
      this.state.paths.users = obj
      log('handleObserving', `observing ${this.state.observablePaths.usersPath}`)
    }
    if (path === this.state.observablePaths.groupsPath) {
      this.state.paths.groups = obj
      log('handleObserving', `observing ${this.state.observablePaths.groupsPath}`)
    }
    if (path === this.state.observablePaths.userFriendsPath) {
      this.state.paths.user.friends = obj
      log('handleObserving', `observing ${this.state.observablePaths.userFriendsPath}`)
    }
    if (path === this.state.observablePaths.userFeedPath) {
      this.state.paths.user.feed = obj
      log('handleObserving', `observing ${this.state.observablePaths.userFeedPath}`)
    }
    if (path === this.state.observablePaths.userSettingsPath) {
      this.state.paths.user.settings = obj
      log('handleObserving', `observing ${this.state.observablePaths.userSettingsPath}`)
    }
    if (path === this.state.observablePaths.userChatsPath) {
      this.state.paths.user.chats = obj
      log('handleObserving', `observing ${this.state.observablePaths.userChatsPath}`)
    }
    if (path === this.state.observablePaths.userIncomingMessagesPath) {
      this.state.paths.user.incoming = obj
      log('handleObserving', `observing ${this.state.observablePaths.userIncomingMessagesPath}`)
    }
    if(this.state.events.onObserving) {
      this.state.events.onObserving(path)
    }
  }

  //
  handleAnnounces(node: any, valu: any, key: any) {
    log('handleAnnounces')
    node.map().once((v: any, k: any) => {
      if(v.username) {
        v.hid = k
        this.handleAnnounce(v)
      }
    })
  }

  //
  handleAnnounce(v: any) {
    log('handleAnnounce')
    dispatch('announce',user(v))
    this.state.lastAnnounce = v.timestamp
  }

  //
  handleChat(v:any) {
    log('handleChat')
    if(v.username !== this.state.auth.username) {
      dispatch('chat_message', {
        username: v.username,
        timestamp: v.timestamp,
        handle: v.handle,
        message: v.chat
      })
      this.state.lastChat = v.timestamp
    }
  }

  //
  handleChats(node: any, valu: any, key: any) {
    log('handleChats')
    node.map().once((v: any, k: any) => {
      if(v.username) {
        v.hid = k
        this.handleChat(v)
      }
    })
  }

  //
  handleFriends(node: any, valu: any, key: any) {
    log('handleFriends')
    node.map().once((v: any, k: any) => {
      if(v.username) {
        v.hid = k
        this.handleFriend(node, v, k)
      }
    })
  }

  //
  handleFriend(node: any, valu: any, key: any) {
    log('handleFriend', valu)
  }

  //
  handleIncomings(node: any, valu: any, key: any) {
    log('handleIncomings')
    node.map().once((v: any, k: any) => {
      if (!v) { return }
      v.hid = k
      this.handleIncoming(node, v, k)
    })
  }

  //
  handleIncoming(node: any, valu: any, key: any) {
    if(!valu || (valu && !valu.type)) { return }
    log('handleIncoming', valu)
    if(valu.type === 'friendrequestapproved') {
      this.handleApproveFriendRequest(node, valu, key)
    }
    else if(valu.type === 'chatrequest') {
      this.handleChatRequest(node, valu, key)
    }
  }

  handleApproveFriendRequest(node: any, valu: any, key: any) {
    const friendBase = this.state.paths.user.friends.get(valu.from)
    friendBase
    .once((v:any, k:any)=> {
      if(v) {
        v.status = 'friend'
        friendBase
        .put(v)
        .once((vv: any, kk:any) => {
          log(`now friends with ${valu.from}`)
          this.state.paths.user.incoming
          .unset(valu, () => {
            dispatch('friendapproved', valu.from)
          })
        })
      }
    })
  }

  handleChatRequest(node: any, valu: any, key: any) {
    const friendBase = this.state.paths.user.friends.get(valu.from)
    const chatBase = this.state.paths.user.chats.get(valu.from)

    // try and see if this chat request is from a friend
    friendBase
    .once((v:any, k:any)=> {
      // if a friend is found
      if(v) {
        // look up the ref of the incoming message
        // its the chat session ref we'll use to chat
        if(!valu.chatSessionKey) {
          throw new Error('No chat session key attached to message')
        }
        // store the chat session in our chats list
        chatBase
        .put(valu.chatSessionKey)
        .once(() => {
          // and finally, remove the incoming message
          this.state.paths.user.incoming
          .unset(valu, () => {
            log(`incoming chat from ${valu.from}`)
            dispatch('chatsession', valu.from)
            // TODO maye look up and return the user
          })
        })
      }
    })
  }

  //
  handleEmit(opath: any, node: any, valu: any, key: any) {
    // announce
    if (opath === this.state.observablePaths.announcePath) {
      this.handleAnnounces(node, valu, key)
    }
    // global chat (TODO: remove this. )
    if (opath === this.state.observablePaths.chatsPath) {
      this.handleChats(node, valu, key)
    }
    // user friends. observed to receive friend requests
    if (opath === this.state.observablePaths.userFriendsPath) {
      this.handleFriends(node, valu, key)
    }
    if (opath === this.state.observablePaths.userIncomingMessagesPath) {
      this.handleIncomings(node, valu, key)
    }
  }

  //
  userList() {}

  //
  chatWith ( friend: any, newMessage: any, callback ) {

    const chatsBase = this.state.paths.chats
    const friendBase = this.state.paths.user.friends.get(friend)

    // look for this friend
    friendBase.once((v,k) => {
      // fail if user not in friends
      if(!v) {
        throw new Error('cannot find this user in the database')
      }
      // fail if user friend not confirmed
      if(v.status !== 'friend') {
        throw new Error('This person has not yet confirmed you as a friend')
      }

      // TODO: look for an existing session b4 making a new 1
      // create a chat session
      const chatSession = {
        timestamp: Date.now()
      }
      chatsBase
      .set(chatSession)
      .once((vv: any, chatSessionKey: any) => {
        // add myself and friend as participants
        const theSession = chatsBase.get(chatSessionKey)
        // list the participants
        theSession
        .get('participants')
        .set(friend)
        .set(this.state.auth.hid)
        // add the initial message
        theSession
        .get('messages')
        .set({
          from: this.state.auth.hid,
          message: newMessage,
          timestamp: Date.now()
        })
        // set the session key
        theSession
        .get('sessionKey')
        .set(chatSessionKey)

        // store the session ref in my
        // user / chats / friends path
        this.state.paths.user.chats
        .get(friend)
        .put(chatSessionKey, () => {
          // create a chat request notification and assign the ref
          // to it and send the whole thing to our friend
          this.gun
          .get(`${this.state.rootNode}/users/${friend}/incoming`)
          .set({
            type: 'chatrequest',
            from: this.state.auth.hid,
            chatSessionKey,
            timestamp: Date.now()
          }, () => {
            if(callback) { callback() }
          })
        })
      })
    })
  }

  async searchGroups() {

  }

  async searchUser() {

  }

  getUsers(callback) {
    const userBase = this.state.paths.users
    userBase.once((v: any, k: any) => {
      if(callback && v) {
        v.hid = k
        callback(null, v)
      }
    })
  }

  getFriends(callback) {
    const friendsBase = this.state.paths.user.friends
    if(!friendsBase) {
      return
    }
    friendsBase.once((v: any, k: any) => {
      if(callback && v) {
        v.hid = k
        callback(null, v)
      }
    })
  }

  addFriend(friend, callback) {
    log('addFriend', friend)
    const friendBase = this.state.paths.user.friends
    friendBase
    .get(friend)
    .once((v) => {
      if(v) { return callback(new Error(`${friend} is already in friends list`)) }
      friendBase
      .get(friend)
      .put({
        timestamp: Date.now(),
        status: 'pending'
      })
      .once((vv, kk) => {
        vv.hid = kk
        this.gun
        .get(`${this.state.rootNode}/users/${friend}/incoming`)
        .set({
          type: 'friendrequest',
          from: this.state.auth.hid,
          timestamp: Date.now()
        })
        .once(() => {
          if(callback) {
            callback(null, vv)
          }
        })
      })
    })
  }

  approveFriend(friend, callback) {
    const friendBase = this.state.paths.user.friends
    friendBase
    .get(friend)
    .once((v, k) => {
      // if(v) {
      //   throw new Error(`already friends with ${friend}`)
      // }
      friendBase
      .get(friend)
      .put({
        timestamp: Date.now(),
        status: 'friend'
      })
      .once(() => {
        this.gun
        .get(`${this.state.rootNode}/users/${friend}/incoming`)
        .set({
          type: 'friendrequestapproved',
          from: this.state.auth.hid,
          timestamp: Date.now()
        })
        .once(() => {
          if(callback) {
            dispatch('friendapproved', friend)
            callback()
          }
        })
      })
    })
  }

  async removeFriend(friend) {

  }

  createGroup(group) {
    this.state.paths.groups
    .set(group)
    .once((v:any, k:any) => {

    })
  }

  async deleteGroup(group) {

  }

  async joinGroup(group, callback) {
    const targetGroup = this.state.paths.groups.get(group)
    targetGroup.once((groupO:any, groupHid:any) => {
      if(!groupO) {
        throw new Error('group does not exist')
      }
      // TODO: add all the validation rules here
      const gm = targetGroup.get('members').get(this.state.auth.hid)
      gm.once((memberO, memberId) => {
        if(memberO) {
          throw new Error('already a member of this group')
        }
        gm.put(this.state.auth.hid, () => {
          dispatch('joinedgroup', group)
          if(callback) {
            callback(null, this.state.auth.hid)
          }
        })
      })
    })
  }

  async leaveGroup(group, callback) {
    const targetGroup = this.state.paths.groups.get(group)
    targetGroup.once((groupO:any, groupHid:any) => {
      if(!groupO) {
        const e = new Error('group does not exist')
        if(callback) { return callback(e) }
        else { throw e }
      }
      // TODO: add all the validation rules here
      const gm = targetGroup.get('members').get(this.state.auth.hid)
      gm.once((memberO, memberId) => {
        if(memberO) {
          throw new Error('not a member of this group')
        }
        targetGroup.get('members').unset(this.state.auth.hid, () => {
          dispatch('leftgroup', group)
          if(callback) {
            callback(null, this.state.auth.hid)
          }
        })
      })
    })
  }

  async updateGroupSettings(group, settings, callback) {
    const targetGroup = this.state.paths.groups.get(group)
    targetGroup.once((groupO:any, groupHid:any) => {
      if(!groupO) {
        const e = new Error('group does not exist')
        if(callback) { return callback(e) }
        else { throw e }
      }
      if(groupO.owner !== this.state.auth.hid){
        const e = new Error('user is not group owner')
        if(callback) { return callback(e) }
        else { throw e }
      }
      // TODO: add all the validation rules here
      targetGroup.put(settings, () => {
        dispatch('updatedgroup', group)
        if(callback) {
          callback(null, group)
        }
      })
    })
  }

  async postToGroup(group, post, callback) {
    const targetGroup = this.state.paths.groups.get(group)
    targetGroup.once((groupO:any, groupHid:any) => {
      if(!groupO) {
        const e = new Error('group does not exist')
        if(callback) { return callback(e) }
        else { throw e }
      }
      // TODO: add all the validation rules here
      const gm = targetGroup.get('members').get(this.state.auth.hid)
      gm.once((memberO, memberId) => {
        if(memberO) {
          throw new Error('not a member of this group')
        }
        targetGroup.get('posts')
        .set(post)
        .once((postO, postKey) => {
          post.hid = postKey
          dispatch('postedtogroup', { group, post } )
          if(callback) {
            callback(null, this.state.auth.hid)
          }
        })
      })
    })
  }

  async postToFeed(post, callback) {
    const targetFeed = this.state.paths.user.feed
    targetFeed.set(post)
    .once((postO:any, postHid:any) => {
      if(!postO) {
        const e = new Error('group does not exist')
        if(callback) { return callback(e) }
        else { throw e }
      }
      post.hid = postHid
      dispatch('postedtfeed', { group, post } )
      if(callback) {
        callback(null, this.state.auth.hid)
      }
    })
  }

  async postToPublic(group) {

  }
}
