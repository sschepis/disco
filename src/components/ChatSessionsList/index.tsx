import React from 'react';
import './ChatSessionsList.css';

export default class ChatSessionsList extends React.Component {

  static defaultState(that: ChatSessionsList) {
    return {
      chats: [],
      ready: false
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      ChatSessionsList.defaultState(this),
      props
    )
    this.handleReady = this.handleReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', () => this.handleReady())
  }

  handleReady() {
    this.state.ready = true
    this.listenForChats()
  }

  listenForChats() {
    window.disco.state.paths.user.chats
    .map()
    .on((v:any, k:any) => {
      const theChatSession = v
      window.disco.state.paths.users
      .get(k) // elements in chat keyed by user id
      .once((vv, kk) => {
        const chats = this.state.chats || []
        chats.push({
          hid: kk,
          username: vv.username,
          handle: vv.handle,
          timestamp: vv.timestamp,
          session: theChatSession
        })
        chats.sort((a, b) => a.timestamp > b.timestamp)
        this.setState({chats})
      })
    })
  }

  handleChange(event) {
    this.setState({hid: event.target.value});
    this.dispatch('chat_session_selected', event.target.value)
  }

  dispatch (e:any, p:any = null) {
    document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
  }

  render() {
    return (
      <div className="chat-session-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.chats.map(function(chat, index) {
            return <option key={index} value={chat.hid}>{chat.handle}</option>;
          })}
        </select>
      </div>
    )
  }
}
