import React from 'react'
import {Launcher} from 'react-chat-window'
import './ChatSession.css'

export default class ChatSession extends React.Component {

  props: {
    sessionHid: any
  }

  static defaultState(that: ChatSession) {
    return {
      sessionHid: null,
      messageList: [],
      chatSessionKey: null
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      ChatSession.defaultState(this),
      props
    )
    this.onMessageWasSent = this.onMessageWasSent.bind(this)

    document.addEventListener('chat_session_selected',(e) => {
      this.state.sessionHid = e.detail
      if(this.state.sessionHid) {
        window.disco.state.paths.user.chats
        .get(this.state.sessionHid)
        .once((chatSessionKey,sessionHid) => {

          this.state.chatSessionKey = chatSessionKey
          window.disco.state.paths.chats
          .get(chatSessionKey)
          .get('messages').map().once((chatMessage: any) => {
            this.setState({
              messageList: [...this.state.messageList, {
                author: chatMessage.from === window.disco.state.auth.hid ? 'me' : 'them'
                type: 'text',
                data: { text: chatMessage.message }
              }]
            })
          })
        })
      }
    })
  }

  dispatch (e:any, p:any = null) {
    document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
  }

  onMessageWasSent(message) {
    if (this.state.chatSessionKey) {
      window.disco.state.paths.chats
      .get(this.state.chatSessionKey)
      .get('messages')
      .set({
        from: window.disco.state.auth.hid,
        message: message.data.text,
        timestamp: Date.now()
      })
    }
  }

  render() {
    return (<div className={'chat-session'}>
      <Launcher
        agentProfile={{
          teamName: 'react-chat-window',
          imageUrl: 'https://a.slack-edge.com/66f9/img/avatars-teams/ava_0001-34.png'
        }}
        onMessageWasSent={this.onMessageWasSent}
        messageList={this.state.messageList}
        showEmoji
      />
    </div>)
  }
}
