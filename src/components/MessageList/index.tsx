import React, { useEffect, useState } from 'react'
import Compose from '../Compose'
import Toolbar from '../Toolbar'
import ToolbarButton from '../ToolbarButton'
import Message from '../Message'
import moment from 'moment'

import './MessageList.css'

const MY_USER_ID = 'apple'

export default function MessageList (props) {
  const [messages, setMessages] = useState([])
  var messageId = 1
  useEffect(() => {
    getMessages()
  }, [])

  const getMessages = () => {
    document.addEventListener('chat_message', (e:any) => {
      const author = e.detail.username === props.iam ? 'apple' : 'orange'
      const msg = {
        id: messageId++,
        author: author,
        message: e.detail.message,
        timestamp: e.detail.timestamp
      }
      setMessages([...messages, msg])
    })
  }

  const renderMessages = () => {
    let i = 0
    const messageCount = messages.length
    const tempMessages = []

    while (i < messageCount) {
      const previous = messages[i - 1]
      const current = messages[i]
      const next = messages[i + 1]
      const isMine = current.author === MY_USER_ID
      const currentMoment = moment(current.timestamp)
      let prevBySameAuthor = false
      let nextBySameAuthor = false
      let startsSequence = true
      let endsSequence = true
      let showTimestamp = true

      if (previous) {
        const previousMoment = moment(previous.timestamp)
        const previousDuration = moment.duration(currentMoment.diff(previousMoment))
        prevBySameAuthor = previous.author === current.author

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false
        }
      }

      if (next) {
        const nextMoment = moment(next.timestamp)
        const nextDuration = moment.duration(nextMoment.diff(currentMoment))
        nextBySameAuthor = next.author === current.author

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false
        }
      }

      tempMessages.push(
        <Message
          key={i}
          isMine={isMine}
          startsSequence={startsSequence}
          endsSequence={endsSequence}
          showTimestamp={showTimestamp}
          data={current}
        />
      )

      // Proceed to the next message.
      i += 1
    }

    return tempMessages
  }

  return (
    <div className='message-list'>
      <Toolbar
        title={`logged in as ${props.iam.substring(0, 8)}`}
        rightItems={[
          <ToolbarButton key='info' icon='ion-ios-information-circle-outline' />,
          <ToolbarButton key='video' icon='ion-ios-videocam' />,
          <ToolbarButton key='phone' icon='ion-ios-call' />
        ]}
      />

      <div className='message-list-container'>{renderMessages()}</div>

      <Compose rightItems={[
        <ToolbarButton key='photo' icon='ion-ios-camera' />,
        <ToolbarButton key='image' icon='ion-ios-image' />,
        <ToolbarButton key='audio' icon='ion-ios-mic' />,
        <ToolbarButton key='money' icon='ion-ios-card' />,
        <ToolbarButton key='games' icon='ion-logo-game-controller-b' />,
        <ToolbarButton key='emoji' icon='ion-ios-happy' />
      ]} />
    </div>
  )
}
