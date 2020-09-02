import React from 'react'
import Messenger from '../Messenger';

import randomstring from 'randomstring'

import GunService from '../../services/gunservice'
import 'gun/gun'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'
import 'gun/sea'
import 'gun/lib/webrtc'

const debounceTimes = {}
const debounceTimerRefs = {}
export function debounce(f, t) {
  const fName = f.name ? f.name : 'anonymous'
  function funcOut() {
      const timeNow = Date.now()
      const timeBefore = debounceTimes[fName] ? debounceTimes[fName] : -1
      const timerRef = debounceTimerRefs[fName]
      if (timerRef) {
          clearTimeout(timerRef)
          debounceTimerRefs[fName] = undefined
      }
      if(timeBefore === -1 || timeNow - timeBefore >= t) {
          debounceTimes[fName] = timeNow
          return f()
      } else {
        debounceTimerRefs[fName] = setTimeout(f, t - (timeNow - timeBefore))
      }
  }
  return funcOut
}

function dispatch (e:any, p:any = null) {
  document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
}

const path = (g, p) => {
  const pathParts = p
    .split('/')
    .filter((e: any) => e)
    .map((e: any) => e.trim())
  var node = g
  pathParts.forEach((p: any) => (node = node.get(p)))
  return node
}
export default class App extends React.Component {
  state: {
    auth: any
    paths: any
    observablePaths: any
    onEmit: any
    onObserving: any
    onAuth: any
    onCreate: any,
    lastAnnounce: any,
    lastChat: any
  }
  gun: any
  userGun: any
  static defaults(that: any) {
    var auth = window.localStorage.getItem('auth')
    auth = auth
      ? JSON.parse(auth)
      : {
          username: randomstring.generate(),
          password: randomstring.generate(),
          create: true
        }
    return {
      auth,
      lastAnnounce: 0,
      lastChat: 0,
      paths: {
        announce: null,
        public: null,
        friends: null
      },
      observablePaths: [
        '45343bobbx/chat/announce',
        '45343bobbx/chat/chat'
      ],
      onInit: (gun: any) => that.handleInit(gun),
      onEmit: (opath: any, node: any, valu: any, key: any) => that.handleEmit(opath, node, valu, key),
      onObserving: (path: any, obj: any) => {
        if (path === that.state.observablePaths[0]) {
          that.state.paths.announce = obj
          console.log('we start observing announce')
        }
        if (path === that.state.observablePaths[1]) {
          that.state.paths.chat = obj
          console.log('we start observing chat')
        }
      },
      onAuth: (user: any, auth: any) => {
        that.auth(user, auth, false)
      },
      onCreate: (user: any, auth: any) => {
        that.auth(user, auth, true)
      }
    }
  }
  gunService: GunService
  constructor(props: any) {
    super(props)
    this.state = Object.assign(App.defaults(this), {})
    this.gunService = new GunService(this.state)
    this.handleNewUserMessage = this.handleNewUserMessage.bind(this)
  }

  auth(user: any, auth: any, newUser: any) {
    console.log('we get called back with auth')
    this.userGun = user
    if (newUser) {
      delete this.state.auth.create
      window.localStorage.setItem('auth', JSON.stringify(this.state.auth))
      console.log('we save the auth')
    }
    this.ready()
  }

  ready() {
    console.log('We are ready')
    this.announce()
    this.showChatHistory()
  }

  announce() {
    console.log('We announce')
    const ann = {
      username: this.state.auth.username,
      timestamp: Date.now()
    }
    path(this.gun, this.state.observablePaths[0]).set(ann)
  }

  handleInit(gun: any) {
    this.gun = gun
    console.log('got a gun')
  }

  announced(v:any) {
    dispatch('announce', {
      username: v.username,
      timestamp: v.timestamp
    })
    this.state.lastAnnounce = v.timestamp
  }

  initing(v:any) {
    Object.values(v).map((ee: any) => {
      path(this.gun, ee['#']).once((vv: any, kk: any) => {
        dispatch('announce', {
          username: v.username,
          timestamp: v.timestamp
        })
        this.state.lastChat = v.timestamp
      })
    })
  }

  handleAnnounce(node: any, valu: any, key: any) {
    node.map().once((v: any, k: any) => {
      if(v.username) {
        this.announced(v)
      } else {
        this.initing(v)
      }
    })
  }

  chatting(v:any) {
    if(v.username !== this.state.auth.username) {
      dispatch('chat_message', {
        username: v.username,
        timestamp: v.timestamp,
        message: v.chat
      })
      this.state.lastChat = v.timestamp
    }
  }

  chiniting(v:any) {
    Object.values(v).map((ee: any) =>
      path(this.gun, ee['#']).once((vv: any, kk: any) => {
        dispatch('chat_message', {
          username: v.username,
          timestamp: v.timestamp,
          message: v.chat
        })
        this.state.lastChat = v.timestamp
      })
    )
  }

  handleChat(node: any, valu: any, key: any) {
    node.map().once((v: any, k: any) => {
      if(v.username) {
        this.chatting(v)
      } else {
        this.chiniting(v)
      }
    })
  }

  showChatHistory() {
    // path(this.gun, this.state.observablePaths[1]).map().on((v: any, k:any) => {
    //   console.log(v)
    // })
  }

  handleEmit(opath: any, node: any, valu: any, key: any) {
    if (opath === this.state.observablePaths[0]) {
      this.handleAnnounce(node, valu, key)
    }
    if (opath === this.state.observablePaths[1]) {
      this.handleChat(node, valu, key)
    }
  }

  userList() {}

  handleNewUserMessage(newMessage: any) {
    if (!this.state.paths.chat) {
      return
    }
    console.log(`We say ${newMessage}`)
    const chat = {
      username: this.state.auth.username,
      chat: newMessage,
      timestamp: Date.now()
    }
    path(this.gun, this.state.observablePaths[1]).set(chat)
  }

  render() {
    return (
    <div className="App">
      <Messenger iam={this.state.auth.username} />
    </div>
    )
  }
}
