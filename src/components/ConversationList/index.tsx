import React, { useState, useEffect } from 'react'
import ConversationSearch from '../ConversationSearch'
import ConversationListItem from '../ConversationListItem'
import Toolbar from '../Toolbar'
import ToolbarButton from '../ToolbarButton'
import axios from 'axios'
import moment from 'moment'

import './ConversationList.css'

export default function ConversationList (props) {
  const [conversations, setConversations] = useState([])
  useEffect(() => {
    setupAnnounceListeners()
  }, [])

  const setupAnnounceListeners = () => {
    document.addEventListener('announce',
      (e:any) => {
        const curConversations = conversations.filter(e => e.username !== e.detail.username)
        const msg = {
          photo: 'user.jpg',
          name: `${e.detail.username.substring(0,8)}`,
          text: moment(e.detail.timestamp).format('LLLL')
        }
        setConversations([...curConversations, msg])
      }
    )
  }

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
        conversations.map(conversation =>
          <ConversationListItem
            key={conversation.name}
            data={conversation}
          />
        )
      }
    </div>
  )
}
