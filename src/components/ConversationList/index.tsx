import React, { useState, useEffect } from 'react'
import ConversationSearch from '../ConversationSearch'
import ConversationListItem from '../ConversationListItem'
import Toolbar from '../Toolbar'
import ToolbarButton from '../ToolbarButton'
import axios from 'axios'
import moment from 'moment'

import './ConversationList.css'

export default class ConversationList extends React.Component {
  state = {
    conversations : []
  }

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const self = this
    document.addEventListener('announce',
      (ev:any) => {
        const curConversations = self.state.conversations.filter(
          e => e.username !==  ev.detail.username
        )
        self.state.conversations = [...curConversations, {
          photo: 'user.jpg',
          username: ev.detail.username,
          name: `${ev.detail.username.substring(0,8)}`,
          text: moment(ev.detail.timestamp).format('LLLL'),
          timestamp: ev.detail.timestamp
        }]
      }
    )
  }

  render() {
    return (
      <div className='conversation-list'>
        <Toolbar
          title='Messenger'
          leftItems={[
            <ToolbarButton key='cog' icon='ion-ios-cog' />
          ]}
          rightItems={[
            <ToolbarButton key='add' icon='ion-ios-add-circle-outline' />
          ]}
        />
        <ConversationSearch />
        {
          this.state.conversations.map(conversation =>
            <ConversationListItem
              key={conversation.name}
              data={conversation}
            />
          )
        }
      </div>
    )
  }
}
