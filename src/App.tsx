import React from 'react'
import './styles.css'
import { Widget, addResponseMessage } from './widget'
import randomstring from 'randomstring'
import 'react-chat-widget/lib/styles.css'

import GunService from './gunservice'
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
    if(v.username !== this.state.auth.username) {
      addResponseMessage(`User ${v.username.substring(0,8)} has entered the chat.`)
      this.state.lastAnnounce = v.timestamp
    }
  }

  initing(v:any) {
    Object.values(v).map((ee: any) =>
      path(this.gun, ee).once((vv: any, kk: any) =>
        addResponseMessage(`User ${v.username.substring(0,8)} has entered the chat.`)
      )
    )
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

  handleChat(node: any, valu: any, key: any) {

    const m = node.map().once((v: any, k: any) => {
      if(v.username !== this.state.auth.username) {
        addResponseMessage(`User ${v.username.substring(0,8)}: ${v.chat}`)
        this.state.lastChat = v.timestamp
      }
    })
    // const out = Object.values(valu), outLen = out.length

    //   (function collectValues() {
    //     const collector = []
    //     const runner = () => {
    //       out.map().on(function(
    //         v: any,
    //         k: any) {
    //         collector.push(v)
    //       })
    //     }
    //     runner()
    //     var counter = 0
    //     const measurer = () => {
    //       if(collector.length !== outLen && counter < 99) {
    //         return setTimeout(() =>{ measurer(); counter++ }, 10)
    //       }
    //       collector
    //         .sort((e1,e2): any => e1.timestamp > e2.timestamp)
    //         .filter(e => e.timestamp > this.state.lastChat)
    //         .forEach(e => {
    //           if(e.timestamp > this.state.lastChat) {
    //             this.state.lastChat = e.timestamp
    //           }
    //           addResponseMessage(
    //             `User ${valu.username.substring(0,8)}:${valu.chat}`
    //           )
    //         })
    //     }
    //   })()
  }

  showChatHistory() {
    path(this.gun, this.state.observablePaths[1]).map().on((v: any, k:any) => {
      console.log(v)
    })
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
      <div className='App'>
        <Widget
          handleNewUserMessage={this.handleNewUserMessage}
          title={`Hello, My Name is:`}
          subtitle={this.state.auth.username.substring(0,8)}
        />
      </div>
    )
  }
}
